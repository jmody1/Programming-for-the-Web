'use strict';

const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const process = require('process');
const url = require('url');
const queryString = require('querystring');

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;


//Main URLs
const DOCS = '/docs';
const COMPLETIONS = '/completions';

//Default value for count parameter
const COUNT = 5;

/** Listen on port for incoming requests.  Use docFinder instance
 *  of DocFinder to access document collection methods.
 */
function serve(port, docFinder) {
  const app = express();
  app.locals.port = port;
  app.locals.finder = docFinder;
  setupRoutes(app);
  const server = app.listen(port, async function() {
    console.log(`PID ${process.pid} listening on port ${port}`);
  });
  return server;
}

module.exports = { serve };

function setupRoutes(app) {
  app.use(cors());            //for security workaround in future projects
  app.use(bodyParser.json()); //all incoming bodies are JSON
  console.log("Hello");
  app.get(`${DOCS}/:name`, doGetContent(app));
  app.get(COMPLETIONS, doGetCompletions(app));
  app.get(DOCS, doSearchContent(app));
  app.post(DOCS, doAddContent(app));

  //@TODO: add routes for required 4 services

  app.use(doErrors()); //must be last; setup for server errors
}



//@TODO: add handler creation functions called by route setup
//routine for each individual web service.  Note that each
//returned handler should be wrapped using errorWrap() to
//ensure that any internal errors are handled reasonably.

function doGetContent(app){
  return errorWrap(async function(req, res) {
    try{
      const name = req.params.name;
      const results = await app.locals.finder.docContent(name);
      console.log(results);
      let obj = {content : results,
           links: baseUrl(req, DOCS+'/'+name)};
    if (results.length === 0) {
      throw {
        isDomain: true,
  errorCode: 'NOT_FOUND',
  message: `doc ${name} not found`
};
    }
    else {
res.json(obj);
    }
  }
  catch(err) {
    const mapped = mapError(err);
    res.status(mapped.status).json(mapped);
    }
  });
}


function doAddContent(app){
  return errorWrap(async function(req, res) {
    try{
      const name = req.body.name;
      const content = req.body.content;
      const results = app.locals.finder.addContent(name,content);
      let obj = {href: baseUrl(req, DOCS+'/'+name) };
      if(!req.body.name){
        throw{
          isDomain: true,
        errorCode: 'BAD_PARAM',
        message: `required body parameter \"name\" is missing`
      };
    }
    else if(!req.body.content){
      throw{
        isDomain: true,
      errorCode: 'BAD_PARAM',
      message: `required body parameter \"content\" is missing`
    };
    }
    else{
      res.json(obj);
    }

    }
    catch(err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
      }
  });
}

function doGetCompletions(app){
  return errorWrap(async function(req, res) {
    try{
      const text = req.query || {};

      if (!text.text) {
        throw {
          isDomain: true,
    errorCode: 'BAD_PARAM',
    message: `required query parameter \"text\" is missing`
  };
      }
      else {
        const results = await app.locals.finder.complete(text.text);
        res.json(results);
      }

    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doSearchContent(app){
  return errorWrap(async function(req, res){
    try{
      const text = req.query;
      let start,count;
      let searchResult = {};
      if(!text.q){
        throw{
          isDomain: true,
        errorCode: 'BAD_PARAM',
        message: `bad query parameter \"q\" is missing`
      };
    }

      if(text.count && text.count<0){
        throw{
          isDomain: true,
        errorCode: 'BAD_PARAM',
        message: `bad query parameter \"count\"`
      };
    }
    else   if(text.start && text.start<0){
        throw{
          isDomain: true,
        errorCode: 'BAD_PARAM',
        message: `bad query parameter \"start\"`
      };
    }
      if(text.start){
       start = text.start;
      }
      else{
        start = 0;
      }
      if(text.count){
        count = text.count;
      }
      else{
        count = 5;
      }

      let results = await app.locals.finder.find(text.q);

      for(var i of results){
      i.href = baseUrl(req, DOCS+'/'+i.name);
      }
      let results_2 = [];
      for(var s = start; s<results.length; s++){

        results_2.push(results[s]);
      }
      searchResult.results = results_2;
      let req1 = requestUrl(req).substring(0,requestUrl(req).indexOf('&'));
      if(text.start == 0){
        searchResult.totalCount = results.length;
        searchResult.link = [{"rel" : "self",
                           "href" : req1+"&start="+start+"&count="+count},
                          {"rel" : "next",
                           "href" : req1+"&start="+Number(start+count)+"&count="+count}];
      }
      else if(text.start == results.length-1){
        searchResult.totalCount = results.length;
        searchResult.link = [{"rel" : "self",
                           "href" :req1+"&start="+start+"&count="+count},
                          {"rel" : "previous",
                           "href" : req1+"&start="+Number(start-count)+"&count="+count}];
      }
      else{
        searchResult.totalCount = results.length;
        searchResult.link = [{"rel" : "self",
                           "href" :req1+"&start="+start+"&count="+count},
                          {"rel" : "next",
                           "href" : req1+"&start="+Number(Number(start)+Number(count))+"&count="+count},
                          {"rel" : "previous",
                           "href" : req1+"&start="+Number(start-count)+"&count="+count}];
      }
      res.json(searchResult);

    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

/** Return error handler which ensures a server error results in nice
 *  JSON sent back to client with details logged on console.
 */
function doErrors(app) {
  return async function(err, req, res, next) {
    res.status(SERVER_ERROR);
    res.json({ code: 'SERVER_ERROR', message: err.message });
    console.error(err);
  };
}

/** Set up error handling for handler by wrapping it in a
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    }
    catch (err) {
      next(err);
    }
  };
}


/*************************** Mapping Errors ****************************/

const ERROR_MAP = {
  EXISTS: CONFLICT,
  NOT_FOUND: NOT_FOUND,
}

function mapError(err) {
  console.error(err);
  return err.isDomain
    ? { status: (ERROR_MAP[err.errorCode] || BAD_REQUEST),
	code: err.errorCode,
	message: err.message
      }
    : { status: SERVER_ERROR,
	code: 'INTERNAL',
	message: err.toString()
      };
}


/** Return base URL of req for path.
 *  Useful for building links; Example call: baseUrl(req, DOCS)
 */
function baseUrl(req, path='/') {
  const port = req.app.locals.port;
  const url = `${req.protocol}://${req.hostname}:${port}${path}`;
  return url;
}

function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}

'use strict';

const express = require('express');
const upload = require('multer')();
const fs = require('fs');
const mustache = require('mustache');
const Path = require('path');
const { URL } = require('url');

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

function serve(port, base, model) {
  const app = express();
  app.locals.port = port;
  app.locals.base = base;
  app.locals.model = model;
  process.chdir(__dirname);
  app.use(base, express.static(STATIC_DIR));
  setupTemplates(app, TEMPLATES_DIR);
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}


module.exports = serve;

/******************************** Routes *******************************/

function setupRoutes(app) {
  //@TODO add appropriate routes
  const base = app.locals.base;
  //app.get(`${base}/search.html`, doSearchContent(app));
  app.get(`${base}/search.html`, listDocs(app));
  app.get(`${base}/search.html`, createSearchForm(app));
  app.get(`${base}/add.html`, createAddForm(app));
  app.get(`${base}/:name`, getDocs(app));
  app.post(`${base}/add`, upload.single('file'), addDocs(app));
}

/*************************** Action Routines ***************************/

//@TODO add action routines for routes + any auxiliary functions.

function createSearchForm(app) {
  return async function(req, res) {
    const model = { base: app.locals.base };
    const html = doMustache(app, 'search', model);
    res.send(html);
  };
};

function createAddForm(app) {
  return async function(req, res) {
    const model = { base: app.locals.base };
    const html = doMustache(app, 'addContent', model);
    res.send(html);
  };
};
function addDocs(app){
  return async function(req, res) {
    console.log("Reaching add docs");
    console.log(req.file);
  }
}

function listDocs(app) {
  return async function(req, res) {
    const text = req.query;
   //console.log(text);
    let html;
    //console.log("reaching function");
    //console.log(text);
    if(Object.keys(text).length !== 0){
      const docs = await app.locals.model.list(text);
      //console.log(docs);
      for(let j=0; j<docs.results.length; j++){
       for(let i =0; i<docs.results[j].lines.length; i++){
        let re = new RegExp(text.name,"ig");
        docs.results[j].lines[i] = docs.results[j].lines[i].replace(re, "\<span class =\"search-term\"\> "+text.name+" \<\/span\> ");
        //console.log(docs.results[j].lines[i]);
       }
     }

      const model = { base: app.locals.base, docs: docs };
      html = doMustache(app, 'summary', model);
    }
    else{
      //const docs = await app.locals.model.list();
      const model = { base: app.locals.base };
      html = doMustache(app, 'search', model);
    }
    res.send(html);

  };
};

function getDocs(app) {
  return async function(req, res) {
    let model;
    let docs;
    const name = req.params.name;

    try {
      docs = await app.locals.model.get(name);
      docs.name = name;

	    model = { base: app.locals.base, docs: docs };
    }
    catch (err) {
      //console.error(err);
      const errors = wsErrors(err);
      model = errorModel(app, {}, errors);
    }
    const html = doMustache(app, 'details', model);
    res.send(html);
  };
};

/************************ General Utilities ****************************/

/** return object containing all non-empty values from object values */
function getNonEmptyValues(values) {
  const out = {};
  Object.keys(values).forEach(function(k) {
    const v = values[k];
    if (v && v.trim().length > 0) out[k] = v.trim();
  });
  return out;
}


/** Return a URL relative to req.originalUrl.  Returned URL path
 *  determined by path (which is absolute if starting with /). For
 *  example, specifying path as ../search.html will return a URL which
 *  is a sibling of the current document.  Object queryParams are
 *  encoded into the result's query-string and hash is set up as a
 *  fragment identifier for the result.
 */
function relativeUrl(req, path='', queryParams={}, hash='') {
  const url = new URL('http://dummy.com');
  url.protocol = req.protocol;
  url.hostname = req.hostname;
  url.port = req.socket.address().port;
  url.pathname = req.originalUrl.replace(/(\?.*)?$/, '');
  if (path.startsWith('/')) {
    url.pathname = path;
  }
  else if (path) {
    url.pathname += `/${path}`;
  }
  url.search = '';
  Object.entries(queryParams).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });
  url.hash = hash;
  return url.toString();
}

/************************** Template Utilities *************************/


/** Return result of mixing view-model view into template templateId
 *  in app templates.
 */
function doMustache(app, templateId, view) {
  const templates = { footer: app.templates.footer };
  return mustache.render(app.templates[templateId], view, templates);
}

/** Add contents all dir/*.ms files to app templates with each
 *  template being keyed by the basename (sans extensions) of
 *  its file basename.
 */
function setupTemplates(app, dir) {
  app.templates = {};
  for (let fname of fs.readdirSync(dir)) {
    const m = fname.match(/^([\w\-]+)\.ms$/);
    if (!m) continue;
    try {
      app.templates[m[1]] =
	String(fs.readFileSync(`${TEMPLATES_DIR}/${fname}`));
    }
    catch (e) {
      console.error(`cannot read ${fname}: ${e}`);
      process.exit(1);
    }
  }
}

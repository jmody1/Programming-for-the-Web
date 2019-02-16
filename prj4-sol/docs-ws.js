'use strict';

const axios = require('axios');


function DocsWs(baseUrl) {
  this.docsUrl = `${baseUrl}/docs`;
}

module.exports = DocsWs;

//@TODO add wrappers to call remote web services.
DocsWs.prototype.list = async function(q) {
  try {
    //console.log("Reaching list");
    const url = this.docsUrl+"?q=" + ((q === undefined) ? '' : `${q.name}`);
  //  console.log(url);
    const response = await axios.get(url);
    return response.data;
    //console.log(q);
  }
  catch (err) {
  //  console.error(err);
    throw (err.response && err.response.data) ? err.response.data : err;
  }
};


DocsWs.prototype.get = async function(name) {
  try {
    const url = this.docsUrl + "/" + (`${name}`);
    console.log(url);
    const response = await axios.get(url);
    //console.log(response.data);
    return response.data;
  }
  catch (err) {
    console.error(err);
    throw (err.response && err.response.data) ? err.response.data : err;
  }
};

const assert = require('assert');
const mongo = require('mongodb').MongoClient;

const {inspect} = require('util'); //for debugging

'use strict';
let arrayOfObjects = [];
map2 = new Map();
map3 = new Map();
map5 = new Map();


/** This class is expected to persist its state.  Hence when the
 *  class is created with a specific database url, it is expected
 *  to retain the state it had when it was last used with that URL.
 */
class DocFinder {

  /** Constructor for instance of DocFinder. The dbUrl is
   *  expected to be of the form mongodb://SERVER:PORT/DB
   *  where SERVER/PORT specifies the server and port on
   *  which the mongo database server is running and DB is
   *  name of the database within that database server which
   *  hosts the persistent content provided by this class.
   */
  constructor(dbUrl) {
    //TODO
  this.client;
  this.dbUrl = dbUrl;
  this.noise_words = new Set();
}

  /** This routine is used for all asynchronous initialization
   *  for instance of DocFinder.  It must be called by a client
   *  immediately after creating a new instance of this.
   */
  async init() {
    //TODO

    this.client  = await mongo.connect(this.dbUrl);
    this.db = this.client.db();
}

  /** Release all resources held by this doc-finder.  Specifically,
   *  close any database connections.
   */
  async close() {
    //TODO
    this.client.close();
  }

  /** Clear database */
  async clear() {
    //TODO
    this.db.dropDatabase(function(err, result){
        console.log("Error : "+err);
        if (err) throw err;
        console.log("Operation Success ? "+result);
  });
}

  /** Return an array of non-noise normalized words from string
   *  contentText.  Non-noise means it is not a word in the noiseWords
   *  which have been added to this object.  Normalized means that
   *  words are lower-cased, have been stemmed and all non-alphabetic
   *  characters matching regex [^a-z] have been removed.
   */
  async words(contentText) {
    //TODO
    let word_arr = contentText.split(/\s+/).map((w) => normalize(w)).filter((w) => !this.noise_words.has(w));
    return word_arr;
  }

  /** Add all normalized words in the noiseText string to this as
   *  noise words.  This operation should be idempotent.
   */
  async addNoiseWords(noiseText) {
    //TODO
    this.noise_words = new Set(noiseText.split(/\n/));
    let array_noise = Array.from(this.noise_words);
  
    this.db.collection("Documents").update({"name" : "Noise Words"},
                                         {"name" : "Noise Words","words" : array_noise},
                                         {upsert : true});
  }

  /** Add document named by string name with specified content string
   *  contentText to this instance. Update index in this with all
   *  non-noise normalized words in contentText string.
   *  This operation should be idempotent.
   */
  async addContent(name, contentText) {
    //TODO
    let noiseWordArray = await this.db.collection("Documents").find({"name" : "Noise Words"}, {fields :{"words" : 1, _id : 0}}).toArray();

    this.noise_words = new Set(noiseWordArray[0].words);


    let object_map = {}
    let word_map = new Map();
    let word_count = new Map();
	  let map_filename = new Map();
    this.words(contentText);
    let object_file = {"Filename" : name,
                       "File Content" : contentText};
    this.db.collection("Documents").insert(object_file,function(err, res) {
     if (err) throw err;
     });

  //  map3.set(name,contentText);
    let word_offset = [];
    let match;

    while(match = WORD_REGEX.exec(contentText)){
      if(!this.noise_words.has(match[0])){
      match[0] = normalize(match[0]);
      var offset = match.index;
      var word = match[0];

      if(!word_map.has(match[0])){
        word_map.set(match[0], match.index);
        word_count.set(match[0],1)
      }
      else{
        word_count.set(match[0],word_count.get(match[0])+1);
      }

    }
  }

    word_map.forEach(function(value,key){
    map_filename.clear();

    var array_temp1 = [];
    array_temp1.push(value);
    array_temp1.push(word_count.get(key));

    if(map2.has(key)){
	  let filename_offscount = map2.get(key);
    filename_offscount.set(name,array_temp1);
    filename_offscount.forEach(function(value,key){

         });
         map2.set(key, filename_offscount);
      }
    else{
   map2.set(key, new Map().set(name, array_temp1));}

   });
   let innerMapKey;
   let innerMapValue;


   for(let [key, value] of map2){

     let arrayOfFileName = [];

     value.forEach(function(value1,key1){
       innerMapKey = key1;
       innerMapValue = value1;
       map5 = {name : innerMapKey, array : innerMapValue}
       arrayOfFileName.push(map5);
     });

      this.db.collection("Documents").update({"_id" : key},
                                             {"_id" : key, "listOfFiles" : arrayOfFileName},
                                             {upsert : true});


   }


  }

  /** Return contents of document name.  If not found, throw an Error
   *  object with property code set to 'NOT_FOUND' and property
   *  message set to `doc ${name} not found`.
   */
  async docContent(name) {
    //TODO

    let content1 = await this.db.collection("Documents").find({"Filename" : name}, {fields :{"File Content" : 1, _id : 0}}).toArray();

    return content1[0]["File Content"];
  }

  /** Given a list of normalized, non-noise words search terms,
   *  return a list of Result's  which specify the matching documents.
   *  Each Result object contains the following properties:
   *
   *     name:  the name of the document.
   *     score: the total number of occurrences of the search terms in the
   *            document.
   *     lines: A string consisting the lines containing the earliest
   *            occurrence of the search terms within the document.  The
   *            lines must have the same relative order as in the source
   *            document.  Note that if a line contains multiple search
   *            terms, then it will occur only once in lines.
   *
   *  The returned Result list must be sorted in non-ascending order
   *  by score.  Results which have the same score are sorted by the
   *  document name in lexicographical ascending order.
   *
   */
  async find(terms) {
    //TODO

    var c = 0;
    var o = new Object();
    let object_array = new Array();
    for(var i of terms){
      let object_retrieve = await this.db.collection("Documents").find({_id : i}).toArray();

      if(object_retrieve != undefined){
        for(var o of object_retrieve[0].listOfFiles){
      let filename = o.name;
      let offset_count = o.array;
      let content1 = await this.db.collection("Documents").find({"Filename" : o.name}, {fields :{"File Content" : 1, _id : 0}}).toArray();


      var offset_prev= offset_count[0];
      while(content1[0]["File Content"].charAt(offset_prev)!= '\n' && offset_prev != 0){
        offset_prev--;

        }
        if(offset_prev!=0){
        offset_prev++;
      }
        var offset_next = offset_count[0];
      while(content1[0]["File Content"].charAt(offset_next)!= '\n'){
        offset_next++;

      }

     let line = content1[0]["File Content"].substring(offset_prev,offset_next);

     object_array.forEach(function(value){
     if(value.name == filename){
     value.score += offset_count[1];
     c = 1;
       }
     });

     if(c == 0){

      o = { name: filename,
            score: offset_count[1],
            lines: line + "\n"
          };

      object_array.push(new Result(o.name, o.score, o.lines));

      }
      c = 0;
    }
  }
};
      object_array.sort(compareResults);

      return object_array;
  }

  /** Given a text string, return a ordered list of all completions of
   *  the last normalized word in text.  Returns [] if the last char
   *  in text is not alphabetic.
   */
  async complete(text) {
    //TODO
    let array_completions = [];
    let arrayKeys = await this.db.collection("Documents").find({_id:{'$regex' : '^'+text, '$options' : 'i'}}).toArray();
    for(var l of arrayKeys){
      array_completions.push(l._id);
    }



    return array_completions;

  }


  //Add private methods as necessary

} //class DocFinder

module.exports = DocFinder;

//Add module global functions, constants classes as necessary
//(inaccessible to the rest of the program).

//Used to prevent warning messages from mongodb.
const MONGO_OPTIONS = {
  useNewUrlParser: true
};

/** Regex used for extracting words as maximal non-space sequences. */
const WORD_REGEX = /\S+/g;

/** A simple utility class which packages together the result for a
 *  document search as documented above in DocFinder.find().
 */
class Result {
  constructor(name, score, lines) {
    this.name = name; this.score = score; this.lines = lines;
  }

  toString() { return `${this.name}: ${this.score}\n${this.lines}`; }
}

/** Compare result1 with result2: higher scores compare lower; if
 *  scores are equal, then lexicographically earlier names compare
 *  lower.
 */
function compareResults(result1, result2) {
  return (result2.score - result1.score) ||
    result1.name.localeCompare(result2.name);
}

/** Normalize word by stem'ing it, removing all non-alphabetic
 *  characters and converting to lowercase.
 */
function normalize(word) {
  return stem(word.toLowerCase()).replace(/[^a-z]/g, '');
}

/** Place-holder for stemming a word before normalization; this
 *  implementation merely removes 's suffixes.
 */
function stem(word) {
  return word.replace(/\'s$/, '');
}

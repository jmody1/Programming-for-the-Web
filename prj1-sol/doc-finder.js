const {inspect} = require('util'); //for debugging

'use strict';


    map1 = new Map();
    map2 = new Map();
    map3 = new Map();

class DocFinder {

  /** Constructor for instance of DocFinder. */
  constructor() {
    //@TODO
    this.noise_words = new Set();

  }

  /** Return array of non-noise normalized words from string content.
   *  Non-noise means it is not a word in the noiseWords which have
   *  been added to this object.  Normalized means that words are
   *  lower-cased, have been stemmed and all non-alphabetic characters
   *  matching regex [^a-z] have been removed.
   */
  words(content) {
    //@TODO
    let word_arr = content.split(/\s+/).map((w) => normalize(w)).filter((w) => !this.noise_words.has(w));
    return word_arr;

  }

  addNoiseWords(noiseWords) {
    //@TODO
    this.noise_words = new Set(noiseWords.split(/\n/));
  }

  /** Add document named by string name with specified content to this
   *  instance. Update index in this with all non-noise normalized
   *  words in content string.
   */
  addContent(name, content) {
    //@TODO
    let word_map = new Map();
    let word_count = new Map();
	  let map_filename = new Map();
    this.words(content);

    map3.set(name,content);

    let word_offset = [];
    let match;


    while(match = WORD_REGEX.exec(content)){
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
  }




  /** Given a list of normalized, non-noise words search terms,
   *  return a list of Result's  which specify the matching documents.
   *  Each Result object contains the following properties:
   *     name:  the name of the document.
   *     score: the total number of occurrences of the search terms in the
   *            document.
   *     lines: A string consisting the lines containing the earliest
   *            occurrence of the search terms within the document.  Note
   *            that if a line contains multiple search terms, then it will
   *            occur only once in lines.
   *  The Result's list must be sorted in non-ascending order by score.
   *  Results which have the same score are sorted by the document name
   *  in lexicographical ascending order.
   *
   */
  find(terms) {
    //@TODO
    var c = 0;
    var o = new Object();
    let map4 = new Map();
    let object_array = new Array();

    terms.forEach(function(value){

      map4 = map2.get(value);

      if(map4 != undefined){
      map4.forEach(function(value1, key1){
        let filename = key1;
        let offset_count = value1;
        let content1 = map3.get(key1);

        var offset_prev= offset_count[0];
        while(content1.charAt(offset_prev)!= '\n' && offset_prev != 0){
          offset_prev--;

          }
          if(offset_prev!=0){
          offset_prev++;
        }
          var offset_next = offset_count[0];
        while(content1.charAt(offset_next)!= '\n'){
          offset_next++;

        }

       let line = content1.substring(offset_prev,offset_next);

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

        object_array.push(o);

      }
      c = 0;


      });
    }
});

    object_array.sort(compareResults);


return object_array;
}
  /** Given a text string, return a ordered list of all completions of
   *  the last word in text.  Returns [] if the last char in text is
   *  not alphabetic.
   */
  complete(text) {
    //@TODO
    let arrayKeys = Array.from(map2.keys());

    let finalArray = arrayKeys.filter(function(value){
      if(value.match(`^${text}`)){
        return value;
      }
    });

    return finalArray;
  }


} //class DocFinder

module.exports = DocFinder;

/** Regex used for extracting words as maximal non-space sequences. */
const WORD_REGEX = /\S+/g;

/** A simple class which packages together the result for a
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

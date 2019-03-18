/*
  ACOL: Transcript keys
  - first item starts with 1, not 0
  - a numeric value that represents a specific transcript and represents
    a specific logical ordering.

  - The integer part of the key represent a transcript and the decimal part
    a paragraph within the transcript.
  - The paragraphId is increased by 1 and divided by 1000

  key format: ssbbuuu.ppp
  where: ss: source Id
         bb: book Id
        uuu: unit Id
        ppp: paragraph number - not positional

  Using this key structure; these are maximums
    books: 99
    units: 999        //units are chapters that make up a book
    paragraphs: 999   //max number of paragraphs in a unit

  NOTE: This module is used by code running in the browser and Node so the 
        common.js module system is used
*/

//import indexOf from "lodash/indexOf";
const sprintf = require("sprintf-js").sprintf;

//source id: each source has a unique id
//WOM = 10
//JSB = 11
//ACIM = 12
//RAJ = 13
const sourceId = 14;

//length of pageKey excluding decimal portion
const keyLength = 7;

//Raj material books (bid)
const books = [
  "course", "treatise", "dialog", "acq"
];

const bookIds = ["xxx", ...books];

const acq = [
  "xxx", "welcome", "book"
];

const course = [
  "xxx", "introduction", "prelude", "chap01", "chap02", "chap03", "chap04", "chap05", "chap06",
  "chap07", "chap08", "chap09", "chap10", "chap11", "chap12", "chap13", "chap14", "chap15", "chap16",
  "chap17", "chap18", "chap19", "chap20", "chap21", "chap22", "chap23", "chap24", "chap25", "chap26",
  "chap27", "chap28", "chap29", "chap30" ,"chap31", "chap32",
];

const treatise = [
  "xxx", "t1chap01", "t1chap02", "t1chap03", "t1chap04", "t1chap05", "t1chap06", "t1chap07", "t1chap08",
  "t1chap09", "t1chap10", "t2chap01", "t2chap02", "t2chap03", "t2chap04", "t2chap05", "t2chap06", "t2chap07",
  "t2chap08", "t2chap09", "t2chap10", "t2chap11", "t2chap12", "t2chap13", "t3chap01", "t3chap02", "t3chap03",
  "t3chap04", "t3chap05", "t3chap06", "t3chap07", "t3chap08", "t3chap09", "t3chap10", "t3chap11", "t3chap12",
  "t3chap13", "t3chap14", "t3chap15", "t3chap16", "t3chap17", "t3chap18", "t3chap19", "t3chap20", "t3chap21",
  "t3chap22", "t4chap01", "t4chap02", "t4chap03", "t4chap04", "t4chap05", "t4chap06", "t4chap07", "t4chap08",
  "t4chap09", "t4chap10", "t4chap11", "t4chap12"
];

const dialog = [
  "xxx", "chap01", "chap02", "chap03", "chap04", "chap05", "chap06", "chap07", "chap08", "chap09", "chap10",
  "chap11", "chap12", "chap13", "chap14", "chap15", "chap16", "chap17", "day01", "day02", "day03", "day04",
  "day05", "day06", "day07", "day08", "day09", "day10", "day11", "day12", "day13", "day14", "day15", "day16",
  "day17", "day18", "day19", "day20", "day21", "day22", "day23", "day24", "day25", "day26", "day27", "day28",
  "day29", "day30", "day31", "day32", "day33", "day34", "day35", "day36", "day37", "day38", "day39", "day40",
  "epilogue"
];

const contents = {
  course: course,
  treatise: treatise,
  dialog: dialog,
  acq: acq
};

function splitUrl(url) {
  let u = url;

  //remove leading and trailing "/"
  u = url.substr(1);
  u = u.substr(0, u.length - 1);

  return u.split("/");
}

/*
  return the position of unit in the bid array
*/
function getUnitId(bid, unit) {
  if (contents[bid]) {
    return contents[bid].indexOf(unit);
  }
  else {
    throw new Error(`unexpected bookId: ${bid}`);
  }
}

function getSourceId() {
  return sourceId;
}

function getKeyInfo() {
  return {
    sourceId: sourceId,
    keyLength: keyLength
  };
}

/*
  parse bookmarkId into pageKey and paragraphId
  - pid=0 indicates no paragraph id
*/
function parseKey(key) {
  const keyInfo = getKeyInfo();
  let keyString = key;
  let pid = 0;

  if (typeof keyString === "number") {
    keyString = key.toString(10);
  }

  let decimalPos = keyString.indexOf(".");

  //if no decimal key doesn't include paragraph id
  if (decimalPos > -1) {
    let decimalPart = keyString.substr(decimalPos + 1);

    //append 0's if decimal part < 3
    switch(decimalPart.length) {
      case 1:
        decimalPart = `${decimalPart}00`;
        break;
      case 2:
        decimalPart = `${decimalPart}0`;
        break;
    }
    pid = parseInt(decimalPart, 10);
  }
  let pageKey = parseInt(keyString.substr(0, keyInfo.keyLength), 10);

  return {pid, pageKey};
}

/*
  Convert url into key
  returns -1 for non-transcript url

  key format: ssbbuuu.ppp
  where: ss: source Id
         bb: book Id
        uuu: unit Id
        ppp: paragraph number - not positional
*/
function genPageKey(url = location.pathname) {
  let key = {
    sid: sourceId,
    bid: 0,
    uid: 0,
    qid: 0
  };

  let parts = splitUrl(url);

  //key.bid = indexOf(bookIds, parts[0]);
  key.bid = bookIds.indexOf(parts[2]);
  if (key.bid === -1) {
    return -1;
  }
  key.uid = getUnitId(parts[2], parts[3]);
  if (key.bid === -1) {
    return -1;
  }

  let compositeKey = sprintf("%02s%02s%03s", key.sid, key.bid, key.uid);
  let numericKey = parseInt(compositeKey, 10);

  return numericKey;
}

/* 
  genParagraphKey(paragraphId, key: url || pageKey) 

  args:
    pid: a string representing a transcript paragraph, starts as "p0"..."pnnn"
         - it's converted to number and incremented by 1 then divided by 1000
        pid can also be a number so then we just increment it and divide by 1000

    key: either a url or pageKey returned from genPageKey(), if key
   is a string it is assumed to be a url
*/
function genParagraphKey(pid, key = location.pathname) {
  let numericKey = key;
  let pKey;

  if (typeof pid === "string") {
    pKey = (parseInt(pid.substr(1), 10) + 1) / 1000;
  }
  else {
    pKey = (pid + 1)/1000;
  }

  //if key is a string it represents a url
  if (typeof key === "string") {
    numericKey = genPageKey(key);
  }

  let paragraphKey = numericKey + pKey;

  return paragraphKey;
}

/*
  key format: ssbbuuu.ppp
  where: ss: source Id
         bb: book Id
        uuu: unit Id
        ppp: paragraph number - not positional

  Substracting one from the unit does not work for getUrl, don't know
  why we do that. Added a second arg to keep old behavior but when false
  we don't do the subtraction.
*/
function decodeKey(key, subtract = true) {
  let {pid, pageKey} = parseKey(key);
  let pageKeyString = pageKey.toString(10);
  let decodedKey = {
    error: 0,
    message: "ok",
    sid: sourceId,
    bookId: "",
    uid: 0,
    pid: pid - 1
  };

  //error, invalid key length
  if (pageKeyString.length !== keyLength) {
    decodedKey.error = true;
    decodedKey.message = `Integer portion of key should have a length of ${keyLength}, key is: ${pageKeyString}`;
    return decodedKey;
  }

  let bid = parseInt(pageKeyString.substr(2,2), 10);
  decodedKey.bookId = bookIds[bid];

  if (subtract) {
    //substract 1 from key value to get index
    decodedKey.uid = parseInt(pageKeyString.substr(4,3), 10) - 1;
  }
  else {
    decodedKey.uid = parseInt(pageKeyString.substr(4,3), 10);
  }


  return decodedKey;
}

function getBooks() {
  return books;
}

/*
  Return the number of chapters in the book (bid). 
  Subtract one from length because of 'xxx' (fake chapter)
*/
function getNumberOfUnits(bid) {
  if (contents[bid]) {
    return contents[bid].length - 1;
  }
  else {
    throw new Error(`getNumberOfUnits() unexpected bookId: ${bid}`);
  }
}

/*
 * Convert page key to url
 */
function getUrl(key) {
  let decodedKey = decodeKey(key, false);
  let unit = "invalid";

  if (decodedKey.error) {
    return "/invalid/key/";
  }

  if (contents[decodedKey.bookId]) {
    unit = contents[decodedKey.bookId][decodedKey.uid];
  }

  return `/${decodedKey.bookId}/${unit}/`;
}

module.exports = {
  getNumberOfUnits: getNumberOfUnits,
  getBooks: getBooks,
  getSourceId: getSourceId,
  getKeyInfo: getKeyInfo,
  parseKey: parseKey,
  getUnitId: getUnitId,
  getUrl: getUrl,
  genPageKey: genPageKey,
  genParagraphKey: genParagraphKey,
  decodeKey: decodeKey
};

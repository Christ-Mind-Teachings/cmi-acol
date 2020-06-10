/*
  Teaching specific data
*/

const keyInfo = require("./modules/_config/key");
import {getPageInfo} from "./modules/_config/config";

export default {
  sid: "acol",
  lang: "en",
  env: "integration",
  getPageInfo: getPageInfo,              //list
  keyInfo: keyInfo,                      //list, bmnet
  bm_modal_key: "bm.acol.modal",         //list
  bm_creation_state: "bm.acol.creation", //bookmark
  bm_list_store: "bm.acol.list",         //bmnet
  bm_topic_list: "bm.acol.topics",       //bmnet
  bm_modal_store: "bm.acol.modal",       //navigator
  url_prefix: "/t/acol"                  //navigator
};

/*
  Teaching specific data
*/

const keyInfo = require("./modules/_config/key");
import {getReservation, getAudioInfo, getPageInfo} from "./modules/_config/config";

const env = "integration";
const sid = "acol";
const lang = "en";
const title = "A Course Of Love";
const HOME_URI = `/t/${sid}`;

export default {
  sid: sid,
  lang: lang,
  env: env,
  title: title,
  url_prefix: HOME_URI,
  configUrl: `${HOME_URI}/public/config`,
  sourceId: 14,
  quoteManagerId: "05399539cca9ac38db6db36f5c770ff1",
  quoteManagerName: "CMI",
  getPageInfo: getPageInfo,
  keyInfo: keyInfo,
  audio: {
    audioBase: `https://s3.amazonaws.com/assets.christmind.info/${sid}/audio`,
    timingBase: `${HOME_URI}/public/timing`,
    getReservation: getReservation,
    getAudioInfo: getAudioInfo
  },
  store: {
    bmList: "bm.list",
    bmCreation: "bm.creation",
    bmTopics: "bm.topics",
    bmModal: "bm.modal",
    srchResults: "srch.results",
    pnDisplay: "pn.display",
    cfgacq: "cfg.acq",
    cfgcourse: "cfg.course",
    cfgdialog: "cfg.dialog",
    cfgtreatise: "cfg.treatise",
    ackState: "ack.state"
  }
};

/* eslint no-console: off */

import {SourceStore, storeInit} from "common/modules/_util/store";
import search from "common/modules/_search/search";
import {showParagraph} from "common/modules/_util/url";
import audio from "common/modules/_audio/audio";
import {initTranscriptPage} from "common/modules/_page/startup";

//teaching specific modules
import {setEnv, loadConfig} from "./modules/_config/config";
import toc, {getBookId} from "./modules/_contents/toc";
import acol from "./modules/_acol/acol";

import constants from "./constants";

$(document).ready(() => {
  const store = new SourceStore(constants);
  storeInit(constants);

  setEnv(store);

  //for acol acq/access page
  acol.initialize();

  loadConfig(getBookId()).then((result) => {
    initTranscriptPage(store);
    search.initialize(store);
    toc.initialize("transcript");
    audio.initialize(store);
    showParagraph();
  }).catch((error) => {
    console.error(error);
  });
});

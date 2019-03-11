/*
  Library and Teaching Metadata

  Setup Instructions:
  1. Assign value to sid - alphabetical identifier for teaching
  2. Add entry for new teaching to "LibraryInfo"
  3. Edit _includes/common/quick-link-menu.html
*/

const libraryInfo = {
  wom: {
    title: "Way of Mastery",
    sourceId: 10,
    local_port: 9910
  },
  jsb: {
    title: "The Impersonal Life",
    sourceId: 11,
    local_port: 9911
  },
  acim: {
    title: "ACIM Sparkly Edition",
    sourceId: 12,
    local_port: 9912
  },
  raj: {
    title: "The Raj Material",
    sourceId: 13,
    local_port: 9913
  },
  acol: {
    title: "A Course Of Love",
    sourceId: 14,
    local_port: 9914
  },
  //ADD NEW SOURCE INFO HERE
  www: {
    title: "The Library Card Catalog",
    sourceId: 99,
    local_port: 9999
  }
};

/*
  Return local url for teaching
*/
function getLocalUrl(teaching) {
  return `http://localhost:${libraryInfo[teaching].local_port}/`;
}

/*
  For development environment, change links to localhost
*/
const setLinks = () => {
  //Header Link, found in _includes/common/masthead.html
  $(".href.www-christmind-info").attr("href", getLocalUrl("www"));

  for (const key in libraryInfo) {
    let info = libraryInfo[key];
    if (libraryInfo.hasOwnProperty(key)) {
      //found in _includes/common/quick-link-menu.html
      $(`.dhref.${key}-christmind-info`).attr("href", getLocalUrl(key));
    }
  }
}

export default {
  //teaching alpha identifier, used for mailgun tag
  sid: "ACOL",

  //API Endpoints
  share: "https://rcd7l4adth.execute-api.us-east-1.amazonaws.com/latest/share",
  user: "https://93e93isn03.execute-api.us-east-1.amazonaws.com/latest/user",

  setLinks: setLinks
}

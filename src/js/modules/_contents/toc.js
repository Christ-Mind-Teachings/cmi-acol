import scroll from "scroll-into-view";
import {getConfig} from "../_config/config";
import keyInfo from "../_config/key";
import {getUserInfo} from "../_user/netlify";

const uiTocModal = ".toc.ui.modal";
const uiOpenTocModal = ".toc-modal-open";
const uiModalOpacity = 0.5;

function renderTitle(bid, content) {
  if (bid === "course" || bid === "treatise") {
    if (content.id) {
      return `Chapter ${content.id}: ${content.title}`;
    }
    else {
      return `${content.title}`;
    }
  }
  else if (bid === "dialog") {
    if (content.id) {
      return `Chapter ${content.id}: ${content.title}`;
    }
    else if (content.did) {
      return `Day ${content.did}: ${content.title}`;
    }
    else {
      return `${content.title}`;
    }
  }

  return `${content.title}`;
}

/*
 * For ACOL, only authorized users can view content that
 * is restricted. Check authorization before generating
 * url. ** NOT IMPLEMENTED YET **
 *
 * if content.restricted then don't render a url, this unit
 * is restricted to signed in users.
*/
function renderUrl(base, content, user_restricted) {
  if (content.restricted && user_restricted) {
    return `data-restricted="1"`;
  }
  return `data-restricted="0" href="${base}${content.url}"`;
}

function renderHeader(content) {
  if (content.heading) {
    return `<h3 class="ui header">${content.heading}</h3>`;
  }

  return "";
}

/*
  generate toc html for flat config file
*/
function makeContents(base, contents, bid, toc) {
  return (`
    <div class="ui relaxed list">
      ${contents.map((content, pidx) => `
        ${renderHeader(content)}
        <a data-lid="${pidx+1}" class="item" ${renderUrl(base, content, toc.restricted)}>
           ${renderTitle(bid, content)}
        </a>`).join("")}
    </div>
  `);
}

/*
  nextPrevUnrestricted()
    - all unites of a book are accessible without restriction

  set next/prev controls on transcript menu

  This works for flat config files where all parts of a book are
  at the same level.
*/
function nextPrevUnrestricted(toc, $el) {
  let bid = toc.bid;
  var LAST_ID = keyInfo.getNumberOfUnits(bid);
  let prevId = -1, nextId = -1, href, text;
  let lid = $el.attr("data-lid");
  let lessonId = parseInt(lid, 10);

  //disable prev control
  if (lessonId === 1) {
    $("#previous-page-menu-item").addClass("disabled");
  }
  else {
    $("#previous-page-menu-item").removeClass("disabled");
    prevId = lessonId - 1;
  }

  //disable next control
  if (lessonId === LAST_ID) {
    $("#next-page-menu-item").addClass("disabled");
  }
  else {
    $("#next-page-menu-item").removeClass("disabled");
    nextId = lessonId + 1;
  }

  if (prevId > -1) {
    href = $(`a[data-lid="${prevId}"]`).attr("href");
    text = $(`a[data-lid="${prevId}"]`).text();

    //set prev tooltip and href
    $("#previous-page-menu-item > span").attr("data-tooltip", `${text}`);
    $("#previous-page-menu-item").attr("href", `${href}`);
  }

  if (nextId > -1) {
    href = $(`a[data-lid="${nextId}"]`).attr("href");
    text = $(`a[data-lid="${nextId}"]`).text();

    //set prev tooltip and href
    $("#next-page-menu-item > span").attr("data-tooltip", `${text}`);
    $("#next-page-menu-item").attr("href", `${href}`);
  }
}

function getNextPrevRestrictedUnitId($el, last) {
  let prevArray = $el.prevAll("[data-restricted='0']").map(function() {
    return $(this).attr("data-lid");
  });

  let nextArray = $el.nextAll("[data-restricted='0']").map(function() {
    return $(this).attr("data-lid");
  });

  let np = {
    prev: -1,
    next: -1
  };

  if (prevArray.length > 0) {
    np.prev = parseInt(prevArray[0], 10);
  }

  if (nextArray.length > 0) {
    np.next = parseInt(nextArray[0], 10);
  }

  return np;
}

/*
 * nextPrevRestricted()
 *  - some units are restricted to authorized users
 */
function nextPrevRestricted(toc, $el) {
  let bid = toc.bid;
  var LAST_ID = keyInfo.getNumberOfUnits(bid);
  let prevId = -1, nextId = -1, href, text;

  //get next/prev from unrestricted units
  let np = getNextPrevRestrictedUnitId($el, LAST_ID);

  //disable prev control
  if (np.prev === -1) {
    $("#previous-page-menu-item").addClass("disabled");
  }
  else {
    $("#previous-page-menu-item").removeClass("disabled");
    prevId = np.prev;
  }

  //disable next control
  if (np.next === -1) {
    $("#next-page-menu-item").addClass("disabled");
  }
  else {
    $("#next-page-menu-item").removeClass("disabled");
    nextId = np.next;
  }

  if (prevId > -1) {
    href = $(`a[data-lid="${prevId}"]`).attr("href");
    text = $(`a[data-lid="${prevId}"]`).text();

    //set prev tooltip and href
    $("#previous-page-menu-item > span").attr("data-tooltip", `${text}`);
    $("#previous-page-menu-item").attr("href", `${href}`);
  }

  if (nextId > -1) {
    href = $(`a[data-lid="${nextId}"]`).attr("href");
    text = $(`a[data-lid="${nextId}"]`).text();

    //set prev tooltip and href
    $("#next-page-menu-item > span").attr("data-tooltip", `${text}`);
    $("#next-page-menu-item").attr("href", `${href}`);
  }
}

function nextPrev(toc, $el) {
  if (toc.restricted) {
    nextPrevRestricted(toc, $el);
  }
  else {
    nextPrevUnrestricted(toc, $el);
  }
}

/*
  If we're on a transcript page, highlight the 
  current transcript in the list and calc prev and next
  links

  Args:
    bid: bookId, 'text', 'workbook', 'manual'

    Bid is needed in case next and previous are determinded differently depending on book
*/
function highlightCurrentTranscript(toc, setNextPrev = true) {
  let bid = toc.bid;

  if ($(".transcript").length > 0) {
    let page = location.pathname;
    let $el = $(`.toc-list a[href='${page}']`);

    //remove href to deactivate link for current page and
    //scroll into middle of viewport
    $el.addClass("current-unit").removeAttr("href");
    scroll($el.get(0));

    if (!setNextPrev) {
      return;
    }

    switch(bid) {
      case "vol":
      case "vol2":
        //create your own render function if default does not
        //work for you
        break;
      default:
        nextPrev(toc, $el);
        break;
    }
  }
}

//called for transcript pages
function loadTOC(toc) {
  //check if previously initialized
  if (toc.init) {
    //toc refresh not needed if not combined
    if (!toc.combined) {
      return;
    }

    //console.log("toc previously initialized, toc: %o", toc);
    $(".toc-image").attr("src", `${toc.image}`);
    $(".toc-title").html(`Table of Contents: <em>${toc.title}</em>`);
    $(".toc-list").html(toc.html);

    //set current-item, don't setNextPrev since it was already done.
    highlightCurrentTranscript(toc, false);

    return;
  }

  //console.log("transcript page: loading toc");
  let book = $("#contents-modal-open").attr("data-book").toLowerCase();
  toc.book = book;

  getConfig(book)
    .then((contents) => {
      $(".toc-image").attr("src", `${contents.image}`);
      $(".toc-title").html(`Table of Contents: <em>${contents.title}</em>`);
      toc["image"] = contents.image;
      toc["title"] = contents.title;
      toc["bid"] = contents.bid;

      toc.init = true;

      //default version of toc render function
      toc.html = makeContents(contents.base, contents.contents, contents.bid, toc);
      $(".toc-list").html(toc.html);

      highlightCurrentTranscript(toc);
    })
    .catch((error) => {
      console.error(error);
      $(".toc-image").attr("src", "/public/img/cmi/toc_modal.png");
      $(".toc-title").html("Table of Contents: <em>Error</em>");
      $(".toc-list").html(`<p>Error: ${error.message}</p>`);
      $(uiTocModal).modal("show");
    });
}

/*
  Calls to this function are valid for transcript pages.
*/
export function getBookId() {
  return $(uiOpenTocModal).attr("data-book");
}

export default {

  /*
   * Init the modal dialog with data from JSON file 
   * or local storage
   */
  initialize: function(env) {
    let toc = {init: false, book: "", restricted: true, html: ""};
    //dialog settings
    $(uiTocModal).modal({
      dimmerSettings: {opacity: uiModalOpacity},
      observeChanges: true
    });

    //check if user has access to content
    const userInfo = getUserInfo();
    if (userInfo && userInfo.roles.indexOf("unrestricted") !== -1) {
      toc.restricted = false;
    }

    //load toc once for transcript pages
    if (env === "transcript") {
      loadTOC(toc);
    }

    /*
     * TOC populated by JSON file from AJAX call if not found
     * in local storage.
     * 
     * Read value of data-book attribute to identify name of file
     * with contents.
     */
    $(uiOpenTocModal).on("click", (e) => {
      e.preventDefault();
      let book = $(e.currentTarget).attr("data-book").toLowerCase();
      let combined = $(e.currentTarget).hasClass("combined");

      //load the TOC if we're not on a transcript page
      if (env !== "transcript" || (env === "transcript" && combined)) {
        getConfig(book)
          .then((contents) => {
            $(".toc-image").attr("src", `${contents.image}`);
            $(".toc-title").html(`Table of Contents: <em>${contents.title}</em>`);
            $(".toc-list").html(makeContents(contents.base, contents.contents, contents.bid, toc));

            //mark toc as combined
            if (env === "transcript" && combined) {
              toc["combined"] = true;
            }

            $(uiTocModal).modal("show");
          })
          .catch((error) => {
            console.error(error);
            $(".toc-image").attr("src", "/public/img/cmi/toc_modal.png");
            $(".toc-title").html("Table of Contents: <em>Error</em>");
            $(".toc-list").html(`<p>Error: ${error.message}</p>`);
            $(uiTocModal).modal("show");
          });
      }
      else {
        loadTOC(toc);
        $(uiTocModal).modal("show");
      }
    });
  }
};

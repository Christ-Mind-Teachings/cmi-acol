import net from "./bmnet";
import key from "../_config/key";
import notify from "toastr";
import {annotation} from "./bookmark";
import {getBookmark} from "./bmnet";
import range from "lodash/range";
import {initShareDialog} from "./navigator";
import {getUserInfo} from "../_user/netlify";
import clipboard from "./clipboard";

var warningIssued = false;
function warnNotSignedIn() {
  let userInfo = getUserInfo();
  if (!userInfo && !warningIssued) {
    notify.options.timeOut = "10000";
    notify.success("Cancel, Sign In, and create a new bookmark.");
    notify.warning("You are not signed in. Bookmarks created when you are not signed in cannot be shared.");

    warningIssued = true;
  }
}

const form = `
  <form name="annotation" id="annotation-form" class="ui form">
    <input class="hidden-field" type="text" readonly="" name="creationDate">
    <input class="hidden-field" type="text" name="aid" readonly>
    <input class="hidden-field" type="text" readonly="" name="rangeStart">
    <div class="fields">
      <div class="three wide field">
        <input id="rangeEnd" type="text" name="rangeEnd" maxlength="4" placeholder="End">
      </div>
      <div id="available-topics" class="twelve wide field"></div>
      </div>
    </div>
    <div class="field">
      <input type="text" name="Comment" placeholder="Comment">
    </div>
    <div class="field">
      <input type="text" name="newTopics" placeholder="New topics? Comma delimited list">
    </div>
    <div class="field">
      <textarea name="Note" placeholder="Additional Notes" rows="3"></textarea>
    </div>
    <div class="fields">
      <button class="annotation-submit ui green button" type="submit">Submit</button>
      <button class="annotation-cancel ui red basic button">Cancel</button>
      <button class="annotation-share ui green disabled basic button">Share</button>
      <button class="annotation-note ui blue basic button">Links</button>
      <div class="twelve wide field">
        <button class="annotation-delete ui red disabled right floated button">Delete</button>
      </div>
    </div>
  </form>
  <div class="note-and-links hide">
    <table id="bookmark-link-table" class="ui selectable celled table">
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th>Reference</th>
          <th>Link</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="bookmark-link-list">
      </tbody>
    </table>
    <form name="linkForm" id="link-form" class="ui form">
      <div class="fields">
        <div class="ten wide field">
          <input required type="text" placeholder="Link note" name="reference">
        </div>
        <div class="five wide field">
          <input required type="text" placeholder="Link" name="link">
        </div>
        <button title="add or update" data-index="-1" type="submit" class="green ui icon button">
          <i class="plus circle icon"></i>
        </button>
        <button title="clear fields" type="reset" class="yellow ui icon button">
          <i class="minus circle icon"></i>
        </button>
      </div>
    </form>
  </div>
`;

let linkArray = [];
export function getLink(index) {
  return linkArray[index];
}

function populateTable(links) {
  return `
    ${links.map((item, index) => `
      <tr data-index="${index}">
        <td title="Delete" class="delete-link-item"><i class="red trash alternate icon"></i></td>
        <td title="Edit" class="edit-link-item"><i class="yellow pencil alternate icon"></i></td>
        <td data-name="reference">${item.reference}</td>
        <td data-name="link">${formatLink(item.link)}</td>
        <td title="Follow" class="follow-link-item"><i class="green share icon"></i></td>
      </tr>
    `).join("")}
  `;
}

function getIndex() {
  let value = $("#link-form [type='submit']").data("index");

  return parseInt(value, 10);
}

function setIndex(index) {
  $("#link-form [type='submit']").data("index", index);
}

function makeTableRow(item, index) {
  return `
    <tr data-index="${index}">
      <td title="Delete" class="delete-link-item"><i class="red trash alternate icon"></i></td>
      <td title="Edit" class="edit-link-item"><i class="yellow pencil alternate icon"></i></td>
      <td data-name="reference">${item.reference}</td>
      <td data-name="link">${item.link}</td>
      <td title="Follow" class="follow-link-item"><i class="green share icon"></i></td>
    </tr>
  `;
}

function validateLink(pid, link) {
  let rawLink;
  let pKey = key.genParagraphKey(pid);

  try {
    rawLink = JSON.parse(link);
  }
  catch(error) {
    notify.error("Invalid link; invalid format, get link from bookmark popup.");
    return false;
  }

  if (!rawLink.aid || !rawLink.desc || !rawLink.key || !rawLink.userId) {
    notify.error("Invalid link; invalid format, get link from bookmark popup.");
    return false;
  }

  if (rawLink.key === pKey) {
    notify.error("Invalid link; it references itself.");
    return false;
  }

  return true;
}

/*
 * format link for display in annotation form
 */
function formatLink(link) {
  let raw = JSON.parse(link);
  let display = `${raw.desc.source}:${raw.desc.book}:${raw.desc.unit}:${raw.desc.pid}`;
  return display;
}

function createLinkHandlers() {
  //add
  $(".transcript").on("submit", "#link-form", function(e) {
    e.preventDefault();

    //get state; new or edit
    let index = getIndex();
    let state = index === -1?"new":"edit";

    //get link values from form
    let form = $("#link-form").form("get values");

    //validate link
    let pid = $(".annotate-wrapper p.cmiTranPara").attr("id");
    if (!validateLink(pid, form.link)) {
      return;
    }

    let linkDisplay = formatLink(form.link);
    if (state === "new") {
      linkArray.push({reference: form.reference, link: form.link, deleted: false});
      let row = makeTableRow({reference: form.reference, link: linkDisplay}, linkArray.length - 1);
      $("#bookmark-link-list").append(row);
    }
    else {
      //update array
      linkArray[index] = {reference: form.reference, link: form.link, deleted: false};

      //update table
      $(`tr[data-index="${index}"] > td[data-name="reference"]`).text(linkArray[index].reference);
      $(`tr[data-index="${index}"] > td[data-name="link"]`).text(linkDisplay);
      setIndex(-1);
    }

    $("#link-form").form("clear");
  });

  //delete
  $(".transcript").on("click", "#bookmark-link-list td.delete-link-item", function(e) {
    e.stopPropagation();
    e.preventDefault();
    let parent = $(this).parent();
    let index = parseInt(parent.attr("data-index"), 10);

    //mark deleted item from linkArray
    linkArray[index].deleted = true;

    //remove item from table
    parent.remove();
    console.log("after delete: link %o", linkArray);
  });

  //edit
  $(".transcript").on("click", "#bookmark-link-list td.edit-link-item", function(e) {
    e.stopPropagation();
    e.preventDefault();
    let index = parseInt($(this).parent().attr("data-index"), 10);

    $("#link-form").form("set values", linkArray[index]);
    setIndex(index);
  });
}

function noteToggle() {
  $(".transcript").on("click", "#annotation-form .annotation-note", function(e) {
    e.preventDefault();

    let nal = $(".note-and-links");

    if (nal.hasClass("hide")) {
      nal.removeClass("hide");
    }
    else {
      nal.addClass("hide");
    }
  });
}


const wrapper = `
  <div class="annotate-wrapper ui raised segment"></div>`;

function generateHorizontalList(listArray) {
  if (!listArray || listArray.length === 0) {
    return `
      <div class="item">
        <em>Annotation has no topics</em>
      </div>
    `;
  }

  return `
    ${listArray.map((item) => `
      <div class="item">
        <em>${item.topic}</em>
      </div>
    `).join("")}
  `;
}

function generateExtraList(annotation) {
  let extras = [];

  if (annotation.Note) {
    extras.push("N");
  }

  if (annotation.links) {
    extras.push(`L${annotation.links.length}`);
  }

  if (extras.length === 0) {
    return `
      <div class="item">
        <i class="bookmark outline icon"></i>
      </div>
    `;
  }

  return `
    ${extras.map((item) => `
      <div class="item">
        ${genExtrasItem(item)}
      </div>
    `).join("")}
  `;
}

function genExtrasItem(item) {
  let icon;

  if (item === "N") {
    icon = "<i class='align justify icon'></i>";
  }
  else if (item.startsWith("L")) {
    let length = item.substr(1);
    icon = `<i class="linkify icon"></i>[${length}]`;
  }

  return `${icon}`;
}

function generateComment(comment) {
  if (!comment) {
    return "No comment";
  }
  else {
    return comment;
  }
}

/*
  Populate form fields
  args:
    pid: the paragraph id of the annotation
    aid: the id of associated highlighted text
    annotation: user data for existing annotations
  */
function initializeForm(pid, aid, annotation) {
  let form = $("#annotation-form");
  let linkform = $("#link-form");

  /*
  linkform.form("set values", {
    linkNote: "Hi Rick",
    link: "a:b:c"
  });
 */

  //set link array to empty
  linkArray = [];

  //a new annotation
  if (!annotation) {
    form.form("set values", {
      rangeStart: pid,
      rangeEnd: pid,
      aid: aid
    });
  }
  else {
    let topicSelect = [];

    if (annotation.topicList) {
      topicSelect = annotation.topicList.map(t => t.value);
    }

    if (annotation.links) {
      linkArray = annotation.links;

      let html = populateTable(linkArray);
      $("#bookmark-link-list").html(html);
    }

    form.form("set values", {
      rangeStart: annotation.rangeStart,
      rangeEnd: annotation.rangeEnd,
      aid: annotation.aid,
      creationDate: annotation.creationDate,
      Comment: annotation.Comment,
      Note: annotation.Note,
      topicList: topicSelect
    });
  }

  document.getElementById("rangeEnd").focus();
}

function getFormData() {
  return $("#annotation-form").form("get values");
}

//returns true if annotation form is open
function annotationFormOpen(currentPid) {
  let selector = $(".transcript .annotation-edit");

  if (selector.length > 0) {
    let pid = selector.first(1).attr("id");

    //if currentPid === pid user clicked hidden link in editor, we just exit w/o notice
    if (currentPid !== pid) {
      notify.info(`A bookmark is already being added at paragraph ${pid}. Please complete that first.`);
    }
    return true;
  }
  return false;
}

function bookmarkNavigatorActive() {
  if ($(".transcript").hasClass("bookmark-navigator-active")) {
    notify.info("Annotation is disabled when the bookmark navigator is active.");
    return true;
  }
  return false;
}

function editAnnotation(pid, aid, annotation) {
  let rangeStart = parseInt(annotation.rangeStart.substr(1), 10);
  let rangeEnd = parseInt(annotation.rangeEnd.substr(1), 10);

  //add class 'annotation-edit' to paragraphs so they can be wrapped
  if (rangeStart !== rangeEnd) {
    let annotationRange = range(rangeStart, rangeEnd + 1);
    for (let i = 0; i < annotationRange.length; i++) {
      $(`#p${annotationRange[i]}`).addClass("annotation-edit");
    }
  }
  else {
    $(`#${pid}`).addClass("annotation-edit");
  }
  //console.log("editAnnotation");

  warnNotSignedIn();

  //.disable-selection will prevent text selection during annotation creation/edit
  addSelectionGuard();


  $(".annotation-edit").wrapAll(wrapper);
  $(".annotate-wrapper").prepend(form);
  $(".annotation-delete.disabled").removeClass("disabled");
  $(".annotation-share.disabled").removeClass("disabled");
  getTopicList(pid, aid, annotation);
}

/*
  Support for creating annotations with no associated selected text
*/
function noteHandler() {
  $(".transcript").on("click", "p.cmiTranPara > span.pnum", function(e) {
    e.preventDefault();
    let pid = $(this).parent("p").attr("id");

    //we're already editing this annotation
    if (annotationFormOpen() || bookmarkNavigatorActive()) {
      return;
    }

    let bookmarkData = getBookmark(pid);

    if (bookmarkData.bookmark) {
      let annotation = bookmarkData.bookmark.find(value => typeof value.aid === "undefined");

      //we found a note - so edit it
      if (annotation) {
        editAnnotation(pid, undefined, annotation);
        return;
      }
    }

    //disable text selection while annotation form is open
    addSelectionGuard();

    //new note for paragraph
    $(`#${pid}`).addClass("annotation-edit annotation-note");
    $(".annotation-edit").wrapAll(wrapper);
    $(".annotate-wrapper").prepend(form);
    getTopicList(pid);
  });
}

function hoverNoteHandler() {
  $(".transcript").on("mouseenter", ".has-annotation", function(e) {
    e.preventDefault();

    let aid = $(this).data("aid");
    let pid = $(this).parent("p").attr("id");

    //bookmark wont be found if it is still being created
    let bookmarkData = getBookmark(pid);
    if (!bookmarkData.bookmark) {
      return;
    }

    let annotation = bookmarkData.bookmark.find(value => value.creationDate === aid);

    //sometimes the annotation won't be found because it is being created, so just return
    if (!annotation) {
      return;
    }

    let topicList = generateHorizontalList(annotation.topicList);
    let comment = generateComment(annotation.Comment);
    let extraHtml = generateExtraList(annotation);
    $(".annotation-information .topic-list").html(topicList);
    $(".annotation-information .range").html(`Range: ${annotation.rangeStart}/${annotation.rangeEnd}`);
    $(".annotation-information .description").html(`${comment}`);
    $(".annotation-information .extra").html(extraHtml);
    $(this)
      .popup({popup: ".annotation-information.popup", hoverable: true})
      .popup("show");

    //create link
    let link = createBookmarkLink(pid, aid);
    $("#popup-button").attr("data-clipboard-text", link);

    clipboard.register("#popup-button");

    //set focus on button so pressing Enter will click the button
    $("#popup-button").focus();
  });
}


/*
 * Highlighted text hover; show popup
 */
function hoverHandler() {
  $(".transcript").on("mouseenter", "[data-annotation-id]", function(e) {
    e.preventDefault();

    let aid = $(this).attr("data-annotation-id");
    let pid = $(this).parent("p").attr("id");
    let realAid = $(this).data("aid");

    //disable hover if highlights are hidden
    if ($(".transcript").hasClass("hide-bookmark-highlights")) {
      $(this).popup("hide").popup("destroy");
      return;
    }

    //disable hover if highlights are selectively hidden, filtered
    if ($(".transcript").hasClass("topic-filter-active")) {
      if (!$(this).hasClass("show")) {
        $(this).popup("hide").popup("destroy");
        return;
      }
    }

    //disable popup for paragraphs being edited
    if ($(`#${pid}`).hasClass("annotation-edit")) {
      $(`#${pid} [data-annotation-id]`).each(function() {
        $(this).popup("hide").popup("destroy");
      });
      return;
    }

    //disable popup for paragraphs wrapped in segment div
    if ($(`#${pid}`).hasClass("selected-annotation")) {
      $(`#${pid} [data-annotation-id]`).each(function() {
        $(this).popup("hide").popup("destroy");
      });
      return;
    }

    //disable popup for shared annotations
    if ($(this).hasClass("shared")) {
      $(this).popup("hide").popup("destroy");
      return;
    }

    //bookmark wont be found if it is still being created
    let bookmarkData = getBookmark(pid);
    if (!bookmarkData.bookmark) {
      return;
    }

    let annotation = bookmarkData.bookmark.find(value => value.aid === aid);

    //sometimes the annotation won't be found because it is being created, so just return
    if (!annotation) {
      return;
    }

    let topicList = generateHorizontalList(annotation.topicList);
    let comment = generateComment(annotation.Comment);
    let extraHtml = generateExtraList(annotation);
    $(".annotation-information .topic-list").html(topicList);
    $(".annotation-information .range").html(`Range: ${annotation.rangeStart}/${annotation.rangeEnd}`);
    $(".annotation-information .description").html(`${comment}`);
    $(".annotation-information .extra").html(extraHtml);
    $(this)
      .popup({popup: ".annotation-information.popup", hoverable: true})
      .popup("show");

    //create link
    let link = createBookmarkLink(pid, realAid);
    $("#popup-button").attr("data-clipboard-text", link);

    clipboard.register("#popup-button");

    //set focus on button so pressing Enter will click the button
    $("#popup-button").focus();
  });
}

/*
 * Create a link reference to a CMI bookmark
 *
 * Format: pageKey.000:aid:uid
 */
function createBookmarkLink(pid, aid) {
  let pKey = key.genParagraphKey(pid);
  let keyInfo = key.describeKey(pKey);
  let userInfo = getUserInfo();

  let link = {userId: userInfo.userId, key: pKey, aid: aid, desc: keyInfo};
  return JSON.stringify(link);
}

/*
 * Click handler for the button press on annotation popups.
 */
function getReferenceHandler() {
  $("body").on("click", "#popup-button", function(e) {
    //for selected text bookmarks
    $("mark.visible").popup("hide");

    //for note style bookmarks
    $(".pnum.has-annotation.visible").popup("hide");
  });
}

function editHandler() {
  $(".transcript").on("click", "[data-annotation-id]", function(e) {
    e.preventDefault();

    let aid = $(this).attr("data-annotation-id");
    let pid = $(this).parent("p").attr("id");

    //we're already editing this annotation
    if (annotationFormOpen(pid) || bookmarkNavigatorActive()) {
      return;
    }

    //disable edit if highlights are hidden
    if ($(".transcript").hasClass("hide-bookmark-highlights")) {
      return;
    }

    //disable edit if highlights are selectively hidden, filtered
    if ($(".transcript").hasClass("topic-filter-active")) {
      if (!$(this).hasClass("show")) {
        return;
      }
    }

    //disable edit for shared annotations
    if ($(this).hasClass("shared")) {
      return;
    }

    //hide this popup
    $(this).popup("hide");

    //show this highlight, all others are hidden
    $(this).addClass("show");

    let bookmarkData = getBookmark(pid);
    let annotation = bookmarkData.bookmark.find(value => value.aid === aid);

    editAnnotation(pid, aid, annotation);
  });
}

/*
 * Enable text selection by removing .disable-selection unless
 * .user is present. This means user has explicitly disabled
 * text selection.
 */
function removeSelectionGuard() {
  let guard = $("div.transcript.ui.disable-selection:not(.user)");
  if (guard.length > 0) {
    console.log("removing selection guard");
    guard.removeClass("disable-selection");
  }
}

/*
 * Disable text selection when annotation form is open
 */
function addSelectionGuard() {
  let guard = $("div.transcript.ui");
  if (!guard.hasClass("disable-selection")) {
    console.log("adding selection guard");
    guard.addClass("disable-selection");
  }
}

function submitHandler() {
  $(".transcript").on("submit", "#annotation-form", function(e) {
    e.preventDefault();

    //enable text selection, disabled when annotation form open
    removeSelectionGuard();

    //1. Create new topic begins here
    let formData = getFormData();

    //topicList contains topic strings but we want the topic object
    //get it from the select option tag
    if (formData.topicList.length > 0) {
      let topicObjectArray = formData.topicList.map(tv => {
        let topic = $(`#annotation-topic-list > [value='${tv}']`).text();
        return {value: tv, topic: topic};
      });
      formData.topicList = topicObjectArray;
    }

    unwrap();

    //remove class "show" added when form was displayed
    $(`[data-annotation-id="${formData.aid}"]`).removeClass("show");

    //this is a note annotation, no selected text, add page title to formData
    if ($(".transcript .annotation-edit").hasClass("annotation-note")) {
      formData.bookTitle = $("#book-title").text();
    }

    //get links from annotation
    let links = linkArray.filter(l => l.deleted === false);
    if (links.length > 0) {
      formData.links = links;
    }

    annotation.submit(formData);
    $(".transcript .annotation-edit").removeClass("annotation-edit annotation-note");
  });
}

/*
  Handle cancel button pressed on annotation form
*/
function cancelHandler() {
  $(".transcript").on("click", "#annotation-form .annotation-cancel", function(e) {
    e.preventDefault();

    //enable text selection, disabled when annotation form open
    removeSelectionGuard();

    let formData = getFormData();
    unwrap();

    //remove class "show" added when form was displayed
    $(`[data-annotation-id="${formData.aid}"]`).removeClass("show");

    annotation.cancel(formData);
    $(".transcript .annotation-edit").removeClass("annotation-edit");
  });
}

/*
  Handle share button pressed on annotation form
*/
function shareHandler() {
  $(".transcript").on("click", "#annotation-form .annotation-share", function(e) {
    e.preventDefault();

    let formData = getFormData();
    unwrap();

    //remove class "show" added when form was displayed
    $(`[data-annotation-id="${formData.aid}"]`).removeClass("show");

    annotation.cancel(formData);
    $(".transcript .annotation-edit").removeClass("annotation-edit");

    let userInfo = getUserInfo();
    if (!userInfo) {
      userInfo = {userId: "xxx"};
    }

    //this is really the annotation-id not the aid
    let annotation_id = formData.aid;
    let aid;

    let rangeArray = [formData.rangeStart, formData.rangeEnd];
    let numericRange = rangeArray.map((r) => parseInt(r.substr(1),10));

    let pid = rangeArray[0];

    //get the real aid
    if (annotation_id.length > 0) {
      aid = $(`[data-annotation-id="${annotation_id}"]`).attr("data-aid");
      $(`[data-annotation-id="${annotation_id}"]`).addClass("show");
    }
    else {
      aid = $(`#${pid} > span.pnum`).attr("data-aid");
    }

    let url = `https://${location.hostname}${location.pathname}?as=${pid}:${aid}:${userInfo.userId}`;

    let annotationRange = range(numericRange[0], numericRange[1] + 1);
    let header2;

    if (userInfo.userId === "xxx") {
      header2 = `
        <h4 class="ui left floated header">
          <i title="Sign into your account to share this bookmark to FB by email or to copy a link." class="red window close outline small icon"></i>
          <div class="content">
            ${formData.Comment}
          </div>
        </h4>
        <h4 class="ui right floated header">
          <i title="Close Window" class="share-annotation window close small icon"></i>
        </h4>
      `;
    }
    else {
      header2 = `
        <h4 class="ui left floated header">
          <i title="Share to Facebook" class="share-annotation facebook small icon"></i>
          <i title="Share via email" class="share-annotation envelope outline small icon"></i>
          <i data-clipboard-text="${url}" title="Copy Url to Clipboard" class="share-annotation linkify small icon"></i>
          <div class="content">
            ${formData.Comment}
          </div>
        </h4>
        <h4 class="ui right floated header">
          <i title="Close Window" class="share-annotation window close small icon"></i>
        </h4>
      `;
    }

    for (let i = 0; i < annotationRange.length; i++) {
      if (i === 0) {
        $(`#p${annotationRange[i]}`).addClass("selected-annotation clearBoth");
      }
      else {
        $(`#p${annotationRange[i]}`).addClass("selected-annotation");
      }
    }

    $(".selected-annotation").wrapAll("<div class='selected-annotation-wrapper ui clearing raised segment'></div>");
    $(".selected-annotation-wrapper").prepend(header2);

    if (userInfo.userId !== "xxx") {
      clipboard.register(".share-annotation.linkify");
    }
  });

  //init click handler for FB and email share dialog
  initShareDialog("annotate.js");
}

function deleteHandler() {
  $(".transcript").on("click", "#annotation-form .annotation-delete", function(e) {
    e.preventDefault();

    //enable text selection, disabled when annotation form open
    removeSelectionGuard();

    let formData = getFormData();
    unwrap();

    annotation.delete(formData);
    $(".transcript .annotation-edit").removeClass("annotation-edit");
  });
}

/*
  initialize annotation event handlers
*/
export function initialize() {
  submitHandler();
  cancelHandler();
  shareHandler();
  deleteHandler();
  editHandler();
  noteHandler();
  hoverHandler();
  noteToggle();
  createLinkHandlers();
  getReferenceHandler();
  hoverNoteHandler();
}

/*
  Display annotation form
  args:
    highlight - highlighted text object
  */
export function getUserInput(highlight) {

  //don't allow multiple annotation forms to be open at the same time
  // - if open cancel the highlight
  if (annotationFormOpen(highlight.pid) || bookmarkNavigatorActive()) {
    annotation.cancel({aid: highlight.id});
    return;
  }

  //.disable-selection will prevent text selection during annotation creation/edit
  addSelectionGuard();

  warnNotSignedIn();

  $(`#${highlight.pid}`).addClass("annotation-edit");
  $(".annotation-edit").wrapAll(wrapper);
  $(".annotate-wrapper").prepend(form);
  getTopicList(highlight.pid, highlight.id);

  //show this highlight, all others are hidden
  $(`[data-annotation-id="${highlight.id}"]`).addClass("show");
}

/*
  remove annotation form
*/
function unwrap() {
  $(".annotate-wrapper > form").remove();
  $(".annotate-wrapper > .note-and-links").remove();
  $(".annotation-edit").unwrap();
}

//generate the option element of a select statement
function generateOption(topic) {
  if (typeof topic === "object") {
    return `<option value="${topic.value}">${topic.topic}</option>`;
  }
  else {
    return `<option value="${topic}">${topic}</option>`;
  }
}

function makeTopicSelect(topics) {
  return (`
    <select name="topicList" id="annotation-topic-list" multiple="" class="search ui dropdown">
      <option value="">Select Topic(s)</option>
      ${topics.map(topic => `${generateOption(topic)}`).join("")}
    </select>
  `);
}

function getTopicList(pid, aid, data) {
  //get topics from server or local storage
  net.fetchTopics()
    .then((response) => {
      let selectHtml = makeTopicSelect(response.topics);
      $("#available-topics").html(selectHtml);

      //init annotation form components
      $("select.dropdown").dropdown();

      //init form
      initializeForm(pid, aid, data);
    })
    .catch(( error ) => {
      console.error("topic fetch error: ", error);
      notify.error("Unable to fetch bookmark topic list: ", error);
    });
}

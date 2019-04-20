import Clipboard from "clipboard";
import notify from "toastr";

//var clipboard;
var clipboard = new Map();

function setEvents(clip) {
  clip.on("success", (e) => {
    notify.info("Link Copied to Clipboard");
    e.clearSelection();
  });

  clip.on("error", () => {notify.info("Error coping to Clipboard");});
}

function createInstance(selector) {
  var object = new Clipboard(selector);
  setEvents(object);
  return object;
}

export default {
  register: function(selector) {
    let clip = clipboard.get(selector);
    if (!clip) {
      clip = createInstance(selector);
      clipboard.set(selector, clip);
    }
    return clip;
  },
  destroy: function(selector) {
    let clip = clipboard.get(selector);
    if (clip) {
      clip.destroy();
      clipboard.delete(selector);
    }
  }
};

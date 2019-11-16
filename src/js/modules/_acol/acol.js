/*
 * ACOL page specific functions
 */

import {getUserInfo} from "www/modules/_user/netlify";
import store from "store";
import notify from "toastr";
import axios from "axios";
import globals from "www/globals";

const ackKey = "acol-ack-state";

/*
 * Submit handler for ACOL Acknowledgement form
 * - enabled only when user has an account and does not already have full access
 */
function createSubmitHandler($form) {

  $form.submit(function(e) {
    e.preventDefault();

    let $form = $(this);
    let formData = $form.form("get values");

    let apiBody = {
      senderName: formData.name,
      senderEmail: formData.email,
      to: globals.acolManager
    };

    axios.post(globals.acol, apiBody)
      .then((response) => {
        if (response.status === 200) {
          notify.info("Request Sent!");
          store.set(ackKey,"request successful");
          $("#acolack-form-submit").attr("disabled", true);
          $(".acol-step2").append("&nbsp;<i class='green check icon'></i> Completed!");
          $("#acolack-prompt").html("<i class='green check icon'></i> Success!");
        }
        else {
          notify.info(response.data.message);
        }
      })
      .catch((error) => {
        console.error("request error: %s", error);
      });
  });
}


export default {
  initialize: function() {
    let $form = $(`form#acolack-form`);
    if ($form.length === 0) {
      return;
    }

    let userInfo = getUserInfo();

    if (userInfo) {
      $form.form("set values", {
        name: userInfo.name,
        email: userInfo.email
      });

      if (!userInfo.roles) {
        userInfo.roles = [];
      }

      //mark Step 1: as complete
      $(".acol-step1").append("&nbsp;<i class='green check icon'></i> Completed!");

      //check if user has acol role
      let acol = userInfo.roles.find(ele => {return ele === "acol"});

      if (acol) {
        //notify user they have access to all content
        $(".acol-step2").append("&nbsp;<i class='green check icon'></i> Completed!");
        $(".acol-step3").append("&nbsp;<i class='green check icon'></i> Complete, you have access!");
      }
      else {
        //check if form previously submitted and waiting for role to be assigned
        //check local storage
        let ackState = store.get(ackKey);

        // User has not yet acknowledged ownership
        if (!ackState) {
          //enable submit
          $("#acolack-form-submit").removeAttr("disabled");
          $("#acolack-prompt").html("<i class='red left arrow icon'></i> Click here to acknowledge");
          createSubmitHandler($form);
        }
        else {
          $(".acol-step2").append("&nbsp;<i class='green check icon'></i> Completed!");
          notify.info("Your request for full accessed has been submitted.");
        }
      }
    }
  }
};


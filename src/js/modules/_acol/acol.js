/*
 * ACOL page specific functions
 */

import notify from "toastr";
import axios from "axios";

import {storeSet, storeGet} from "common/modules/_util/store";
import {getUserInfo} from "common/modules/_user/netlify";
import globals from "common/globals";

//const ackKey = "acol-ack-state";
const ackKey = "ackState";

/*
 * Submit handler for ACOL Acknowledgement form
 * - enabled only when user has an account and does not already have full access
 */
function createSubmitHandler($form) {

  $form.submit(function(e) {
    e.preventDefault();

    let $form = $(this);
    let formData = $form.form("get values");
    //console.log("formData: %o", formData);

    $("#acolack-form-submit").attr("disabled", true);

    let apiBody = {
      senderName: formData.name,
      senderEmail: formData.email,
      newsletter: formData.newsletter,
      to: globals.acolManager
    };

    axios.post(globals.acol, apiBody)
      .then((response) => {
        if (response.status === 200) {
          notify.info("Request Sent!");
          storeSet(ackKey,"request successful");
          $(".acol-step2").append("&nbsp;<i class='green check icon'></i> Completed!");
          $("#acolack-prompt").html("<i class='green check icon'></i> Success!");
        }
        else {
          notify.info(response.data.message);
        }
      })
      .catch((error) => {
        notify.info(`There was an error sending your request for full access to ACOL. Please contact Rick using the contact form.`);
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
      let newsletter = userInfo.roles.find(ele => {return ele === "newsletter"});

      if (acol) {
        //notify user they have access to all content
        $(".acol-step2").append("&nbsp;<i class='green check icon'></i> Completed!");
        $(".acol-step3").append("&nbsp;<i class='green check icon'></i> Complete, you have access!");

        //indicate user declined subscription to newsletter
        if (!newsletter) {
          $("[name='newsletter']").removeAttr("checked");
        }
      }
      else {
        //check if form previously submitted and waiting for role to be assigned
        //check local storage
        let ackState = storeGet(ackKey);

        // User has not yet acknowledged ownership
        if (!ackState) {
          //enable submit
          $("#acolack-form-submit").removeAttr("disabled");
          $("#acolack-prompt").html("<i class='red left arrow icon'></i> Click here to acknowledge");

          //allow user to accept or reject newsletter subscription
          $("[name='newsletter']").removeAttr("disabled");
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


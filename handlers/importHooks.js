const express = require('express');
const router = express.Router();
const app = express();
const http = require('http').Server(app);
const svr = require('../server.js');
const io = svr.io;
const helpers = require('../helpers.js');
const hookViewer = require('../hookViewer.js');

let title;
let description;
let body;

/**
*
* Import Hook Handler
* 
* NOTE: In a production environment, you MUST check the Authorization header. 
* This MUST be done on every request made to this endpoint to verify that the request is really from Okta.
*
**/

router.post("/", (req, res) => {
  
  var cloudEvent = req.body.data;
  console.log(`Importing user "${cloudEvent.appUser.profile.userName}" as a "${cloudEvent.action.result}"`);

  title = req.originalUrl;
  description = `Okta Import Hook handler called with user: <b>${cloudEvent.appUser.profile.userName}</b> with action <b>${cloudEvent.action.result}</b>. Here's the body of the request from Okta:`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
    
  // Return an empty response if we show no conflicts in the event
  if (cloudEvent.context.conflicts.length == 0) {
    return res.status(204).send();
  }
  
  // Return an empty response if the conflict isn't for the login id
  if (!cloudEvent.context.conflicts.includes("login")) {
    return res.status(204).send();
  }
  
  // Resolve the login id conflict
  var user = cloudEvent.appUser.profile;
  var profileUpdate = {
    "result": "SUCCESS",
    "commands": [
      {
        "type": "com.okta.appUser.profile.update",
        "email": user.firstName + "." + user.lastName + "@example.com"
      },
      {
        "type": "com.okta.action.update.import",
        "result": "CREATE"
      }
    ],
    "debugContext": {
      "stuff": "The user profile was updated to an example email address"
    }
  }
  
  title = '/okta/hooks/registration/dblookup';
  description = `Below is the <b>response</b> that our Hook handler will return to Okta:`;
  body = profileUpdate;

  hookViewer.emitViewerEvent(title, description, body, true);    
    
  res.send(profileUpdate);

})


/**
 * Expose the API routes
 */
module.exports = router;
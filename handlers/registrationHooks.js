const express = require('express');
const app = express();
const http = require('http').Server(app);
const router = express.Router();
const request = require('request');
const util = require('util');
const helpers = require('../helpers.js');
const hookViewer = require('../hookViewer.js');

let payload;
let statusCode;
let commands;
let responseBody = {}
let error = null;
let contextMessage;
let debugContext;
let title;
let description;
let body;

/**
*
*  Experimental - included so that there's a pre-registered hook in Okta for testing
*   out ideas.
*
**/
router.post('/exp', function(req, res) {
  
  res.status(204).send();
  
});

/**
*
*  Inline hook handler for registration with database lookup for account verification
*
**/
router.post('/dblookup/:post_action?', function(req, res) {

  helpers.logRequest(req);
  
  const payload = req.body;
  
  // Make sure we have a valid request payload
  if (!payload.data.userProfile || !payload.data.userProfile.memberNumber || !payload.data.userProfile.ssn) {
    // If the request payload is missing the user profile element, deny registration with a specific error
    commands = [{
        "type": "com.okta.action.update",
        "value": {
            "registration": "DENY"
        }
    }];
    error = {
        "errorSummary": "Invalid request payload",
        "errorCauses": [{
            "errorSummary": "The request payload was not in the expected format. Member Number and SSN are required.",
            "reason": "INVALID_PAYLOAD",
        }]
    };
    contextMessage = {
        "status": "Payload was missing expected user profile fields"
    };
    // Format the debugContext element as a stringified JSON object so it could potentially be parsed by a SEIM tool later.
    debugContext = {
      "contextMessage": JSON.stringify(contextMessage)
    };
    
    // compose the response to Okta, including any commands we want Okta to perform
    responseBody = {
        commands,
        error,
        debugContext
    };
      
    // Emit this event to the socket.io listener
    title = req.originalUrl;
    description = `<div class="logDescriptionText">Below is the <b>response</b> that our Hook handler will return to Okta:</div>`;
    body = responseBody;

    hookViewer.emitViewerEvent(title, description, body, true);  
    
    res.status(200).send(responseBody);
    return;
  }
  
  // Parse memberNumber and SSN request payload
  const userProfile = payload.data.userProfile;
  const memberSSN = userProfile.ssn;
  const memberNumber = userProfile.memberNumber;
  
  title = req.originalUrl;
  description = `Below is the <b>request</b> that Okta sent to our Registration Hook`;
  body = payload;
  
  hookViewer.emitViewerEvent(title, description, body, true);      
  
  const requestJson = {
    "memberId": memberNumber,
    "ssn": memberSSN
  }
  
  //TODO: change the MEMBER_DATA_API value to /member-lookup
  
  const options = {
    uri: `${process.env.MEMBER_DATA_API}`,
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'x-api-key': process.env.MEMBER_DATA_API_KEY
    },
    json: requestJson
  };
  
  request(options, function(error, response, body) {
  
    console.log(`Member data API request:\n`, util.inspect(options, {showHidden: false, depth: null, colors: true}));
    
    if (error) {
      console.log(`Status: ${response.statusCode}`);
      console.error(error);
      //res.status(500).send(error);
    }
    
    if (response) {
      
      error = null;
      console.log(`Member data API response code: ${response.statusCode}`);
      console.log(`Member data API response body:\n`, util.inspect(response.body, {showHidden: false, depth: null, colors: true}));
      
      if (response.statusCode === 200 && response.body.verified === true) {

        // If we found a match in the Member service

        commands = [{
              "type": "com.okta.user.profile.update",
              "value": {
                "memberLevel": response.body.memberPlanLevel
              }
            }];
            contextMessage = {
              "statusMessage": `Registration succeeded. Member account was verified by SSN and MemberId`
            };
            debugContext = {
              "contextMessage": JSON.stringify(contextMessage)
            };
         } else {
            
          // Member SSN and MemberId weren't found in Members service
          commands = [{
            "type": "com.okta.action.update",
            "value": {
                "registration": "DENY"
            }
          }];
          error = {
            "errorSummary": "Member not found",
            "errorCauses": [{
                "errorSummary": "Unable to verify user by SSN and MemberId",
                "reason": "MEMBER_NOT_FOUND",
            }]
          };
          contextMessage = {
              "status": "Unable to verify user by SSN and MemberId"
          };
          // Format the debugContext element as a stringified JSON object so it could potentially be parsed by a SEIM tool later.
          debugContext = {
            "contextMessage": JSON.stringify(contextMessage)
          };

          // compose the response to Okta, including any commands we want Okta to perform
          console.log(`*** error *** ${error}`);
         }

        responseBody = {
          commands,
          error,
          debugContext
        };
        
    
        // compose the response body
        // only include optional elements if they have values
        if (commands) responseBody.commands = commands;
        if (error) responseBody.error = error;
        if (debugContext) responseBody.debugContext = debugContext;
    
        // Emit this event to the socket.io listener
        title = req.originalUrl;
        description = `Below is the <b>response</b> that our Hook handler will return to Okta:`;
        body = responseBody;
  
        hookViewer.emitViewerEvent(title, description, body, true);  
      
        res.send(responseBody);      

    }
        
  });
});

/**
*
*  Inline hook handler for registration with demoble scenarios determined by email domain 
*
**/
router.post('/domain', function(req, res) {
    
  const payload = req.body;
  
  // Make sure we have a valid request payload
  if (!payload.data || !payload.data.userProfile) {
    // If the request payload is missing the user profile element, deny registration with a specific error
    commands = [{
        "type": "com.okta.action.update",
        "value": {
            "registration": "DENY"
        }
    }];
    error = {
        "errorSummary": "Invalid request payload",
        "errorCauses": [{
            "errorSummary": "The request payload was not in the expected format",
            "reason": "INVALID_PAYLOAD",
        }]
    };
    contextMessage = {
        "status": "Payload was missing event.body or event.body.data object"
    };
    // Format the debugContext element as a stringified JSON object so it could potentially be parsed by a SEIM tool later.
    debugContext = {
      "contextMessage": JSON.stringify(contextMessage)
    }
    // compose the response to Okta, including any commands we want Okta to perform
    const responseBody = {
          commands,
          error,
          debugContext
      };
    
    // Send this event to the Hook Viewer
    title = '/okta/hooks/registration/domain';
    description = `Below is the <b>response</b> that our Hook handler will return to Okta:`;
    body = responseBody;

    hookViewer.emitViewerEvent(title, description, body, true);  
    
    res.status(200).send(responseBody);
    return;
  }
  
  // Parse user email from request payload
  const userProfile = payload.data.userProfile;
  const emailAddress = userProfile.email;
  const emailDomain = helpers.parseEmailDomain(emailAddress);
  
  title = '/okta/hooks/registration/domain';
  description = `Below is the <b>request</b> that Okta sent to our Registration Hook`;
  body = payload;
  
  hookViewer.emitViewerEvent(title, description, body, true);    
  
  // *** DEMO *** depending on the email domain provided in the registration form, 
  // this API will perform different actions
  switch(emailDomain) {
    case 'deny.example.com':
      commands = [{
        "type": "com.okta.action.update",
        "value": {
          "registration": "DENY"
        }
      }];
      error = null;
      contextMessage = {
        "status": "Registration Failed",
        "reason": "Demo use case denying registration with no specific error for domain: " + emailDomain
      };
      debugContext = { 
        "contextMessage": JSON.stringify(contextMessage) 
      };
      statusCode = 200;
      break;
    case 'error.example.com':
      commands = [{
        "type": "com.okta.action.update",
        "value": {
          "registration": "DENY"
        }
      }];
      error = {
        "errorSummary": "Registration Denied",
		    "errorCauses": [{
				"errorSummary": "Invalid email domain: " + emailDomain,
          "reason": "INVALID_EMAIL_DOMAIN",
          "locationType": "body",
          "location": "email",
          "domain": emailDomain
        }]
      };
      contextMessage = {
        "status": "Registration Failed",
        "reason": "Special demo email domain: " + emailDomain
      };
      debugContext = { 
        "contextMessage": JSON.stringify(contextMessage) 
      };
      statusCode = 200;
      break;
    case 'allow.example.com':
      commands = null;
      error = null;
      contextMessage = {
        "statusMessage": "Registration succeeded. No UD profile attributes were updated."
      }
      debugContext = {
        "contextMessage": JSON.stringify(contextMessage)
      }
      statusCode = 200;
      break;
    case 'update.example.com':
      commands = [
        {
          "type": "com.okta.user.profile.update",
          "value": {
            "title": "Bigshot at " + emailDomain
          }
        },
        {
          "type": "com.okta.user.profile.update",
          "value": {
            "nickName": "Frank"
          }
        }
      ];
      error = null;
      contextMessage = {
        "statusMessage": `Registration succeeded. We've updated the UD profile attribute Title to the value Main Guy at ${emailDomain}`
      }
      debugContext = {
        "contextMessage": JSON.stringify(contextMessage)
      }
      statusCode = 200;
      break;
    default:
      // If the email domain provided doesn't match any of our demo use cases, allow registration and reply with a 204.
      commands = null;
      error = null;
      debugContext = null
      statusCode = 204;
  }
    
  // compose the response body
  let responseBody = {}
  
  // only include optional elements if they have values
  if (commands) responseBody.commands = commands;
  if (error) responseBody.error = error;
  if (debugContext) responseBody.debugContext = debugContext;
   
  title = '/okta/hooks/registration/domain';
  description = `Below is the <b>response</b> that our Hook handler will return to Okta:`;
  body = responseBody;
  
  hookViewer.emitViewerEvent(title, description, body, true);  
  
  res.status(statusCode).send(responseBody);
  
});


/**
 * Expose the API routes
 */
module.exports = router;
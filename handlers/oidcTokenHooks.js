const express = require('express');
const router = express.Router();
const app = express();
const http = require('http').Server(app);
const request = require('request');
const util = require('util');
const svr = require('../server.js');
const io = svr.io;
const helpers = require('../helpers.js');
const hookViewer = require('../hookViewer.js');

let title;
let description;
let body;

/**
*
* OIDC/OAuth token extensibilty Hook Handler (simple email domain)
*
* 
* 
* NOTE: In a production environment, you MUST check the Authorization header. 
* This MUST be done on every request made to this endpoint to verify that the request is really from Okta.
*
**/
router.post("/domain", (req, res) => {

  let requestBody = req.body;
  let client = requestBody.data.context.protocol.client.name;
  let issuer = requestBody.data.context.protocol.issuer.uri;
  
  title = req.originalUrl;
  description = `<div class="logDescriptionText">Okta OIDC/OAuth token Hook handler called by authorization server: <b>${issuer}</b> for client: <b>${client}</b></div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = requestBody;
  
  hookViewer.emitViewerEvent(title, description, body, true);  
  
  // Put your commands here
  
  // Add a custom claim "sensitiveData" to the ID Token
  let debugContext = {
    idTokenClaims: [
      {
        sensitiveData: "NOT_STORED_IN_OKTA"
      }
    ]
  };
  
  let commandArray = [
      {
        "op": "add",
        "path": "/claims/sensitiveData",
        "value": "NOT_STORED_IN_OKTA"
      }          
    ]
     
  // If the user's email domain is 'allow.example.com', add an addtional claim "alternateEmail" to the ID Token
  const emailAddress = requestBody.data.context.user.profile.login;
  const emailDomain = helpers.parseEmailDomain(emailAddress);
  
  if (emailDomain === 'allow.example.com') {
    let emailName = emailAddress.split('@')[0] + '@different.example.com';
   
    // add the additonal command
    const cmd = {        
      "op": "add",
      "path": "/claims/alternateEmail",
      "value": emailName
    }  
    
    // push this new claim on to the ID token command array
    commandArray.push(cmd);  
    
    // a corresponding debug context message on the the debugContext array to capture the event in the Okta syslog
    let newClaimDebugContext = {
      alternateEmail: emailName
    }
    
    debugContext.idTokenClaims.push(newClaimDebugContext);
  }
  
  // Add our ID Token commands the handlers response command object
  const commands = [
    {
      "type": "com.okta.tokens.id_token.patch",
      "value": commandArray
    }       
  ];
     
  // stringify the debug context so that a JSON payload can be based back to Okta as a string
  debugContext = JSON.parse(JSON.stringify(debugContext));
 
  const responseBody = {
      "result": "SUCCESS",
      "commands": commands,
      "debugContext": debugContext
  }  
  
  // log our response in the live Hook Viewer
  title = req.originalUrl;
  description = `Below is the <b>response</b> that our Hook handler will return to Okta:`;
  body = responseBody;

  hookViewer.emitViewerEvent(title, description, body, true);   
  
  res.status(200).send(responseBody);
  
});

/**
*
*  OIDC/OAuth token extensibilty Hook handler (db lookup example)
*
**/
router.post('/dblookup', function(req, res) {
  
  let requestBody = req.body;
  let client = requestBody.data.context.protocol.client.name;
  let issuer = requestBody.data.context.protocol.issuer.uri;
  let login = requestBody.data.context.session.login;
  let lastName = requestBody.data.context.user.profile.lastName;
  let last4;
  let externalGuid;
  let responseBody;
  let debugContext;
  
  title = req.originalUrl;
  description = `<div class="logDescriptionText">Okta OIDC/OAuth token Hook handler called by authorization server: <b>${issuer}</b> for OAuth client: <b>${client}</b>.</div><div class="logDescriptionText">This handler will call an external service https://member-data.glitch.me/member-info to look up the user by last name. If the user is found, the service will return the last 4 digits of the user's SSN, which will be added to a claim in the ID token. The service will also return the user's GUID from that system, which will be added as a claim 'externalGuid' on the access token.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = requestBody;
  
  hookViewer.emitViewerEvent(title, description, body, true);  
   
  // look up the user in the member-data service and compose a claim using the last 4 of the user's SSN
  const requestJson = {
    "login": login,
    "lastName": lastName
  }  
  
  const options = {
    uri: `${process.env.MEMBER_INFO_API}`,
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
      
      if (response.statusCode === 200) {
      // If we found a match in the Member service
        last4 = response.body.last4;
        externalGuid = response.body.guid;
        
        // compose a JSON payload that can be sent to Okta to populate the debug context of the Okta syslog event that records the success of this Hook
        debugContext = {
          idTokenClaims: [
            {
              last4: last4
            }
          ],
          accessTokenClaims: [
            {
              externalGuid: externalGuid
            }
          ]
        };

        // command array of the response payload
        let commands = [];
        
        // array of operations to perform on the ID token
        let idTokenOperations = [
          {
            "op": "add",
            "path": "/claims/SSN4",
            "value": last4
          }
        ];

        // add the ID token operations to the ID token command object
        const idTokenCommand = {
          "type": "com.okta.tokens.id_token.patch",
          "value": idTokenOperations
        };  
        
        // push the idTokenCommands on to the response command array
        commands.push(idTokenCommand);
        
        // array of operations to perform on the access token
        let accessTokenOperations = [
          {
            "op": "add",
            "path": "/claims/externalGuid",
            "value": externalGuid
          }               
        ];
        
        // add the access token operations to the access token command object
        const accessTokenCommand = {
          "type": "com.okta.tokens.access_token.patch",
          "value": accessTokenOperations
        }
        
        // push Access Token command to the command attribute of the response
        commands.push(accessTokenCommand);
        

        // stringify the debug context so that a JSON payload can be based back to Okta as a string
        debugContext = JSON.parse(JSON.stringify(debugContext));  

        // compose the response to Okta
        responseBody = {
          "result": "SUCCESS",
          "commands": commands,
          "debugContext": debugContext
        }  

        // log our response in the live Hook Viewer
        title = req.originalUrl;
        description = `<div class="logDescriptionText">The user was found in the external member-data service, so additional claims were added to the ID and Access Tokens.</div><div class="logHint">Below is the <b>response</b> that our Hook handler will return to Okta:</div>`;
        body = responseBody;

        hookViewer.emitViewerEvent(title, description, body, true);   

        res.status(200).send(responseBody);        
        
      } else {
        
        // Member last name wasn't found in Members service
        
        debugContext = {
          idTokenClaims: "none",
          accessTokenClaims: "none"
        };
        
        debugContext = JSON.parse(JSON.stringify(debugContext));  
       
        responseBody = {
          "result": "SUCCESS",
          "debugContext": debugContext          
        }
        
        // log our response in the live Hook Viewer
        title = req.originalUrl;
        description = `<div class="logDescriptionText">The user wasn't found in the external member-data service, so the handler didn't make any changes to the token. We are just going to return a context message for the Okta syslog. No 'commands' are included in the response.</div><div class="logHint">Below is the <b>response</b> that our Hook handler will return to Okta:</div>`;
        body = responseBody;

        hookViewer.emitViewerEvent(title, description, body, true);        
        
        res.status(200).send(responseBody);
     }

    }
        
  });
    
});


/**
 * Expose the API routes
 */
module.exports = router;
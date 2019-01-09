const express = require('express');
const router = express.Router();
const app = express();
const request = require('request');
const http = require('http').Server(app);
const svr = require('../server.js');
const io = svr.io;
const helpers = require('../helpers.js');
const hookViewer = require('../hookViewer.js');

let title;
let description;
let body;
let responsePayload = {} // currently not used by Okta in beta implementation

/**
*
*  Optionally forward the incoming Okta Hook request body to another application.
*
*  For demo purposes, we're always registering handlers from this Glitch project, so that they show
*   up in the live Hook viewer on index.html. We can use this to forward the same request to another 
*   app, like Zapier, to perform some action. You can also transform the incoming Hook request to suit
*   the format of the downstream app.
*
**/
let handleForward = function(requestBody) { 
  
  const requestJson = requestBody;
  
  // Optionally perform some transformation on the Okta Hook request body before forwarding it
  
  title = 'Hook Forward Request';
  description = `<div class="logDescriptionText">Forwarding the Okta Hook request to <b>${process.env.FORWARD_HANDLER_URL}</b></div>`;
  body = requestJson;

  hookViewer.emitViewerEvent(title, description, body, true);    
  
  // Compose the request to the downstream app that we are forwarding the Hook request to
  const options = {
    uri: `${process.env.FORWARD_HANDLER_URL}`,
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'x-api-key': 'NOT_IN_USE'
    },
    json: requestJson
  };
  
  request(options, function(error, response, body) {
    if (error) {
      console.log(`Status: ${response.statusCode}`);
      console.error(error);
    }
    
    if (response) {    
      if (response.statusCode === 200) {
        console.log(`Successfully forwarded Hook request to ${process.env.FORWARD_HANDLER_URL}.`);
        console.log(response.body);

        title = 'Hook Forward Response';
        description = `<div class="logDescriptionText">Successfully forwarded Hook request to ${process.env.FORWARD_HANDLER_URL}</div<div class="logHint">Below is the <b>response</b> from the downstream handler:</div>`;
        body = response.body;

        hookViewer.emitViewerEvent(title, description, body, true);          
      } else {
        console.error(`Error forwarding request to ${process.env.FORWARD_HANDLER_URL} status: ${response.statusCode}`);
        console.error(response.body);
        
        title = 'Hook Forward Response';
        description = `<div class="logDescriptionText">Error forwarding Hook request to ${process.env.FORWARD_HANDLER_URL}</div><div class="logHint">elow is the <b>response</b> from the downstream handler:</div>`;
        body = response.body;

        hookViewer.emitViewerEvent(title, description, body, true);         
      }
    }
  });
}

/**
*
* Single handler for all Okta Event Hook categories
* 
* This handler can be registered with all supported Okta event hook types. The handler will use a switch to determine
* what action to take based on the event type. This is a nice simple way to demo Event Hooks, but in a production system
* you'd probably want separate handlers (on different endpoints) that perform different actions for different categories of events.
*
* The optional post_action route parameter can be used to specify addtional processing for the Hook handler to perform. In this
* case, we're checking to see if the post_action is 'forward', to see if we should call the handleForward function which will
* forwrd the Hook request from Okta along to another service.
*
**/
router.post('/:post_action?', function(req, res) {
   
  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  } 
 
  const eventCategory = eventType.substring(0, eventType.lastIndexOf('.'));

  // add logic to perform different actions based on event category ...
  switch(eventType) {
    case 'user.lifecycle':
      break;
    case 'user.session':
      break;
    case 'user.account':
      break;
    case 'application.user_membership':
      break;
    case 'group.user_membership':
      break;
    case 'policy.lifecycle':
      break;
    default: 
  }
  
  title = req.originalUrl;
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  // if we receive a query parameter forward=true, call the optional forward function to forward the request body from Okta to another handler
  if (req.params.post_action === 'forward') {
    handleForward(body);
  }
  
  res.status(204).send(responsePayload);
  
});

/**
*
* Individual handlers for each Okta Event Hook category
* 
* These handlers should be registered for a specific categories of Okta Event Hooks, e.g. user.lifecycle, 
* user.session, etc. Same concept as the single handler above, but this implementation allows us to register
* different endpoints for each category of event type.
* 
**/ 

// Includes all events that begin with "application.user_membership" 
router.post('/application-user-membership/:post_action?', function(req, res) {
  
  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }
  
  title = req.originalUrl;
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

// Includes all events that begin with "group.user_membership" 
router.post('/group-user-membership/:post_action?', function(req, res) {

  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }
  
  title = req.originalUrl;
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

// Includes all events that begin with "policy.lifecycle" 
router.post('/policy-lifecycle/:post_action?', function(req, res) {
  
  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }  

  title = '/okta/hooks/event/policy-lifecycle';
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

// Includes all events that begin with "user.lifecycle" 
router.post('/user-lifecycle/:post_action?', function(req, res) {
   
  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }
  
  title = req.originalUrl;
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  // if we receive a query parameter forward=true, call the optional forward function to forward the request body from Okta to another handler
  if (req.params.post_action === 'forward') {
    handleForward(body);
  }  
  
  res.status(204).send(responsePayload);
  
});

// Includes all events that begin with "user.session" 
router.post('/user-session/:post_action?', function(req, res) {

  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }
  
  title = req.originalUrl;
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

// Includes all events that begin with "user.account" 
router.post('/user-account/:post_action?', function(req, res) {
  
  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }

  title = req.originalUrl;
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

// GET verification endpoints for async webhooks
router.get('/*', function(req, res) {
  
  helpers.logRequest(req);
  
  let jsonToken = {};
  jsonToken["verificationToken"] = req.headers['x-okta-verification-token'];  
   
  res.send(jsonToken);
});


/**
 * Expose the API routes
 */
module.exports = router;
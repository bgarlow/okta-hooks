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

// currently not used by Okta
let responsePayload = {}

/**
*
* Single handler for all Okta Event Hook categories
* 
* This handler can be registered with all supported Okta event hook types. The handler will use a switch to determine
* what action to take based on the event type. 
*
**/

router.post('/', function(req, res) {
  
  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  } 
 
  switch(eventType) {
    
    default: 
      // TODO: add logic here
  }
  
  title = '/okta/hooks/events';
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

/**
*
* Individual handlers for each Okta Event Hook category
* 
* These handlers should be registered for a specific type of Okta Event Hooks, e.g. user.lifecycle.create, 
* user.lifecycle.activate, etc.
* 
**/ 

// Includes all events that begin with "application.user_membership" 
router.post('/application-user-membership', function(req, res) {
  
  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }
  
  title = '/okta/hooks/events/application-user-membership';
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

// Includes all events that begin with "group.user_membership" 
router.post('/group-user-membership', function(req, res) {

  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }
  
  title = '/okta/hooks/events/group-user-membership';
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

// Includes all events that begin with "policy.lifecycle" 
router.post('/policy-lifecycle', function(req, res) {
  
  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }  

  title = '/okta/hooks/events/policy-lifecycle';
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

// Includes all events that begin with "user.lifecycle" 
router.post('/user-lifecycle', function(req, res) {
  
  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }
  
  title = '/okta/hooks/events/user-lifecycle';
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

// Includes all events that begin with "user.session" 
router.post('/user-session', function(req, res) {

  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }
  
  title = '/okta/hooks/events/user-session';
  description = `<div class="logDescriptionText">Okta Event Hook handler called with event type: <b>${eventType}</b>.</div><div class="logHint">Here's the body of the <b>request</b> from Okta:</div>`;
  body = req.body;
  
  hookViewer.emitViewerEvent(title, description, body, true);
  
  res.status(204).send(responsePayload);
  
});

// Includes all events that begin with "user.account" 
router.post('/user-account', function(req, res) {
  
  let eventType;
  
  if (req.body.events[0]) {
    eventType = req.body.events[0].eventType;
  }

  title = '/okta/hooks/events/user-account';
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
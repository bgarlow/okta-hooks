const express = require('express');
const router = express.Router();
const util = require('util');
const app = express();
const request = require('request');
const helpers = require('./helpers.js');

// Call the /api/v1/webhooks API on the configured Okta org
router.get('/event_hooks', function(req, res) {
  
  helpers.logRequest(request);
  
  const options = {
    uri: `${process.env.OKTA_ORG}/api/v1/webhooks`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Authorization': 'SSWS ' + process.env.OKTA_API_KEY
    }
  };
  
  // Call the Okta /webhooks endpoint
  request(options, function(error, response, body) {
  
    if (error) {
      console.error(error);
      res.status(500).send(error);
    }
    
    if (response) {
      console.log(response);
      res.status(response.statusCode).send(response.body);
    }
        
  });
  
});

/**
 * Expose the API routes
 */
module.exports = router;
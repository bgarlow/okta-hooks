const util = require('util');

let methods = {}

// log entire request
methods.logRequest = function(req) {
  console.log(`>>> request headers <<<\n`, util.inspect(req.headers, {showHidden: false, depth: null, colors: true, compact: false}));
  console.log(`>>> request query string <<<\n`, util.inspect(req.query, {showHidden: false, depth: null, colors: true, compact: false}));
  console.log(`>>> request body <<<\n`, util.inspect(req.body, {showHidden: false, depth: null, colors: true, compact: false}));
}

// log just the request body
methods.logBody = function(req) {
  console.log(`>>> request body <<<\n`, util.inspect(req.body, {showHidden: false, depth: null, colors: true, compact: false}));
  
  return req.body;
}


// parse event hook request payload
methods.logEventHookRequest = function(req) {
  
  req.body['events'].forEach(function(event) {
    console.log(`displayMessage:\n`, util.inspect(event.displayMessage, {showHidden: false, depth: null, colors: true, compact: false}));
    console.log(`actor:\n`, util.inspect(event.actor, {showHidden: false, depth: null, colors: true, compact: false}));
    console.log(`target:\n`, util.inspect(event.target, {showHidden: false, depth: null, colors: true, compact: false}));
    console.log(`outcome:\n`, util.inspect(event.outcome, {showHidden: false, depth: null, colors: true, compact: false}));
  });
}

/**
 * Parses the domain from an email address
 * @param {string} emailAddress - An RFC5322 email address (i.e. "user.name@example.com")
 * @return {string} - A domain (i.e. "example.com")
 */
methods.parseEmailDomain = function(emailAddress) {
  return emailAddress.slice(emailAddress.indexOf('@')+1)
}

/**
*
* Expose methods
*
**/
module.exports = methods;
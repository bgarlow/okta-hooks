const svr = require('./server.js');
const io = svr.io;
const util = require('util');

let methods = {}

// Hook Viewer Methods

methods.buildViewerEvent = function(title, description, body) {
  
  const prettyDate = (new Date).toTimeString().slice(0,8);
  
  const event = {
    'timestamp': prettyDate,
    'title': title,
    'description': description,
    'body': body
  }    
  
  return event;
}

methods.emitViewerEvent = function(title, description, body, logToConsole) {
  
  const event = this.buildViewerEvent(title, description, body);
  
  io.emit('logMessage', { 'logMessage': event });
  
  if (logToConsole) {
    console.log(`event:\n`, util.inspect(event, {showHidden: false, depth: null, colors: true, compact: false}));
  }
  
}

/**
*
* Expose methods
*
**/
module.exports = methods;

// init project
const express = require('express');
const app = express();
const http = require('http').Server(app);
http.listen(process.env.PORT);
const io = require('socket.io')(http);
const util = require('util');
const bodyParser = require('body-parser');

module.exports = {
  "io": io
}

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
app.use(bodyParser.json());

// Define our API routes
const registrationHooks = require('./handlers/registrationHooks');
const eventHooks = require('./handlers/eventHooks');
const samlTokenHooks = require('./handlers/samlTokenHooks');
const oidcTokenHooks = require('./handlers/oidcTokenHooks');
const importHooks = require('./handlers/importHooks');
const oktaUtils = require('./oktaUtils');

app.use('/okta/hooks/registration', registrationHooks);
app.use('/okta/hooks/event', eventHooks);
app.use('/okta/hooks/saml-token', samlTokenHooks);
app.use('/okta/hooks/oidc-token', oidcTokenHooks);
app.use('/okta/hooks/import', importHooks);
app.use('/demo/utils', oktaUtils);

// Set up socket.io for real-time logging
io.on('connection', function(socket){
    console.log('Client connection received');
     
    const connectionMessage = {
      'Logger Status': 'connected!'
    }
    
    socket.emit('logMessage', { 'logMessage': 'Logger connected!' });
     
    // Not used
    socket.on('receivedFromClient', function (data) {
        console.log(data);
    });
});


// Bind prefix to log levels to make it easier to read the logs
console.log = console.log.bind(null, '[LOG]');
console.info = console.info.bind(null, '[INFO]');
console.warn = console.warn.bind(null, '[WARN]');
console.error = console.error.bind(null, '[ERROR]');

// Routes --------------------------------------------
// http://expressjs.com/en/starter/basic-routing.html

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/readme', function(request, response) {
  response.sendFile(__dirname + '/README.md');
});

// Listen for requests ------------------------------------- :)
/*
http.listen(process.env.PORT, function(){
    console.log('HTTP server started on port ' + process.env.PORT);
});
*/
/*
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
*/
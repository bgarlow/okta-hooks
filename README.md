Okta Hooks Demo
=======================

https://okta-hooks.glitch.me/

## About

This application serves sample endpoints for Okta Hooks. It is designed to handle the currently supported Okta Hooks, and includes a couple of demo use cases for the registration inline hook.

Also included are Postman collections for configuring the demo in your Okta tenant.

### Installation

Use the included Postman collections to add hooks to your Okta org. You'll need to add a couple of custom attributes to the Okta user profile in your org in order to demo the inline registration hooks (see below).

#### Demo Tip

>In order to effectively demo Hooks functionality, you will want to show the incoming requests from Okta and the responses back to Okta (especially for the inline hooks, which may include Commands for Okta to perform).

>The index.html page of this project includes a real-time Hook Viewer feature that will capture the incoming request and outgoing responses to our hooks, and display the JSON payload in a nice formatted fashion. Just click on the "Show Live" button at the top of the page to view the index.html page served up by Glitch. As Hooks are triggered in Okta, the Hook Viewer (which uses socket.io and JQuery) will automatically update. This is a great way to demo what's happening.

>If you remix your own version of this project, experiment with the Hook Viewer to display the info y ou need to convey during a demo.

## Registration Hooks (handlers/registrationHooks)

### [/okta/hooks/registration/domain](/okta/hooks/registration/domain)

This endpoint is a handler for the Okta inline hook for registration. It supports a demo _script_ in that you can cause different behavior depending on the email domain you use when registering a new user. 

Make sure you have selected this hook in the Extension field in the Self Service Registration configuration page in Okta.

*Prerequisite*
Add the following attribute(s) to the user profile in Okta:
- memberLevel

#### Demo Use Cases

The demo will perform different actions depending on the email domain used during the registration process. Register new users with these email domain in their username to trigger different actions:

**deny.example.com** - The response to Okta will include a command to deny the registration, and a debugContext message that can be seen in the Okta SysLog.

**error.example.com** - The response to Okta will include a command to deny the registration, an error object that will be displayed in the Sign-In widget, and a debugContext message.

**allow.example.com** - Registration will be allowed, and the response to Okta will include a debugContext message.

**update.example.com** - Registration will be allowed. The response to Okta will include a command to update the users UD profile, setting their _title_ to some value. The response will also include a debugContext message.

**any other domain** - Registration will be allowed. No data will be sent to Okta other than a 204 response.

#### How it works

The service uses a simple switch statement to determine which response payload to return to Okta, based on the email domain. 


### [/okta/hooks/registration/dblookup](/okta/hooks/registration/dblookup)

This endpoint is another handler for the Okta inline hook for registration. This one was designed for a financial services/insurance demo use case.

Make sure you have selected this hook in the Extension field in the Self Service Registration configuration page in Okta.

*Prerequisite*
Add the following attributes to the user profile in Okta:
- memberNumber (string)
- SSN (string)
- planLevel (string)

#### Demo User Case

>In order to register for the app, the user (a current bank member, insurance policy holder, etc.) must provide their SSN and Member ID, which will be verified against the institution's (potentially onsite) member database. 

#### How it works

1. During registration, the registration hook calls out to this applications /hooks/inline/registration/dblookup endpoint. 
2. The service extracts the member ID and SSN from the request payload, 
3. and makes a POST request to another service [member-data](https://glitch.com/~member-data) (also hosted on Glitch). 
4. member-data looks up the member ID and SSN in a mock database (there's a static JSON file there that you can modify if you want)
5. If there's a match, that means the registrant is a valid current member, so we'll:
- allow the registration
- include a command in the response payload, instructing Okta to update the user's *planLevel* attribute to the value returned in the mock database lookup.
6. If there's no match (either the SSN or the Member ID are wrong), respond to Okta with a command to deny the registration and provide both an error message (which will be displayed in the Sign-On Widget) and a context error that will be included in the Okta syslog.

## Event Hooks (handlers/eventHooks.js)

### Single Hook handler for all Okta Event Hook categories

[https://okta-hooks.glitch.me/okta/hooks/event](https://okta-hooks.glitch.me/okta/hooks/event)

Use this if you want to register a single Hook in Okta for multiple (or all) event types. The handler uses a switch statement to perform different actions depending upon the event type of the incoming request.


### Separate Hook handlers for each Okta Event category

[https://okta-hooks.glitch.me/okta/hooks/event/{{event-category}}](https://okta-hooks.glitch.me/okta/hooks/event/{{event-category}})

These handlers are designed to cover individual 'categories' of events.

For example [https://okta-hooks.glitch.me/okta/hooks/event/group-user-membership](https://okta-hooks.glitch.me/okta/hooks/event/group-user-membership) is designed to handle the following event types:

- group.user_membership.add
- group.user_membership.remove

You can make these handlers even more granular by adding a switch statement to handle individual event types rather than the broader category.


Your Project
------------

On the front-end,
- edit `public/client.js`, `public/style.css` and `views/index.html`
- drag in `assets`, like images or music, to add them to your project

On the back-end,
- your app starts at `server.js`
- add frameworks and packages in `package.json`
- safely store app secrets in `.env` (nobody can see this but you and people you invite)


About Glitch
============

Click `Show` in the header to see your app live. Updates to your code will instantly deploy and update live.

**Glitch** is the friendly community where you'll build the app of your dreams. Glitch lets you instantly create, remix, edit, and host an app, bot or site, and you can invite collaborators or helpers to simultaneously edit code with you.

Find out more [about Glitch](https://glitch.com/about).

Made by [Glitch](https://glitch.com/)
-------------------

\ ゜o゜)ノ

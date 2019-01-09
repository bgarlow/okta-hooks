Okta Hooks Demo
=======================

https://okta-hooks.glitch.me/

## About

This application serves sample endpoints for Okta Hooks. It is designed to handle the currently supported Okta Hooks, and includes a couple of demo use cases for the Registration Inline Hook, API Access Management Token Inline Hook, and SAML Token Inline Hook.

Also included are Postman collections for configuring the demo in your Okta tenant.

### Installation

Several Postman Collections are included in the postman/ directory of the source code for this project. Import those collections into Postman, and configure a Postman Environment for your Okta org. You'll need the following variables:

| Variable | Value |
|---|---|
| url | This is the full url to your Okta org, e.g., https://avb.oktapreview.com |
| apikey | Generate an Okta API key from your Okta org. This is needed so that Postman can call the Okta APIs to create the Hooks for you. |
| awsapikey | Okta Hooks are designed to use header-based authentication, such as an API key, that should be validated by the downstream Hook handler in a production environment. This demo does not validate the Authentication header, but the Postman collection will configure the Hooks in Okta with this value in case you want to host the handlers on another service that uses API keys, such as AWS API Gateway. For this demo, simply use a dummy value like "NOTUSED". |

You'll need to add a couple of custom attributes to the Okta user profile in your org in order to demo the inline registration hooks (see below).

| Variable | Data Type |
|---|---|
| memberNumber | Used by the registration/dblookup handler to look up a user in an external data service during registration |
| ssn | registration/dblookup also collects the users SSN, which is used for a financial service/healthcare demo use case of account claiming |
| memberLevel | Used by the registration/dblookup handler. If account claiming (user lookup by memberNumber and SSN) is successful, the memberLevel value from the external data source is set on the users Okta profile.
| inlineHookEndpoint | Okta endpoint for the Inline Hook API. Currently api/v1/callbacks, but this will probably change when the feature goes GA. |
| eventHookEndpoint | Okta endpoint for the Event Hook API. Currently api/v1/webhooks, but this will probably change when the feature goes GA. |

#### Demo Tip

>In order to effectively demo Hooks functionality, you will want to show the incoming requests from Okta and the responses back to Okta (especially for the inline hooks, which may include Commands for Okta to perform).

>The index.html page of this project includes a real-time Hook Viewer feature that will capture the requests coming from Okta to the Hook handlers in this project, as well as the Hook handlers' responses back to Okta The Hook Viwer will display the JSON payload in a nice formatted fashion with some explanatory text and a timestamp. Click on the "Show Live" button at the top left of this page to view the index.html page served up by Glitch. As Hooks are triggered in Okta, the Hook Viewer (which uses socket.io and JQuery) will automatically update to display the request and response. This is a great way to demo what's happening external to Okta.

>If you remix your own version of this project, experiment with the Hook Viewer to display the info y ou need to convey during a specific demo.

## Registration Inlink Hooks (handlers/registrationHooks)

### [/okta/hooks/registration/domain](/okta/hooks/registration/domain)

This endpoint is a handler for the Okta inline hook for registration. It supports a demo _script_ in that you can cause different behavior depending on the email domain you use when registering a new user. 

Make sure you have selected this hook in the Extension field in the Self Service Registration configuration page in Okta.

*Prerequisite*
Add the following string attribute to the Okta user profile in your Okta org:
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

This endpoint is another handler for the Okta inline hook for registration. This one was designed for a financial services or healthcare demo use case.

Make sure you have selected this hook in the Extension field in the Self Service Registration configuration page in Okta.

*Prerequisite*
Make sure you have added the custom attributes listed above to the Okta user profile in your org.

#### Demo User Case

>In order to register for the app (which might be a financial service member portal), the user (a current bank member, insurance policy holder, etc.) must provide their SSN and Member Number, which will be verified against the institution's member database. 

Since the user lookup for this demo use case is done by SSN and Member Number (not email or user name), you can perform this registration demo scenario with any user name/email combo. What's important for the demo is SSN and Member Number:

**1 - Unsuccessful Registration - deny with error message**

Member Number: 
>12345678

SSN: 
>111223334

This will result in a "deny" command being sent back to Okta, along with an error message explaning the problem.

**2 - Successful Registration - allow and update the user's Okta profile with data from the database lookup**

Member Number:
>12345678

SSN: 
>111223333

This will result in a successful registration, and our Hook handler's response to Okta will include a _com.okta.user.profile.update_ command to set the user's memberLevel profile attribute to the value returned from the external member-data service.

#### How it works

1. During registration, the Registration Inline Hook calls out to this Glitch application's /hooks/inline/registration/dblookup endpoint (in handlers/registrationHooks.js). 
2. The service extracts the member ID and SSN from the request payload sent by Okta,
3. and makes a POST request to another service <a href="https://glitch.com/~member-data" target="_blank">member-data</a> (also hosted on Glitch). This URL, <a href="https://member-data.glitch.me/members" target="_blank">members</a> will return the full data set, so that you can see what's there. You can also remix this project and update the data to suit your demo needs. 
4. member-data looks up the member ID and SSN in a mock database (there's a static JSON file there that you can modify if you want)
5. If there's a match, that means the registrant is a valid current member, so we'll:
- allow the registration
- include a command in the response payload, instructing Okta to update the user's *memberLevel* attribute to the value returned in the database lookup.
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

#!/usr/bin/env node

'use strict';

var server = require('./app');
const cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();

var port = process.env.PORT || process.env.VCAP_APP_PORT || appEnv.port || 3000;

// Create facebook middleware
var watsonMiddleware = require('botkit-middleware-watson')({
    username: process.env.CONVERSATION_USERNAME,
    password: process.env.CONVERSATION_PASSWORD,
    workspace_id: process.env.WORKSPACE_ID,
    version_date: '2016-09-20'
});



// Facebook configuration
var Facebook = require('./bot-facebook');
var bot = Facebook.bot;
var controller = Facebook.controller;
var config = controller.config;
config.hostname = appEnv.url.replace('https://', '');
config.port = appEnv.port;

// Receiving message from watson on facebook
controller.middleware.receive.use(watsonMiddleware.receive);
console.log(controller.middleware.receive.use(watsonMiddleware.receive));

// Creating Webhook End Points
controller.createWebhookEndpoints(server, bot);
console.log('Facebook bot is on.');

// Server is active
server.listen(port, function () {
    console.log('Server running on port: %d', port);
});

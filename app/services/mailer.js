"use strict";
const path = require("path");
const nodemailer = require("nodemailer");
var hbs = require('nodemailer-express-handlebars');
const appConfig = require(path.resolve('config/app'));

const sendGridConfig = appConfig.mail.sendgrid;
let transportConfig = {
    //service: 'SendGrid',
    host: sendGridConfig.host,
    port: sendGridConfig.port,
    auth: {
        user: sendGridConfig.user,
        pass: sendGridConfig.pass
    },
    secure: false,
    requireTLS: true
};

//returns jsonMessage in test mode
if(process.env.MAILER_MODE === 'test') {
  transportConfig = { jsonTransport: true }
}

//development mode email
//use maildev for receiving email
if(process.env.NODE_ENV === 'development') {
  transportConfig = {
    host: 'localhost',
    port: 1025,
    secure: false,
    ignoreTLS: true
  }
}

const transport = nodemailer.createTransport(transportConfig);

const options = {
     viewEngine: {
         extname: '.hbs',
         layoutsDir: './app/html/mail/',
         partialsDir : './app/html/mail/'
     },
     viewPath: './app/html/mail/',
     extName: '.html'
 };

transport.use("compile", hbs(options));

module.exports = transport;

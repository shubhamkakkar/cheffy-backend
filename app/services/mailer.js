"use strict";
const path = require("path");
const nodemailer = require("nodemailer");
var hbs = require('nodemailer-express-handlebars');
const appConfig = require(path.resolve('config/app'));

const sendGridConfig = appConfig.mail.sendgrid

let transportConfig = {
    host: sendGridConfig.host,
    port: sendGridConfig.port,
    auth: {
        user: sendGridConfig.user,
        pass: sendGridConfig.pass
    }
};

//returns jsonMessage in test mode
if(process.env.MAILER_MODE === 'test') {
  transportConfig = { jsonTransport: true }
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

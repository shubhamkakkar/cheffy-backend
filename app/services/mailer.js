"use strict";
const path = require("path");
const nodemailer = require("nodemailer");
var hbs = require('nodemailer-express-handlebars');

const transport = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 25,
    auth: {
        user: "apikey",
        pass: "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"
    }
});

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

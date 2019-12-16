'use strict'
const debug = require('debug')('server');

let envPath = '.env';

if(process.env.NODE_ENV === "test") {
  envPath = '.env.test';
}

if(process.env.DOCKER_MODE) {
  envPath = '.docker-env';
}

require("dotenv").config({
    path: envPath
});

debug('en vars', process.env);
global.SALT_KEY = process.env.SALT_KEY;

const app = require('../server/index');
const http = require('http');

const port = normalizePort(process.env.PORT || '9000');
app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('listening', onListening);
console.log(`Server is currently running on port: ${port}`);

function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val
    }
    if (port >= 0) {
        return port
    }
    return false
}

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ?
        'pipe' + addr :
        'port' + addr.port;
    debug('Listening on ' + bind)
}

//for catching unhandled promise rejection
//TODO fix all the unhandledRejection error, the ones with async middleware used in express
process.on('unhandledRejection', (reason, p) => {
	debug('unhandled rejection', reason, p);
});

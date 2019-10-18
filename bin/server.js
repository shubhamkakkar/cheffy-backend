'use strict'

const app = require('../server/index');
const debug = require('debug');
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

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', reason.stack || reason)
    // Recommended: send the information to sentry.io
    // or whatever crash reporting service you use
});

process.on('warning', (warning) => {
    console.warn(warning.name);    // Print the warning name
    console.warn(warning.message); // Print the warning message
    console.warn(warning.stack);   // Print the stack trace
});
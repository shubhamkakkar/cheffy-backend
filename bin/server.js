'use strict'
const debug = require('debug')('server');

let envPath = '.env';

if (process.env.NODE_ENV === "test") {
  envPath = '.env.test';
}

if (process.env.DOCKER_MODE) {
  envPath = '.docker-env';
}

require("dotenv").config({
  path: envPath
});

debug('en vars', process.env);
global.SALT_KEY = process.env.SALT_KEY;

const app = require('../server/index');
const http = require('http');
const io = require('socket.io')(http);

// socket's needed library import
const HttpStatus = require('http-status-codes');
const driverAPI = require('../app/services/driverApi');
const authService = require("../app/services/auth");
const ValidationContract = require('../app/services/validator');


const port = normalizePort(process.env.PORT || '9000');
app.set('port', port);

const server = http.createServer(app);

const driverIO = io.of('/driver');
driverIO.on('connection', socket => {
  socket.on('DRIVER_UPDATE', async (data) => {
    let contract = new ValidationContract();
    contract.isRequired(req.body.latitude, 'You must provide latitude');
    contract.isRequired(req.body.longitude, 'You must provide longitude');

    if (!contract.isValid()) {
      console.log(contract.errors());
      return 0;
    }

    const { token, latitude, longitude } = data
    const token_return = await authService.decodeToken(token)

    const existUser = await User.findOne({ where: { id: token_return.id } });

    if (!existUser || existUser.user_type !== 'driver') {
      console.log('Could not update user position');
    }

    try {
      await driverAPI.updateDriverPosition({
        email: existUser.email,
        lat: latitude,
        lng: longitude
      });
      driverIO.emit('DRIVER_LOCATION_UPDATED', {
        email: existUser.email,
        lat: latitude,
        lng: longitude
      })
    } catch (err) {
      console.log(`Conflict in request Driver API ${err.config.url}`)
    }
  })
})
// stream server
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

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

module.exports = {
  driverIO
}

const WebSocket = require('ws');

const { User } = require('../models/index')
const { decodeToken } = require('../services/auth');

function heartbeat() {
  this.isAlive = true;
}

function toEvent(message) {
  try {
    const event = JSON.parse(message);
    this.emit(event.type, event.payload);
  } catch (err) {
    console.log('Not is an event', err);
  }
}

exports.initWSConnection = (port) => {
  const wss = new WebSocket.Server({ port: port });
  const getTrackingURl = /(driver\/get-tracking.+)/;
  const setTrackingURl = /(driver\/set-tracking.+)/;
  const idRegex = /userId=.{1,}[a-zA-Z0-9]/;

  wss.on('connection', async (ws, req) => {
    const url = req.url;

    if (url.match(getTrackingURl)) {
      const userId = url.match(getTrackingURl)[0].match(idRegex)[0].split('=')[1];
      ws.isAlive = true;
      ws.on('pong', heartbeat);
      ws.on('message', toEvent)
        .on('authenticate', async (data) => {
          let token = data.token;
          try {
            token = await decodeToken(token);
          } catch (error) {
            ws.send(JSON.stringify({ code: 403, message: 'It is necessary be logged to use this functionality.' }));
            ws.close(1003);
          }
          if (!userId) {
            ws.send(JSON.stringify({ code: 404, message: 'User id not found' }));
            ws.close(1003);
          }
          if (data.command === 'stop') {
            ws.send(JSON.stringify({ code: 200, message: 'Connection closed.' }));
            ws.close(1000, 'Closing connection.');
          } else if (data.command === 'start') {
            const trackInverval = setInterval(async () => {
              if (ws.readyState === WebSocket.CLOSED) {
                clearInterval(trackInverval);
              }
              try {
                let user = await User.findOne({
                  where: { id: userId },
                  attributes: ['location_lat', 'location_lon']
                });
                if (user === null || user.location_lat === null || user.location_lon === null) {
                  ws.send(JSON.stringify({ code: 404, message: 'Latitude/Longitude undenifed.' }));
                  ws.close(1000);
                } else {
                  ws.send(JSON.stringify(user));
                }
              } catch (err) {
                ws.send(JSON.stringify(err));
                ws.close(1002);
              }
            }, 5000);
          } else {
            ws.send(JSON.stringify({ code: 404, message: 'Command not found' }));
            ws.close(1003);
          }
        });
    } else if (url.match(setTrackingURl)) {
      const userId = url.match(setTrackingURl)[0].match(idRegex)[0].split('=')[1];

      ws.isAlive = true;
      ws.on('pong', heartbeat);
      ws.on('message', toEvent)
        .on('authenticate', async (data) => {
          if (!userId) {
            ws.send('Undefined userId.')
            ws.send(JSON.stringify({ code: 404, message: 'User id not found' }));
            ws.close(1003);
          }
          if (data.command === 'stop') {
            ws.send(JSON.stringify({ code: 200, message: 'Connection closed.' }));
            ws.close(1000);
          } else if (data.command === 'send') {
            try {
              if (data.lat && data.lon) {
                let user = await User.findOne({
                  where: { id: userId }
                });
                user.location_lat = data.lat;
                user.location_lon = data.lon;
                try {
                  await user.save();
                  ws.send(JSON.stringify({ code: 200, message: 'Position saved' }));
                } catch (error) {
                  ws.send(JSON.stringify(err));
                }
              }
            } catch (err) {
              ws.send(JSON.stringify(err))
            }
          }
        });
    } else {
      ws.send(JSON.stringify({ code: 403, message: 'Unautorized channel' }));
      ws.close(1003);
    }
  });

  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping(null, false, true);
    });
  }, 30000);
}

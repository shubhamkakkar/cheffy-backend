const WebSocket = require('ws');

const { sequelize, User } = require('../models/index')

function heartbeat() {
  this.isAlive = true;
}

exports.initWSConnection = (port) => {
  const wss = new WebSocket.Server({ port: port });
  const getTrackingURl = /(driver\/get-tracking.+)/;
  const saveTrackingURl = /(driver\/save-tracking.+)/;
  const idRegex = /userId=.{1,}[a-zA-Z0-9]/;

  wss.on('connection', (ws, req) => {
    const url = req.url;

    if (url.match(getTrackingURl)) {
      const userId = url.match(getTrackingURl)[0].match(idRegex)[0].split('=')[1];

      ws.isAlive = true;
      ws.on('pong', heartbeat);
      ws.on('message', (message) => {
        if (!userId) ws.close(1003, 'Undefined userId.');
        if (message === 'stop') {
          ws.send('Closing connection.')
          ws.close(1000, 'Closing connection.');
        } else if (message === 'start') {
          setInterval(async () => {
            try {
              let user = await User.findOne({
                where: { id: userId },
                attributes: ['location_lat', 'location_lon']
              });
              if (user === null || user.location_lat === null || user.location_lon === null) {
                ws.send(JSON.stringify({ message: 'Latitude/Longitude undenifed.' }));
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
          ws.send('Nonexistent command. Please, try again.')
        }
      });
    } else if (url.match(saveTrackingURl)) {
      const id = url.match(saveTrackingURl)[0].match(idRegex)[0].split('=')[1];

      ws.isAlive = true;
      ws.on('pong', heartbeat);
      ws.on('message', (message) => {
        if (!id) ws.close(1003, 'Undefined id.');
        if (message === 'stop') {
          // Driver.findById(id, (err, driver) => {
          //   if (err || driver == null) {
          //     ws.send('Unregistered driver.');
          //     ws.close(1002);
          //   }
          //   driver.routes.push(driver.current_route);
          //   driver.current_route = null;
          //   driver.save(err => {
          //     if (err) ws.send(toString(err));
          //     ws.send('Closing connection.');
          //   });
          // });
          ws.close(1000);
        } else if (message === 'start') {
          // Driver.findById(id, (err, driver) => {
          //   if (err || driver == null) {
          //     ws.send('Unregistered driver.');
          //     ws.close(1002);
          //   }
          //   else if (!driver.isAvailable) {
          //     ws.send('Offline driver.');
          //     ws.close(1000)
          //   }
          //   else {
          //     const vehicle = driver.vehicle;
          //     const newRoute = new Route({
          //       driver_id: id,
          //       vehicle,
          //     });
          //     driver.current_route = newRoute;
          //     driver.save(err => {
          //       if (err) ws.send(JSON.stringify(err));
          //       else {
          //         ws.send('Send JSON Object { "lat": , "lng": }.');
          //       }
          //     });
          //   }
          // });
        } else {
          try {
            const messageObject = JSON.parse(message);
            if (messageObject.lat && messageObject.lng) {
              // Driver.findById(id, (err, driver) => {
              //   if (err) ws.send(JSON.stringify(err));
              //   driver.location.lat = messageObject.lat;
              //   driver.location.lng = messageObject.lng;
              //   driver.current_route.locations.push(messageObject);
              //   driver.save(err => {
              //     if (err) ws.send(toString(err));
              //     else ws.send('Tracking.');
              //   });
              // });
            }
          } catch (e) {
            ws.send('JSON malformed, please check that out.')
            return console.error(e);
          }
        }
      });
    } else {
      ws.send('Unautorized channel');
      ws.close(1002, 'Unautorized channel');
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

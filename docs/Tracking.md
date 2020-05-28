
## WebSocket Tracking Routes

---
Tracking Routes uses the WebSocket concepts to create a connection between client and server. WebSocket connections are indicated for messages exchanges in real time.

**The use**: It's necessary follow steps below to use this feature.

### WebSocket Routes ###
| Action              | Required | Method | Parameters | URL                                     |
|---------------------|----------|--------|------------|-----------------------------------------|
| GET DRIVER LOCATION |   Auth   | `WS`   |   userId   | ws://localhost:3002/driver/get-tracking |
| SET DRIVER LOCATION |   Auth   | `WS`   |   userId   | ws://localhost:3002/driver/set-tracking |

#### GET DRIVER LOCATION ####
* CREATE CONNECTION
``` js
var ws = new WebSocket('ws://localhost:3002/driver/get-tracking?userId=19');

ws.onopen = function (event) {
  console.log('Connected to ws://.../get-tracking');
};
```
* START LOCATION STREAMMING
```js
var data = {
  type: 'authenticate',
  payload: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIsImVtYWlsIjoiam9uaEBnbWFpbC5jb20iLCJuYW1lIjoiSm9uaCIsImlhdCI6MTU3MTI3NjkyMywiZXhwIjoxNjAyODEyOTIzfQ.OBQqcgjfJQZtT16RSdpQzd-RxDBhI2WuJ8bU01eJPO0',
    command: 'start'
  }
};

ws.send(JSON.stringify(data));
```
* RECEIVE LOCATION DATA
```js
ws.onmessage = function (event) {
  const response = JSON.parse(event.data);
}
```
* CLOSE WEBSOCKET CONNECTION
```js
ws.close();
```
* WEBSOCKET RESPONSE
```json
{ 
  "location_lat": "-2.3123", 
  "location_lon": "2.4535" 
}
```

#### SET DRIVER LOCATION ####
* CREATE CONNECTION
``` js
var ws = new WebSocket('ws://localhost:3002/driver/set-tracking?userId=19');

ws.onopen = function (event) {
  console.log('Connected to ws://.../set-tracking');
};
```
* SEND LOCATION DATA
```js
setInterval(() => {
  const sendData = {
    type: 'authenticate',
    payload: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIsImVtYWlsIjoiam9uaEBnbWFpbC5jb20iLCJuYW1lIjoiSm9uaCIsImlhdCI6MTU3MTI3NjkyMywiZXhwIjoxNjAyODEyOTIzfQ.OBQqcgjfJQZtT16RSdpQzd-RxDBhI2WuJ8bU01eJPO0',
      command: 'send',
      lat: '-1.4354',
      lon: '0.9871'
    }
  };
  ws.send(JSON.stringify(sendData));
}, 5000);
```

* RECEIVE RESPONSE
```js
ws.onmessage = function (event) {
  const response = JSON.parse(event.data);
}
```

* CLOSE WEBSOCKET CONNECTION
```js
ws.close();
```
* WEBSOCKET RESPONSE
```json
{ 
  "location_lat": "-2.3123", 
  "location_lon": "2.4535" 
}
```


---

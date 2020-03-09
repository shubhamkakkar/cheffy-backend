const express = require('express');
const bodyParser = require('body-parser');
const payService = require("../app/services/payment");
const cors = require('cors');
const conf = require('../configs');
const nunjucks = require('nunjucks');
const errors = require('./errors');
const routes = require('./routes');
const morgan = require("morgan");
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
}
const app = express();

nunjucks.configure('views', {
  autoescape: true,
  express: app
});

app.use('/tmp', express.static(`${__dirname}/../tmp/`));
app.use(morgan("dev"));
app.use(cors(corsOptions))
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({
  limit: '50mb', extended: true
}));
// app.use(bodyParser.urlencoded({
//   limit: '50mb', extended: true
// }));

// app.use(bodyParser())//add this before any route or before using req.body

app.use((req, res,next) => {
  console.log(req.body); // console the request           
  next() 
});

app.get('/', (req, res) => {
  res.status(200).send({
    message: "The service is online!",
    version: '1.0.2',
  });
});

routes(app);

errors(app);

module.exports = app;

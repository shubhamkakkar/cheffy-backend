const express = require('express');
const bodyParser = require('body-parser');
const payService = require("../app/services/payment");
const cors = require('cors');
const conf = require('../configs');
const nunjucks = require('nunjucks');
const errors = require('./errors');

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

app.use(cors(corsOptions))
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({
  limit: '50mb', extended: true
}));
app.use(bodyParser.urlencoded({
  limit: '50mb', extended: true
}));

app.get('/', (req, res) => {
  res.status(200).send({
    message: "The service is online!",
    version: '1.0.2',
  });
});

const user = require('../app/routes/user');
const plate = require('../app/routes/plate');
const category = require('../app/routes/category');
const shipping = require("../app/routes/shipping");
const docs = require("../app/routes/docs");
const basket = require("../app/routes/basket");
const admin = require("../app/routes/admin");
const payment = require("../app/routes/payment");
const delivery = require("../app/routes/delivery");
const order = require("../app/routes/order");
const driver = require("../app/routes/driver");
const customPlate = require("../app/routes/customPlate");
const favourite = require("../app/routes/favourite");

app.use('/user', user);
app.use('/plate', plate);
app.use('/category', category);
app.use("/shipping", shipping);
app.use("/docs", docs);
app.use("/basket", basket);
app.use("/manage", admin);
app.use("/payment", payment);
app.use("/delivery", delivery);
app.use("/order", order);
app.use("/driver", driver);
app.use("/custom-plate", customPlate);
app.use("/favourite", favourite);

errors(app);

module.exports = app;

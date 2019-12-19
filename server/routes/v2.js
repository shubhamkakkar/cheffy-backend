const path = require('path');
const express = require('express');
const user = require(path.resolve('./app/routes/user'));
const card = require(path.resolve('./app/routes/card'));
const plate = require(path.resolve('./app/routes/plate'));
const category = require(path.resolve('./app/routes/category'));
const shipping = require(path.resolve('./app/routes/shipping'));
const docs = require(path.resolve('./app/routes/docs'));
const basket = require(path.resolve('./app/routes/basket'));
const admin = require(path.resolve('./app/routes/admin'));
const payment = require(path.resolve('./app/routes/payment'));
const delivery = require(path.resolve('./app/routes/delivery'));
const order = require(path.resolve('./app/routes/order'));
const driver = require(path.resolve('./app/routes/driver'));
const customPlate = require(path.resolve('./app/routes/customPlate'));
const favourite = require(path.resolve('./app/routes/favourite'));

const router = express.Router(); // eslint-disable-line new-cap

router.use('/users', user);
router.use('/cards', card);
router.use('/plates', plate);
router.use('/categories', category);
router.use("/shippings", shipping);
router.use("/docs", docs);
router.use("/baskets", basket);
router.use("/manages", admin);
router.use("/payments", payment);
router.use("/deliveries", delivery);
router.use("/orders", order);
router.use("/drivers", driver);
router.use("/custom-plates", customPlate);
router.use("/favourites", favourite);

module.exports = router;

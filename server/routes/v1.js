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
const rating = require(path.resolve('./app/routes/rating'));
const locationTracking = require(path.resolve('./app/routes/location_tracking'));
const foodTracking = require(path.resolve('./app/routes/order_tracking'));
const distanceController = require(path.resolve('./app/routes/distance_controller'));
const groupNotifications = require(path.resolve('./app/routes/group_notifications'));

const router = express.Router(); // eslint-disable-line new-cap

router.use('/user', user);
router.use('/card', card);
router.use('/plate', plate);
router.use('/category', category);
router.use("/shipping", shipping);
router.use("/docs", docs);
router.use("/basket", basket);
router.use("/manage", admin);
router.use("/payment", payment);
router.use("/delivery", delivery);
router.use("/order", order);
router.use("/driver", driver);
router.use("/custom-plate", customPlate);
router.use("/favourite", favourite);
router.use("/rating", rating);
router.use("/location", locationTracking);
router.use("/trackorder", foodTracking);
router.use("/distanceController", distanceController);
router.use("/groupNotifications", groupNotifications);

module.exports = router;

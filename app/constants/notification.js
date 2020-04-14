'use strict';

exports.NOTIFICATION_TYPE_UNSENT = 'unsent';
exports.NOTIFICATION_TYPE_SENT = 'sent';
exports.NOTIFICATION_TYPE_SEEN = 'seen';

/** Notiifcation message texts for various events  are listed below*/

/** Review */
/** Customer submits feedback/review for an order item */
exports.ORDER_ITEM_REVIEW_TITLE= "You have a new feedback";
exports.ORDER_ITEM_REVIEW_BRIEF= "Feedback details";
exports.ACTIVITY_REVIEW_ORDER = 'Order reviewed by customer';

/**  Order item when marked as ready by chef  */
exports.ORDER_ITEM_IS_READY_TITLE= "Your order item is ready";
exports.ORDER_ITEM_IS_READY_BRIEF= "order item will be delivered soon";
exports.ACTIVITY_ORDER_ITEM_READY = 'Order item is ready';

/**  Order item cancelled by user  */
exports.ORDER_ITEM_IS_CANCELLED_TITLE= "Order was cancelled";
exports.ORDER_ITEM_IS_CANCELLED_BRIEF= "User has cancelled the order";
exports.ACTIVITY_ORDER_ITEM_CANCELLED = 'Order item cancelled"';

/**  Order Delivery completed  */
exports.ORDER_DELIVERY_COMPLETED_TITLE= "Order delivery completed ";
exports.ORDER_DELIVERY_COMPLETED_BRIEF= "Order delivery completed for the order ";
exports.ACTIVITY_ORDER_DELIVERY_COMPLETED= "Order delivered";
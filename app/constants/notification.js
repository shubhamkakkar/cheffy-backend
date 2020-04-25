'use strict';

exports.NOTIFICATION_TYPE_UNSENT = 'unsent';
exports.NOTIFICATION_TYPE_SENT = 'sent';
exports.NOTIFICATION_TYPE_SEEN = 'seen';

/** Notiifcation message texts for various events  are listed below*/

/** Customer submits feedback/review for an order item */
exports.ORDER_ITEM_REVIEW_TITLE = 'You have a new feedback';
exports.ORDER_ITEM_REVIEW_BODY = 'Feedback details';

/** New order item by user */
exports.ORDER_RECEIVED_TITLE = 'New order received';
exports.ORDER_RECEIVED_BODY = 'New order received';

/**  Order item rejected by chef  */
exports.ORDER_ITEM_IS_REJECT_TITLE = 'Order rejected';
exports.ORDER_ITEM_IS_REJECT_BODY = 'Chef has rejected the order';

/**  Order item accepted by chef  */
exports.ORDER_ITEM_IS_ACCEPT_TITLE = 'Order accepted';
exports.ORDER_ITEM_IS_ACCEPT_BODY = 'Chef has accepted the order';

/**  Order item cancelled by user  */
exports.ORDER_ITEM_IS_CANCELLED_TITLE = 'Order was cancelled';
exports.ORDER_ITEM_IS_CANCELLED_BODY = 'User has cancelled the order';

/**  Order item when marked as ready by chef  */
exports.ORDER_ITEM_IS_READY_TITLE = 'Your order item is ready';
exports.ORDER_ITEM_IS_READY_BODY = 'order item will be delivered soon';

/**  Custom Plate Created by user  */
exports.CUSTOMPLATE_CREATED_TITLE = 'You have a new custom order';
exports.CUSTOMPLATE_CREATED_BODY =
	'User has created a new request for custom plate';

/**  Custom Plate BID by chef  */
exports.CUSTOMPLATE_BID_TITLE = 'A new bid on your plate';
exports.CUSTOMPLATE_BID_BODY =
	'User has created a new request for custom plate';

/**  Custom Plate BID accept by user  */
exports.CUSTOMPLATE_ACCEPT_TITLE = 'Your bid got accepted';
exports.CUSTOMPLATE_ACCEPT_BODY =
	'User has created a new request for custom plate';

/**  Custom Plate BID reject by user  */
exports.CUSTOMPLATE_REJECT_TITLE = 'Your bid got rejected';
exports.CUSTOMPLATE_REJECT_BODY =
	'User has created a new request for custom plate';

/**  Order when changed to ready for driver  */
exports.DRIVER_ORDER_READY_TITLE = 'Your bid got rejected';
exports.DRIVER_ORDER_READY_BODY =
	'User has created a new request for custom plate';

/**  Order Delivery completed  */
exports.ORDER_DELIVERY_COMPLETED_TITLE = 'Order delivery completed ';
exports.ORDER_DELIVERY_COMPLETED_BRIEF =
	'Order delivery completed for the order ';
exports.ACTIVITY_ORDER_DELIVERY_COMPLETED = 'Order delivered';

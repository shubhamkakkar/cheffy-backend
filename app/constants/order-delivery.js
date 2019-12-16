
//user order is ready. driver accepts the order delivery, picks up the order, and then finally delivered
//or the order delivery can be canceled by user
//when do we use driver_not_found

exports.STATE_TYPE_PENDING = 'pending';
exports.STATE_TYPE_APPROVED = 'approved';
exports.STATE_TYPE_REJECTED = 'rejected';
exports.STATE_TYPE_CANCELED = 'canceled';
exports.STATE_TYPE_DELIVERED = 'delivered';
exports.STATE_TYPE_DRIVER_NOT_FOUND = 'driver_not_found';
//on_course and picked_up is same
exports.STATE_TYPE_PICKED_UP = 'picked_up';

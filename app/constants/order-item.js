'use strict';

exports.STATE_TYPE_PENDING = 'pending';
exports.STATE_TYPE_APPROVED = 'approved';
exports.STATE_TYPE_REJECTED = 'rejected';
exports.STATE_TYPE_CANCELED = 'canceled';

exports.selectFields = [
  'id', 'orderId', 'user_id', 'chef_id', 'plate_id', 'customPlateId',
  'item_type', 'state_type', 'chef_location','name', 'description',
  'amount', 'quantity'
];

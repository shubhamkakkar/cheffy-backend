'use strict';

exports.STATUS_PENDING = 'pending';
exports.STATUS_VERIFIED = 'verified';

exports.USER_TYPE_USER = 'user';
exports.USER_TYPE_CHEF = 'chef';
exports.USER_TYPE_ADMIN = 'admin';
exports.USER_TYPE_DRIVER = 'driver';

exports.USER_TYPES = [exports.USER_TYPE_USER, exports.USER_TYPE_CHEF, exports.USER_TYPE_ADMIN, exports.USER_TYPE_DRIVER];

exports.STATUS_TYPES = [exports.STATUS_PENDING, exports.STATUS_VERIFIED];

//when a user object is required just for id or sometimes even name
exports.minSelectFields = ['id', 'name'];

//used for publicly accesible api. e.g. /api/users/:userId
exports.publicSelectFields = [ 'id', 'name', 'imagePath'];

//for self. don't expose verification tokens, password even for self.
//used for login session
exports.privateSelectFields = exports.publicSelectFields.concat([
  'email', 'country_code', 'phone_no', 'restaurant_name',
  'user_type', 'verification_email_status', 'verification_phone_status', 'status',
  'location_lat', 'location_lon',
  'stripe_id', 'createdAt', 'updatedAt'
]);

exports.userSelectFields = exports.publicSelectFields.concat([
  'email', 'country_code', 'phone_no', 'location_lat', 'location_lon'
]);

//don't expose to other users. use it only for internal apis
exports.internalApiSelectFields = exports.publicSelectFields.concat([
  'user_type', 'email', 'phone_no', 'restaurant_name', 'status'
]);


//for sending email you need to get email_status
exports.emailSelectFields = exports.privateSelectFields.concat([
  'verification_email_status'
]);

//for sending sms you need to get phone_status
exports.phoneSelectFields = exports.privateSelectFields.concat([
  'verification_phone_status'
]);

//select fields for admin
exports.adminSelectFields = exports.privateSelectFields
  .concat(exports.emailSelectFields)
  .concat(exports.phoneSelectFields)
  .concat(['user_ip', 'verification_code', 'verification_email_token', 'verification_phone_token']);

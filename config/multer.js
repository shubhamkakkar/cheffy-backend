const path = require('path');
const crypto = require('crypto');
const multer = require("multer");

module.exports = (fieldsObj) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        switch(file.fieldname) {
          case 'driver_license':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'driver_license'));
            break;
          case 'chef_certificate':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'chef_certificate'));
            break;
          case 'kitchen_photo':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'kitchen_photo'));
            break;
          case 'profile_photo':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'profile_photo'));
            break;
          case 'front_side':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'front_side'));
            break;
          case 'chef_license':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'chef_license'));
            break;
          case 'front_side':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'front_side'));
            break;
          case 'category_image':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'category_image'));
            break;
          case 'plate_image':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'plate_image'));
            break;
          case 'custom_plate_image':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'custom_plate_image'));
            break;
          case 'kitchen_image':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'kitchen_image'));
            break;
          case 'receipt_image':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'receipt_image'));
            break;
          case 'driver_license_front_side':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'driver_license_front_side'));
            break;
          case 'driver_vehicle_registration':
            cb(null, path.resolve(__dirname, '..', 'tmp', 'driver_vehicle_registration'));
            break;
          default:
            break;
        }
      },
      filename: (req, file, cb) => {
        crypto.randomBytes(4, (err, hash) => {
          if (err) cb(err);
          file.key = `${Date.now()}-${hash.toString('hex')}-${file.originalname}`;

          cb(null, file.key);
        });
      }
    })
  }).fields(fieldsObj);
};

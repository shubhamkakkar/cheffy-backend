const path = require('path');
const crypto = require('crypto');
const multer = require("multer");
const photoConstants = require(path.resolve('app/constants/photo'));
const {cloudinary} = require('./cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');

module.exports = (fieldsObj) => {
  return multer({
    storage: cloudinaryStorage({
        cloudinary: cloudinary,
        folder : function(req, file, cb) {
            cb (null, file.fieldname)
        },       
        filename: function (req, file, cb) {            
            crypto.randomBytes(4, (err, hash) => {
              if (err) cb(err);
              var fileName = `${Date.now()}-${hash.toString('hex')}-${file.originalname}`
              cb(null, fileName);
            });
          }
    })
  }).fields(fieldsObj);
};

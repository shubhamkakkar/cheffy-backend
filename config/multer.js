const path = require('path');
const crypto = require('crypto');
const multer = require("multer");
const photoConstants = require(path.resolve('app/constants/photo'));

const getFileUrl = ({folderName, fileName}) => {
  return `${process.env.URL_SERVER}tmp/${folderName}/${fileName}`;
};

module.exports = (fieldsObj) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        if(!photoConstants.folderMap[file.fieldname]) {
          return res.status(400).send({message: `Invalid photo type ${file.fieldname}`});
        }
        cb(null, path.resolve(__dirname, '..', 'tmp', file.fieldname));
      },
      filename: (req, file, cb) => {
        crypto.randomBytes(4, (err, hash) => {
          if (err) cb(err);
          const fileName = `${Date.now()}-${hash.toString('hex')}-${file.originalname}`
          const folderName = file.fieldname;
          
          file.key = fileName;
          file.url = getFileUrl({folderName, fileName});
          //old file name in this key
          //file.uniqueFileName = `${Date.now()}-${hash.toString('hex')}-${file.originalname}`;
          cb(null, file.key);
        });
      }
    })
  }).fields(fieldsObj);
};

const fs = require("fs");
const path = require("path");

exports.deleteImage = async (fieldName, url) => {
  const photoPath = url.replace(process.env.URL_SERVER, "");
  const dirRelativePath = path.resolve(photoPath);
  //const dirPhoto = path.resolve(__dirname, '..', '..','tmp', fieldName, name);

  await fs.access(dirPhoto, (err) => {
    if (!err) {
      fs.unlink(dirPhoto, (err) => {
        if (err) throw "Directory is not exists!";
      });
    }
  });
};

'use strict';

/**
 * Checks if two models/ids represent the same document
 *
 * @param var1
 * @param var2
 * @returns {*}
 */
exports.equals = function (var1, var2) {
  if (!var1 || !var2)
    return false;
  if (var1.constructor.name === 'model')
    var1 = var1._id;
  if (var2.constructor.name === 'model')
    var2 = var2._id;
  //_id can not be 0 or false
  if (var1._id)
    var1 = var1._id;
  if (var2._id)
    var2 = var2._id;
  return String(var1) === String(var2);
};

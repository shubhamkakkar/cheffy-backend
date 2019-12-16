'use strict';

const _ = require('lodash');

function BlackListInputFilter(fields) {
  if (!fields)
  this.fields = [];
  else
      this.fields = fields;
}

BlackListInputFilter.prototype.filter = function(data) {
  const result = {}, _this = this;
  Object.keys(data).forEach(function(field) {
    if (!_this.fields || _this.fields.indexOf(field) === -1) result[field] = data[field];
  });
  return result;
};

BlackListInputFilter.prototype.addField = function(field) {
  this.fields.push(field);
};

BlackListInputFilter.prototype.addFields = function(fields) {
  this.fields = _.merge(this.fields, fields);
};

module.exports = function(fields) {
  return new BlackListInputFilter(fields);
};

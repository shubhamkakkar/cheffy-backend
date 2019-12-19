'use strict';

const _ = require('lodash');

function WhiteListInputFilter(fields) {
  if (!fields)
    this.fields = [];
  else
      this.fields = fields;
}

WhiteListInputFilter.prototype.filter = function(data, reqType) {
  const result = {};
  this.fields.forEach(function(field) {    
    if(reqType === 'form-data') {
      if (data[field]) {
        result[field] = data[field];
        return;
      }
      return;
    }
    if (data.hasOwnProperty(field)) {
      result[field] = data[field];
    }
  });
  return result;
};

WhiteListInputFilter.prototype.addField = function(field) {
  this.fields.push(field);
};

WhiteListInputFilter.prototype.addFields = function(fields) {
  this.fields = _.union(this.fields, fields);
};

module.exports = function(fields) {
  return new WhiteListInputFilter(fields);
};

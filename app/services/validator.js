"use strict";

let error = "";

function ValidationContract() {
  this.clear();
  let error = "";
}

ValidationContract.prototype.isRequired = (value, message) => {
  if (!value || value.length <= 0) error = message;
};

ValidationContract.prototype.hasMinLen = (value, min, message) => {
  if (!value || value.length < min) error = message;
};

ValidationContract.prototype.hasMaxLen = (value, max, message) => {
  if (!value || value.length > max) error = message;
};

ValidationContract.prototype.isFixedLen = (value, len, message) => {
  if (value.length != len) error = message;
};

ValidationContract.prototype.isEmail = (value, message) => {
  var reg = new RegExp(/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/);
  if (!reg.test(value)) error = message;
};

ValidationContract.prototype.isAccountNumber = (value, message) => {
  var reg = new RegExp(/^[0-9]{7,14}$/);
  if (!reg.test(value)) error = message;
};

ValidationContract.prototype.isTaxInformation = (value, message) => {
  var taxArr = ["Tax0", "Tax1", "Tax2", "Tax3"];
  if (!taxArr.includes(value)) error = message;
};

ValidationContract.prototype.errors = () => {
  return error;
};

ValidationContract.prototype.clear = () => {
  console.log("clear called");
  error = "";
};

ValidationContract.prototype.isValid = () => {
  return error.length == 0;
};

module.exports = ValidationContract;

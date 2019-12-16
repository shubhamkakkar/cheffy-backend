'use strict';

const path = require('path');
const HttpStatus = require("http-status-codes");
const asyncHandler = require('express-async-handler');

exports.authorization = (callback, passResponse) => {
	passResponse = passResponse || false;
	return asyncHandler(async (req, res, next) =>  {

		var handleBoolean = (result) => {
			if (!result) {
				return res.status(HttpStatus.FORBIDDEN).sendMessage('forbidden');
			}
			next();
		};

    //callback returns boolean or promise
    let result = callback(req, passResponse ? res : undefined);

		if (typeof result === 'boolean') {
			return handleBoolean(result);
		}

    if (typeof result.then === 'function') {
      const boolResult = await result;
      return handleBoolean(boolResult);
		}

    handleBoolean(false);
	});
};

const path = require('path');
const Slack = require('slack-node');
const appConfig = require(path.resolve('config/app'));
const { REAL_IP_HEADER } = require('./events');

const userActivityWebhookURI = appConfig.slack.userActivityWebhookURI;
const bugWebhookURI = appConfig.slack.bugWebhookURI;

const bugSlack = new Slack();
bugSlack.setWebhook(bugWebhookURI);

const userActivitySlack = new Slack();
userActivitySlack.setWebhook(userActivityWebhookURI);

/**
 * Log Bugs in Slack
 * @param name
 * @param req
 * @param error
 */
exports.logError = (error, req, name) => {

  if(!error.stack) return;

  bugSlack.webhook({
    channel: `#${appConfig.slack.bugChannel}`,
    username: `${appConfig.slack.username}`,
    text: JSON.stringify({name, url: req.originalUrl, method: req.method, ip:req.headers[REAL_IP_HEADER], stack: error.stack, message: error.message})
  }, function(err, response) {
  });
};

/**
 * Internal process error like photo transform error
 * @param error
 * @param req
 * @param name
 */
exports.logInternalError = (error, name) => {
  if(!error.stack) return;
  bugSlack.webhook({
    channel: `#${appConfig.slack.bugChannel}`,
    username: `${appConfig.slack.username}`,
    text: JSON.stringify({name, stack: error.stack, message: error.message})
  }, function(err, response) {
  });
};

/**
 * Log User Activity
 * @param activity
 * @param req
 */
exports.logActivity = (activity, req) => {
  userActivitySlack.webhook({
    channel: `#${appConfig.slack.userLogsChannel}`,
    username: `${appConfig.slack.username}`,
    text: JSON.stringify(activity)
  }, function(err, response) {
  });
};

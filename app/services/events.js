const path = require('path');
const Slack = require('slack-node');
const logger = require(path.resolve('./server/logger'));
const AppEmitter = require('./emitter');
const debug = require('debug')('userlogs');
const useragent = require('useragent');
const slackLogger = require('./slack');
const appConfig = require(path.resolve('config/app'));

const REAL_IP_HEADER = 'x-real-ip';

exports.REAL_IP_HEADER = REAL_IP_HEADER;

exports.getAgentInfo = (req) => {
  const agent = req.headers && useragent.parse(req.headers['user-agent']);
  if(!agent) return {};

  const agentInfo = {
    browser: agent.family,
    browserVersion:agent.toVersion(),
    os: agent.os.family,
    osVersion: agent.os.toVersion(),
    device: agent.device.family,
    deviceVersion: agent.device.toVersion()
  };

  return agentInfo;
};

//only attach event listener once, since it will cause maxListener warning.
AppEmitter.on('error', (error) => {
  slackLogger.logError(error, {}, 'EventEmitter Error');
});

exports.publish = (config, req) => {
    /* sample config object
    {
     action: 'created',
     user: req.user,
     plate: plate,
     type: 'plate'
     scope: appConstants.SCOPE_USER
     };
     */

    const agentInfo = exports.getAgentInfo(req);

    AppEmitter.emit(`${config.type}-${config.action}`, config, req);

    if(process.env.NODE_ENV === 'development') {
      debug('User Activity Log: ',JSON.stringify({...config, ...agentInfo}));
    }

    //slack notification
    const slackPayload = {
      ip: req.headers[REAL_IP_HEADER],
      action: config.action,
      type: config.type,
      //referrer: req.query.referrer || req.headers['referer'],
      [config.type]: config[config.type] ?  config[config.type]._id : '',
      user: (config.user && config.user.name) || (req.user ?  req.user.name : 'Guest'),
      ...agentInfo
    };

    if(config.payload) {
      slackPayload.payload = config.payload;
    }

    if(req.query.crawler) {
      slackPayload.crawler = req.query.crawler;
    }

    if(config.body) {
      slackPayload.body = config.body;
    }

    if(config.query) {
      slackPayload.query = config.query;
    }

    if(config.params) {
      slackPayload.params = config.params;
    }

    if(req.user) {
      slackPayload.user = req.user.name;
    }

    if(config.action === 'searched') {
      slackPayload.keyword = config.keyword;
    }

    //finally log to slack if prod mode
    if(process.env.NODE_ENV === 'production') {
        return slackLogger.logActivity(slackPayload);
    }

    debug('User Activity Log Slack: ',JSON.stringify(slackPayload));
};

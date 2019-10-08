// Notification Service Class
/*
  Requires userId to be defined in the client as an external OneSignal Player Id.
  It is also recommended to divide users into segments ( chefs and clients, for example),
so that we can send notifications to specific groups. 
*/

// Requests library
const got = require('got')
// Notification builder helper
const builder = require('../../helpers/notificationBuilder')

/**
 * @description Notification services.
 */
class NotificationServices{
  /**
   * @description Sends a new push notification.
   * @param {Object} data - Notification data. 
   * @param {String} data.type - Notification type. 
   */
  static async sendPushNotification (data) {
    try {
      if (!data || !data.type) throw new Error('Missing argument "type".')
      // Build notification (throws error if fails)
      const notification = builder[data.type](data)
      // Makes POST request to OneSignal API
      return this._emitNotification(notification)
    } catch (err) {
      console.log(err)
      return false
    }
  }


  /**
   * @description Makes POST request to OneSignal notifications endpoint and await result. Returns Notification ID if successful
   * @param {Object} notification 
   */
  static async _emitNotification (notification) {
    const response = await got.post('/api/v1/notifications', {
      host: 'onesignal.com',
      port: 443,
      headers:
        {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: 'Basic ' + process.env.ONESIGNAL_API_KEY
        },
      body: JSON.stringify(notification)
    })
    const body = JSON.parse(response.body)
    if (response.statusCode === 200 && (!body.errors)) return body.id
    else throw new Error('Received Status: ' + response.statusCode + '. Received Message: ' + body.errors)
  }

  /**
   * @description Cancels previously sent notification.
   * @param {String} id - Notification id.
   */
  static async cancelNotification (id) {
    if (!id) throw new Error('Missing argument "id".')
    const response = await got.delete('/api/v1/notifications/' + id + '?app_id=' + process.env.ONESIGNAL_APP_ID, {
      host: 'onesignal.com',
      port: 443,
      headers:
        {
          Authorization: 'Basic ' + process.env.ONESIGNAL_API_KEY
        }
    })
    const body = JSON.parse(response.body)
    if (response.statusCode === 200 && (body.success)) return true
    else throw new Error('Received Status: ' + response.statusCode + '. Received Message: ' + body)
  }
}

  
module.exports = NotificationServices;
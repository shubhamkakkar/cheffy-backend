require("dotenv").config({
  path: '.env.test'
})
const chai = require('chai')
const nock = require('nock')


const expect = chai.expect

const NotificationService = require('../../../app/services/notification')
const notificationBuilder = require('../../../helpers/notificationBuilder')

describe('Testing Notification service.', () => {
  it('Expects sendPushNotification method to return the notification Id for the successfully sent notification.', async () => {
    const intercept = nock('https://onesignal.com').persist().post('/api/v1/notifications', body => {
      if (body.app_id && body.headings && body.headings.en && body.contents && body.contents.en && (body.include_external_user_ids || body.included_segments))return true

      return false
    }).reply(200, { id: 'NOTIFICATION_ID' })

    const data = {
      type: 'delivery_complete',
      userId: 'USER_ID',
      orderId: 'ORDER_ID'
    }
    const result = await NotificationService.sendPushNotification(data)
    expect(result).to.be.equal('NOTIFICATION_ID')
  })

  it('Expects _emitNotification method to return the notification Id for each registered builder.', async () => {
    const intercept = nock('https://onesignal.com').persist().post('/api/v1/notifications', body => {
      if (body.app_id && body.headings && body.headings.en && body.contents && body.contents.en && (body.include_external_user_ids || body.included_segments))return true

      return false
    }).reply(200, { id: 'NOTIFICATION_ID' })

    const data = {
      userId: 'USER_ID',
      orderId: 'ORDER_ID',
      group: 'GROUP'
    }

    const builders = Object.keys(notificationBuilder)
    for (const builder of builders) {
      const notification = notificationBuilder[builder](data)
      const result = await NotificationService._emitNotification(notification)
      expect(result).to.be.equal('NOTIFICATION_ID')
    }
  })
  it('Expects cancelNotification method to return true.', async () => {
    const intercept = nock('https://onesignal.com').persist().delete('/api/v1/notifications/notificationid').query(query => { 
      if (query && query.app_id) return true
      return false
    }).reply(200, { success: true })

    const response = await NotificationService.cancelNotification('notificationid')
    expect(response).to.be.true
    
  })
})

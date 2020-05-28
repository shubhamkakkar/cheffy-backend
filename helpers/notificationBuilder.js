// Notification Builders

// Delivery complete
exports.delivery_complete = (data) => {
  if (!data.userId || !data.orderId) throw new Error('Missing argument. Expects "userId" and "orderId" to be defined.')
  const Notification = {
    app_id: process.env.ONESIGNAL_APP_ID,
    headings: {
      en: 'Delivery complete!'
    },
    contents: {
      en: 'The delivery ' + data.orderId + ' was completed.'
    },
    data,
    include_external_user_ids: [data.userId]
  }
  return Notification
}

// New delivery
exports.you_got_new_delivery = (data) => {
  if (!data.userId) throw new Error('Missing argument. Expects "userId" to be defined.')
  const Notification = {
    app_id: process.env.ONESIGNAL_APP_ID,
    headings: {
      en: 'You got a new delivery!'
    },
    contents: {
      en: 'You got a new delivery request.'
    },
    data,
    include_external_user_ids: [data.userId]
  }
  return Notification
}

// Example sending notification to all users
exports.send_all_users = (data) => {
  const Notification = {
    app_id: process.env.ONESIGNAL_APP_ID,
    headings: {
      en: 'TO DO'
    },
    contents: {
      en: 'TO DO'
    },
    data,
    included_segments: ['All']
  }
  return Notification
}

// Example sending notification only to certain category
exports.send_to_group = (data) => {
  if (!data.group) throw new Error('Missing argument. Expects "group" to be defined.')
  const Notification = {
    app_id: process.env.ONESIGNAL_APP_ID,
    headings: {
      en: 'TO DO'
    },
    contents: {
      en: 'TO DO'
    },
    data,
    included_segments: [data.group]
  }
  return Notification
}

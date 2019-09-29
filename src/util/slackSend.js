const { IncomingWebhook } = require('@slack/webhook')
const readConfig = require('./readConfig')

const { slackWebhookUrl } = readConfig()

let slackSend = () => {}

if (slackWebhookUrl) {
  const webhook = new IncomingWebhook(slackWebhookUrl)

  slackSend = (opts) => {
    webhook.send({
      attachments: [
        opts
      ]
    })
  }
}

module.exports = slackSend

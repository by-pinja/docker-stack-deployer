const { IncomingWebhook } = require('@slack/webhook')

const url = process.env.SLACK_WEBHOOK_URL

let slackSend = () => {}

if (url) {
  const webhook = new IncomingWebhook(url)

  slackSend = (opts) => {
    webhook.send({
      attachments: [
        opts
      ]
    })
  }
}

module.exports = slackSend

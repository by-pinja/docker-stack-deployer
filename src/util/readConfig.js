const fs = require('fs')
const path = require('path')
const logger = require('./logger')

const readConfig = () => {
  const configFilePath = path.join(__dirname, '../../', 'config.json')

  try {
    return JSON.parse(fs.readFileSync(configFilePath))
  } catch (e) {
    logger.error(
      `Failed to read configuration file at "${configFilePath}". Make sure it exists and it's valid JSON.`
    )

    throw e
  }
}

module.exports = readConfig

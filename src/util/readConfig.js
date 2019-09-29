const fs = require('fs')
const path = require('path')

const readConfig = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../../', 'config.json')))

module.exports = readConfig

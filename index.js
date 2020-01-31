const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const logger = require('./src/util/logger')
const slackSend = require('./src/util/slackSend')
const readConfig = require('./src/util/readConfig')

const port = process.env.PORT || 3000

const deploConfigDir = path.join(__dirname, 'deployments')

!fs.existsSync(deploConfigDir) && fs.mkdirSync(deploConfigDir)

const handler = async (request, response) => {
  const config = readConfig()

  response.status = (status) => {
    response.writeHead(status)
    response.end()
  }

  const { authorization } = request.headers
  const { pathname } = url.parse(request.url) // eslint-disable-line

  if (request.method !== 'POST') {
    return response.status(405)
  }

  if (authorization !== `Token ${config.token}`) {
    return response.status(401)
  }

  const regex = /^\/deploy\/(?<stack>[a-z0-9-]+)$/

  if (!pathname.match(regex)) {
    return response.status(404)
  }

  const { stack } = pathname.match(regex).groups

  // Request OK, send response
  response.end()

  const envName = config.envName ? `[${config.envName}]` : ''
  const startTime = new Date()

  try {
    await deployStack(stack)

    const duration = ((new Date() - startTime) / 1000).toFixed(2) + 's'

    slackSend({
      title: `${envName} Stack "${stack}" deployed (${duration})`,
      color: 'good'
    })
  } catch (e) {
    logger.error(`Failed to deploy stack ${stack}: ${e.toString()}`)
    slackSend({
      title: `${envName} Failed to deploy stack "${stack}"`,
      color: 'danger',
      footer: e.toString()
    })
  }
}

async function deployStack (stack) {
  // 1. Check if stack configuration defined
  logger.info(`Deploying stack ${stack}`)

  const config = readConfig()

  let stackConfig

  if (!(stackConfig = config.stacks[stack])) {
    throw new Error(`No configuration found for stack ${stack}`)
  }

  const branch = stackConfig.branch || 'master'

  // 2. Update stack configuration from git
  const stackConfigDir = path.join(deploConfigDir, (`${stack}-${branch}`).replace(/\//g, '_'))

  !fs.existsSync(stackConfigDir) && fs.mkdirSync(stackConfigDir)

  const cmdOptions = { cwd: stackConfigDir }

  try {
    await runCommand(['stat', '.git'], cmdOptions)
    await runCommand(['git', 'pull'], cmdOptions)
  } catch (e) {
    const { repository } = stackConfig
    await runCommand(['git', 'clone', repository, `-b ${branch}`, '.'], cmdOptions)
  }

  // 3. Run docker login
  await dockerLogin()

  // 4. Decrypt possible crypted secrets
  let crypted = true

  try {
    await runCommand(['stat', '.git-crypt'], cmdOptions)
  } catch (e) {
    crypted = false
  } finally {
    if (crypted) {
      await runCommand(['git-crypt', 'unlock'], cmdOptions)
    }
  }

  // 5. Run stack's deployment command
  await runCommand(stackConfig.command.split(' '), cmdOptions)

  logger.info(`Stack ${stack} deployed`)
}

async function dockerLogin () {
  const {
    DOCKER_USERNAME,
    DOCKER_PASSWORD,
    DOCKER_REGISTRY
  } = process.env

  if (!DOCKER_USERNAME || !DOCKER_PASSWORD || !DOCKER_REGISTRY) {
    return
  }

  await runCommand([
    'docker',
    'login',
    `-u "${DOCKER_USERNAME}"`,
    `-p ${JSON.stringify(DOCKER_PASSWORD)}`,
    DOCKER_REGISTRY
  ])
}

async function runCommand (args, options) {
  return new Promise((resolve, reject) => {
    const proc = spawn(args.shift(), args, { ...options, shell: true })

    proc.stdout.on('data', (data) => logger.info(data.toString()))
    proc.stderr.on('data', (data) => logger.info(data.toString()))

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(code)
      }

      resolve()
    })
  })
}

const server = http.createServer(handler)

server.listen(port, () => logger.info(`Listening on ${port}`))

const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const readConfig = () => JSON.parse(fs.readFileSync('./config.json'))

const port = process.env.PORT || 3000

const deploConfigDir = path.join(__dirname, 'deployments')

!fs.existsSync(deploConfigDir) && fs.mkdirSync(deploConfigDir)

const handler = async (request, response) => {
  const config = readConfig()

  response.status = (status) => {
    response.writeHead(status)
    response.end()
  }

  const { path } = url.parse(request.url)
  const { authorization } = request.headers

  if (request.method !== 'POST') {
    return response.status(405)
  }

  if (authorization !== `Token ${config.token}`) {
    return response.status(401)
  }

  let regex = /^\/deploy\/(?<stack>[a-z0-9-]+)$/

  if (!path.match(regex)) {
    return response.status(404)
  }

  const { stack } = path.match(regex).groups

  // Request OK, send response
  response.end()

  try {
    await deployStack(stack)
  } catch (e) {
    console.error(`Failed to deploy stack ${stack}: ${e.toString()}`)
  }
}

async function deployStack (stack) {
  // 1. Check if stack configuration defined
  console.log(`Deploying stack ${stack}`)

  const config = readConfig()

  let stackConfig

  if (!(stackConfig = config.stacks[stack])) {
    throw new Error(`No configuration found for stack ${stack}`)
  }

  const branch = stackConfig.branch || 'master'

  // 2. Update stack configuration from git
  const stackConfigDir = path.join(deploConfigDir, (`${stack}-${branch}`).replace(/\//g, '_'))

  !fs.existsSync(stackConfigDir) && fs.mkdirSync(stackConfigDir)

  const cmdOptions = { cwd: stackConfigDir }

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

  console.log(`Stack ${stack} deployed`)
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
    const proc = spawn(args.shift(), args, {...options, shell: true})

    proc.stdout.on('data', (data) => console.log(data.toString()))
    proc.stderr.on('data', (data) => console.log(data.toString()))

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(code)
      }

      resolve()
    })
  })
}

const server = http.createServer(handler)

server.listen(port, () => console.log(`Listening on ${port}`))

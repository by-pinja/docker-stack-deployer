# What is this?

[![Build Status](https://jenkins.protacon.cloud/buildStatus/icon?job=www.github.com/docker-stack-deployer/master)](https://jenkins.protacon.cloud/job/www.github.com/job/docker-stack-deployer/job/master/)

This is a docker stack deployer

## Installation

### Secrets

In swarm mode app requires storing the credentials as [Docker secrets](https://docs.docker.com/v17.12/engine/swarm/secrets)

Secrets can be for example created as external secrets beforehand and use them

```
cat your-docker-password.txt | docker secret create dsd-docker-password -
cat your-ssh-private-key.txt | docker secret create dsd-ssh-private-key -
cat your-gpg-private-key.txt | docker secret create dsd-gpg-private-key -
```

When run with `docker-compose` the secrets part may be "faked" using just pure volume mount.

### Usage with docker-compose

```
docker-compose up -d
```

## Configuration

App reads it's configuration at startup from `config.json`

```
{
  "token": "foobar",
  "slackWebhookUrl": "https://hooks.slack.com/services/YOURSLACKWEBHOOKTOKEN"
  "stacks": {
    "hello-world": {
      "repository": "git@github.com:/protacon/barfoo-testicles",
      "branch": "master",
      "command": "docker stack deploy -c docker-compose.yml barfoo-testicles --with-registry-auth"
    }
  }
}
```

### token (string)

Required token to authorize requests to this tool. For example "foobar" token is required as header in format `Authorization: Token foobar`.

### slackWebhookUrl (string)

Slack Incoming Webhook url to send notifications to. Notifications are send from both successfull and failed deployments.

### stacks (string => stack)

Collection of **stack** configurations. Key represents the stack name.

#### stack.repository (string)

The `deployment repository` of this stack. Configuration is cloned and/or pulled from this specified repository on every deployment.

#### stack.branch (string)

Branch of the used `deployment repository`. Defaults to `master`.

#### stack.command (string)

The actual deployment command. Usually just `docker stack deploy -c docker-compose.yml [stack-name]`.

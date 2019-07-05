# What is this?

This is a docker stack deployer

## Installation

### Secrets

App requires storing the credentials as [Docker secrets](https://docs.docker.com/v17.12/engine/swarm/secrets)

Secrets can be for example created as external secrets beforehand and use them

```
cat your-docker-password.txt | docker secret create dsd-docker-password -
cat your-ssh-private-key.txt | docker secret create dsd-ssh-private-key -
cat your-gpg-private-key.txt | docker secret create dsd-gpg-private-key -
```

### Deploy to swarm

```
docker stack deploy -c docker-compose.yml docker-stack-deployer
```

## Configuration

App reads it's configuration at startup from `config.json`

```
{
  "token": "foobar",
  "stacks": {
    "hello-world": {
      "repository": "git@github.com:/protacon/barfoo-testicles",
      "command": "docker stack deploy -c docker-compose.yml barfoo-testicles --with-registry-auth"
    }
  }
}
```

### token (string)

Required token to authorize requests to this tool. For example "foobar" token is required as header in format `Authorization: Token foobar`.

### stacks (sting => stack)

Collection of **stack** configurations. Key represents the stack name.

#### stack.repository (string)

The `deployment repository` of this stack. Configuration is cloned and/or pulled from this specified repository on every deployment.

#### stack.command (string)

The actual deployment command. Usually just `docker stack deploy -c docker-compose.yml [stack-name]`.

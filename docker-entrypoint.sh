#!/bin/bash
set -e

# Import gpg keys for git-crypt
gpg --import /run/secrets/dsd-gpg-private-key

# Add ssh keys for git access
mkdir -p /root/.ssh
cp /run/secrets/dsd-ssh-private-key /root/.ssh/id_rsa
chmod 400 /root/.ssh/id_rsa

eval "$(ssh-agent -s)"
ssh-add /root/.ssh/id_rsa

# Read docker password from secret to env
export DOCKER_PASSWORD=`cat /run/secrets/dsd-docker-password`

# Skip host key verification
git config --global core.sshCommand 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'

exec "$@"

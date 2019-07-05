FROM ubuntu:latest

RUN apt-get update && apt-get install -y \
  curl \
  openssh-client \
  git \
  git-crypt \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg-agent \
  software-properties-common

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

# Install docker
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
RUN add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
RUN apt-get update && apt-get install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io

WORKDIR /app

COPY . .

ENTRYPOINT ["./docker-entrypoint.sh"]

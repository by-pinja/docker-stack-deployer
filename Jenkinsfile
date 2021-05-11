library 'jenkins-ptcs-library@3.1.0'

def label = "docker-stack-deployer-${UUID.randomUUID().toString()}"

podTemplate(label: label,
  containers: pod.templates + [
    containerTemplate(
      name: 'node',
      image: 'node:10',
      alwaysPullImage: true,
      ttyEnabled: true,
      command: '/bin/sh -c',
      args: 'cat'
    )
  ]
) {
  def project = 'docker-stack-deployer'

  node(label) {
    stage('Checkout') {
      checkout scm
    }
    stage('Build') {
      container('node') {
        sh """
          npm install
        """
      }
    }
    stage('Test') {
      container('node') {
        sh """
          npm run lint
        """
      }
    }
    stage('Package') {
      container('docker') {
        publishContainerToGcr(project);
        publishTagToDockerhub(project);
      }
    }
  }
}

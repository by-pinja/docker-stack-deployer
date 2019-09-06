library 'jenkins-ptcs-library@0.6.1'

def label = "docker-stack-deployer-${UUID.randomUUID().toString()}"

podTemplate(label: label,
  containers: pod.templates
) {
  def project = "docker-stack-deployer"

  node(label) {
    stage('Checkout') {
      checkout scm
    }
    stage('Package') {
      container('docker') {
        publishContainerToGcr(project);
      }
    }
  }
}

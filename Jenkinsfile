pipeline {
  agent any

  environment {
    NODE_ENV = 'production'
    REGISTRY = credentials('docker-registry-creds')
    IMAGE_NAME = 'space-weather-insights'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Setup Node') {
      steps {
        sh 'node -v || true'
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci --no-audit --no-fund'
      }
    }

    stage('Lint & Typecheck') {
      steps {
        sh 'npm run lint'
        sh 'npm run typecheck'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Docker Build') {
      when { expression { return fileExists('Dockerfile') } }
      steps {
        sh 'docker build -t ${IMAGE_NAME}:$BUILD_NUMBER .'
      }
    }

    // Optional: push to registry if configured
    stage('Docker Push') {
      when { allOf { expression { return env.REGISTRY }, expression { return env.DOCKERHUB_USERNAME } } }
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
          sh 'echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin'
          sh 'docker tag ${IMAGE_NAME}:$BUILD_NUMBER ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:$BUILD_NUMBER'
          sh 'docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:$BUILD_NUMBER'
        }
      }
    }
  }

  post {
    success {
      echo 'Build completed successfully.'
    }
    failure {
      echo 'Build failed.'
    }
  }
}

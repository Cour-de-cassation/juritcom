#!/bin/bash

# Wanted host, should be passed as $1 (INTEGRATION|RECETTE|QUALIF)
ENV_DESTINATION="$1"

# Construct variable names
DEPLOY_HOST_VAR="DEPLOY_HOST_${ENV_DESTINATION}"
DEPLOY_IP_VAR="DEPLOY_IP_${ENV_DESTINATION}"
SSH_PRIVATE_KEY_VAR="DEPLOY_SSH_PRIVATE_KEY_${ENV_DESTINATION}"

# Use eval to evaluate the variable names and assign their values to new variables
eval DEPLOY_HOST=\$$DEPLOY_HOST_VAR
eval DEPLOY_IP=\$$DEPLOY_IP_VAR
eval SSH_PRIVATE_KEY=\$$SSH_PRIVATE_KEY_VAR

# Config hosts file
echo "$DEPLOY_IP $DEPLOY_HOST" >> /etc/hosts && cat /etc/hosts

# Setup SSH deploy keys
eval $(ssh-agent)
echo "$SSH_PRIVATE_KEY" | ssh-add -
mkdir -p ~/.ssh
echo -e "StrictHostKeyChecking no" >> ~/.ssh/config

echo "DEPLOY IN HOST : ${DEPLOY_HOST}"
ssh -t $DEPLOY_USER@$DEPLOY_HOST "sudo docker login -u ${APP_DEPLOYER_USER} -p ${APP_DEPLOYER_TOKEN} ${CI_REGISTRY} &&  sudo docker-compose pull ${APP_TO_DEPLOY} && sudo docker-compose up -d --force-recreate ${APP_TO_DEPLOY}; exit"
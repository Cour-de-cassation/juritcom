# --- Builder --- #
FROM node:20-alpine as builder

ENV NODE_ENV build

USER node
WORKDIR /home/node

RUN npm config set proxy $http_proxy
RUN npm config set https-proxy $https_proxy

COPY package*.json ./
RUN npm ci

COPY --chown=node:node . .

# Build the application
RUN npm run build

# --- Only prod dependencies --- #
FROM builder as prod

# Remove dev dependencies
RUN npm prune --production

# Check the contents of the dist directory in the prod stage
RUN ls -al /home/node/dist

# --- Base final image with only shared dist content --- #
FROM node:20-alpine as shared

ENV NODE_ENV production

USER node
WORKDIR /home/node

COPY --from=prod --chown=node:node /home/node/package*.json ./
COPY --from=prod --chown=node:node /home/node/node_modules/ ./node_modules/
COPY --from=prod --chown=node:node /home/node/dist/shared ./dist/shared

# --- Base final image with batch dist content --- #
FROM shared as batch 

USER node
COPY --from=prod --chown=node:node /home/node/dist/batch ./dist/batch
COPY --chown=node:node batch_docker_entrypoint.sh batch_docker_entrypoint.sh

ENTRYPOINT ["/bin/sh", "batch_docker_entrypoint.sh"]

# --- Base final image with api dist content --- #
FROM shared as api

USER node
WORKDIR /home/node

COPY --from=prod --chown=node:node /home/node/dist ./dist

CMD ["node", "dist/api/main"]

# --- Base image with batch content --- #
FROM shared as batch-local

USER node

CMD ["npm", "run", "batch:start:watch"]

# --- Base image with api content --- #
FROM node:20-alpine as api-local

USER node
WORKDIR /home/node

COPY --chown=node:node . .
RUN npm i

CMD ["npm", "run", "start:dev"]

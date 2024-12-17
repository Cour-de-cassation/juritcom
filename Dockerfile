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

# --- Base final image with api dist content --- #
FROM shared as api

USER node
WORKDIR /home/node

COPY --from=prod --chown=node:node /home/node/dist ./dist

CMD ["node", "dist/api/main"]

# --- Base image with api content --- #
FROM node:18-alpine as api-local

USER node
WORKDIR /home/node

COPY --chown=node:node . .
RUN npm i

CMD ["npm", "run", "start:dev"]


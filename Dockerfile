# --- Builder --- #
FROM node:24-alpine AS builder

ENV NODE_ENV=build

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
FROM builder AS prod

# Remove dev dependencies
RUN npm prune --production

# --- Base final image with only shared dist content --- #
FROM node:24-alpine AS shared

ENV NODE_ENV=production

USER node
WORKDIR /home/node

COPY --from=prod --chown=node:node /home/node/package*.json ./
COPY --from=prod --chown=node:node /home/node/node_modules/ ./node_modules/
COPY --from=prod --chown=node:node /home/node/dist/shared ./dist/shared

# --- Base final image with batch dist content --- #
FROM shared AS batch 

USER node
COPY --from=prod --chown=node:node /home/node/dist/batch ./dist/batch

CMD ["node", "dist/batch/normalization/index.js"]

# --- Base final image with api dist content --- #
FROM shared AS api

USER node
WORKDIR /home/node

COPY --from=prod --chown=node:node /home/node/dist ./dist

CMD ["node", "dist/api/main"]

# --- Base image with batch content --- #
FROM shared AS batch-local

USER node

CMD ["npm", "run", "batch:start:watch"]

# --- Base image with api content --- #
FROM node:24-alpine AS api-local

USER node
WORKDIR /home/node

COPY --chown=node:node . .

CMD ["npm", "run", "start:watch"]

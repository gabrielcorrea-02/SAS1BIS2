# ------------------------
# STAGE 1: BUILD
# ------------------------
FROM node:20 AS build

WORKDIR /app

ARG BUILD_MODE=release
ENV BUILD_MODE=${BUILD_MODE}

# Só copia package.json e lock
COPY package*.json ./

# Instala conforme o modo
RUN if [ "$BUILD_MODE" = "debug" ]; then \
      npm install; \
    else \
      npm ci; \
    fi

# Copy rest of the app files
COPY ./app ./app
COPY server.js .


# ------------------------
# STAGE 2: PRODUCTION
# ------------------------
FROM node:20

WORKDIR /app

# Copia TUDO do stage build, incluindo node_modules
COPY --from=build /app /app

USER node

EXPOSE 3000

CMD ["npm", "start"]

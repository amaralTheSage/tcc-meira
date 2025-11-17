FROM dunglas/frankenphp:1.9.0-php8.4.11

RUN apt update

# Instala o mise :v
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"
RUN curl https://mise.run | sh

# Instala o nodejs 24
RUN mise use node@24

RUN install-php-extensions \
    @composer \
    pcntl \
    pdo_pgsql \
    pgsql \
    redis

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader

CMD [ "composer", "run", "dev:all" ]

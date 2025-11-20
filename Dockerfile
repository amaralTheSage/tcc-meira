FROM dunglas/frankenphp:1.9.0-php8.4.11

RUN apt update

# Instala o mise :v
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"

# Instala o nodejs 24 com mise
RUN curl https://mise.run | sh && \
    mise use node@24

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

# Isso parece inseguro estar no git, mas é obrigatório e entra na build PUBLICA do vite.
# Então qualquer um pode ver isso de qualquer maneira :b
ARG VITE_APP_NAME
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME

RUN npm run build

RUN composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader

RUN php artisan event:cache && \
    php artisan route:cache && \
    php artisan view:cache

CMD [ "composer", "run", "dev:all" ]

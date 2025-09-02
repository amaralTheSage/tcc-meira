FROM dunglas/frankenphp:1.9.0-php8.4.11-alpine

RUN apk add --no-cache nodejs npm

RUN install-php-extensions \
    @composer \
    pcntl \
    pdo_pgsql \
    pgsql

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

RUN npm run build:ssr

RUN php artisan event:cache
RUN php artisan route:cache
RUN php artisan view:cache

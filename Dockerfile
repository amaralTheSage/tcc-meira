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

RUN composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader

CMD [ "composer", "run", "dev:all" ]

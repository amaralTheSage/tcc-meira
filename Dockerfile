FROM dunglas/frankenphp:1.9.0-php8.4.11-alpine

RUN apk add --no-cache supervisor nodejs npm

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

ENV VITE_APP_NAME="Meira" \
    VITE_REVERB_APP_KEY="vilz1hsaxbzohc0i7pwi" \
    VITE_REVERB_HOST="localhost" \
    VITE_REVERB_PORT="8080" \
    VITE_REVERB_SCHEME="http"

RUN npm run build:ssr

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN php artisan event:cache && \
    php artisan route:cache && \
    php artisan view:cache

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8000/up || exit 1

EXPOSE 8000
EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

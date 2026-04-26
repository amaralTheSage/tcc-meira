<?php

namespace App\Providers;

use App\Http\Middleware\UpgradeToHttps;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->configureSecureUrls();
    }

    // Peguei da daqui:
    // https://laravel-news.com/url-force-https
    // Isso é importante em produção
    protected function configureSecureUrls()
    {
        // Determine if HTTPS should be enforced
        $enforceHttps = $this->app->environment(['production', 'staging'])
            && ! $this->app->runningUnitTests();

        // Force HTTPS for all generated URLs
        URL::forceHttps($enforceHttps);

        // Ensure proper server variable is set
        if ($enforceHttps) {
            $this->app['request']->server->set('HTTPS', 'on');

            $this->app['router']->pushMiddlewareToGroup('web', UpgradeToHttps::class);
        }
    }
}

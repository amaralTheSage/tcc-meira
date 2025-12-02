import { Page } from '@/types';

const initialPages: Page[] = [
    {
        id: '7',
        name: 'Laravel Installation Guide',
        sections: [
            {
                id: '7-1',
                name: 'Meet Laravel',
                blocks: [
                    {
                        id: 'b19',
                        type: 'text',
                        content:
                            'Laravel is a web application framework with expressive, elegant syntax. It provides a structure and starting point for creating web applications, allowing you to focus on building something amazing.',
                    },
                    {
                        id: 'b20',
                        type: 'callout',
                        calloutType: 'info',
                        content:
                            'Laravel is a progressive framework that grows with you. Whether you are new to PHP web frameworks or have years of experience, Laravel can grow with you.',
                    },
                ],
            },
            {
                id: '7-2',
                name: 'Prerequisites',
                blocks: [
                    {
                        id: 'b21',
                        type: 'text',
                        content:
                            'Before creating your first Laravel application, ensure your local machine has PHP, Composer, and the Laravel installer installed. You should also install Node and NPM or Bun to compile frontend assets.',
                    },
                    {
                        id: 'b22',
                        type: 'list',
                        content: 'PHP 8.1 or higher\nComposer package manager\nLaravel installer\nNode.js and NPM (or Bun)',
                    },
                ],
            },
            {
                id: '7-3',
                name: 'Creating an Application',
                blocks: [
                    {
                        id: 'b23',
                        type: 'text',
                        content:
                            'The Laravel installer will prompt you to select your preferred testing framework, database, and starter kit during application creation.',
                    },
                    {
                        id: 'b24',
                        type: 'code',
                        language: 'bash',
                        content: 'laravel new example-app\ncd example-app\nnpm install && npm run build\ncomposer run dev',
                    },
                ],
            },
            {
                id: '7-4',
                name: 'Initial Configuration',
                blocks: [
                    {
                        id: 'b25',
                        type: 'text',
                        content:
                            'Laravel uses a .env file for environment-based configuration. Many configuration values vary depending on whether your application is running locally or on a production server.',
                    },
                    {
                        id: 'b26',
                        type: 'callout',
                        calloutType: 'warning',
                        content:
                            'Your .env file should not be committed to source control. Each developer/server may require different environment configuration, and exposing it is a security risk.',
                    },
                ],
            },
            {
                id: '7-5',
                name: 'Database Configuration',
                blocks: [
                    {
                        id: 'b27',
                        type: 'text',
                        content:
                            'By default, Laravel is configured to use SQLite. You can update the .env file to use MySQL, PostgreSQL, or other database drivers.',
                    },
                    {
                        id: 'b28',
                        type: 'code',
                        language: 'bash',
                        content: 'DB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_DATABASE=laravel\nDB_USERNAME=root\nDB_PASSWORD=',
                    },
                    {
                        id: 'b29',
                        type: 'text',
                        content: 'After configuring your database, run migrations to create the application database tables:',
                    },
                    {
                        id: 'b30',
                        type: 'code',
                        language: 'bash',
                        content: 'php artisan migrate',
                    },
                ],
            },
            {
                id: '7-6',
                name: 'Laravel Herd',
                blocks: [
                    {
                        id: 'b31',
                        type: 'text',
                        content:
                            'Laravel Herd is a blazing fast, native Laravel and PHP development environment for macOS and Windows. It includes everything needed to get started with Laravel development, including PHP and Nginx.',
                    },
                    {
                        id: 'b32',
                        type: 'list',
                        content:
                            'Includes PHP, Composer, Node, NPM, and other tools\nAutomatic HTTPS and domain management\nHerd Pro adds MySQL, PostgreSQL, and Redis support\nAvailable for both macOS and Windows',
                    },
                ],
            },
            {
                id: '7-7',
                name: 'IDE Support',
                blocks: [
                    {
                        id: 'b33',
                        type: 'text',
                        content:
                            'You are free to use any code editor. Popular choices for Laravel development include VS Code with the Laravel extension, PhpStorm with Laravel Idea plugin, and Cursor.',
                    },
                    {
                        id: 'b34',
                        type: 'list',
                        content:
                            'VS Code + Laravel Extension: lightweight and extensible\nPhpStorm: extensive and robust Laravel support\nCursor: modern AI-powered code editor\nFirebase Studio: cloud-based development experience',
                    },
                ],
            },
            {
                id: '7-8',
                name: 'Next Steps',
                blocks: [
                    {
                        id: 'b35',
                        type: 'text',
                        content:
                            'After creating your Laravel application, familiarize yourself with core concepts like the request lifecycle, configuration, directory structure, routing, and the service container.',
                    },
                    {
                        id: 'b36',
                        type: 'text',
                        content:
                            'Laravel can be used as a full-stack framework with Blade templates or Inertia.js, or as an API backend for JavaScript single-page applications.',
                    },
                ],
            },
        ],
    },
    {
        id: '8',
        name: 'Laravel Configuration',
        sections: [
            {
                id: '8-1',
                name: 'Introduction',
                blocks: [
                    {
                        id: 'b37',
                        type: 'text',
                        content:
                            'All of the configuration files for the Laravel framework are stored in the config directory. Each option is documented, so feel free to look through the files and get familiar with the options available to you.',
                    },
                    {
                        id: 'b38',
                        type: 'text',
                        content:
                            'These configuration files allow you to configure your database connection information, mail server information, and various other core configuration values such as your application URL and encryption key.',
                    },
                ],
            },
            {
                id: '8-2',
                name: 'Environment Configuration',
                blocks: [
                    {
                        id: 'b39',
                        type: 'text',
                        content:
                            'It is often helpful to have different configuration values based on the environment where the application is running. Laravel utilizes the DotEnv PHP library to manage this.',
                    },
                    {
                        id: 'b40',
                        type: 'callout',
                        calloutType: 'warning',
                        content:
                            'Your .env file should not be committed to source control. Each developer/server may require different configuration, and exposing it is a security risk.',
                    },
                ],
            },
            {
                id: '8-3',
                name: 'Environment Variable Types',
                blocks: [
                    {
                        id: 'b41',
                        type: 'text',
                        content:
                            'All variables in your .env files are typically parsed as strings, but reserved values allow you to return a wider range of types:',
                    },
                    {
                        id: 'b42',
                        type: 'list',
                        content: "true → (bool) true\nfalse → (bool) false\nempty → (string) ''\nnull → (null) null",
                    },
                    {
                        id: 'b43',
                        type: 'code',
                        language: 'bash',
                        content: 'APP_NAME="My Application"  # Values with spaces must be quoted',
                    },
                ],
            },
            {
                id: '8-4',
                name: 'Retrieving Configuration',
                blocks: [
                    {
                        id: 'b44',
                        type: 'text',
                        content:
                            'All variables in your .env file will be loaded into the $_ENV PHP super-global when your application receives a request.',
                    },
                    {
                        id: 'b45',
                        type: 'code',
                        language: 'php',
                        content:
                            "// Using the env() function\n'debug' => (bool) env('APP_DEBUG', false),\n\n// Using the Config facade\n$value = Config::get('app.timezone');\n$value = config('app.timezone', 'Asia/Seoul');",
                    },
                ],
            },
            {
                id: '8-5',
                name: 'Determining Current Environment',
                blocks: [
                    {
                        id: 'b46',
                        type: 'text',
                        content:
                            'The current application environment is determined via the APP_ENV variable from your .env file. You may access this value via the environment() method on the App facade.',
                    },
                    {
                        id: 'b47',
                        type: 'code',
                        language: 'php',
                        content:
                            "use Illuminate\\Support\\Facades\\App;\n\n$environment = App::environment();\n\nif (App::environment('local')) {\n    // The environment is local\n}\n\nif (App::environment(['local', 'staging'])) {\n    // The environment is either local OR staging\n}",
                    },
                ],
            },
            {
                id: '8-6',
                name: 'Encrypting Environment Files',
                blocks: [
                    {
                        id: 'b48',
                        type: 'text',
                        content:
                            'Unencrypted environment files should never be stored in source control. However, Laravel allows you to encrypt your environment files so they may safely be added to source control.',
                    },
                    {
                        id: 'b49',
                        type: 'code',
                        language: 'bash',
                        content:
                            '# Encrypt the .env file\nphp artisan env:encrypt\n\n# Encrypt with a custom key\nphp artisan env:encrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF\n\n# Decrypt the .env file\nphp artisan env:decrypt\n\n# Decrypt with a custom key\nphp artisan env:decrypt --key=3UVsEgGVK36XN82KKeyLFMhvosbZN1aF',
                    },
                ],
            },
            {
                id: '8-7',
                name: 'Configuration Caching',
                blocks: [
                    {
                        id: 'b50',
                        type: 'text',
                        content:
                            'To give your application a speed boost, cache all configuration files into a single file using the config:cache Artisan command.',
                    },
                    {
                        id: 'b51',
                        type: 'callout',
                        calloutType: 'info',
                        content:
                            'The config:cache command should be run as part of your production deployment process, not during local development.',
                    },
                    {
                        id: 'b52',
                        type: 'code',
                        language: 'bash',
                        content: '# Cache configuration\nphp artisan config:cache\n\n# Clear configuration cache\nphp artisan config:clear',
                    },
                ],
            },
            {
                id: '8-8',
                name: 'Debug Mode',
                blocks: [
                    {
                        id: 'b53',
                        type: 'text',
                        content: 'The debug option in your config/app.php determines how much information about an error is displayed to the user.',
                    },
                    {
                        id: 'b54',
                        type: 'callout',
                        calloutType: 'error',
                        content:
                            'For local development, set APP_DEBUG to true. In production, this value must ALWAYS be false. Setting it to true in production risks exposing sensitive configuration values.',
                    },
                ],
            },
        ],
    },
    {
        id: '9',
        name: 'Laravel Directory Structure',
        sections: [
            {
                id: '9-1',
                name: 'Introduction',
                blocks: [
                    {
                        id: 'b55',
                        type: 'text',
                        content:
                            'The default Laravel application structure is intended to provide a great starting point for both large and small applications. However, you are free to organize your application however you like.',
                    },
                    {
                        id: 'b56',
                        type: 'text',
                        content:
                            'Laravel imposes almost no restrictions on where any given class is located - as long as Composer can autoload the class.',
                    },
                ],
            },
            {
                id: '9-2',
                name: 'Root Directory Structure',
                blocks: [
                    {
                        id: 'b57',
                        type: 'list',
                        content:
                            'app/ - Core code of your application\nbootstrap/ - Framework bootstrapping files\nconfig/ - Configuration files\ndatabase/ - Migrations, factories, and seeds\npublic/ - Entry point and assets\nresources/ - Views and raw assets\nroutes/ - Route definitions\nstorage/ - Logs and caches\ntests/ - Automated tests\nvendor/ - Composer dependencies',
                    },
                ],
            },
            {
                id: '9-3',
                name: 'App Directory',
                blocks: [
                    {
                        id: 'b58',
                        type: 'text',
                        content:
                            'The app directory contains the core code of your application. It is namespaced under App and autoloaded by Composer using PSR-4.',
                    },
                    {
                        id: 'b59',
                        type: 'text',
                        content:
                            'By default, the app directory contains Http, Models, and Providers subdirectories. Additional directories are generated as needed.',
                    },
                ],
            },
            {
                id: '9-4',
                name: 'App Subdirectories',
                blocks: [
                    {
                        id: 'b60',
                        type: 'list',
                        content:
                            'Broadcasting/ - Broadcast channel classes\nConsole/ - Custom Artisan commands\nEvents/ - Event classes\nExceptions/ - Custom exceptions\nHttp/ - Controllers, middleware, requests\nJobs/ - Queueable jobs\nListeners/ - Event listeners\nMail/ - Mailable classes\nModels/ - Eloquent models\nNotifications/ - Notification classes\nPolicies/ - Authorization policies\nProviders/ - Service providers\nRules/ - Custom validation rules',
                    },
                ],
            },
            {
                id: '9-5',
                name: 'Bootstrap Directory',
                blocks: [
                    {
                        id: 'b61',
                        type: 'text',
                        content:
                            'The bootstrap directory contains the app.php file which bootstraps the framework. This directory also houses a cache directory which contains framework-generated files for performance optimization such as route and services cache files.',
                    },
                ],
            },
            {
                id: '9-6',
                name: 'Config Directory',
                blocks: [
                    {
                        id: 'b62',
                        type: 'text',
                        content:
                            "The config directory contains all of your application's configuration files. It's a great idea to read through all of these files and familiarize yourself with all of the options available to you.",
                    },
                ],
            },
            {
                id: '9-7',
                name: 'Database Directory',
                blocks: [
                    {
                        id: 'b63',
                        type: 'text',
                        content:
                            'The database directory contains your database migrations, model factories, and seeds. If you wish, you may also use this directory to hold an SQLite database.',
                    },
                ],
            },
            {
                id: '9-8',
                name: 'Public & Resources Directories',
                blocks: [
                    {
                        id: 'b64',
                        type: 'text',
                        content:
                            'The public directory contains the index.php file, which is the entry point for all requests entering your application. It also houses your assets such as images, JavaScript, and CSS.',
                    },
                    {
                        id: 'b65',
                        type: 'text',
                        content: 'The resources directory contains your views as well as your raw, un-compiled assets such as CSS or JavaScript.',
                    },
                ],
            },
            {
                id: '9-9',
                name: 'Routes Directory',
                blocks: [
                    {
                        id: 'b66',
                        type: 'text',
                        content: 'The routes directory contains all of the route definitions for your application.',
                    },
                    {
                        id: 'b67',
                        type: 'list',
                        content:
                            'web.php - Routes in web middleware group (sessions, CSRF, cookies)\nconsole.php - Closure-based console commands\napi.php - Stateless API routes (authenticated via tokens)\nchannels.php - Event broadcasting channels',
                    },
                ],
            },
            {
                id: '9-10',
                name: 'Storage & Tests Directories',
                blocks: [
                    {
                        id: 'b68',
                        type: 'text',
                        content:
                            "The storage directory contains logs, compiled Blade templates, sessions, file caches, and other framework-generated files. It's segregated into app, framework, and logs subdirectories.",
                    },
                    {
                        id: 'b69',
                        type: 'text',
                        content:
                            'The tests directory contains your automated tests. Example Pest or PHPUnit unit tests and feature tests are provided. Each test class should be suffixed with the word "Test".',
                    },
                ],
            },
        ],
    },
];
export default initialPages;

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&display=swap" rel="stylesheet">

        {{-- Inline script to lock dark mode before React renders. --}}
        <script>
            (function() {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';

                try {
                    localStorage.setItem('appearance', 'dark');
                } catch (error) {
                    // Private browsing can reject localStorage; the class above is enough for rendering.
                }

                document.cookie = 'appearance=dark;path=/;max-age=31536000;SameSite=Lax';
            })();
        </script>

        {{-- Inline style keeps the first paint aligned with the locked theme. --}}
        <style>
            html {
                font-family: "Merriweather", serif;
                background-color: oklch(0.145 0 0);
                color-scheme: dark;
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

     
        <link rel="icon" href="/gato_safado.svg" type="image/svg+xml">  

        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-merriweather antialiased">
        @inertia
    </body>
</html>

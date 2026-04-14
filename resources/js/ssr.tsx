import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { type RouteName, route } from 'ziggy-js';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
type ServerZiggyConfig = { location: string } & Record<string, unknown>;
type ServerPageProps = { ziggy: ServerZiggyConfig };
type ServerRoute = (name: RouteName, params?: unknown, absolute?: boolean) => string;

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => `${title} - ${appName}`,
        resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
        setup: ({ App, props }) => {
            const ziggy = (page.props as unknown as ServerPageProps).ziggy;

            const serverRoute: ServerRoute = (name, params, absolute) =>
                route(name, params as never, absolute, {
                    ...ziggy,
                    location: new URL(ziggy.location),
                } as never);

            globalThis.route = serverRoute as typeof route;

            return <App {...props} />;
        },
    }),
);

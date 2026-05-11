#!/usr/bin/env node

import { EXPECTED_VITE_URL, HOT_FILE, commandOutput, readHotFile } from './dev-server-checks.mjs';
import process from 'node:process';

const failures = [];
const hotUrl = readHotFile();

if (hotUrl === null) {
    failures.push(`${HOT_FILE} is missing, so Laravel will serve public/build assets.`);
} else if (hotUrl !== EXPECTED_VITE_URL) {
    failures.push(`${HOT_FILE} is ${hotUrl}; expected ${EXPECTED_VITE_URL}.`);
}

const viteClientStatus = await fetchViteClientStatus();

if (viteClientStatus !== 200) {
    failures.push(`${EXPECTED_VITE_URL}/@vite/client returned ${viteClientStatus}; expected 200.`);
}

if (!laravelSeesHotMode()) {
    failures.push('Laravel Vite::isRunningHot() is false, so @vite will use the build manifest.');
}

if (failures.length > 0) {
    console.error('Vite dev health check failed.');
    failures.forEach((failure) => console.error(`- ${failure}`));
    console.error('Recovery: kill the stale PIDs, restart composer run dev, then run composer run dev:health.');
    process.exit(1);
}

console.log(`Vite dev health check passed at ${EXPECTED_VITE_URL}.`);

async function fetchViteClientStatus() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
        const response = await fetch(`${EXPECTED_VITE_URL}/@vite/client`, { signal: controller.signal });
        return response.status;
    } catch (error) {
        return error instanceof Error ? error.message : String(error);
    } finally {
        clearTimeout(timeout);
    }
}

function laravelSeesHotMode() {
    const code = [
        'require "vendor/autoload.php";',
        '$app = require "bootstrap/app.php";',
        '$app->make("Illuminate\\\\Contracts\\\\Console\\\\Kernel")->bootstrap();',
        'echo app("Illuminate\\\\Foundation\\\\Vite")->isRunningHot() ? "yes" : "no";',
    ].join(' ');

    return commandOutput('php', ['-r', code]) === 'yes';
}

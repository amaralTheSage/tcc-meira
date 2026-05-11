#!/usr/bin/env node

import { DEV_PORTS, HOT_FILE, formatOwner, portOwners, removeHotFile, runningViteProcesses } from './dev-server-checks.mjs';
import process from 'node:process';

const occupiedPorts = DEV_PORTS.flatMap((target) => portOwners(target.port).map((owner) => ({ ...owner, name: target.name })));
const viteProcesses = runningViteProcesses();

if (occupiedPorts.length > 0) {
    fail('Dev ports are already in use. Stop the existing stack before starting a new one.', occupiedPorts);
}

if (viteProcesses.length > 0) {
    fail('A Vite process is already running. Stop it before starting composer run dev.', viteProcesses);
}

if (removeHotFile()) {
    console.log(`Removed stale ${HOT_FILE}.`);
}

console.log('Dev preflight passed.');

function fail(message, owners) {
    console.error(message);
    owners.forEach((owner) => console.error(`- ${formatOwner(owner)}`));
    process.exit(1);
}

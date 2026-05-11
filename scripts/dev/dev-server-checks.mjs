import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';

export const EXPECTED_VITE_URL = 'http://127.0.0.1:5173';
export const HOT_FILE = 'public/hot';
export const DEV_PORTS = [
    { name: 'Laravel HTTP', port: 8000 },
    { name: 'Vite', port: 5173 },
    { name: 'Reverb', port: 8050 },
];

export function commandOutput(command, args) {
    const result = spawnSync(command, args, { encoding: 'utf8' });

    if (result.status !== 0) {
        return '';
    }

    return result.stdout.trim();
}

export function commandForPid(pid) {
    return commandOutput('ps', ['-p', String(pid), '-o', 'pid=,ppid=,cmd=']) || `pid=${pid}`;
}

export function formatOwner(owner) {
    if (owner.port === 'process') {
        return `${owner.name ?? 'process'}: ${owner.command}`;
    }

    return `${owner.name ?? `port ${owner.port}`} on ${owner.port}: ${owner.command}`;
}

export function portOwners(port) {
    const ssOwners = ssPortOwners(port);

    if (ssOwners.length > 0) {
        return ssOwners;
    }

    return lsofPortOwners(port);
}

export function runningViteProcesses() {
    return commandOutput('ps', ['-eo', 'pid=,ppid=,cmd='])
        .split('\n')
        .map(processFromPsLine)
        .filter((item) => item && isViteProcess(item))
        .map((item) => ({ command: item.command, name: 'Vite process', pid: item.pid, port: 'process' }));
}

export function readHotFile() {
    if (!existsSync(HOT_FILE)) {
        return null;
    }

    return readFileSync(HOT_FILE, 'utf8').trim();
}

export function removeHotFile() {
    if (!existsSync(HOT_FILE)) {
        return false;
    }

    rmSync(HOT_FILE);

    return true;
}

function ssPortOwners(port) {
    return commandOutput('ss', ['-ltnp'])
        .split('\n')
        .filter((line) => line.includes(`:${port}`))
        .map((line) => ownerFromSsLine(port, line))
        .filter(Boolean);
}

function ownerFromSsLine(port, line) {
    const pid = line.match(/pid=(\d+)/)?.[1];

    return {
        command: pid ? commandForPid(pid) : line.trim(),
        pid: pid ?? 'unknown',
        port,
    };
}

function lsofPortOwners(port) {
    return commandOutput('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'])
        .split('\n')
        .slice(1)
        .map((line) => ownerFromLsofLine(port, line))
        .filter(Boolean);
}

function ownerFromLsofLine(port, line) {
    const columns = line.trim().split(/\s+/);

    if (columns.length < 2) {
        return null;
    }

    return {
        command: commandForPid(columns[1]) || line.trim(),
        pid: columns[1],
        port,
    };
}

function processFromPsLine(line) {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);

    if (!match) {
        return null;
    }

    return {
        command: match[3],
        pid: match[1],
        ppid: match[2],
    };
}

function isViteProcess(item) {
    if (Number(item.pid) === process.pid) {
        return false;
    }

    return (
        /npm run dev\b/.test(item.command) ||
        /node .*node_modules\/\.bin\/vite\b/.test(item.command) ||
        /node .*vite\/bin\/vite\.js\b/.test(item.command)
    );
}

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import type React from 'react';
import { afterEach, vi } from 'vitest';
import { mockRoute, resetInertiaMocks } from './inertia';
import { resetEchoMocks } from './echo';

vi.mock('@inertiajs/react', async () => {
    const react = await vi.importActual<typeof import('react')>('react');
    const inertia = await import('./inertia');

    return inertia.createInertiaReactMock(react);
});

vi.mock('@laravel/echo-react', async () => {
    const echo = await import('./echo');

    return {
        useEcho: echo.useEchoMock,
    };
});

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock('@dnd-kit/core', async () => {
    const react = await vi.importActual<typeof import('react')>('react');

    return {
        DndContext: ({ children }: { children: React.ReactNode }) => react.createElement('div', {}, children),
        DragOverlay: ({ children }: { children: React.ReactNode }) => react.createElement('div', {}, children),
        KeyboardSensor: vi.fn(),
        PointerSensor: vi.fn(),
        closestCenter: vi.fn(),
        useSensor: vi.fn(),
        useSensors: () => [],
    };
});

vi.mock('@dnd-kit/sortable', async () => {
    const react = await vi.importActual<typeof import('react')>('react');

    return {
        SortableContext: ({ children }: { children: React.ReactNode }) => react.createElement('div', {}, children),
        arrayMove,
        sortableKeyboardCoordinates: vi.fn(),
        useSortable: () => ({
            attributes: {},
            isDragging: false,
            listeners: {},
            setNodeRef: vi.fn(),
            transform: null,
            transition: undefined,
        }),
        verticalListSortingStrategy: {},
    };
});

vi.mock('@tiptap/extension-image', () => ({ default: {} }));
vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/react', async () => {
    const react = await vi.importActual<typeof import('react')>('react');

    return {
        EditorContent: () => react.createElement('div', { 'data-testid': 'mock-editor' }),
        useEditor: () => ({ getHTML: () => '<p>Updated description</p>' }),
    };
});

vi.mock('emoji-picker-react', () => ({
    default: () => null,
}));

class MemoryStorage implements Storage {
    private values = new Map<string, string>();

    get length(): number {
        return this.values.size;
    }

    clear(): void {
        this.values.clear();
    }

    getItem(key: string): string | null {
        return this.values.get(key) ?? null;
    }

    key(index: number): string | null {
        return Array.from(this.values.keys())[index] ?? null;
    }

    removeItem(key: string): void {
        this.values.delete(key);
    }

    setItem(key: string, value: string): void {
        this.values.set(key, value);
    }
}

Object.defineProperty(globalThis, 'route', {
    configurable: true,
    value: mockRoute,
});

Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: createMatchMedia(),
});

const memoryStorage = new MemoryStorage();

Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: memoryStorage,
});

Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: memoryStorage,
});

Object.defineProperty(window.URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:test-preview'),
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
});

window.HTMLElement.prototype.scrollIntoView = vi.fn();

globalThis.ResizeObserver = class ResizeObserver {
    disconnect(): void {}
    observe(): void {}
    unobserve(): void {}
};

globalThis.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '0px';
    readonly thresholds: readonly number[] = [];

    disconnect(): void {}
    observe(): void {}
    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
    unobserve(): void {}
};

afterEach(() => {
    cleanup();
    resetEchoMocks();
    resetInertiaMocks();
    window.localStorage.clear();
    document.cookie = 'appearance=;path=/;max-age=0';
    document.documentElement.className = '';
    vi.clearAllMocks();
});

function arrayMove<TValue>(items: TValue[], oldIndex: number, newIndex: number): TValue[] {
    const copy = [...items];
    const [item] = copy.splice(oldIndex, 1);
    copy.splice(newIndex, 0, item);

    return copy;
}

function createMatchMedia(): (query: string) => MediaQueryList {
    return (query: string) =>
        ({
            addEventListener: vi.fn(),
            addListener: vi.fn(),
            dispatchEvent: vi.fn(),
            matches: query.includes('max-width') ? window.innerWidth < 768 : false,
            media: query,
            onchange: null,
            removeEventListener: vi.fn(),
            removeListener: vi.fn(),
        }) as MediaQueryList;
}

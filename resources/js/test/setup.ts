import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import type React from 'react';
import { afterEach, vi } from 'vitest';
import { resetEchoMocks } from './echo';
import { mockRoute, resetInertiaMocks } from './inertia';

vi.mock('@inertiajs/react', async () => {
    const react = await vi.importActual<typeof import('react')>('react');
    const inertia = await import('./inertia');

    return inertia.createInertiaReactMock(react);
});

vi.mock('@laravel/echo-react', async () => {
    const echo = await import('./echo');

    return {
        echo: echo.echoMock,
        echoIsConfigured: echo.echoIsConfiguredMock,
        useEcho: echo.useEchoMock,
        useEchoNotification: echo.useEchoNotificationMock,
        useEchoPresence: echo.useEchoPresenceMock,
    };
});

vi.mock('sonner', () => ({
    Toaster: () => null,
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

vi.mock('@tiptap/extension-image', () => ({ default: { configure: () => ({}) } }));
vi.mock('@tiptap/starter-kit', () => ({ default: { configure: () => ({}) } }));
vi.mock('@tiptap/react', async () => {
    const react = await vi.importActual<typeof import('react')>('react');

    return {
        EditorContent: () => react.createElement('div', { 'data-testid': 'mock-editor' }),
        useEditor: () => ({
            chain: createTiptapChain,
            commands: { setContent: vi.fn() },
            getAttributes: () => ({}),
            getHTML: () => '<p>Updated description</p>',
            getJSON: () => ({
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Updated description' }] }],
            }),
            isActive: () => false,
            state: { selection: { from: 1, to: 1 }, tr: { setMeta: vi.fn() } },
            view: { dispatch: vi.fn() },
        }),
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
window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();

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

function createTiptapChain(): Record<string, unknown> {
    const chain = {
        focus: () => chain,
        redo: () => chain,
        run: () => true,
        setHorizontalRule: () => chain,
        setImage: () => chain,
        setLink: () => chain,
        toggleBlockquote: () => chain,
        toggleBold: () => chain,
        toggleBulletList: () => chain,
        toggleCode: () => chain,
        toggleCodeBlock: () => chain,
        toggleHeading: () => chain,
        toggleItalic: () => chain,
        toggleOrderedList: () => chain,
        toggleStrike: () => chain,
        undo: () => chain,
        unsetLink: () => chain,
    };

    return chain;
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

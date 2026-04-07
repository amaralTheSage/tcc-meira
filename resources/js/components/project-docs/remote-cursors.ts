import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface RemoteCursorSelection {
    color: string;
    from: number;
    name: string;
    to: number;
    userId: number;
}

export const remoteCursorKey = new PluginKey<RemoteCursorSelection[]>('remoteCursors');

export const RemoteCursors = Extension.create({
    name: 'remoteCursors',

    addProseMirrorPlugins() {
        return [
            new Plugin<RemoteCursorSelection[]>({
                key: remoteCursorKey,
                state: {
                    init: () => [],
                    apply: (transaction, value) => transaction.getMeta(remoteCursorKey) ?? value,
                },
                props: {
                    decorations: (state) => decorationsForSelections(state.doc, remoteCursorKey.getState(state) ?? []),
                },
            }),
        ];
    },
});

export function decorationsForSelections(document: ProseMirrorNode, selections: RemoteCursorSelection[]): DecorationSet {
    const decorations = selections.flatMap((selection) => selectionDecorations(document.content.size, selection));

    return DecorationSet.create(document, decorations);
}

function selectionDecorations(documentSize: number, selection: RemoteCursorSelection): Decoration[] {
    const from = boundedPosition(documentSize, selection.from);
    const to = boundedPosition(documentSize, selection.to);
    const decorations = [Decoration.widget(from, () => cursorElement(selection), { key: `cursor-${selection.userId}` })];

    if (from !== to) {
        decorations.push(Decoration.inline(Math.min(from, to), Math.max(from, to), selectionStyle(selection.color)));
    }

    return decorations;
}

function cursorElement(selection: RemoteCursorSelection): HTMLElement {
    const cursor = document.createElement('span');
    cursor.className = 'docs-remote-cursor';
    cursor.style.borderColor = selection.color;
    cursor.dataset.name = selection.name;

    return cursor;
}

function selectionStyle(color: string): Record<string, string> {
    return {
        class: 'docs-remote-selection',
        style: `background-color: ${color}33`,
    };
}

function boundedPosition(documentSize: number, position: number): number {
    return Math.min(Math.max(position, 1), Math.max(documentSize, 1));
}

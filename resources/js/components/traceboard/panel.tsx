import { Panel, useReactFlow } from '@xyflow/react';
import { NotepadText, SquarePlus } from 'lucide-react';

export default function TaskPanel({ createNode }) {
    const { screenToFlowPosition } = useReactFlow();

    return (
        <Panel position="center-left" className="space-y-2">
            <NotepadText className="rounded-md bg-white p-1.5" size={34} onClick={() => createNode(screenToFlowPosition, 'Note')} />
            <SquarePlus className="rounded-md bg-white p-1.5" size={34} onClick={() => createNode(screenToFlowPosition, 'Task')} />
        </Panel>
    );
}

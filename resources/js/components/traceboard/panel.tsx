import { screenToFlowPositionType } from '@/types';
import { Panel, useReactFlow } from '@xyflow/react';
import { NotepadText, SquarePlus } from 'lucide-react';

export default function TaskPanel({ createNode }: { createNode: (screenToFlowPosition: screenToFlowPositionType, type: 'Note' | 'Task') => void }) {
    const { screenToFlowPosition } = useReactFlow();

    return (
        <Panel position="center-left" className="space-y-2">
            <SquarePlus className="cursor-pointer rounded-md bg-white p-1.5" size={34} onClick={() => createNode(screenToFlowPosition, 'Task')} />
            <NotepadText className="cursor-pointer rounded-md bg-white p-1.5" size={34} onClick={() => createNode(screenToFlowPosition, 'Note')} />
        </Panel>
    );
}

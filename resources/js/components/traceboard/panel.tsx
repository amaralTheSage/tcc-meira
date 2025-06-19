import { Panel, useReactFlow } from '@xyflow/react';
import { SquarePlus } from 'lucide-react';

export default function TaskPanel({ createTask }) {
    const { screenToFlowPosition } = useReactFlow();

    return (
        <Panel position="center-left" className="rounded-md bg-white p-2">
            <SquarePlus className="cursor-pointer" onClick={() => createTask(screenToFlowPosition)} />
        </Panel>
    );
}

import { screenToFlowPositionType } from '@/types';
import { Panel, useReactFlow } from '@xyflow/react';
import { NotepadText, SquarePlus } from 'lucide-react';
import TooltipContainer from '../tooltip-container';

export default function TaskPanel({ createNode }: { createNode: (screenToFlowPosition: screenToFlowPositionType, type: 'Note' | 'Task') => void }) {
    const { screenToFlowPosition } = useReactFlow();

    return (
        <Panel position="center-left" className="grid space-y-2">
            <TooltipContainer text="Add a task to the Traceboard || Tasks are synchronized with the Kanban and Sprint Planner">
                <SquarePlus className="cursor-pointer rounded-md bg-white p-1.5" size={34} onClick={() => createNode(screenToFlowPosition, 'Task')} />
            </TooltipContainer>

            <TooltipContainer
                text="Add a note to the board ||
            Notes are not shown anywhere else"
            >
                <NotepadText
                    className="cursor-pointer rounded-md bg-white p-1.5"
                    size={34}
                    onClick={() => createNode(screenToFlowPosition, 'Note')}
                />
            </TooltipContainer>
        </Panel>
    );
}

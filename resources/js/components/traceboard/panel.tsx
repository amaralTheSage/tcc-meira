import { screenToFlowPositionType } from '@/types';
import { Panel, useReactFlow } from '@xyflow/react';
import { NotepadText, SquarePlus } from 'lucide-react';
import InfoSheet from '../info-sheet';
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

            <InfoSheet>
                <p>
                    <span className="text-base font-bold">Tasks</span> you add here are going to be immediately available on the Kanban board, on the{' '}
                    <span className="font-bold">Backlog</span> column by default. <br />
                    <br />
                    They're also going to be available on the <span className="font-bold">Sprint Planner</span> so they can be picked as part of a
                    Sprint.
                </p>

                {/* simulando imagem */}
                <div className="aspect-video w-full rounded-md bg-gray-400"></div>

                <p>
                    Any update to a task in any one of those pages is going to be immediately <span className="font-bold">synchronized</span>{' '}
                    throughout all other pages.
                </p>

                <p>
                    <span className="text-base font-bold">Notes</span>, on the other hand, are just that: notes in the Traceboard, meant for
                    reminders, warnings, annotations, explanations. They can be pretty useful.
                </p>

                {/* simulando imagem */}
                <div className="aspect-video w-full rounded-md bg-gray-400"></div>

                <p>
                    They have <span className="font-bold">no effect</span> on the other pages or systems.
                </p>
            </InfoSheet>
        </Panel>
    );
}

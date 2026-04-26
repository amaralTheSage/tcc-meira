import {
    GanttCreateMarkerTrigger,
    GanttFeature,
    GanttFeatureList,
    GanttFeatureRow,
    GanttHeader,
    GanttProvider,
    GanttSidebar,
    GanttSidebarItem,
    GanttStatus,
    GanttTimeline,
    GanttToday,
} from '/components/ui/shadcn-io/gantt';
import { ColumnTask, Sprint } from '@/types/models';

interface SprintBoardProps {
    sprints: (Sprint & { tasks: ColumnTask[] })[];
}

function SprintBoard({ sprints }: SprintBoardProps) {

    return (
        <GanttProvider
            className="border h-[85%]"
            range="monthly" // This will likely become dynamic
            zoom={200} // This will likely become dynamic
        >
            <GanttSidebar>
                {sprints.map((sprint) => {
                    const sprintFeature = {
                        id: `sprint-${sprint.id}`,
                        name: sprint.title,
                        startAt: new Date(sprint.start_at),
                        endAt: new Date(sprint.end_at),
                        status: { id: sprint.id, name: sprint.title },
                    };

                    return <GanttSidebarItem key={sprint.id} feature={sprintFeature} />;
                })}
            </GanttSidebar>

            <GanttTimeline>
                <GanttHeader />
                <GanttFeatureList>
                    {sprints.map((sprint) => {
                        const sprintFeature: GanttFeature = {
                            id: `sprint-${sprint.id}`,
                            name: sprint.title,
                            startAt: new Date(sprint.start_at),
                            endAt: new Date(sprint.end_at),
                            status: { id: sprint.id, name: sprint.title },
                        };

                        const allFeatures = [sprintFeature];

                        return <GanttFeatureRow key={sprint.id} features={allFeatures} />;
                    })}
                </GanttFeatureList>

                <GanttToday />
            </GanttTimeline>
        </GanttProvider>
    );
}

export default SprintBoard;

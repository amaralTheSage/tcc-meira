import {
  GanttCreateMarkerTrigger,
  GanttFeatureItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttHeader,
  GanttMarker,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
} from '/components/ui/shadcn-io/gantt';
import { EyeIcon, LinkIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const statuses = [
  { id: 'status-1', name: 'Planned', color: '#6B7280' },
  { id: 'status-2', name: 'In Progress', color: '#F59E0B' },
  { id: 'status-3', name: 'Done', color: '#10B981' },
];

const users = [
  { id: 'user-1', name: 'John Doe', image: '/avatars/a1.png' },
  { id: 'user-2', name: 'Maria Silva', image: '/avatars/a2.png' },
  { id: 'user-3', name: 'Liam Turner', image: '/avatars/a3.png' },
  { id: 'user-4', name: 'Sophie Mendez', image: '/avatars/a4.png' },
];

const exampleGroups = [
  { id: 'group-1', name: 'Platform' },
  { id: 'group-2', name: 'Billing' },
  { id: 'group-3', name: 'Collaboration' },
  { id: 'group-4', name: 'Analytics' },
  { id: 'group-5', name: 'Mobile' },
  { id: 'group-6', name: 'Identity' },
];

const exampleProducts = [
  { id: 'prod-1', name: 'Core App' },
  { id: 'prod-2', name: 'Dashboard' },
  { id: 'prod-3', name: 'API' },
  { id: 'prod-4', name: 'Admin Console' },
];

const exampleInitiatives = [
  { id: 'init-1', name: 'Improve UX' },
  { id: 'init-2', name: 'Reduce Costs' },
];

const exampleReleases = [
  { id: 'rel-1', name: 'Q1 Release' },
  { id: 'rel-2', name: 'Q2 Release' },
  { id: 'rel-3', name: 'Q3 Release' },
];

// date helpers
const now = new Date();
const addDays = (days: number) => new Date(now.getTime() + days * 86400000);

// features
const exampleFeatures = [
  {
    id: 'feat-1',
    name: 'User onboarding revamp',
    startAt: addDays(-20),
    endAt: addDays(10),
    status: statuses[1],
    owner: users[0],
    group: exampleGroups[0],
    product: exampleProducts[0],
    initiative: exampleInitiatives[0],
    release: exampleReleases[0],
  },
  {
    id: 'feat-2',
    name: 'Billing sync rewrite',
    startAt: addDays(-5),
    endAt: addDays(20),
    status: statuses[0],
    owner: users[1],
    group: exampleGroups[1],
    product: exampleProducts[1],
    initiative: exampleInitiatives[1],
    release: exampleReleases[1],
  },
  {
    id: 'feat-3',
    name: 'Collaboration live cursors',
    startAt: addDays(-15),
    endAt: addDays(5),
    status: statuses[1],
    owner: users[2],
    group: exampleGroups[2],
    product: exampleProducts[2],
    initiative: exampleInitiatives[0],
    release: exampleReleases[0],
  },
  {
    id: 'feat-4',
    name: 'Analytics export v2',
    startAt: addDays(-10),
    endAt: addDays(15),
    status: statuses[2],
    owner: users[3],
    group: exampleGroups[3],
    product: exampleProducts[3],
    initiative: exampleInitiatives[1],
    release: exampleReleases[2],
  },
  {
    id: 'feat-5',
    name: 'Mobile refactor alpha',
    startAt: addDays(-30),
    endAt: addDays(-5),
    status: statuses[2],
    owner: users[0],
    group: exampleGroups[4],
    product: exampleProducts[0],
    initiative: exampleInitiatives[0],
    release: exampleReleases[1],
  },
  {
    id: 'feat-6',
    name: 'Identity provider integration',
    startAt: addDays(-25),
    endAt: addDays(30),
    status: statuses[1],
    owner: users[1],
    group: exampleGroups[5],
    product: exampleProducts[1],
    initiative: exampleInitiatives[1],
    release: exampleReleases[2],
  },
];

const exampleMarkers = [
  {
    id: 'mark-1',
    date: addDays(-30),
    label: 'Kickoff',
    className: 'bg-blue-100 text-blue-900',
  },
  {
    id: 'mark-2',
    date: addDays(-10),
    label: 'Design Freeze',
    className: 'bg-green-100 text-green-900',
  },
  {
    id: 'mark-3',
    date: addDays(0),
    label: 'Today',
    className: 'bg-purple-100 text-purple-900',
  },
  {
    id: 'mark-4',
    date: addDays(10),
    label: 'Beta Start',
    className: 'bg-red-100 text-red-900',
  },
  {
    id: 'mark-5',
    date: addDays(20),
    label: 'Release Prep',
    className: 'bg-orange-100 text-orange-900',
  },
  {
    id: 'mark-6',
    date: addDays(30),
    label: 'Public Launch',
    className: 'bg-teal-100 text-teal-900',
  },
];
function groupFeaturesByGroupName(features: any[]) {
  const result: Record<string, any[]> = {};

  for (const feature of features) {
    const key = feature.group?.name ?? 'Unknown';
    if (!result[key]) result[key] = [];
    result[key].push(feature);
  }

  // sort keys alphabetically
  return Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
  );
}

// -------------------------------------
// COMPONENT
// -------------------------------------

function SprintBoard() {
  const [features, setFeatures] = useState(exampleFeatures);

  const groupedFeatures = groupFeaturesByGroupName(features);

  const handleViewFeature = (id: string) =>
    console.log(`Feature selected: ${id}`);

  const handleCopyLink = (id: string) => console.log(`Copy link: ${id}`);

  const handleRemoveFeature = (id: string) =>
    setFeatures((prev) => prev.filter((f) => f.id !== id));

  const handleRemoveMarker = (id: string) =>
    console.log(`Remove marker: ${id}`);

  const handleCreateMarker = (date: Date) =>
    console.log(`Create marker: ${date.toISOString()}`);

  const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
    if (!endAt) return;

    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === id ? { ...feature, startAt, endAt } : feature
      )
    );

    console.log(`Move feature: ${id} from ${startAt} to ${endAt}`);
  };

  const handleAddFeature = (date: Date) =>
    console.log(`Add feature: ${date.toISOString()}`);

  return (
    <GanttProvider
      className="border h-[85%]"
      onAddItem={handleAddFeature}
      range="monthly"
      zoom={100}
    >
      <GanttSidebar>
        {Object.entries(groupedFeatures).map(([group, groupFeatures]) => (
          <GanttSidebarGroup key={group} name={group}>
            {groupFeatures.map((feature) => (
              <GanttSidebarItem
                feature={feature}
                key={feature.id}
                onSelectItem={handleViewFeature}
              />
            ))}
          </GanttSidebarGroup>
        ))}
      </GanttSidebar>

      <GanttTimeline>
        <GanttHeader />
        <GanttFeatureList>
          {Object.entries(groupedFeatures).map(([group, groupFeatures]) => (
            <GanttFeatureListGroup key={group}>
              {groupFeatures.map((feature) => (
                <div className="flex" key={feature.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => handleViewFeature(feature.id)}
                        type="button"
                      >
                        <GanttFeatureItem
                          onMove={handleMoveFeature}
                          {...feature}
                        >
                          <p className="flex-1 truncate text-xs">
                            {feature.name}
                          </p>

                          {feature.owner && (
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={feature.owner.image} />
                              <AvatarFallback>
                                {feature.owner.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </GanttFeatureItem>
                      </button>
                    </ContextMenuTrigger>

                    <ContextMenuContent>
                      <ContextMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleViewFeature(feature.id)}
                      >
                        <EyeIcon size={16} />
                        View feature
                      </ContextMenuItem>

                      <ContextMenuItem
                        className="flex items-center gap-2"
                        onClick={() => handleCopyLink(feature.id)}
                      >
                        <LinkIcon size={16} />
                        Copy link
                      </ContextMenuItem>

                      <ContextMenuItem
                        className="flex items-center gap-2 text-destructive"
                        onClick={() => handleRemoveFeature(feature.id)}
                      >
                        <TrashIcon size={16} />
                        Remove from roadmap
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </div>
              ))}
            </GanttFeatureListGroup>
          ))}
        </GanttFeatureList>

        {exampleMarkers.map((marker) => (
          <GanttMarker key={marker.id} {...marker} onRemove={handleRemoveMarker} />
        ))}

        <GanttToday />
        <GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} />
      </GanttTimeline>
    </GanttProvider>
  );
};

export default SprintBoard;

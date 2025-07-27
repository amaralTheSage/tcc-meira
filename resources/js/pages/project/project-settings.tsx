'use client';

import CanvasPreview from '@/components/project-settings/canvas-preview';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import { Edge, Handle, Node, Position } from '@xyflow/react';
import { Settings } from 'lucide-react';
import { useState } from 'react';

const edgeTypes = [
    { value: 'default', label: 'Default' },
    { value: 'straight', label: 'Straight' },
    { value: 'step', label: 'Step' },
    { value: 'smoothstep', label: 'Smooth Step' },
    { value: 'bezier', label: 'Bezier' },
];

const TaskNode = ({ data }: { data: { title: string } }) => {
    return (
        <div className="w-[300px] rounded-md border-2 border-stone-400 bg-white p-2 text-[#3e2828] shadow-md">
            {data.title === 'Lorem ipsum' ? <Handle type="source" position={Position.Right} /> : <Handle type="target" position={Position.Left} />}

            <div className="flex items-center">
                <div className="ml-2">
                    <div className="text-lg font-bold">{data.title}</div>
                </div>
            </div>
        </div>
    );
};

const nodeTypes = { task: TaskNode };

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'task',
        position: { x: 0, y: 80 },
        data: { title: 'Lorem ipsum' },
    },
    {
        id: '2',
        type: 'task',
        position: { x: 360, y: 0 },
        data: { title: 'dolor sit' },
    },
    {
        id: '3',
        type: 'task',
        position: { x: 370, y: 110 },
        data: { title: 'amet consectetur ' },
    },
    {
        id: '4',
        type: 'task',
        position: { x: 320, y: 200 },
        data: { title: 'adipisicing elit' },
    },
];

export default function ProjectSettings({ project }: { project: Project }) {
    const [selectedEdgeType, setSelectedEdgeType] = useState('bezier');
    const [isAnimated, setIsAnimated] = useState(true);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Project Settings',
            href: route('project-settings', { project: project.id }),
        },
    ];

    const edges: Edge[] = [
        {
            id: '1-2',
            source: '1',
            target: '2',
            type: selectedEdgeType,
            animated: isAnimated,
        },
        {
            id: '1-3',
            source: '1',
            target: '3',
            type: selectedEdgeType,
            animated: isAnimated,
        },
        {
            id: '1-4',
            source: '1',
            target: '4',
            type: selectedEdgeType,
            animated: isAnimated,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Project Settings" />
            <div className="mx-auto w-full p-6 md:max-w-5xl">
                <div className="my-3">
                    <h1 className="flex items-center gap-2 text-2xl">
                        <Settings className="h-6 w-6" />
                        Project Settings
                    </h1>
                    <p className="hidden text-muted-foreground sm:block">Customize your project according to your needs</p>
                </div>

                <section className="mt-8">
                    <div className="bg-card">
                        <h2 className="mb-4 text-lg font-semibold">Canvas Settings</h2>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                            {/* Settings Controls */}
                            <div className="col-span-2 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="connection-type">Connection Type</Label>
                                    <Select value={selectedEdgeType} onValueChange={setSelectedEdgeType}>
                                        <SelectTrigger id="connection-type" className="w-full">
                                            <SelectValue placeholder="Select connection type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {edgeTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-start gap-6">
                                    <label for="animated-checkbox">Animated</label>
                                    <Checkbox id="animated-checkbox" onCheckedChange={(checked) => setIsAnimated(checked)} checked={isAnimated} />
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="col-span-3">
                                <div className="relative h-[200px] w-full rounded-md bg-gray-100">
                                    <CanvasPreview nodes={initialNodes} edges={edges} nodeTypes={nodeTypes} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

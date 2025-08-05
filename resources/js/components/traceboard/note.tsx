import { NodeProps } from '@xyflow/react';

interface NoteNodeProps {
    id: string;
    data: { text: string };
    height?: number;
    width?: number;
    position: { x: number; y: number };
}

export default function Note({ data: { text } }: NodeProps<NoteNodeProps>) {
    return <div className="bg-yellow-400">{text}</div>;
}

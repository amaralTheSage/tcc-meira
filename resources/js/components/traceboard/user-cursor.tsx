import { NodeProps } from '@xyflow/react';

interface UserCursorNodeProps {
    id: string;
    data: {
        color?: string;
    };
    height?: number;
    width?: number;
    position: { x: number; y: number };
}

export default function UserCursor({ id, data: { color } }: NodeProps<UserCursorNodeProps>) {
    return <div className={`h-8 w-8 rounded-full bg-red-600 opacity-75`}></div>;
}

import type { Node, NodeProps } from '@xyflow/react';
import { remoteTraceboardCursorColor } from './cursor-smoothing';

type UserCursorNodeData = Record<string, unknown> & {
    color?: string;
};

type UserCursorNode = Node<UserCursorNodeData, 'UserCursor'>;

export default function UserCursor({ data: { color } }: NodeProps<UserCursorNode>) {
    const cursorColor = color ?? remoteTraceboardCursorColor(0);

    return (
        <svg
            aria-hidden="true"
            version="1.1"
            id="Capa_1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="24px"
            style={{
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45))',
                pointerEvents: 'none',
                transform: 'scaleX(-1)',
                transformOrigin: 'center',
            }}
            fill={cursorColor}
            height="24px"
            viewBox="0 0 188.324 188.324"
            xmlSpace="preserve"
        >
            <path
                stroke="#ffffff"
                strokeLinejoin="round"
                strokeWidth="10"
                style={{ paintOrder: 'stroke fill' }}
                d="M104.552,188.324l-1.126-0.023c-8.686-0.485-16.159-6.421-18.601-14.758l-14.164-48.403
				l-52.088-10.344c-8.548-1.675-15.124-8.622-16.348-17.279c-1.224-8.638,3.162-17.134,10.91-21.137L156.295,2.228
				c7.49-3.883,17.143-2.596,23.369,3.119c6.336,5.827,8.371,15.078,5.083,23.018l-61.193,147.287
				C120.334,183.355,112.872,188.324,104.552,188.324z"
            />
        </svg>
    );
}

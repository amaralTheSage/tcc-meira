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
    return (
        <svg
            version="1.1"
            id="Capa_1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            width="24px"
            style={{ transform: 'scaleX(-1)', transformOrigin: 'center' }}
            fill={color || '#FFFFFF'}
            height="24px"
            viewBox="0 0 188.324 188.324"
            xmlSpace="preserve"
        >
            <g>
                <g>
                    <g>
                        <path
                            d="M104.552,188.324l-1.126-0.023c-8.686-0.485-16.159-6.421-18.601-14.758l-14.164-48.403
				l-52.088-10.344c-8.548-1.675-15.124-8.622-16.348-17.279c-1.224-8.638,3.162-17.134,10.91-21.137L156.295,2.228
				c7.49-3.883,17.143-2.596,23.369,3.119c6.336,5.827,8.371,15.078,5.083,23.018l-61.193,147.287
				C120.334,183.355,112.872,188.324,104.552,188.324z M165.741,11.643c-1.401,0-2.803,0.346-4.055,0.989L18.516,86.789
				c-3.339,1.722-5.223,5.375-4.697,9.092c0.529,3.729,3.351,6.713,7.022,7.445l59.061,11.71l16.154,55.225
				c1.055,3.591,4.269,6.152,8.011,6.358h0.48c3.585,0,6.793-2.139,8.183-5.467l61.188-147.261c1.413-3.414,0.538-7.399-2.184-9.907
				C170.098,12.475,167.965,11.643,165.741,11.643z"
                        />
                    </g>
                </g>
            </g>
        </svg>
    );
}

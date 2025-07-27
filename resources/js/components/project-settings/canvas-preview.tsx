import { Background, Edge, Node, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function CanvasPreview({ nodes, edges, nodeTypes }: { nodes: Node[]; edges: Edge[]; nodeTypes: any }) {
    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            fitView
            draggable={false}
            nodesConnectable={false}
            nodesDraggable={false}
            edgesFocusable={false}
            nodesFocusable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={true}
        >
            <Background />
        </ReactFlow>
    );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  BackgroundVariant,
  Node,
  Edge
} from '@xyflow/react';
import { 
  CAMPUS_TOPOLOGY_NODES, 
  CAMPUS_TOPOLOGY_EDGES 
} from '../../data/mockData';
import { NetworkCustomNode } from '../topology/NetworkCustomNode';
import { NodeDetailDrawer } from '../topology/NodeDetailDrawer';
import { NetworkNodeData } from '../../types';
import { useScenario } from '../../context/ScenarioContext';
import { fetchRemoteTopology } from '../../services/api';
import { 
  AlertOctagon,
  RefreshCw
} from 'lucide-react';

export const NetworkMapScreen: React.FC = () => {
  const { setActiveScreen, activeScenario } = useScenario();

  const [nodes, setNodes, onNodesChange] = useNodesState(CAMPUS_TOPOLOGY_NODES as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(CAMPUS_TOPOLOGY_EDGES as unknown as Edge[]);
  const [selectedNode, setSelectedNode] = useState<NetworkNodeData | null>(
    (CAMPUS_TOPOLOGY_NODES.find(n => n.id === 'ap-eng-04')?.data as unknown as NetworkNodeData) || null
  );

  // Fetch dynamic topology from backend when activeScenario changes
  useEffect(() => {
    let isMounted = true;
    fetchRemoteTopology(activeScenario.id).then(res => {
      if (!isMounted || !res) return;
      if (res.nodes && res.nodes.length > 0) {
        setNodes(res.nodes as unknown as Node[]);
        const defaultSelected = res.nodes.find((n: any) => n.data?.status === 'fault') || res.nodes[0];
        if (defaultSelected) {
          setSelectedNode(defaultSelected.data as unknown as NetworkNodeData);
        }
      }
      if (res.edges && res.edges.length > 0) {
        setEdges(res.edges as unknown as Edge[]);
      }
    });
    return () => { isMounted = false; };
  }, [activeScenario.id, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({
    networkNode: NetworkCustomNode,
  }), []);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as unknown as NetworkNodeData);
  }, []);

  const handleFilterAffectedOnly = () => {
    const affectedNode = nodes.find(n => (n.data as any)?.status === 'fault') ||
                         CAMPUS_TOPOLOGY_NODES.find(n => n.id === 'dev-eng-failing');
    if (affectedNode) setSelectedNode(affectedNode.data as unknown as NetworkNodeData);
  };

  const handleResetView = () => {
    setNodes(CAMPUS_TOPOLOGY_NODES as unknown as Node[]);
    setSelectedNode((CAMPUS_TOPOLOGY_NODES.find(n => n.id === 'ap-eng-04')?.data as unknown as NetworkNodeData) || null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-soft-sm flex flex-col">
      {/* Top Topology Toolbar / Legend */}
      <div className="h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-xs text-slate-800">Campus L2/L3 Topology:</span>
            <span className="text-xs font-mono text-slate-500">{activeScenario.name}</span>
          </div>

          {/* Color Legend */}
          <div className="hidden md:flex items-center space-x-4 text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Healthy ({activeScenario.aggregateHealthPct}%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">Warning (Scope/Retries)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-slate-600">Faulted Node / Blast Radius</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {activeScenario.affectedDevices > 0 && (
            <button
              onClick={handleFilterAffectedOnly}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Focus {activeScenario.affectedDevices} Affected Devices</span>
            </button>
          )}
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs transition-colors"
            title="Reset topology view"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes as any}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.8}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#CBD5E1" />
          <Controls className="!bg-white !border-slate-200 !shadow-soft-sm !rounded-lg" />
        </ReactFlow>

        {/* Selected Node Details Drawer */}
        <NodeDetailDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onNavigateEvidence={() => setActiveScreen('evidence')}
        />
      </div>
    </div>
  );
};

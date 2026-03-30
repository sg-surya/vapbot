import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ArrowLeft, Save, Play, MessageSquare, Type, GitBranch, Globe, Clock, Image as ImageIcon, Plus, MoreHorizontal, Check, Trash2, Bot, X, Sun, Moon } from 'lucide-react';
import ChatPreview from '../components/ChatPreview';

// Custom Node Design based on the provided image
const CustomNode = ({ data, isConnectable }: any) => {
  let Icon = MessageSquare;
  let headerColor = 'text-blue-400';
  let previewText = '';

  switch (data.type) {
    case 'message':
      Icon = MessageSquare;
      headerColor = 'text-blue-400';
      previewText = data.text || 'Empty message';
      break;
    case 'input':
      Icon = Type;
      headerColor = 'text-orange-400';
      previewText = data.variable ? `Save to: ${data.variable}` : 'No variable';
      break;
    case 'condition':
      Icon = GitBranch;
      headerColor = 'text-purple-400';
      previewText = data.variable ? `If ${data.variable} ${data.operator} ${data.value}` : 'Setup condition';
      break;
    case 'api':
      Icon = Globe;
      headerColor = 'text-green-400';
      previewText = data.method + ' ' + (data.url || 'No URL');
      break;
    case 'delay':
      Icon = Clock;
      headerColor = 'text-yellow-400';
      previewText = `Wait ${data.time || 0}s`;
      break;
    case 'image':
      Icon = ImageIcon;
      headerColor = 'text-pink-400';
      previewText = data.url ? 'Image URL set' : 'No image';
      break;
    case 'ai':
      Icon = Bot;
      headerColor = 'text-indigo-400';
      previewText = data.prompt ? `Prompt: ${data.prompt}` : 'No prompt';
      break;
  }

  return (
    <div className="bg-card/95 backdrop-blur-xl rounded-md shadow-2xl border border-border min-w-[240px] overflow-visible flex flex-col transition-all hover:border-foreground/30">
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-6 bg-muted-foreground border-none rounded-r-sm rounded-l-none -ml-[1px]" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-accent/10 rounded-t-md">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center ${headerColor}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{data.label}</span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete(data.id);
          }}
          className="text-muted-foreground hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 bg-transparent">
        <p className="text-[11px] text-muted-foreground font-mono truncate">{previewText}</p>
      </div>

      {data.type === 'condition' ? (
        <div className="flex flex-col border-t border-border/50">
           <div className="relative flex items-center justify-between bg-accent/5 text-muted-foreground text-[10px] uppercase font-mono px-3 py-1.5 border-b border-border/50 hover:bg-accent/10 transition-colors">
             <span>True</span>
             <Handle type="source" position={Position.Right} id="true" isConnectable={isConnectable} className="w-2 h-6 bg-green-500/80 border-none rounded-l-sm rounded-r-none -mr-[1px] !relative !right-[-13px] !transform-none" />
           </div>
           <div className="relative flex items-center justify-between bg-accent/5 text-muted-foreground text-[10px] uppercase font-mono px-3 py-1.5 hover:bg-accent/10 transition-colors rounded-b-md">
             <span>False</span>
             <Handle type="source" position={Position.Right} id="false" isConnectable={isConnectable} className="w-2 h-6 bg-red-500/80 border-none rounded-l-sm rounded-r-none -mr-[1px] !relative !right-[-13px] !transform-none" />
           </div>
        </div>
      ) : (
        <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-6 bg-muted-foreground border-none rounded-l-sm rounded-r-none -mr-[1px]" />
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

let id = 0;
const getId = () => `dndnode_${id++}`;

export default function Builder() {
  const { botId } = useParams();
  const { token, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsBotPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const res = await fetch(`/api/flows/${botId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Fetch bot details to get published state
          const botRes = await fetch(`/api/bots`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (botRes.ok) {
            const bots = await botRes.json();
            const currentBot = bots.find((b: any) => b.id === parseInt(botId!));
            if (currentBot) setIsPublished(!!currentBot.published);
          }

          if (data.nodes) {
            const nodesWithDelete = data.nodes.map((n: any) => ({
              ...n,
              data: { ...n.data, onDelete: deleteNode }
            }));
            setNodes(nodesWithDelete);
          }
          if (data.edges) setEdges(data.edges);
          
          if (data.nodes && data.nodes.length > 0) {
            const maxId = Math.max(...data.nodes.map((n: any) => {
              const match = n.id.match(/dndnode_(\d+)/);
              return match ? parseInt(match[1]) : 0;
            }));
            id = maxId + 1;
          }
        }
      } catch (error) {
        console.error('Failed to fetch flow', error);
      }
    };
    fetchFlow();
  }, [botId, token, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds)),
    [setEdges],
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
    setShowAddMenu(false);
  };

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const updateNodeData = (key: string, value: string) => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              [key]: value,
              label: key === 'text' && node.data.type === 'message' ? value : 
                     key === 'variable' && node.data.type === 'input' ? `Input: ${value}` : node.data.label
            },
          };
          setSelectedNode(updatedNode);
          return updatedNode;
        }
        return node;
      })
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/flows/${botId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nodes, edges })
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch (error) {
      console.error('Save error', error);
      alert('Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsBotPublishing(true);
    try {
      const res = await fetch(`/api/bots/${botId}/publish`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ published: !isPublished })
      });
      if (res.ok) {
        const data = await res.json();
        setIsPublished(data.published);
        if (data.published) setShowPublishModal(true);
      }
    } catch (error) {
      console.error('Publish error', error);
    } finally {
      setIsBotPublishing(false);
    }
  };

  const addNode = (type: string) => {
    if (!reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    
    let label = 'Node';
    let defaultData = {};

    switch (type) {
      case 'message': label = 'Message'; defaultData = { text: 'Hello!' }; break;
      case 'input': label = 'User Input'; defaultData = { variable: 'name' }; break;
      case 'condition': label = 'Condition'; defaultData = { variable: '', operator: 'equals', value: '' }; break;
      case 'api': label = 'API Request'; defaultData = { url: 'https://api.example.com', method: 'GET' }; break;
      case 'delay': label = 'Delay'; defaultData = { time: '3' }; break;
      case 'image': label = 'Image'; defaultData = { url: '' }; break;
      case 'ai': label = 'AI Response'; defaultData = { prompt: 'Summarize the conversation so far.' }; break;
    }

    const newNode: Node = {
      id: getId(),
      type: 'custom',
      position,
      data: { 
        id: getId(), // We need the ID in data for deletion
        label,
        type,
        onDelete: deleteNode,
        ...defaultData
      },
    };

    setNodes((nds) => nds.concat(newNode));
    setShowAddMenu(false);
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground font-sans relative overflow-hidden flex p-[3px]">
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.2]"></div>
        <div className="absolute inset-0 opacity-[0.04] mix-blend-screen" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      {/* Main Container */}
      <main className="flex-1 relative z-10 bg-card/40 backdrop-blur-2xl border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-accent/5">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-1.5 hover:bg-accent/10 rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-[#ff8a00] to-[#e52e71] rounded-md flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_rgba(255,138,0,0.3)]">
                V
              </div>
              <h1 className="font-mono text-foreground text-sm tracking-wide">Flow Builder</h1>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
            <button className="px-3 py-1 bg-accent/10 text-foreground rounded-md border border-border">Build</button>
            <span className="text-muted-foreground/30 px-1">&rsaquo;</span>
            <button className="px-3 py-1 hover:bg-accent/5 rounded-md transition-colors">Design</button>
            <span className="text-muted-foreground/30 px-1">&rsaquo;</span>
            <button className="px-3 py-1 hover:bg-accent/5 rounded-md transition-colors">Settings</button>
            <span className="text-muted-foreground/30 px-1">&rsaquo;</span>
            <button className="px-3 py-1 hover:bg-accent/5 rounded-md transition-colors">Share</button>
            <span className="text-muted-foreground/30 px-1">&rsaquo;</span>
            <button className="px-3 py-1 hover:bg-accent/5 rounded-md transition-colors">Analyze</button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={handleSave} disabled={isSaving} className="px-3 py-1.5 flex items-center gap-2 rounded-md bg-accent/5 border border-border text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors text-xs font-mono uppercase tracking-wider" title="Save">
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
            <button onClick={() => setIsChatOpen(true)} className="px-3 py-1.5 border border-border text-muted-foreground font-mono uppercase tracking-wider rounded-md hover:bg-accent/5 hover:text-foreground transition-colors text-xs flex items-center gap-2">
              <Play className="w-3.5 h-3.5" />
              Test
            </button>
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className={`px-4 py-1.5 font-mono uppercase tracking-wider rounded-md transition-all text-xs ${
                isPublished 
                  ? 'bg-green-500/20 text-green-500 border border-green-500/20 hover:bg-green-500/30' 
                  : 'bg-gradient-to-r from-[#ff8a00] to-[#e52e71] text-white hover:shadow-[0_0_15px_rgba(255,138,0,0.4)]'
              }`}
            >
              {isPublishing ? '...' : isPublished ? 'Published' : 'Publish'}
            </button>
          </div>
        </header>

        {/* Main Builder Area */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative" ref={reactFlowWrapper}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                fitView
                className="bg-transparent"
                colorMode="dark"
              >
                <Background color="#475569" gap={20} size={1} opacity={0.3} />
                
                {/* Floating Add Button */}
                <Panel position="top-left" className="m-4">
                  <div className="relative">
                    <button 
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="w-10 h-10 bg-card hover:bg-accent/10 border border-border backdrop-blur-md text-foreground rounded-md flex items-center justify-center shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    
                    {showAddMenu && (
                      <div className="absolute top-12 left-0 bg-card/95 backdrop-blur-xl rounded-md shadow-2xl border border-border w-48 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                        <button onClick={() => addNode('message')} className="w-full px-3 py-2 text-left text-[11px] font-mono uppercase tracking-wider hover:bg-accent/5 flex items-center gap-3 text-muted-foreground transition-colors"><MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Message</button>
                        <button onClick={() => addNode('input')} className="w-full px-3 py-2 text-left text-[11px] font-mono uppercase tracking-wider hover:bg-accent/5 flex items-center gap-3 text-muted-foreground transition-colors"><Type className="w-3.5 h-3.5 text-orange-400" /> User Input</button>
                        <button onClick={() => addNode('condition')} className="w-full px-3 py-2 text-left text-[11px] font-mono uppercase tracking-wider hover:bg-accent/5 flex items-center gap-3 text-muted-foreground transition-colors"><GitBranch className="w-3.5 h-3.5 text-purple-400" /> Condition</button>
                        <button onClick={() => addNode('api')} className="w-full px-3 py-2 text-left text-[11px] font-mono uppercase tracking-wider hover:bg-accent/5 flex items-center gap-3 text-muted-foreground transition-colors"><Globe className="w-3.5 h-3.5 text-green-400" /> API Request</button>
                        <button onClick={() => addNode('delay')} className="w-full px-3 py-2 text-left text-[11px] font-mono uppercase tracking-wider hover:bg-accent/5 flex items-center gap-3 text-muted-foreground transition-colors"><Clock className="w-3.5 h-3.5 text-yellow-400" /> Delay</button>
                        <button onClick={() => addNode('image')} className="w-full px-3 py-2 text-left text-[11px] font-mono uppercase tracking-wider hover:bg-accent/5 flex items-center gap-3 text-muted-foreground transition-colors"><ImageIcon className="w-3.5 h-3.5 text-pink-400" /> Image</button>
                        <button onClick={() => addNode('ai')} className="w-full px-3 py-2 text-left text-[11px] font-mono uppercase tracking-wider hover:bg-accent/5 flex items-center gap-3 text-muted-foreground transition-colors"><Bot className="w-3.5 h-3.5 text-indigo-400" /> AI Response</button>
                      </div>
                    )}
                  </div>
                </Panel>

                <Controls className="bg-card/80 border-border fill-muted-foreground shadow-lg rounded-md overflow-hidden backdrop-blur-md" showInteractive={false} />
              </ReactFlow>
            </ReactFlowProvider>
          </div>

          {/* Right Settings Panel */}
          {selectedNode && (
            <div className="w-72 bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl z-20 flex flex-col animate-in slide-in-from-right-8">
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-accent/10">
                <div>
                  <h2 className="text-[11px] font-mono text-foreground uppercase tracking-widest">Node Settings</h2>
                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest mt-1">{selectedNode.data.type} Configuration</p>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-1.5 hover:bg-accent/10 rounded-md text-muted-foreground transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                {selectedNode.data.type === 'message' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Message Text</label>
                      <textarea 
                        value={selectedNode.data.text as string} 
                        onChange={(e) => updateNodeData('text', e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-orange-500/50 transition-all text-xs min-h-[120px] resize-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'input' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Variable Name</label>
                      <input 
                        value={selectedNode.data.variable as string || ''} 
                        onChange={(e) => updateNodeData('variable', e.target.value)}
                        placeholder="e.g., user_name"
                        className="w-full bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                      <p className="text-[9px] text-muted-foreground font-mono uppercase mt-1">Stored variable name.</p>
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'condition' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Variable to Check</label>
                      <input 
                        value={selectedNode.data.variable as string || ''} 
                        onChange={(e) => updateNodeData('variable', e.target.value)}
                        placeholder="e.g., user_age"
                        className="w-full bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Operator</label>
                      <select 
                        value={selectedNode.data.operator as string || 'equals'} 
                        onChange={(e) => updateNodeData('operator', e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono appearance-none"
                      >
                        <option value="equals" className="bg-card">Equals</option>
                        <option value="contains" className="bg-card">Contains</option>
                        <option value="greater_than" className="bg-card">Greater Than</option>
                        <option value="less_than" className="bg-card">Less Than</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Value</label>
                      <input 
                        value={selectedNode.data.value as string || ''} 
                        onChange={(e) => updateNodeData('value', e.target.value)}
                        placeholder="e.g., 18"
                        className="w-full bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'api' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Method</label>
                      <select 
                        value={selectedNode.data.method as string || 'GET'} 
                        onChange={(e) => updateNodeData('method', e.target.value)}
                        className="w-full bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono appearance-none"
                      >
                        <option value="GET" className="bg-card">GET</option>
                        <option value="POST" className="bg-card">POST</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">URL</label>
                      <input 
                        value={selectedNode.data.url as string || ''} 
                        onChange={(e) => updateNodeData('url', e.target.value)}
                        placeholder="https://api.example.com/data"
                        className="w-full bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'delay' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Delay (seconds)</label>
                      <input 
                        type="number"
                        value={selectedNode.data.time as string || '3'} 
                        onChange={(e) => updateNodeData('time', e.target.value)}
                        min="1"
                        max="60"
                        className="w-full bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'image' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Image URL</label>
                      <input 
                        value={selectedNode.data.url as string || ''} 
                        onChange={(e) => updateNodeData('url', e.target.value)}
                        placeholder="https://example.com/image.png"
                        className="w-full bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
                
                {selectedNode.data.type === 'ai' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">AI Prompt</label>
                      <textarea 
                        value={selectedNode.data.prompt as string || ''} 
                        onChange={(e) => updateNodeData('prompt', e.target.value)}
                        placeholder="e.g., Generate a helpful response based on the user's name: {{name}}"
                        className="w-full bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-orange-500/50 transition-all text-xs min-h-[120px] resize-none font-mono"
                      />
                      <p className="text-[9px] text-muted-foreground font-mono uppercase mt-1">Use {"{{variable}}"} to inject stored data.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Chat Preview Modal */}
      {isChatOpen && (
        <ChatPreview 
          nodes={nodes} 
          edges={edges} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}

      {/* Publish Success Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowPublishModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2 text-center">Agent Published!</h2>
            <p className="text-muted-foreground mb-6 font-light text-center">Your agent is now live and ready to interact with users.</p>
            
            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Public URL</label>
              <div className="flex gap-2">
                <input 
                  readOnly
                  value={`${window.location.origin}/bot/${botId}`}
                  className="flex-1 bg-accent/5 border border-border rounded-md px-3 py-2 text-foreground text-xs font-mono"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/bot/${botId}`);
                    // alert('Copied to clipboard');
                  }}
                  className="px-3 py-2 bg-accent/5 border border-border rounded-md text-muted-foreground hover:bg-accent/10 transition-colors text-xs font-mono"
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowPublishModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff8a00] to-[#e52e71] text-white font-medium shadow-[0_0_15px_rgba(255,138,0,0.3)] hover:shadow-[0_0_25px_rgba(255,138,0,0.5)] transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


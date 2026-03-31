import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/Logo';
import { GoogleGenAI, Type } from "@google/genai";
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

import { ArrowLeft, ArrowRight, Save, Play, MessageSquare, Type as TypeIcon, GitBranch, Globe, Clock, Image as ImageIcon, Plus, MoreHorizontal, Check, Trash2, Bot, X, Flag, Sparkles, Phone, Link2, MapPin, List, Star, ThumbsUp, HelpCircle } from 'lucide-react';
import ChatPreview from '../components/ChatPreview';

// Custom Node Design - Professional Human-Designed Style
const CustomNode = ({ data, isConnectable }: any) => {
  const isStartNode = data.label === 'Starting point';

  if (isStartNode) {
    return (
      <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-2xl border border-white/20 w-[280px] h-[80px] flex items-center px-5 gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative group hover:border-cyan-400/50 transition-all duration-300">
        {/* Gradient Orb Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
          <Flag className="w-6 h-6 text-white" />
        </div>
        
        {/* Text Content */}
        <div className="flex flex-col justify-center overflow-hidden flex-1">
          <h3 className="text-[15px] font-bold text-white tracking-tight leading-tight">Starting point</h3>
          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">Where your bot begins</p>
        </div>

        {/* Output Handle - Centered vertically */}
        <Handle 
          type="source" 
          position={Position.Right} 
          isConnectable={isConnectable}
          style={{ top: '50%', transform: 'translateY(-50%)' }}
          className="!w-10 !h-10 !bg-gradient-to-r !from-[#ff8a00] !to-[#e52e71] !border-2 !border-white/20 flex items-center justify-center shadow-lg hover:scale-110 transition-transform rounded-full"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </Handle>
      </div>
    );
  }

  let Icon = MessageSquare;
  let gradientFrom = 'from-blue-500';
  let gradientTo = 'to-blue-600';
  let headerText = 'Message';
  let bodyText = '';

  switch (data.type) {
    case 'message':
      Icon = MessageSquare;
      gradientFrom = 'from-blue-500';
      gradientTo = 'to-indigo-600';
      headerText = 'Message';
      bodyText = data.text || 'Empty message';
      break;
    case 'input':
      Icon = TypeIcon;
      gradientFrom = 'from-orange-500';
      gradientTo = 'to-red-500';
      headerText = data.label || 'User Input';
      bodyText = data.variable ? `Save to: ${data.variable}` : 'No variable set';
      break;
    case 'condition':
      Icon = GitBranch;
      gradientFrom = 'from-purple-500';
      gradientTo = 'to-pink-600';
      headerText = 'Condition';
      bodyText = data.variable ? `If ${data.variable} ${data.operator} ${data.value}` : 'Setup condition';
      break;
    case 'api':
      Icon = Globe;
      gradientFrom = 'from-green-500';
      gradientTo = 'to-emerald-600';
      headerText = 'API Request';
      bodyText = data.method + ' ' + (data.url || 'No URL');
      break;
    case 'delay':
      Icon = Clock;
      gradientFrom = 'from-yellow-500';
      gradientTo = 'to-amber-600';
      headerText = 'Delay';
      bodyText = `Wait ${data.time || 0}s`;
      break;
    case 'image':
      Icon = ImageIcon;
      gradientFrom = 'from-pink-500';
      gradientTo = 'to-rose-600';
      headerText = 'Image';
      bodyText = data.url ? 'Image URL set' : 'No image';
      break;
    case 'buttons':
      Icon = () => <div className="w-4 h-4 rounded-full bg-blue-500" />;
      gradientFrom = 'from-blue-500';
      gradientTo = 'to-indigo-600';
      headerText = 'Buttons';
      bodyText = data.text || 'Button options';
      break;
  }

  // Special case for buttons node - show message box + button list
  if (data.type === 'buttons' || data.label === 'Buttons') {
    const buttons = data.buttons || [{ label: 'Button' }, { label: 'Any of the above', icon: '?' }];
    return (
      <div className="bg-[#1E293B] rounded-xl border border-white/10 w-[280px] overflow-visible flex flex-col transition-all duration-300 hover:border-white/20 shadow-xl">
        {/* Input Handle */}
        <Handle type="target" position={Position.Left} isConnectable={isConnectable} 
          className="!w-2.5 !h-6 !bg-slate-400 !border !border-[#1E293B] !rounded-r-md !-ml-1 !top-1/2 !-translate-y-1/2" />
        
        {/* Header - Blue with circle icon */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#3B82F6] rounded-t-xl">
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
          </div>
          <span className="text-[13px] font-semibold text-white">Buttons</span>
          <button className="ml-auto text-white/70 hover:text-white">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content - Message + Buttons */}
        <div className="p-4 flex-1 flex flex-col gap-3 bg-[#1E293B]">
          {/* Message Box - White */}
          <div className="bg-white rounded-md p-3 min-h-[50px]">
            <p className="text-[13px] text-slate-800 leading-relaxed">{data.text || 'Text body'}</p>
          </div>
          
          {/* Buttons List */}
          <div className="flex flex-col gap-2">
            {buttons.map((btn: any, idx: number) => (
              <div key={idx} className="relative">
                <div className="bg-gradient-to-r from-pink-500 to-rose-400 rounded-md px-4 py-3 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-white">{btn.label}</span>
                  {btn.icon && (
                    <span className="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center text-white text-xs">{btn.icon}</span>
                  )}
                </div>
                {/* Teal output handle */}
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id={`btn-${idx}`}
                  isConnectable={isConnectable}
                  className="!w-6 !h-6 !bg-teal-400 !border-2 !border-white !rounded-full !-right-3 !top-1/2 !-translate-y-1/2 !absolute !z-10"
                >
                  <ArrowRight className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </Handle>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-xl border border-white/10 w-[220px] min-h-[140px] overflow-visible flex flex-col transition-all duration-300 hover:border-white/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] shadow-lg">
      {/* Input Handle */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} 
        className="!w-3 !h-8 !bg-slate-500 !border-2 !border-[#1E293B] !rounded-r-lg !-ml-1.5 !top-1/2 !-translate-y-1/2" />
      
      {/* Header with Gradient */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-md`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">{headerText}</span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete(data.id);
          }}
          className="ml-auto text-slate-500 hover:text-red-400 transition-colors p-1 hover:bg-white/5 rounded"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="px-4 py-3 flex-1 flex flex-col justify-center">
        <p className="text-[12px] text-slate-400 leading-relaxed line-clamp-3">{bodyText}</p>
      </div>

      {/* Output Handle */}
      {data.type === 'condition' ? (
        <div className="flex flex-col border-t border-white/5">
           <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
             <span className="text-[10px] font-medium text-green-400">True</span>
             <Handle type="source" position={Position.Right} id="true" isConnectable={isConnectable} 
               className="!w-2.5 !h-6 !bg-green-500 !border-2 !border-[#1E293B] !rounded-l-md !-mr-1.5 !relative !top-0 !translate-y-0" />
           </div>
           <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02]">
             <span className="text-[10px] font-medium text-red-400">False</span>
             <Handle type="source" position={Position.Right} id="false" isConnectable={isConnectable} 
               className="!w-2.5 !h-6 !bg-red-500 !border-2 !border-[#1E293B] !rounded-l-md !-mr-1.5 !relative !top-0 !translate-y-0" />
           </div>
        </div>
      ) : (
        <Handle type="source" position={Position.Right} isConnectable={isConnectable} 
          className="!w-3 !h-8 !bg-slate-500 !border-2 !border-[#1E293B] !rounded-l-lg !-mr-1.5 !top-1/2 !-translate-y-1/2" />
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

let id = 0;
const getId = () => `dndnode_${id++}`;

export default function Builder() {
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];
  const { botId } = useParams();
  const [searchParams] = useSearchParams();
  const prompt = searchParams.get('prompt');
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsBotPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [botName, setBotName] = useState('Flow Builder');
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const res = await fetch(`/api/flows/${botId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          
          // Fetch bot details
          const botRes = await fetch(`/api/bots`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (botRes.ok) {
            const bots = await botRes.json();
            const currentBot = bots.find((b: any) => b.id === parseInt(botId!));
            if (currentBot) {
              setIsPublished(!!currentBot.published);
              setBotName(currentBot.name);
            }
          }

          if (data.nodes && data.nodes.length > 0) {
            const nodesWithDelete = data.nodes.map((n: any) => ({
              ...n,
              data: { ...n.data, onDelete: deleteNode }
            }));
            setNodes(nodesWithDelete);
            if (data.edges) setEdges(data.edges);
            
            const maxId = Math.max(...data.nodes.map((n: any) => {
              const match = n.id.match(/dndnode_(\d+)/);
              return match ? parseInt(match[1]) : 0;
            }));
            id = maxId + 1;
          } else if (prompt && !hasGeneratedRef.current) {
            // Trigger AI Generation if flow is empty and prompt exists
            hasGeneratedRef.current = true;
            generateAIFlow(prompt);
          } else {
            // Manual creation: Add starting node
            const startNode = {
              id: 'dndnode_0',
              type: 'custom',
              position: { x: 250, y: 250 },
              data: { 
                label: 'Starting point', 
                type: 'message', 
                text: 'Where your bot begins',
                onDelete: deleteNode
              },
            };
            setNodes([startNode]);
            id = 1;
          }
        }
      } catch (error) {
        console.error('Failed to fetch flow', error);
      }
    };
    fetchFlow();
  }, [botId, token, prompt]);

  const generateAIFlow = async (userPrompt: string) => {
    setIsGenerating(true);
    setNodes([]);
    setEdges([]);

    try {
      setGenerationStep('Analyzing requirements...');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a logical and comprehensive conversation flow for a chatbot based on this description: "${userPrompt}".
        
        The flow should include:
        1. A welcome message.
        2. Relevant questions to gather information (User Input).
        3. AI-powered responses or processing steps.
        4. Logical transitions.
        
        CRITICAL CONTENT REQUIREMENTS: 
        - EVERY node must have a non-empty 'label' (e.g., "Welcome Message", "Collect User Name").
        - 'message' nodes MUST have a 'text' field with a helpful, friendly message (at least 15-20 words).
        - 'ai' nodes MUST have a 'prompt' field with clear instructions for the AI (at least 15-20 words).
        - 'input' nodes MUST have a 'variable' name (e.g., "userName", "userEmail").
        - DO NOT generate empty or placeholder nodes.
        - Ensure the conversation feels natural and complete.
        
        Return a JSON object with 'nodes' and 'edges' arrays.
        Nodes must have:
        - id: string (e.g., "dndnode_0", "dndnode_1", ...)
        - type: "custom"
        - position: { x: number, y: number }
        - data: { 
            label: string, 
            type: "message" | "input" | "condition" | "api" | "delay" | "image" | "ai",
            text?: string,
            variable?: string,
            prompt?: string,
            url?: string,
            method?: string,
            time?: string
          }
        
        Edges must have:
        - id: string
        - source: string
        - target: string
        
        Ensure the flow is complete and ready to use.`,
        config: {
          systemInstruction: "You are an expert chatbot designer. You must always generate complete, non-empty conversation flows in JSON format. Every message node must have a substantial text response. Every AI node must have a detailed prompt.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    position: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER }
                      }
                    },
                    data: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        type: { type: Type.STRING },
                        text: { type: Type.STRING },
                        variable: { type: Type.STRING },
                        prompt: { type: Type.STRING },
                        url: { type: Type.STRING },
                        method: { type: Type.STRING },
                        time: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    source: { type: Type.STRING },
                    target: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      if (!response.text) {
        throw new Error('AI failed to generate a response. Please try a different prompt.');
      }

      const result = JSON.parse(response.text || '{}');
      let generatedNodes = result.nodes || [];
      const generatedEdges = result.edges || [];

      if (generatedNodes.length === 0) {
        throw new Error('AI generated an empty flow. Please try a more detailed prompt.');
      }

      // Improve Layout: Calculate levels for nodes to avoid messiness
      const nodeLevels: Record<string, number> = {};
      const adj: Record<string, string[]> = {};
      const inDegree: Record<string, number> = {};

      generatedNodes.forEach((n: any) => {
        adj[n.id] = [];
        inDegree[n.id] = 0;
      });

      generatedEdges.forEach((e: any) => {
        if (adj[e.source]) adj[e.source].push(e.target);
        if (inDegree[e.target] !== undefined) inDegree[e.target]++;
      });

      // BFS to find levels
      const queue: { id: string; level: number }[] = [];
      generatedNodes.forEach((n: any) => {
        if (inDegree[n.id] === 0) queue.push({ id: n.id, level: 0 });
      });

      // If no start nodes found, just pick the first one
      if (queue.length === 0 && generatedNodes.length > 0) {
        queue.push({ id: generatedNodes[0].id, level: 0 });
      }

      const processed = new Set<string>();
      const levelCounts: Record<number, number> = {};

      while (queue.length > 0) {
        const { id, level } = queue.shift()!;
        if (processed.has(id)) continue;
        processed.add(id);

        nodeLevels[id] = level;
        levelCounts[level] = (levelCounts[level] || 0) + 1;

        adj[id].forEach(targetId => {
          queue.push({ id: targetId, level: level + 1 });
        });
      }

      // Assign positions based on levels
      generatedNodes = generatedNodes.map((node: any) => {
        const level = nodeLevels[node.id] || 0;
        const indexInLevel = Object.keys(nodeLevels).filter(id => nodeLevels[id] === level).indexOf(node.id);
        
        return {
          ...node,
          position: { 
            x: 100 + level * 350, 
            y: 150 + indexInLevel * 250 
          }
        };
      });

      setGenerationStep('Designing conversation structure...');
      await new Promise(r => setTimeout(r, 800));
      
      setGenerationStep('Optimizing flow logic...');
      await new Promise(r => setTimeout(r, 800));
      
      setGenerationStep('Finalizing agent nodes...');
      await new Promise(r => setTimeout(r, 500));

      // Place nodes one by one for visual effect
      for (let i = 0; i < generatedNodes.length; i++) {
        const node = {
          ...generatedNodes[i],
          data: { ...generatedNodes[i].data, onDelete: deleteNode }
        };
        setNodes(prev => [...prev, node]);
        
        // Add edges connected to this node
        const nodeEdges = generatedEdges.filter((e: any) => e.target === node.id);
        if (nodeEdges.length > 0) {
          setEdges(prev => [...prev, ...nodeEdges.map((e: any) => ({ ...e, type: 'smoothstep', animated: true }))]);
        }
        
        await new Promise(r => setTimeout(r, 600));
      }

      // Update global ID counter
      const maxId = Math.max(...generatedNodes.map((n: any) => {
        const match = n.id.match(/dndnode_(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }));
      id = maxId + 1;

      // Auto-save the generated flow
      await fetch(`/api/flows/${botId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nodes: generatedNodes, edges: generatedEdges })
      });

    } catch (error) {
      console.error('AI Generation error', error);
      setGenerationStep('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds)),
    [setEdges],
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowAddMenu(false);
    setMenuPosition(null);
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const updateNodeData = (key: string, value: any) => {
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

  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [connectingHandleId, setConnectingHandleId] = useState<string | null>(null);

  const onConnectStart = useCallback((_: any, { nodeId, handleId }: any) => {
    setConnectingNodeId(nodeId);
    setConnectingHandleId(handleId);
  }, []);

  const onConnectEnd = useCallback(
    (event: any) => {
      // Reset connection state when drag ends
      setConnectingNodeId(null);
      setConnectingHandleId(null);
    },
    [reactFlowInstance]
  );

  // Right-click handler to show menu
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (!reactFlowInstance) return;
      
      // Reset connection state for standalone node
      setConnectingNodeId(null);
      setConnectingHandleId(null);
      
      setMenuPosition({ x: event.clientX, y: event.clientY });
    },
    [reactFlowInstance]
  );

  const addAndConnectNode = (type: string, specificLabel?: string) => {
    if (!menuPosition || !reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: menuPosition.x,
      y: menuPosition.y,
    });

    const newNodeId = getId();
    let label = specificLabel || 'Node';
    let defaultData: any = {};

    switch (type) {
      case 'message': 
        label = specificLabel || 'Message'; 
        defaultData = { text: 'Hello! How can I help you today?' }; 
        break;
      case 'input': 
        label = specificLabel || 'User Input'; 
        defaultData = { variable: 'user_input' }; 
        break;
      case 'input_phone': 
        label = 'Ask for phone'; 
        defaultData = { type: 'input', variable: 'phone', label: 'Ask for phone' }; 
        break;
      case 'input_url': 
        label = 'Ask for a Url'; 
        defaultData = { type: 'input', variable: 'url', label: 'Ask for a Url' }; 
        break;
      case 'input_address': 
        label = 'Ask for an address'; 
        defaultData = { type: 'input', variable: 'address', label: 'Ask for an address' }; 
        break;
      case 'input_name': 
        label = 'Ask for a name'; 
        defaultData = { type: 'input', variable: 'name', label: 'Ask for a name' }; 
        break;
      case 'input_date': 
        label = 'Ask for a date'; 
        defaultData = { type: 'input', variable: 'date', label: 'Ask for a date' }; 
        break;
      case 'input_number': 
        label = 'Ask for a number'; 
        defaultData = { type: 'input', variable: 'number', label: 'Ask for a number' }; 
        break;
      case 'input_email': 
        label = 'Ask for email'; 
        defaultData = { type: 'input', variable: 'email', label: 'Ask for email' }; 
        break;
      case 'buttons': 
        label = 'Buttons'; 
        defaultData = { 
          type: 'buttons', 
          variable: 'choice', 
          label: 'Buttons',
          text: 'Choose an option:',
          buttons: [{ label: 'Button' }, { label: 'Any of the above' }]
        }; 
        break;
      case 'condition': 
        label = 'Condition'; 
        defaultData = { variable: '', operator: 'equals', value: '' }; 
        break;
      case 'api': 
        label = 'API Request'; 
        defaultData = { url: 'https://api.example.com', method: 'GET' }; 
        break;
      case 'delay': 
        label = 'Delay'; 
        defaultData = { time: '3' }; 
        break;
      case 'image': 
        label = 'Image'; 
        defaultData = { url: '' }; 
        break;
      case 'ai': 
        label = 'AI Response'; 
        defaultData = { prompt: 'Generate a helpful response based on the conversation.' }; 
        break;
    }

    const newNode: Node = {
      id: newNodeId,
      type: 'custom',
      position,
      data: { 
        id: newNodeId,
        label,
        type: type === 'buttons' ? 'buttons' : type.startsWith('input_') ? 'input' : type,
        onDelete: deleteNode,
        ...defaultData
      },
    };

    setNodes((nds) => nds.concat(newNode));

    // Only add edge if connecting from another node
    if (connectingNodeId) {
      const newEdge: Edge = {
        id: `e-${connectingNodeId}-${newNodeId}`,
        source: connectingNodeId,
        target: newNodeId,
        sourceHandle: connectingHandleId,
      };
      setEdges((eds) => eds.concat(newEdge));
    }

    setMenuPosition(null);
    setConnectingNodeId(null);
    setConnectingHandleId(null);
  };

  // Add standalone node from dock
  const addStandaloneNode = () => {
    if (!reactFlowInstance) return;
    
    // Reset connection state to ensure standalone node is created
    setConnectingNodeId(null);
    setConnectingHandleId(null);
    
    // Get center of viewport
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const viewportWidth = reactFlowWrapper.current?.clientWidth || window.innerWidth;
    const viewportHeight = reactFlowWrapper.current?.clientHeight || window.innerHeight;
    
    const centerX = (viewportWidth / 2 - x) / zoom;
    const centerY = (viewportHeight / 2 - y) / zoom;

    setMenuPosition({ 
      x: viewportWidth / 2, 
      y: viewportHeight / 2 
    });
  };

  const closeMenu = () => {
    setMenuPosition(null);
    setConnectingNodeId(null);
    setConnectingHandleId(null);
  };

  return (
    <div className="h-screen w-screen bg-[#0B0F19] text-white font-sans relative overflow-hidden flex p-[3px]">
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute inset-0 opacity-[0.04] mix-blend-screen" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      {/* Main Container */}
      <main className="flex-1 relative z-10 bg-[#0B0F19]/80 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden">
        {/* Floating Header Elements */}
        
        {/* Left: Agent Info */}
        <div className="absolute top-6 left-6 z-[100] flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 bg-[#1A1D24]/80 backdrop-blur-xl border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors shadow-lg">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-[#1A1D24]/80 backdrop-blur-xl border border-white/10 rounded-xl px-2 py-1.5 shadow-lg">
            <Logo className="w-5 h-5" />
            <h1 className="font-mono text-slate-200 text-xs tracking-wide truncate max-w-[150px]">{botName}</h1>
          </div>
        </div>

        {/* Center: Navigation Steps */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1 bg-[#1A1D24]/80 backdrop-blur-xl border border-white/10 rounded-xl px-1 py-1 shadow-lg">
            <button className="px-3 py-1 bg-white/10 text-white rounded-lg border border-white/5">Build</button>
            <span className="text-slate-600 px-0.5">&rsaquo;</span>
            <button className="px-3 py-1 hover:bg-white/5 rounded-lg transition-colors">Design</button>
            <span className="text-slate-600 px-0.5">&rsaquo;</span>
            <button className="px-3 py-1 hover:bg-white/5 rounded-lg transition-colors">Settings</button>
            <span className="text-slate-600 px-0.5">&rsaquo;</span>
            <button className="px-3 py-1 hover:bg-white/5 rounded-lg transition-colors">Share</button>
            <span className="text-slate-600 px-0.5">&rsaquo;</span>
            <button className="px-3 py-1 hover:bg-white/5 rounded-lg transition-colors">Analyze</button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="absolute top-6 right-6 z-[100] flex items-center gap-2">
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 flex items-center gap-2 rounded-xl bg-[#1A1D24]/80 backdrop-blur-xl border border-white/10 text-slate-300 hover:bg-white/10 transition-colors text-[10px] font-mono uppercase tracking-wider shadow-lg" title="Save">
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          <button onClick={() => setIsChatOpen(true)} className="px-4 py-2 bg-[#1A1D24]/80 backdrop-blur-xl border border-white/10 text-slate-300 font-mono uppercase tracking-wider rounded-xl hover:bg-white/5 transition-colors text-[10px] flex items-center gap-2 shadow-lg">
            <Play className="w-3.5 h-3.5" />
            Test
          </button>
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className={`px-5 py-2 font-mono uppercase tracking-wider rounded-xl transition-all text-[10px] shadow-lg ${
              isPublished 
                ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20 backdrop-blur-xl' 
                : 'bg-gradient-to-r from-[#ff8a00] to-[#e52e71] text-white hover:shadow-[0_0_15px_rgba(255,138,0,0.4)]'
            }`}
          >
            {isPublishing ? '...' : isPublished ? 'Published' : 'Publish'}
          </button>
        </div>

        {/* Main Builder Area */}
        <div className="h-full w-full relative flex overflow-hidden">
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
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onInit={setReactFlowInstance}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onPaneContextMenu={onPaneContextMenu}
                fitView
                className="bg-transparent"
                colorMode="dark"
              >
                <Background color="#475569" gap={20} size={1} opacity={0.3} />
                
                <Controls className="bg-[#1A1D24]/80 border-white/10 fill-slate-400 rounded-md overflow-hidden backdrop-blur-md" showInteractive={false} />
              </ReactFlow>
            </ReactFlowProvider>
          </div>

          {/* Bottom Center Dock - Add Node Button */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100]">
            <div className="group relative">
              <button 
                onClick={addStandaloneNode}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#ff8a00] to-[#e52e71] flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,138,0,0.4)] hover:shadow-[0_0_30px_rgba(255,138,0,0.6)] hover:scale-110 transition-all duration-300 border border-white/20"
              >
                <Plus className="w-6 h-6" />
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1A1D24] border border-white/10 rounded-lg text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                Add Block
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1D24]" />
              </div>
            </div>
          </div>

          {/* Right Settings Panel - Floating Glass Effect */}
          {selectedNode && (
            <div className="w-72 mr-4 my-4 bg-[#1A1D24]/90 backdrop-blur-2xl rounded-2xl border border-white/10 z-20 flex flex-col animate-in slide-in-from-right-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <h2 className="text-[10px] font-mono text-slate-300 uppercase tracking-[0.2em]">Settings</h2>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                {selectedNode.data.type === 'message' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Message Text</label>
                      <textarea 
                        value={selectedNode.data.text as string} 
                        onChange={(e) => updateNodeData('text', e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all text-xs min-h-[120px] resize-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'input' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Variable Name</label>
                      <input 
                        value={selectedNode.data.variable as string || ''} 
                        onChange={(e) => updateNodeData('variable', e.target.value)}
                        placeholder="e.g., user_name"
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                      <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Stored variable name.</p>
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'condition' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Variable to Check</label>
                      <input 
                        value={selectedNode.data.variable as string || ''} 
                        onChange={(e) => updateNodeData('variable', e.target.value)}
                        placeholder="e.g., user_age"
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Operator</label>
                      <select 
                        value={selectedNode.data.operator as string || 'equals'} 
                        onChange={(e) => updateNodeData('operator', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono appearance-none"
                      >
                        <option value="equals" className="bg-[#1A1D24]">Equals</option>
                        <option value="contains" className="bg-[#1A1D24]">Contains</option>
                        <option value="greater_than" className="bg-[#1A1D24]">Greater Than</option>
                        <option value="less_than" className="bg-[#1A1D24]">Less Than</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Value</label>
                      <input 
                        value={selectedNode.data.value as string || ''} 
                        onChange={(e) => updateNodeData('value', e.target.value)}
                        placeholder="e.g., 18"
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'api' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Method</label>
                      <select 
                        value={selectedNode.data.method as string || 'GET'} 
                        onChange={(e) => updateNodeData('method', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono appearance-none"
                      >
                        <option value="GET" className="bg-[#1A1D24]">GET</option>
                        <option value="POST" className="bg-[#1A1D24]">POST</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">URL</label>
                      <input 
                        value={selectedNode.data.url as string || ''} 
                        onChange={(e) => updateNodeData('url', e.target.value)}
                        placeholder="https://api.example.com/data"
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'delay' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Delay (seconds)</label>
                      <input 
                        type="number"
                        value={selectedNode.data.time as string || '3'} 
                        onChange={(e) => updateNodeData('time', e.target.value)}
                        min="1"
                        max="60"
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'image' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Image URL</label>
                      <input 
                        value={selectedNode.data.url as string || ''} 
                        onChange={(e) => updateNodeData('url', e.target.value)}
                        placeholder="https://example.com/image.png"
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
                
                {selectedNode.data.type === 'ai' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">AI Prompt</label>
                      <textarea 
                        value={selectedNode.data.prompt as string || ''} 
                        onChange={(e) => updateNodeData('prompt', e.target.value)}
                        placeholder="e.g., Generate a helpful response based on the user's name: {{name}}"
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all text-xs min-h-[120px] resize-none font-mono"
                      />
                      <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Use {"{{variable}}"} to inject stored data.</p>
                    </div>
                  </div>
                )}

                {/* Buttons Node Settings */}
                {(selectedNode.data.type === 'buttons' || selectedNode.data.label === 'Buttons') && (
                  <div className="space-y-5">
                    {/* Message Text */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Write a message</label>
                      <textarea 
                        value={selectedNode.data.text as string || ''} 
                        onChange={(e) => updateNodeData('text', e.target.value)}
                        placeholder="Text body"
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all text-xs min-h-[80px] resize-none font-mono"
                      />
                      {/* Formatting Toolbar */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <button className="px-2 py-1 hover:bg-white/10 rounded font-bold">B</button>
                        <button className="px-2 py-1 hover:bg-white/10 rounded italic">I</button>
                        <button className="px-2 py-1 hover:bg-white/10 rounded">😊</button>
                        <button className="px-2 py-1 hover:bg-white/10 rounded">&lt;/&gt;</button>
                        <button className="px-2 py-1 hover:bg-white/10 rounded">H</button>
                        <button className="px-2 py-1 hover:bg-white/10 rounded">1.</button>
                        <button className="px-2 py-1 hover:bg-white/10 rounded">•</button>
                        <button className="px-2 py-1 hover:bg-white/10 rounded">🔗</button>
                        <button className="px-2 py-1 hover:bg-white/10 rounded">"</button>
                        <button className="ml-auto px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[9px]">Use field</button>
                      </div>
                    </div>

                    {/* Add Message/Media Buttons */}
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-[10px] text-slate-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                        <span className="text-xs">+</span> Add message
                      </button>
                      <button className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-[10px] text-slate-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                        <span className="text-xs">+</span> Add media
                      </button>
                    </div>

                    {/* Buttons Editor */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Buttons editor</label>
                      <div className="space-y-2">
                        {(selectedNode.data.buttons || [{ label: 'Button' }]).map((btn: any, idx: number) => (
                          <div key={idx} className="bg-gradient-to-r from-pink-500/80 to-rose-500/80 rounded-md px-3 py-2.5 flex items-center justify-between border border-white/10 group">
                            <input
                              type="text"
                              value={btn.label}
                              onChange={(e) => {
                                const newButtons = [...(selectedNode.data.buttons || [])];
                                newButtons[idx] = { ...newButtons[idx], label: e.target.value };
                                updateNodeData('buttons', newButtons);
                              }}
                              className="bg-transparent text-[11px] font-medium text-white placeholder:text-white/50 focus:outline-none w-full mr-2"
                              placeholder="Button text..."
                            />
                            <div className="flex items-center gap-1">
                              <button className="text-white/60 hover:text-white p-1"><span className="text-xs">⋮⋮</span></button>
                              <button 
                                onClick={() => {
                                  const newButtons = [...(selectedNode.data.buttons || [])];
                                  newButtons.splice(idx, 1);
                                  updateNodeData('buttons', newButtons);
                                }}
                                className="text-white/60 hover:text-red-300 p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {/* Add Another Button */}
                        <button 
                          onClick={() => {
                            const newButtons = [...(selectedNode.data.buttons || []), { label: 'New Button' }];
                            updateNodeData('buttons', newButtons);
                          }}
                          className="w-full px-3 py-2.5 bg-slate-700/50 border border-white/10 rounded-md text-[10px] text-slate-400 hover:bg-slate-700/70 transition-colors flex items-center gap-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs">+</span>
                          Add another button
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 italic">Press ⚡ to set up icons/images/URLs to the buttons</p>
                    </div>

                    {/* Alignment Toggle */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Buttons alignment</label>
                      <div className="flex bg-black/40 rounded-md p-1 border border-white/10">
                        <button className="flex-1 px-3 py-1.5 text-[10px] text-slate-300 bg-white/10 rounded">HORIZONTAL</button>
                        <button className="flex-1 px-3 py-1.5 text-[10px] text-slate-500 hover:text-slate-300">VERTICAL</button>
                      </div>
                    </div>

                    {/* Toggle Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300">Randomize order</span>
                        <div className="flex bg-black/40 rounded-md p-0.5 border border-white/10">
                          <button className="px-3 py-1 text-[9px] text-slate-500 hover:text-slate-300">NO</button>
                          <button className="px-3 py-1 text-[9px] text-slate-300 bg-white/10 rounded">YES</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300">Searchable options</span>
                        <div className="flex bg-black/40 rounded-md p-0.5 border border-white/10">
                          <button className="px-3 py-1 text-[9px] text-slate-300 bg-white/10 rounded">NO</button>
                          <button className="px-3 py-1 text-[9px] text-slate-500 hover:text-slate-300">YES</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300">Multiple choices</span>
                        <div className="flex bg-black/40 rounded-md p-0.5 border border-white/10">
                          <button className="px-3 py-1 text-[9px] text-slate-300 bg-white/10 rounded">NO</button>
                          <button className="px-3 py-1 text-[9px] text-slate-500 hover:text-slate-300">YES</button>
                        </div>
                      </div>
                    </div>

                    {/* Save Answer Field */}
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Save user answer in the field</label>
                        <button className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[8px] flex items-center justify-center border border-blue-500/30">i</button>
                      </div>
                      <input 
                        value={selectedNode.data.variable as string || 'choice'} 
                        onChange={(e) => updateNodeData('variable', e.target.value)}
                        placeholder="Search or create"
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 transition-all text-xs font-mono"
                      />
                      <p className="text-[9px] text-orange-400/80">If a field is not set, the answer won't be saved.</p>
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
          <div className="bg-[#11141B]/95 backdrop-blur-3xl border border-white/5 rounded-2xl p-8 w-full max-w-md relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_2px_15px_rgba(0,0,0,0.5)]">
            <button 
              onClick={() => setShowPublishModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2 text-center">Agent Published!</h2>
            <p className="text-slate-400 mb-6 font-light text-center">Your agent is now live and ready to interact with users.</p>
            
            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Public URL</label>
              <div className="flex gap-2">
                <input 
                  readOnly
                  value={`${window.location.origin}/bot/${botId}`}
                  className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-2 text-slate-200 text-xs font-mono"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/bot/${botId}`);
                    // alert('Copied to clipboard');
                  }}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-slate-300 hover:bg-white/10 transition-colors text-xs font-mono"
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
      {/* Quick Add Menu - Dark Theme Matching App */}
      {menuPosition && (
        <div 
          className="fixed z-[1000] w-72 bg-[#1A1D24]/98 backdrop-blur-2xl rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/10"
          style={{ left: Math.min(menuPosition.x, window.innerWidth - 300), top: Math.min(menuPosition.y, window.innerHeight - 400) }}
        >
          {/* Search Header */}
          <div className="p-3 border-b border-white/5 bg-black/20">
            <div className="relative">
              <input 
                type="text"
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                placeholder="Search by name"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
              />
            </div>
          </div>
          
          <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
            {/* AI Generation Option */}
            <button 
              onClick={() => addAndConnectNode('ai')}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-slate-200">Build it for me!</span>
                <span className="text-[10px] text-slate-500 font-medium">AI Generation</span>
              </div>
            </button>

            <div className="h-px bg-white/5 my-2" />

            {/* Input Blocks Category */}
            <div className="mb-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2">Input Blocks</span>
            </div>
            
            {[ 
              { type: 'buttons', label: 'Buttons', icon: () => <div className="w-4 h-4 rounded bg-blue-400 flex items-center justify-center text-[8px] text-white font-bold">B</div>, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { type: 'input', label: 'Ask a question', icon: () => <span className="text-lg">📝</span>, color: 'text-slate-300', bg: 'bg-white/5' },
              { type: 'input_date', label: 'Ask for a date', icon: () => <span className="text-lg">📅</span>, color: 'text-slate-300', bg: 'bg-white/5' },
              { type: 'input_name', label: 'Ask for a name', icon: () => <span className="text-lg">👤</span>, color: 'text-slate-300', bg: 'bg-white/5' },
              { type: 'input_number', label: 'Ask for a number', icon: () => <span className="text-lg">🔢</span>, color: 'text-slate-300', bg: 'bg-white/5' },
              { type: 'input_phone', label: 'Ask for a phone', icon: Phone, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { type: 'input_url', label: 'Ask for a Url', icon: Link2, color: 'text-green-400', bg: 'bg-green-400/10' },
              { type: 'input_address', label: 'Ask for an address', icon: MapPin, color: 'text-red-400', bg: 'bg-red-400/10' },
              { type: 'input_email', label: 'Ask for email', icon: () => <span className="text-lg">📧</span>, color: 'text-slate-300', bg: 'bg-white/5' },
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => addAndConnectNode(item.type)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group"
              >
                <div className={`w-7 h-7 rounded-md ${item.bg} flex items-center justify-center border border-white/5`}>
                  {typeof item.icon === 'function' ? item.icon() : <item.icon className={`w-4 h-4 ${item.color}`} />}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white">{item.label}</span>
                </div>
              </button>
            ))}

            <div className="h-px bg-white/5 my-2" />

            {/* Special Blocks Category */}
            <div className="mb-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2">Special Blocks</span>
            </div>

            {[ 
              { type: 'input', label: 'Auto-complete', icon: Bot, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              { type: 'input', label: 'Forms', icon: List, color: 'text-slate-400', bg: 'bg-white/5' },
              { type: 'input', label: 'Opinion scale', icon: Star, color: 'text-orange-400', bg: 'bg-orange-400/10' },
              { type: 'input', label: 'Picture choice', icon: ImageIcon, color: 'text-pink-400', bg: 'bg-pink-400/10' },
              { type: 'input', label: 'Rating', icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { type: 'condition', label: 'Yes/No', icon: HelpCircle, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => addAndConnectNode(item.type)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group"
              >
                <div className={`w-7 h-7 rounded-md ${item.bg} flex items-center justify-center border border-white/5`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white">{item.label}</span>
                </div>
              </button>
            ))}

            <div className="h-px bg-white/5 my-2" />

            {/* Logic & Flow Category */}
            <div className="mb-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2">Logic & Flow</span>
            </div>

            {[
              { type: 'message', label: 'Message', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { type: 'delay', label: 'Delay', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              { type: 'api', label: 'API Request', icon: Globe, color: 'text-green-400', bg: 'bg-green-400/10' },
            ].map((item) => (
              <button 
                key={item.type}
                onClick={() => addAndConnectNode(item.type)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all group"
              >
                <div className={`w-7 h-7 rounded-md ${item.bg} flex items-center justify-center border border-white/5`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


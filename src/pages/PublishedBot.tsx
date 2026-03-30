import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Node, Edge } from '@xyflow/react';
import { Send, Bot, User, Loader2, AlertCircle, Sun, Moon } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useThemeStore } from '../store/themeStore';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  type?: 'text' | 'image';
  url?: string;
}

export default function PublishedBot() {
  const { botId } = useParams();
  const { theme, toggleTheme } = useThemeStore();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const variablesRef = useRef<Record<string, any>>({});
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const res = await fetch(`/api/public/flows/${botId}`);
        if (!res.ok) {
          throw new Error('Bot not found or not published');
        }
        const data = await res.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        
        if (data.nodes && data.nodes.length > 0) {
          // Find start node
          const incomingEdges = new Set(data.edges.map((e: any) => e.target));
          const startNodes = data.nodes.filter((n: any) => !incomingEdges.has(n.id));
          const startNodeId = startNodes.length > 0 ? startNodes[0].id : data.nodes[0].id;
          
          // Small delay before starting
          setTimeout(() => executeNode(startNodeId, data.nodes, data.edges), 1000);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFlow();
  }, [botId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender: 'bot' | 'user', text: string, type: 'text' | 'image' = 'text', url?: string) => {
    setMessages(prev => [...prev, { id: Math.random().toString(), sender, text, type, url }]);
  };

  const replaceVariables = (text: string) => {
    let result = text || '';
    const currentVars = variablesRef.current;
    Object.keys(currentVars).forEach(key => {
      const val = typeof currentVars[key] === 'object' ? JSON.stringify(currentVars[key]) : currentVars[key];
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });
    return result;
  };

  const executeNode = async (nodeId: string, currentNodes: Node[] = nodes, currentEdges: Edge[] = edges) => {
    const node = currentNodes.find(n => n.id === nodeId);
    if (!node) {
      addMessage('bot', 'Flow ended.');
      return;
    }

    setCurrentNodeId(nodeId);
    setIsBotThinking(true);

    const nodeType = node.data.type;

    try {
      if (nodeType === 'message') {
        const text = replaceVariables((node.data.text as string) || '');
        addMessage('bot', text);
        setTimeout(() => moveToNextNode(nodeId, currentNodes, currentEdges), 800);
      } 
      else if (nodeType === 'image') {
        const url = replaceVariables((node.data.url as string) || '');
        addMessage('bot', 'Sending image...', 'image', url);
        setTimeout(() => moveToNextNode(nodeId, currentNodes, currentEdges), 800);
      }
      else if (nodeType === 'input') {
        setIsBotThinking(false);
        setIsWaitingForInput(true);
      } 
      else if (nodeType === 'delay') {
        const seconds = parseInt(node.data.time as string) || 1;
        setTimeout(() => moveToNextNode(nodeId, currentNodes, currentEdges), seconds * 1000);
      }
      else if (nodeType === 'condition') {
        const variable = node.data.variable as string;
        const operator = node.data.operator as string;
        const value = node.data.value as string;
        const currentVal = variablesRef.current[variable];

        let result = false;
        if (operator === 'equals') result = String(currentVal) === String(value);
        else if (operator === 'contains') result = String(currentVal).includes(String(value));
        else if (operator === 'greater_than') result = Number(currentVal) > Number(value);
        else if (operator === 'less_than') result = Number(currentVal) < Number(value);

        const edgeId = result ? 'true' : 'false';
        const nextEdge = currentEdges.find(e => e.source === nodeId && e.sourceHandle === edgeId);
        
        if (nextEdge) {
          executeNode(nextEdge.target, currentNodes, currentEdges);
        } else {
          moveToNextNode(nodeId, currentNodes, currentEdges);
        }
      }
      else if (nodeType === 'api') {
        const url = replaceVariables((node.data.url as string) || '');
        const method = (node.data.method as string) || 'GET';
        
        try {
          const res = await fetch(url, { method });
          const data = await res.json();
          const varName = `api_${nodeId.replace(/[^a-zA-Z0-9]/g, '_')}`;
          variablesRef.current[varName] = data;
          setVariables({ ...variablesRef.current });
        } catch (e) {
          console.error('API Node error', e);
        }
        moveToNextNode(nodeId, currentNodes, currentEdges);
      }
      else if (nodeType === 'ai') {
        const prompt = replaceVariables((node.data.prompt as string) || '');
        
        const history = messages.map(m => `${m.sender === 'bot' ? 'Assistant' : 'User'}: ${m.text}`).join('\n');
        const fullPrompt = `Conversation history:\n${history}\n\nInstructions: ${prompt}\n\nAssistant:`;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: fullPrompt,
        });

        const aiText = response.text || "I'm sorry, I couldn't generate a response.";
        addMessage('bot', aiText);
        setTimeout(() => moveToNextNode(nodeId, currentNodes, currentEdges), 800);
      }
    } catch (error) {
      console.error('Node execution error', error);
      addMessage('bot', 'An error occurred during execution.');
      setIsBotThinking(false);
    }
  };

  const moveToNextNode = (currentNodeId: string, currentNodes: Node[], currentEdges: Edge[]) => {
    const outgoingEdges = currentEdges.filter(e => e.source === currentNodeId);
    if (outgoingEdges.length > 0) {
      const node = currentNodes.find(n => n.id === currentNodeId);
      if (node?.data.type === 'condition') return;

      executeNode(outgoingEdges[0].target, currentNodes, currentEdges);
    } else {
      setIsBotThinking(false);
      addMessage('bot', 'Flow completed.');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !isWaitingForInput || !currentNodeId) return;

    const node = nodes.find(n => n.id === currentNodeId);
    if (!node || node.data.type !== 'input') return;

    addMessage('user', inputValue);

    const variableName = (node.data.variable as string) || 'input';
    const newVars = { ...variablesRef.current, [variableName]: inputValue };
    variablesRef.current = newVars;
    setVariables(newVars);

    setInputValue('');
    setIsWaitingForInput(false);

    setTimeout(() => {
      moveToNextNode(currentNodeId, nodes, edges);
    }, 500);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Initializing Agent...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center text-foreground p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-medium mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-accent/5 hover:bg-accent/10 border border-border rounded-xl transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground font-sans flex flex-col relative overflow-hidden">
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.2]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-600/5 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-accent/5 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff8a00] to-[#e52e71] flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(255,138,0,0.3)]">
            V
          </div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-foreground">AI Agent</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Live</span>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 max-w-3xl mx-auto w-full custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-300`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              msg.sender === 'user' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/20' : 'bg-accent/10 text-muted-foreground border border-border'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-mono leading-relaxed shadow-xl ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-r from-[#ff8a00] to-[#e52e71] text-white' 
                : 'bg-card/80 backdrop-blur-md border border-border text-foreground'
            }`}>
              {msg.type === 'image' && msg.url ? (
                <div className="space-y-3">
                  <img src={msg.url} alt="Bot content" className="rounded-xl max-w-full h-auto border border-border/50 shadow-2xl" referrerPolicy="no-referrer" />
                  <p>{msg.text}</p>
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isBotThinking && (
          <div className="flex gap-4">
            <div className="w-9 h-9 rounded-xl bg-accent/10 text-muted-foreground border border-border flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-accent/5 border-t border-border backdrop-blur-xl relative z-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-3">
            <input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isWaitingForInput ? "Type your message..." : "Agent is processing..."}
              disabled={!isWaitingForInput}
              className="flex-1 bg-accent/5 border border-border rounded-2xl px-5 py-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
            />
            <button 
              type="submit" 
              disabled={!isWaitingForInput || !inputValue.trim()}
              className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#ff8a00] to-[#e52e71] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,138,0,0.3)] hover:shadow-[0_0_30px_rgba(255,138,0,0.5)] hover:scale-[1.05] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-[9px] text-muted-foreground/50 font-mono uppercase tracking-widest mt-4">
            Powered by VapBot AI Builder
          </p>
        </div>
      </div>
    </div>
  );
}

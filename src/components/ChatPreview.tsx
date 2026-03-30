import React, { useState, useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ChatPreviewProps {
  nodes: Node[];
  edges: Edge[];
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  type?: 'text' | 'image';
  url?: string;
}

export default function ChatPreview({ nodes, edges, onClose }: ChatPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const variablesRef = useRef<Record<string, any>>({});
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Initialize chat
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    if (nodes.length === 0) {
      addMessage('bot', 'No nodes found in the flow.');
      return;
    }

    // Find start node (node with no incoming edges)
    const incomingEdges = new Set(edges.map(e => e.target));
    const startNodes = nodes.filter(n => !incomingEdges.has(n.id));
    
    if (startNodes.length === 0) {
      executeNode(nodes[0].id);
      return;
    }

    executeNode(startNodes[0].id);
  }, []);

  // Auto-scroll to bottom
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

  const executeNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
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
        setTimeout(() => moveToNextNode(nodeId), 800);
      } 
      else if (nodeType === 'image') {
        const url = replaceVariables((node.data.url as string) || '');
        addMessage('bot', 'Sending image...', 'image', url);
        setTimeout(() => moveToNextNode(nodeId), 800);
      }
      else if (nodeType === 'input') {
        setIsBotThinking(false);
        setIsWaitingForInput(true);
      } 
      else if (nodeType === 'delay') {
        const seconds = parseInt(node.data.time as string) || 1;
        setTimeout(() => moveToNextNode(nodeId), seconds * 1000);
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
        const nextEdge = edges.find(e => e.source === nodeId && e.sourceHandle === edgeId);
        
        if (nextEdge) {
          executeNode(nextEdge.target);
        } else {
          moveToNextNode(nodeId);
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
        moveToNextNode(nodeId);
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
        setTimeout(() => moveToNextNode(nodeId), 800);
      }
    } catch (error) {
      console.error('Node execution error', error);
      addMessage('bot', 'An error occurred during execution.');
      setIsBotThinking(false);
    }
  };

  const moveToNextNode = (currentNodeId: string) => {
    const outgoingEdges = edges.filter(e => e.source === currentNodeId);
    if (outgoingEdges.length > 0) {
      const node = nodes.find(n => n.id === currentNodeId);
      if (node?.data.type === 'condition') return;

      executeNode(outgoingEdges[0].target);
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
      moveToNextNode(currentNodeId);
    }, 500);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#1A1D24]/95 backdrop-blur-2xl shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/10 flex flex-col z-50 animate-in slide-in-from-right text-white font-sans">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-slate-200">Test Bot</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
              msg.sender === 'user' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-white/10 text-slate-300 border border-white/10'
            }`}>
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[85%] rounded-md px-3 py-2 text-xs font-mono leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-r from-[#ff8a00] to-[#e52e71] text-white shadow-[0_4px_15px_rgba(255,138,0,0.2)]' 
                : 'bg-black/40 border border-white/10 text-slate-200'
            }`}>
              {msg.type === 'image' && msg.url ? (
                <div className="space-y-2">
                  <img src={msg.url} alt="Bot content" className="rounded-md max-w-full h-auto border border-white/5" referrerPolicy="no-referrer" />
                  <p>{msg.text}</p>
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isBotThinking && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-md bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="max-w-[75%] rounded-md px-3 py-2 text-xs bg-black/40 border border-white/10 text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-black/20 border-t border-white/10 backdrop-blur-md">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isWaitingForInput ? "Type your message..." : "Bot is typing..."}
            disabled={!isWaitingForInput}
            className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 transition-all font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button 
            type="submit" 
            disabled={!isWaitingForInput || !inputValue.trim()}
            className="w-9 h-9 rounded-md bg-gradient-to-r from-[#ff8a00] to-[#e52e71] text-white flex items-center justify-center shadow-[0_0_15px_rgba(255,138,0,0.3)] hover:shadow-[0_0_25px_rgba(255,138,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

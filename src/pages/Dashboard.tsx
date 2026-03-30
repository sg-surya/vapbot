import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Plus, Trash2, Bot, LogOut, LayoutTemplate, BarChart2, Settings, PanelLeftClose, PanelLeftOpen, MonitorSmartphone, MessageCircle, MessageSquare, Code, ArrowLeft, X } from 'lucide-react';

interface BotData {
  id: number;
  name: string;
  createdAt: string;
}

export default function Dashboard() {
  const [bots, setBots] = useState<BotData[]>([]);
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [selectedAgentType, setSelectedAgentType] = useState<string | null>(null);
  const [newBotName, setNewBotName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [botToDelete, setBotToDelete] = useState<number | null>(null);

  const fetchBots = async () => {
    try {
      const res = await fetch('/api/bots', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBots(data);
      }
    } catch (error) {
      console.error('Failed to fetch bots', error);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const openCreateModal = () => {
    setNewBotName('');
    setCreateStep(1);
    setSelectedAgentType(null);
    setIsCreateModalOpen(true);
  };

  const submitCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;
    
    setIsCreating(true);
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBotName.trim() })
      });
      if (res.ok) {
        fetchBots();
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create bot', error);
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDeleteBot = (id: number) => {
    setBotToDelete(id);
  };

  const submitDeleteBot = async () => {
    if (botToDelete === null) return;

    try {
      const res = await fetch(`/api/bots/${botToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBots();
        setBotToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete bot', error);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0B0F19] text-white font-sans relative overflow-hidden flex p-[3px] gap-[3px]">
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute inset-0 opacity-[0.04] mix-blend-screen" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 flex-shrink-0 flex flex-col justify-between relative z-10 bg-transparent py-6 px-4`}>
        <div>
          <div className="mb-10 px-2 flex items-center justify-center">
            <span className={`font-bold tracking-tight text-orange-500 lowercase whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'text-xl' : 'text-2xl'}`}>
              vapbot<span className="text-orange-500">.</span>
            </span>
          </div>
          
          <nav className="space-y-2">
            <a href="#" className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl bg-white/10 text-white font-medium transition-colors border border-white/5`} title="My Agents">
              <Bot className="w-5 h-5 text-orange-400 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">My Agents</span>}
            </a>
            <a href="#" className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors`} title="Templates">
              <LayoutTemplate className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">Templates</span>}
            </a>
            <a href="#" className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors`} title="Analytics">
              <BarChart2 className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">Analytics</span>}
            </a>
            <a href="#" className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors`} title="Settings">
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap">Settings</span>}
            </a>
          </nav>
        </div>

        {/* Profile Dropdown */}
        <div className="relative mt-auto">
          {isProfileDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileDropdownOpen(false)}
              ></div>
              <div className={`absolute bottom-full ${isSidebarCollapsed ? 'left-14' : 'left-0'} mb-3 w-56 bg-[#1A1D24] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                <div className="p-4 border-b border-white/5">
                  <p className="text-sm font-medium text-white truncate">{user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                    Free Plan
                  </div>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
          
          <button 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-2'} py-2 rounded-xl hover:bg-white/5 transition-colors text-left focus:outline-none`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff8a00] to-[#e52e71] flex items-center justify-center text-white font-medium shadow-[0_0_15px_rgba(255,138,0,0.3)] border border-white/10 flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-500 truncate">Free Plan</p>
              </div>
            )}
          </button>

          {/* Collapse Sidebar Button */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`mt-2 w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors`}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 flex-shrink-0" /> : <PanelLeftClose className="w-5 h-5 flex-shrink-0" />}
            {!isSidebarCollapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl overflow-y-auto">
        <div className="w-full px-8 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <div>
              <h1 className="text-3xl font-medium text-slate-200">My Agents</h1>
              <p className="text-slate-400 mt-2 font-light">Manage and create your AI agents</p>
            </div>
            <button 
              onClick={openCreateModal}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff8a00] to-[#e52e71] text-white font-medium flex items-center gap-2 shadow-[0_0_20px_rgba(255,138,0,0.3)] hover:shadow-[0_0_30px_rgba(255,138,0,0.5)] hover:scale-[1.02] transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Build an Agent
            </button>
          </div>

          {bots.length === 0 ? (
            <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-transparent max-w-2xl mx-auto mt-20">
              <div className="absolute inset-0 rounded-2xl bg-[#1A1D24]/80 backdrop-blur-xl"></div>
              <div className="relative p-12 rounded-2xl text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <Bot className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-200 mb-2">No agents yet</h3>
                <p className="text-slate-400 font-light mb-8">Build your first agent to start automating your conversations.</p>
                <button 
                  onClick={openCreateModal}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all"
                >
                  Build your first agent
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map((bot) => (
                <div key={bot.id} className="relative p-[1px] rounded-2xl bg-gradient-to-b from-white/20 to-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] group hover:-translate-y-1 transition-transform duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-[#1A1D24]/90 backdrop-blur-xl"></div>
                  <div className="relative p-6 rounded-2xl flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/20 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-orange-400" />
                      </div>
                      <button 
                        onClick={() => confirmDeleteBot(bot.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Delete Agent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h3 className="text-xl font-medium text-slate-200 mb-2">{bot.name}</h3>
                    <p className="text-sm text-slate-500 font-light mb-8">
                      Created {new Date(bot.createdAt).toLocaleDateString()}
                    </p>
                    
                    <div className="mt-auto pt-6 border-t border-white/10">
                      <button 
                        onClick={() => navigate(`/builder/${bot.id}`)}
                        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center justify-center gap-2"
                      >
                        Open Builder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Bot Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-[#1A1D24] border border-white/10 rounded-2xl p-8 w-full ${createStep === 1 ? 'max-w-3xl' : 'max-w-md'} shadow-2xl relative transition-all duration-300`}>
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {createStep === 1 ? (
              <div className="text-center">
                <h2 className="text-2xl font-medium text-white mb-10">What kind of agent are you going to launch?</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {/* Web */}
                  <button 
                    onClick={() => { setSelectedAgentType('Web'); setCreateStep(2); }}
                    className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-500/50 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MonitorSmartphone className="w-8 h-8 text-pink-500" />
                    </div>
                    <span className="font-medium text-slate-300 group-hover:text-white">Web</span>
                  </button>

                  {/* WhatsApp */}
                  <button 
                    onClick={() => { setSelectedAgentType('WhatsApp'); setCreateStep(2); }}
                    className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-green-500/50 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <span className="font-medium text-slate-300 group-hover:text-white">WhatsApp</span>
                  </button>

                  {/* Messenger */}
                  <button 
                    onClick={() => { setSelectedAgentType('Messenger'); setCreateStep(2); }}
                    className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-8 h-8 text-blue-500" />
                    </div>
                    <span className="font-medium text-slate-300 group-hover:text-white">Messenger</span>
                  </button>

                  {/* API Agent */}
                  <button 
                    onClick={() => { setSelectedAgentType('API'); setCreateStep(2); }}
                    className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/50 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Code className="w-8 h-8 text-orange-500" />
                    </div>
                    <span className="font-medium text-slate-300 group-hover:text-white">API Agent</span>
                  </button>
                </div>

                <div className="pt-6 border-t border-white/10 text-left">
                  <span className="text-sm text-slate-500 font-light">No-code agent builder</span>
                </div>
              </div>
            ) : (
              <div>
                <button 
                  onClick={() => setCreateStep(1)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to agent types
                </button>
                
                <h2 className="text-xl font-medium text-white mb-4">Name your {selectedAgentType} agent</h2>
                <form onSubmit={submitCreateBot}>
                  <div className="space-y-2 mb-6">
                    <label className="text-sm text-slate-400">Agent Name</label>
                    <input
                      type="text"
                      value={newBotName}
                      onChange={(e) => setNewBotName(e.target.value)}
                      placeholder="e.g., Customer Support Agent"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-light"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || !newBotName.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff8a00] to-[#e52e71] text-white font-medium disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,138,0,0.3)] transition-all"
                    >
                      {isCreating ? 'Creating...' : 'Create Agent'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {botToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1A1D24] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-medium text-white mb-2">Delete Agent</h2>
            <p className="text-slate-400 mb-6 font-light">Are you sure you want to delete this agent? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBotToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitDeleteBot}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium transition-colors border border-red-500/20"
              >
                Delete Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";

interface TerminalSettingProps {
  onNavigate: (tab: string) => void;
}

export default function TerminalSetting({ onNavigate }: TerminalSettingProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "INITIALIZING DISPATCH TERMINAL PROTOCOL...",
    "ESTABLISHING SECURE CONNECTION CODES..."
  ]);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setConsoleLogs((prev) => [
          ...prev,
          `SYSTEM HEALTH CHECK: STATUS_OK`,
          `FIREBASE DISPATCH: ${data.firebaseConnected ? "CONNECTED" : "FALLBACK_MEMORY"}`
        ]);
        setLoading(false);
      })
      .catch((err) => {
        setConsoleLogs((prev) => [...prev, `ERROR BINDING BACKEND INFRASTRUCTURE: ${err.message}`]);
        setLoading(false);
      });
  }, []);

  const handleClearData = async () => {
    if (!window.confirm("ARE YOU SURE YOU WANT TO FORMAT THE CASE-FILES DATABASE? THIS CANNOT BE UNDONE.")) {
      return;
    }
    setClearing(true);
    setConsoleLogs((prev) => [...prev, "WIPING ACTIVE DIRECTORIES...", "FORMATTING VOLATILE MEMORY SECTORS..."]);
    try {
      const res = await fetch("/api/reset-issues", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setConsoleLogs((prev) => [...prev, "WIPE COMPLETED. REBOOTING RECORD INDEX..."]);
        alert("ALL CASE FILES HAVE BEEN CLEARED.");
      } else {
        setConsoleLogs((prev) => [...prev, "WIPE ABORTED BY SECURE SUBSYSTEM PREVENTATIVE FLAGS."]);
      }
    } catch (err: any) {
      setConsoleLogs((prev) => [...prev, `WIPE ENCOUNTERED EXCEPTION: ${err.message}`]);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md h-screen overflow-hidden flex flex-col md:flex-row relative">
      <div className="noise-bg"></div>

      {/* Top App Bar (Mobile Only) */}
      <header className="md:hidden bg-surface-container-highest dark:bg-surface-container-highest text-primary w-full border-b-2 border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] flex justify-between items-center px-margin-edge h-16 z-50 fixed top-0 left-0">
        <div className="flex items-center gap-4">
          <span 
            onClick={() => setIsMobileMenuOpen(true)}
            className="material-symbols-outlined text-on-surface-variant hover:bg-surface-variant transition-colors p-2 rounded-full cursor-pointer flex items-center justify-center"
          >
            menu
          </span>
          <h1 className="font-headline-md text-headline-md text-primary uppercase tracking-widest text-base">TERMINAL INTEL</h1>
        </div>
        <span 
          onClick={() => onNavigate("new-case-intake")}
          className="material-symbols-outlined text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors p-2 rounded-full cursor-pointer"
        >
          add_circle
        </span>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-50 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Mobile Side Drawer Navigation */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#1c1613] text-[#ede0d9] border-r-2 border-[#4f453f] flex flex-col pt-6 shadow-[10px_0px_20px_rgba(0,0,0,0.6)] transform transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 mb-8 border-b border-[#4f453f] pb-4 relative flex justify-between items-start">
          <div className="absolute top-2 right-12 text-[#9b8e87] opacity-40 transform rotate-12">
            <span className="material-symbols-outlined text-sm">attach_file</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-lg text-[#dec1af] uppercase tracking-wider font-bold">INVESTIGATION</h2>
            <p className="font-mono text-xs text-[#9b8e87] mt-1">CASE FILE v1.0</p>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-[#9b8e87] hover:text-[#ede0d9] p-1 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <ul className="flex flex-col gap-2 font-mono text-sm px-2">
          {[
            { id: "evidence-board", label: "Evidence Board", icon: "grid_view" },
            { id: "case-dossiers", label: "Case Dossiers", icon: "folder_open" },
            { id: "precinct-report", label: "Precinct Report", icon: "query_stats" },
            { id: "terminal-setting", label: "Terminal Setting", icon: "settings", fill: true },
            { id: "evidence-analysis", label: "Evidence Analysis", icon: "analytics" },
            { id: "field-manual", label: "Field Manual", icon: "description" },
          ].map((item) => {
            const isActive = item.id === "terminal-setting";
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-4 p-3.5 transition-all duration-150 w-full text-left cursor-pointer ${
                    isActive
                      ? "bg-[#92030f] text-[#F4EFE6] rounded-none rotate-[-1deg] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] font-bold"
                      : "text-[#ede0d9]/80 hover:bg-[#322722] hover:text-[#ede0d9]"
                  }`}
                >
                  <span 
                    className="material-symbols-outlined" 
                    style={item.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-auto p-6 text-center border-t border-[#4f453f] bg-[#17110e]">
          <button 
            onClick={() => {
              onNavigate("new-case-intake");
              setIsMobileMenuOpen(false);
            }}
            className="bg-[#92030f] hover:bg-red-700 text-[#F4EFE6] border-2 border-[#4f453f] px-4 py-2.5 font-bold w-full shadow-[2px_2px_0px_rgba(0,0,0,0.5)] transition-colors cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider font-mono text-xs"
          >
            <span className="material-symbols-outlined text-sm">add</span> NEW LEAD
          </button>
        </div>
      </div>

      {/* Side Navigation Drawer (Desktop Only) */}
      <nav className="hidden md:flex bg-surface-container-low text-primary h-full w-64 border-r-2 border-outline-variant shadow-[6px_0px_0px_0px_rgba(0,0,0,0.3)] fixed left-0 top-0 bottom-0 flex-col z-40 pt-6">
        <div className="px-6 mb-8 border-b border-outline-variant pb-4 relative">
          <div className="absolute top-2 right-2 text-outline opacity-50 transform rotate-12">
            <span className="material-symbols-outlined">attach_file</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm text-tertiary-fixed-dim uppercase tracking-wider">INVESTIGATION</h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 typewriter-input w-full pb-1">CASE FILE v1.0</p>
        </div>

        <ul className="flex flex-col gap-2 font-label-lg text-label-lg">
          {[
            { id: "evidence-board", label: "Evidence Board", icon: "grid_view" },
            { id: "case-dossiers", label: "Case Dossiers", icon: "folder_open" },
            { id: "precinct-report", label: "Precinct Report", icon: "query_stats" },
            { id: "terminal-setting", label: "Terminal Setting", icon: "settings", fill: true },
            { id: "evidence-analysis", label: "Evidence Analysis", icon: "analytics" },
            { id: "field-manual", label: "Field Manual", icon: "description" },
          ].map((item) => {
            const isActive = item.id === "terminal-setting";
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-4 p-3 mx-2 transition-all duration-150 w-[calc(100%-16px)] text-left cursor-pointer ${
                    isActive
                      ? "bg-primary text-on-primary rounded-none rotate-[-1deg] shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transform translate-x-1 font-bold"
                      : "text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container"
                  }`}
                >
                  <span 
                    className="material-symbols-outlined" 
                    style={item.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto p-6 text-center border-t border-outline-variant">
          <button 
            onClick={() => onNavigate("new-case-intake")}
            className="bg-primary-container text-on-primary-container border-2 border-outline-variant px-4 py-2 font-label-lg font-bold w-full shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-surface-variant transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span> NEW LEAD
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow flex-1 mt-16 md:mt-0 md:ml-64 relative overflow-y-auto corkboard-bg h-full p-6 md:p-8 flex flex-col gap-8">
        <div className="hidden md:block bg-surface-container-high border-2 border-outline-variant p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] transform -rotate-1 max-w-fit mb-4">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="material-symbols-outlined text-secondary opacity-80">push_pin</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-widest border-b-2 border-primary border-dashed pb-2">
            STATION TERMINAL
          </h1>
          <p className="font-label-lg text-label-lg text-on-surface-variant mt-2 font-mono">
            SECURE PRECINCT ANOMALY PROTOCOL
          </p>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto flex flex-col gap-6">
          {/* Console Box */}
          <div className="bg-[#18120e] p-4 rounded border-2 border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] text-green-500 font-mono text-xs flex flex-col gap-2 min-h-[180px]">
            <div className="text-gray-500 pb-1 border-b border-gray-800 flex justify-between">
              <span>STATIONSYSTEM.SYS v1.0.4</span>
              <span className="animate-pulse">● LIVE CONNECTION</span>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 max-h-[220px]">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="leading-5 text-left">
                  <span className="text-gray-600 mr-1">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Actions Block */}
          <div className="bg-[#F4EFE6] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] transform rotate-1 relative text-on-secondary-fixed flex flex-col gap-4">
            <div className="absolute top-4 left-4 w-6 h-1 bg-gray-600 shadow-sm rotate-45"></div>
            
            <h3 className="font-headline-sm text-on-secondary-fixed border-b-2 border-gray-400 pb-1 uppercase tracking-wider text-sm font-bold text-left">DATABASE PURGE</h3>
            <p className="font-body-md text-xs text-on-secondary-fixed opacity-85 text-left">
              Purges all logged community issues from local storage. WARNING: Purges active Firestore structures if server connection handles standard storage formats.
            </p>

            <button
              onClick={handleClearData}
              disabled={clearing}
              className="w-full bg-[#92030f] hover:bg-red-800 text-white font-bold py-3 px-4 font-headline-sm uppercase tracking-widest text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all duration-100 disabled:opacity-50 cursor-pointer text-xs"
            >
              {clearing ? "WIPING MEMORY..." : "PURGE ALL CASES"}
            </button>
          </div>
        </div>
      </main>

      {/* Persistent Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden bg-surface-container-highest dark:bg-surface-container-highest text-primary fixed bottom-0 left-0 w-full h-16 flex justify-around items-center z-50 px-4 border-t-2 border-outline-variant shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.4)]">
        <button 
          onClick={() => onNavigate("case-dossiers")}
          className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">folder_open</span>
          <span className="text-[9px] uppercase tracking-tighter mt-1">Dossiers</span>
        </button>
        <button 
          onClick={() => onNavigate("new-case-intake")}
          className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">add_box</span>
          <span className="text-[9px] uppercase tracking-tighter mt-1">Capture</span>
        </button>
        <button 
          onClick={() => onNavigate("evidence-board")}
          className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">grid_view</span>
          <span className="text-[9px] uppercase tracking-tighter mt-1">Evidence</span>
        </button>
        <button 
          onClick={() => onNavigate("terminal-setting")}
          className="flex flex-col items-center justify-center text-tertiary font-bold scale-110 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
          <span className="text-[9px] uppercase tracking-tighter mt-1">Intel</span>
        </button>
      </nav>
    </div>
  );
}

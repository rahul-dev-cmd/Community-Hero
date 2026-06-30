import React, { useState, useEffect } from "react";
import { Issue } from "../types";
import EvidenceAnalysis from "./EvidenceAnalysis";

interface AIAnalysisLabProps {
  onNavigate: (tab: string) => void;
}

export default function AIAnalysisLab({ onNavigate }: AIAnalysisLabProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchIssues = () => {
      const saved = localStorage.getItem("civic_user");
      const user = saved ? JSON.parse(saved) : null;
      const city = user ? user.city : "New York";

      fetch(`/api/issues?city=${encodeURIComponent(city)}`)
        .then((res) => res.json())
        .then((data) => {
          setIssues(data);
          setLoading(false);
          // Keep active selected issue updated if it's open
          setSelectedIssue((prev) => {
            if (!prev) return null;
            const updated = data.find((item: Issue) => item.id === prev.id);
            return updated || prev;
          });
        })
        .catch((err) => {
          console.warn("AI Lab database loading failed:", err);
          setLoading(false);
        });
    };

    fetchIssues();
    const interval = setInterval(fetchIssues, 5000);
    return () => clearInterval(interval);
  }, []);

  const getFilteredIssues = () => {
    if (filterType === "ALL") return issues;
    if (filterType === "AWAITING") return issues.filter((i) => !i.aiCategory);
    if (filterType === "CLASSIFIED") return issues.filter((i) => !!i.aiCategory);
    return issues;
  };

  const getStatusTag = (issue: Issue) => {
    if (issue.aiCategory) {
      return {
        text: "AI CLASSIFIED",
        style: "bg-[#1c3d2b]/60 text-[#e0f1e8] border-[#3e7d5b]",
      };
    }
    return {
      text: "AWAITING SCAN",
      style: "bg-[#3d2b1f]/60 text-[#ede0d9] border-[#705a4c] animate-pulse",
    };
  };

  const filtered = getFilteredIssues();

  return (
    <div className="bg-background text-on-background font-body-md h-screen overflow-hidden flex flex-col md:flex-row relative">
      <div className="noise-bg"></div>

      {/* Top App Bar (Mobile Only) */}
      <header className="md:hidden bg-surface-container-highest dark:bg-surface-container-highest text-primary w-full border-b-2 border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] flex justify-between items-center px-margin-edge h-16 z-50 fixed top-0 left-0">
        <div className="flex items-center gap-4">
          <span 
            onClick={() => setIsMobileMenuOpen(true)}
            className="material-symbols-outlined text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors p-2 rounded-full cursor-pointer"
          >
            menu
          </span>
          <h1 className="font-headline-md text-headline-md text-primary uppercase tracking-widest text-base">ANALYSIS LAB</h1>
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
            { id: "terminal-setting", label: "Terminal Setting", icon: "settings" },
            { id: "evidence-analysis", label: "Evidence Analysis", icon: "analytics", fill: true },
            { id: "field-manual", label: "Field Manual", icon: "description" },
          ].map((item) => {
            const isActive = item.id === "evidence-analysis";
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
            { id: "terminal-setting", label: "Terminal Setting", icon: "settings" },
            { id: "evidence-analysis", label: "Evidence Analysis", icon: "analytics", fill: true },
            { id: "field-manual", label: "Field Manual", icon: "description" },
          ].map((item) => {
            const isActive = item.id === "evidence-analysis";
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
      <main className="flex-1 mt-16 md:mt-0 md:ml-64 relative overflow-y-auto h-full pb-24 md:pb-8">
        {selectedIssue ? (
          /* Render full scanning interface if single issue is selected */
          <div className="fixed inset-0 bg-[#18120e] z-[100] overflow-y-auto">
            <EvidenceAnalysis
              issue={selectedIssue}
              onClose={() => setSelectedIssue(null)}
              onNavigate={onNavigate}
            />
          </div>
        ) : (
          /* Folder-tab directory */
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="hidden md:block mb-8 bg-[#F4EFE6] border-2 border-outline-variant p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] transform rotate-[0.5deg] max-w-xl text-on-secondary-fixed">
              <div className="absolute top-0 right-4 transform -translate-y-1/2">
                <span className="material-symbols-outlined text-red-800 opacity-80">analytics</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-widest border-b-2 border-primary border-dashed pb-2">
                AI ANALYTICS STATION
              </h1>
              <p className="font-label-lg text-label-lg text-on-surface-variant mt-2 font-mono">
                PRECINCT 12 // AUTOMATED DEFECT RISK ASSESSMENT LOG
              </p>
            </div>

            <div className="border-b-2 border-outline-variant pb-3 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-headline-sm text-primary tracking-widest uppercase text-lg">
                  Report Directory
                </h3>
                <span className="text-[10px] text-outline uppercase font-mono tracking-wider block mt-1">
                  SECURE WIRELESS TRANSCEIVER LOGS
                </span>
              </div>

              {/* Filtering tab controls */}
              <div className="flex gap-2 bg-[#130d09] border border-outline-variant/60 p-1.5 rounded text-xs font-mono">
                {[
                  { id: "ALL", label: "ALL ISSUES" },
                  { id: "AWAITING", label: "AWAITING SCAN" },
                  { id: "CLASSIFIED", label: "AI CLASSIFIED" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    className={`px-3 py-1 text-[10px] tracking-wider uppercase font-bold transition-all cursor-pointer ${
                      filterType === tab.id
                        ? "bg-primary text-on-primary font-extrabold"
                        : "text-outline hover:text-primary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-primary font-bold animate-pulse uppercase text-base font-mono">
                &gt; READING TRANSMISSIONS...
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-surface-container border border-outline-variant border-dashed p-10 text-center text-outline font-mono text-xs leading-relaxed rounded">
                &gt;&gt; SCANNER STATE: IDLE
                <p className="mt-2 text-on-surface font-sans text-sm">
                  No active cases found matching this classification state.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((issue) => {
                  const statusInfo = getStatusTag(issue);
                  const shortId = issue.id.slice(-5).toUpperCase();

                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="bg-[#F4EFE6] border-2 border-outline-variant hover:border-primary p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.5)] transition-all cursor-pointer flex gap-4 hover:bg-surface-variant text-on-secondary-fixed group"
                    >
                      {/* Thumbnail frame */}
                      <div className="w-16 h-16 bg-black p-1 shadow-sm border border-gray-400 flex-shrink-0 overflow-hidden self-center">
                        {issue.imageDataUrl ? (
                          <img
                            src={issue.imageDataUrl}
                            alt={issue.incidentType}
                            className="w-full h-full object-cover filter contrast-125 brightness-90 grayscale-[20%]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-outline text-[7px] text-center p-0.5 font-mono">
                            <span className="material-symbols-outlined text-sm opacity-55">image</span>
                            <span>NO IMG</span>
                          </div>
                        )}
                      </div>

                      {/* Info lines */}
                      <div className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[9px] font-mono tracking-wider text-outline block">
                              EXH-{shortId}
                            </span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono border ${statusInfo.style}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs uppercase tracking-wide truncate mt-1 group-hover:text-primary">
                            {issue.incidentType}
                          </h4>
                          <p className="text-[10px] text-outline mt-1 font-mono truncate">
                            Loc: {issue.location?.address || "Coordinates Filed"}
                          </p>
                        </div>
                        
                        <div className="border-t border-dashed border-gray-300 mt-2 pt-1 flex justify-between items-center text-[9px] font-mono text-outline">
                          <span>LOGGED: {new Date(issue.createdAt).toLocaleDateString()}</span>
                          <span className="text-primary font-bold group-hover:translate-x-1 transition-transform">
                            SCAN &gt;
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
          className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[9px] uppercase tracking-tighter mt-1">Intel</span>
        </button>
      </nav>
    </div>
  );
}

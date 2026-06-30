import React, { useState, useEffect } from "react";
import { Issue } from "../types";
import EvidenceAnalysis from "./EvidenceAnalysis";
import AuthModal from "./AuthModal";

interface EvidenceBoardProps {
  onNavigate: (tab: string) => void;
}

export default function EvidenceBoard({ onNavigate }: EvidenceBoardProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; city: string } | null>(() => {
    const saved = localStorage.getItem("civic_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleSignOut = () => {
    localStorage.removeItem("civic_user");
    setCurrentUser(null);
  };

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
          // Keep selectedIssue up to date if currently open
          setSelectedIssue((prev) => {
            if (!prev) return null;
            const updated = data.find((item: Issue) => item.id === prev.id);
            return updated || prev;
          });
        })
        .catch((err) => {
          console.warn("Failed to fetch issues", err);
          setLoading(false);
        });
    };

    fetchIssues();
    const interval = setInterval(fetchIssues, 5000);
    return () => clearInterval(interval);
  }, []);

  // Deterministic positions to keep layout organic but consistent
  function getDeterministicStyles(id: string, index: number) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const rotation = (Math.abs(hash) % 10) - 5; // -5 to +5 deg
    
    // Grid alignment parameters for the virtual 2000px canvas
    const cols = 4;
    const colIndex = index % cols;
    const rowIndex = Math.floor(index / cols);
    
    const colWidth = 440;
    const rowHeight = 420;
    
    const baseLeft = 100 + colIndex * colWidth;
    const baseTop = 240 + rowIndex * rowHeight;
    
    // Deterministic organic offsets
    const offsetX = (Math.abs(hash) % 80) - 40; // -40px to +40px
    const offsetY = (Math.abs(hash >> 3) % 80) - 40; // -40px to +40px
    
    return {
      rotation,
      left: baseLeft + offsetX,
      top: baseTop + offsetY
    };
  }

  // Calculate canvas height based on number of cards (issues + 1 AI card)
  const totalCards = issues.length + 1;
  const rows = Math.ceil(totalCards / 4);
  const canvasHeight = Math.max(1200, 300 + rows * 420);

  // Calculate threads/strings between pins sharing same incident category
  const threads: { id: string; x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  const grouped: Record<string, { issue: Issue; left: number; top: number }[]> = {};

  issues.forEach((issue, index) => {
    const cat = (issue.incidentType || "").trim().toUpperCase();
    if (!cat) return;
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    const { left, top } = getDeterministicStyles(issue.id, index);
    grouped[cat].push({ issue, left, top });
  });

  Object.keys(grouped).forEach((cat) => {
    const list = grouped[cat];
    if (list.length < 2) return;
    
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i];
      const b = list[i + 1];
      
      const isAResolved = (a.issue.status || "").toUpperCase() === "RESOLVED";
      const isBResolved = (b.issue.status || "").toUpperCase() === "RESOLVED";
      
      const bothResolved = isAResolved && isBResolved;
      const color = bothResolved ? "#2E7D5B" : "#C23B3B"; // green for resolved, red for unresolved
      
      // Calculate center coordinates of pins (Polaroid card width = 192px)
      const x1 = a.left + 96;
      const y1 = a.top + 10;
      const x2 = b.left + 96;
      const y2 = b.top + 10;
      
      threads.push({
        id: `${a.issue.id}-${b.issue.id}`,
        x1,
        y1,
        x2,
        y2,
        color
      });
    }
  });

  const mostRecentIssue = issues.length > 0 
    ? [...issues].sort((a, b) => b.createdAt - a.createdAt)[0] 
    : null;

  const aiCardStyles = getDeterministicStyles("AI_ANALYSIS_CARD", issues.length);

  if (loading) {
    return (
      <div className="bg-background text-on-background font-body-md min-h-screen flex items-center justify-center">
        <div className="text-center py-12 text-primary font-bold animate-pulse uppercase text-lg">
          &gt; SECURING ACCESS TO FILE SYSTEM...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-md h-screen overflow-hidden flex flex-col md:flex-row relative">
      <div className="noise-bg"></div>

      {/* Top App Bar (Mobile) / Header */}
      <header className="md:hidden bg-surface-container-highest dark:bg-surface-container-highest text-primary w-full border-b-2 border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] flex justify-between items-center px-margin-edge h-16 z-50 fixed top-0 left-0">
        <div className="flex items-center gap-4">
          <span 
            onClick={() => setIsMobileMenuOpen(true)}
            className="material-symbols-outlined text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors p-2 rounded-full cursor-pointer"
          >
            menu
          </span>
          <h1 className="font-headline-md text-headline-md text-primary uppercase tracking-widest text-base">METROPOLIS CIVIC PORTAL</h1>
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
            { id: "evidence-board", label: "Evidence Board", icon: "grid_view", fill: true },
            { id: "case-dossiers", label: "Case Dossiers", icon: "folder_open" },
            { id: "precinct-report", label: "Precinct Report", icon: "query_stats" },
            { id: "terminal-setting", label: "Terminal Setting", icon: "settings" },
            { id: "evidence-analysis", label: "Evidence Analysis", icon: "analytics" },
            { id: "field-manual", label: "Field Manual", icon: "description" },
          ].map((item) => {
            const isActive = item.id === "evidence-board";
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
        
        {/* User Identity widget inside mobile drawer */}
        <div className="px-4 py-3 border-t border-[#4f453f] bg-[#1a1412] mt-4 text-left">
          {currentUser ? (
            <div className="flex flex-col gap-1 font-mono">
              <span className="text-[10px] text-[#9b8e87] uppercase tracking-wider">OFFICER IDENTITY ({currentUser.city || "NEW YORK"})</span>
              <div className="flex justify-between items-center bg-[#130d09] border border-[#4f453f] p-2">
                <span className="text-xs font-bold text-[#dec1af] uppercase tracking-wide truncate pr-2">
                  {currentUser.username}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="text-[9px] text-[#92030f] hover:text-[#ffb4ac] border border-[#92030f] px-1.5 py-0.5 uppercase font-bold cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 font-mono">
              <span className="text-[10px] text-[#9b8e87] uppercase tracking-wider">OFFICER IDENTITY</span>
              <button 
                onClick={() => {
                  setShowAuthModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-[#3d2b1f] hover:bg-[#4f453f] text-[#ede0d9] border border-[#705a4c] py-2 text-xs uppercase font-bold tracking-wider cursor-pointer text-center"
              >
                Authenticate Sign In
              </button>
            </div>
          )}
        </div>

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

      {/* Side Navigation Drawer (Desktop) */}
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
            { id: "evidence-board", label: "Evidence Board", icon: "grid_view", fill: true },
            { id: "case-dossiers", label: "Case Dossiers", icon: "folder_open" },
            { id: "precinct-report", label: "Precinct Report", icon: "query_stats" },
            { id: "terminal-setting", label: "Terminal Setting", icon: "settings" },
            { id: "evidence-analysis", label: "Evidence Analysis", icon: "analytics" },
            { id: "field-manual", label: "Field Manual", icon: "description" },
          ].map((item) => {
            const isActive = item.id === "evidence-board";
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
        
        {/* User Identity widget inside desktop navigation */}
        <div className="px-4 py-3 border-t border-outline-variant bg-surface-container-high mt-4">
          {currentUser ? (
            <div className="flex flex-col gap-1 font-mono text-left">
              <span className="text-[10px] text-outline uppercase tracking-wider">OFFICER IDENTITY ({currentUser.city || "NEW YORK"})</span>
              <div className="flex justify-between items-center bg-surface-dim border border-outline-variant p-2">
                <span className="text-xs font-bold text-[#dec1af] uppercase tracking-wide truncate pr-2">
                  {currentUser.username}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="text-[9px] text-[#92030f] hover:text-[#ffb4ac] border border-[#92030f] px-1.5 py-0.5 uppercase font-bold cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 font-mono text-left">
              <span className="text-[10px] text-outline uppercase tracking-wider">OFFICER IDENTITY</span>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-[#3d2b1f] hover:bg-[#4f453f] text-[#ede0d9] border border-[#705a4c] py-2 text-xs uppercase font-bold tracking-wider cursor-pointer text-center"
              >
                Authenticate Sign In
              </button>
            </div>
          )}
        </div>

        <div className="mt-auto p-6 text-center border-t border-outline-variant">
          <button 
            onClick={() => onNavigate("new-case-intake")}
            className="bg-primary-container text-on-primary-container border-2 border-outline-variant px-4 py-2 font-label-lg font-bold w-full shadow-[2px_2px_0px_rgba(0,0,0,0.5)] hover:bg-surface-variant transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span> NEW LEAD
          </button>
        </div>
      </nav>

      {/* Main Content Area - The Evidence Board */}
      <main className="flex-1 mt-16 md:mt-0 md:ml-64 relative overflow-auto corkboard-bg h-full">
        {/* Desktop Header Overlay */}
        <div className="hidden md:block absolute top-6 left-8 z-30 bg-surface-container-high border-2 border-outline-variant p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] transform -rotate-1">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="material-symbols-outlined text-secondary opacity-80">push_pin</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-widest border-b-2 border-primary border-dashed pb-2">METROPOLIS CIVIC PORTAL</h1>
          <p className="font-label-lg text-label-lg text-on-surface-variant mt-2">ACTIVE DISPATCH BOARD: DOWNTOWN SECTOR</p>
        </div>

        {issues.length === 0 ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] md:min-h-screen p-6">
            <div className="bg-[#F4EFE6] p-card-padding shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] text-center text-on-secondary-fixed transform rotate-1 relative max-w-md mx-auto">
              <div className="absolute top-4 left-4 w-6 h-1 bg-gray-600 shadow-sm rotate-45"></div>
              <h3 className="font-headline-sm text-on-secondary-fixed mb-2 uppercase text-lg">NO ACTIVE LEADS</h3>
              <p className="text-xs leading-relaxed text-on-secondary-fixed opacity-80">
                The precinct board is currently bare. Use the "New Case Intake" camera protocol to file our first civic anomaly.
              </p>
              <button
                onClick={() => onNavigate("new-case-intake")}
                className="mt-6 stamp-button font-headline-sm text-sm hover:bg-surface-variant transition-colors cursor-pointer"
              >
                FILE FIRST LEAD
              </button>
            </div>
          </div>
        ) : (
          /* The Canvas - Scrollable Container */
          <div 
            className="w-[2000px] relative p-10 select-none" 
            style={{ height: `${canvasHeight}px` }}
            id="board-canvas"
          >
            {/* Map Underlay Details */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none" 
              style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, #4f453f 10px, #4f453f 11px)" }}
            ></div>

            {/* Strings/Threads Canvas */}
            <svg className="absolute inset-0 pointer-events-none z-10" width="2000" height={canvasHeight}>
              <defs>
                <filter id="stringShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
                </filter>
              </defs>
              
              {threads.map((thread) => (
                <line
                  key={thread.id}
                  x1={thread.x1}
                  y1={thread.y1}
                  x2={thread.x2}
                  y2={thread.y2}
                  stroke={thread.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#stringShadow)"
                />
              ))}
            </svg>

            {/* Dynamic Issue Polaroid Cards */}
            {[...issues].sort((a, b) => (b.votes || 0) - (a.votes || 0)).map((issue, index) => {
              const { rotation, left, top } = getDeterministicStyles(issue.id, index);
              const isResolved = (issue.status || "").toUpperCase() === "RESOLVED";
              const pinColorClass = isResolved ? "pin-green" : "pin-red";
              const shortId = issue.id.slice(-4).toUpperCase();

              return (
                <div
                  key={issue.id}
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    transform: `rotate(${rotation}deg)`
                  }}
                  onClick={() => setSelectedIssue(issue)}
                  className="absolute polaroid w-48 z-20 cursor-pointer hover:scale-105 hover:rotate-0 transition-all duration-200 select-none"
                >
                  {/* Pushpin Visual */}
                  <div className={`pin ${pinColorClass}`}></div>

                  {/* Evidence Photo */}
                  <div 
                    className="h-40 w-full mb-3 border-b-4 border-white bg-cover bg-center bg-no-repeat bg-surface-dim relative"
                    style={{ backgroundImage: `url('${issue.imageDataUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAhdD9IZzmufPz_XPSBY7owgAxFi1ptkQ9-6YRhoOSBYo7fkbMjbYUvS9afeTEjvRYpaG9FyBAuc2tdrdp05wytZpT9QiMYqKa6HN-6MgSDlikf_3k1RLo_gQr9vGRhRjpVB7YXUYrrJ2g3baTuwxEnDREgkW5LyFD8oSbeHwwHkXBJd-HP4TNy0k__VwGn_kftNvYHdDESKwJpKvFfrNkS8aMnFHwnChCxNqXHuFBUtE5c2KMYl_HUU-Z7naDZc5_cqkjc0isXDFdg"}')` }}
                  >
                    {/* Vote Badge */}
                    <div className="absolute top-2 left-2 bg-[#7c2d12] text-[#ffedd5] border border-[#ea580c] px-1.5 py-0.5 text-[9px] font-mono font-bold flex items-center gap-0.5 shadow-md rounded">
                      <span className="material-symbols-outlined text-[11px] text-orange-400">bolt</span>
                      <span>{issue.votes || 0}</span>
                    </div>

                    {isResolved && (
                      <div className="absolute bottom-2 right-2 text-green-800 font-bold font-headline-sm transform -rotate-12 opacity-90 border-2 border-green-800 px-1 text-[10px] bg-[#F4EFE6] shadow-sm tracking-wider">
                        RESOLVED
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <div className="font-label-sm text-black opacity-80 typewriter-input inline-block text-[11px] font-mono whitespace-nowrap overflow-hidden text-ellipsis w-full pb-1">
                    EXH-{shortId}: {issue.incidentType}
                  </div>
                </div>
              );
            })}

            {/* AI Analysis Note (Witness Document Style) */}
            <div
              style={{
                left: `${aiCardStyles.left}px`,
                top: `${aiCardStyles.top}px`,
                transform: `rotate(${aiCardStyles.rotation}deg)`
              }}
              onClick={() => mostRecentIssue && setSelectedIssue(mostRecentIssue)}
              className="absolute bg-[#F4EFE6] p-4 w-56 border border-outline-variant shadow-[4px_4px_8px_rgba(0,0,0,0.5)] z-20 hover:scale-105 hover:rotate-0 transition-all duration-200 text-on-secondary-fixed cursor-pointer select-none"
            >
              {/* Pushpin Visual */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-600 rounded-full border border-red-800 shadow-md flex items-center justify-center z-20">
                <div className="w-1.5 h-1.5 bg-red-300 rounded-full"></div>
              </div>

              <div className="absolute top-2 left-2 text-outline opacity-60">
                <span className="material-symbols-outlined text-sm">attach_file</span>
              </div>
              
              <h3 className="font-headline-sm text-black mt-4 border-b border-black pb-1 uppercase tracking-wider text-sm">
                AI ANALYSIS
              </h3>
              
              {mostRecentIssue ? (
                <>
                  <p className="font-label-sm text-[10px] text-red-900 font-bold mt-1.5 uppercase font-mono">
                    TARGET: #{mostRecentIssue.id}
                  </p>
                  <p className="font-label-sm text-black mt-2 opacity-80 line-clamp-5 font-mono leading-relaxed text-[11px] h-24 overflow-hidden">
                    {mostRecentIssue.description ? mostRecentIssue.description : "Awaiting AI analysis..."}
                  </p>
                </>
              ) : (
                <p className="font-label-sm text-black mt-2 opacity-80 line-clamp-5 font-mono leading-relaxed text-[11px] h-24 overflow-hidden">
                  No active case files loaded.
                </p>
              )}
              
              <div className="mt-4 bg-tertiary-container text-tertiary px-2 py-0.5 text-[10px] font-bold inline-block border border-tertiary transform -rotate-6">
                AI VERIFIED
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Polished Full-Screen AI Analysis Detail Screen */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-[#18120e] z-[100] overflow-y-auto">
          <EvidenceAnalysis
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* Bottom Navigation Bar (Mobile Only) */}
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
          className="flex flex-col items-center justify-center text-tertiary font-bold scale-110 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
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

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={(username) => {
            setCurrentUser({ username });
          }}
        />
      )}
    </div>
  );
}

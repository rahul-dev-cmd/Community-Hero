import React, { useState, useEffect } from "react";
import { Issue } from "../types";
import EvidenceAnalysis from "./EvidenceAnalysis";

interface CaseDossiersProps {
  onNavigate: (tab: string) => void;
}

export default function CaseDossiers({ onNavigate }: CaseDossiersProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if there's a logged in user
  const loggedInUserStr = localStorage.getItem("civic_user");
  const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;
  const loggedInUsername = loggedInUser ? loggedInUser.username : "";

  // If logged in, use their username as the identifier for filtering dossiers; otherwise fallback to guest sessionId
  const sessionId = loggedInUsername || localStorage.getItem("chSessionId") || "";

  useEffect(() => {
    const fetchIssues = () => {
      fetch("/api/issues")
        .then((res) => res.json())
        .then((data) => {
          setIssues(data);
          setLoading(false);
          // Keep the selectedIssue updated if it is currently open
          setSelectedIssue((prev) => {
            if (!prev) return null;
            const updated = data.find((item: Issue) => item.id === prev.id);
            return updated || prev;
          });
        })
        .catch((err) => {
          console.error("Failed to fetch issues in Dossier", err);
          setLoading(false);
        });
    };

    fetchIssues();
    const interval = setInterval(fetchIssues, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter client-side into two groups
  // Cases filed by you
  const filedIssues = issues.filter((issue) => issue.reporterSessionId === sessionId);
  
  // Cases confirmed by you (and not filed by you, to deduplicate as requested)
  const confirmedIssues = issues.filter(
    (issue) => issue.confirmedBy?.includes(sessionId) && issue.reporterSessionId !== sessionId
  );

  const getStatusStamp = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case "RESOLVED":
        return {
          text: "RESOLVED",
          bg: "bg-[#1c3d2b] text-[#e0f1e8] border-[#3e7d5b]",
        };
      case "IN_PROGRESS":
        return {
          text: "IN PROGRESS",
          bg: "bg-[#3d2b1f] text-[#ede0d9] border-[#705a4c]",
        };
      case "VERIFIED":
        return {
          text: "VERIFIED",
          bg: "bg-[#660007] text-[#ffdad6] border-[#ffb4ac]",
        };
      default:
        return {
          text: "REPORTED",
          bg: "bg-[#251e1a] text-[#9b8e87] border-[#4f453f]",
        };
    }
  };

  const getSeverityStyle = (sev?: string) => {
    if (!sev) return "text-[#d2c4bc] bg-[#251e1a] border-[#4f453f]";
    const s = sev.toUpperCase();
    if (s === "HIGH") {
      return "text-[#ffdad6] bg-[#660007] border-[#ffb4ac]";
    } else if (s === "LOW") {
      return "text-[#d2c4bc] bg-[#251e1a] border-[#4f453f]";
    } else {
      return "text-[#dec1af] bg-[#3d2b1f] border-[#705a4c]";
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
            className="material-symbols-outlined text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors p-2 rounded-full cursor-pointer"
          >
            menu
          </span>
          <h1 className="font-headline-md text-headline-md text-primary uppercase tracking-widest text-base">CASE DOSSIERS</h1>
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
            { id: "case-dossiers", label: "Case Dossiers", icon: "folder_open", fill: true },
            { id: "precinct-report", label: "Precinct Report", icon: "query_stats" },
            { id: "terminal-setting", label: "Terminal Setting", icon: "settings" },
            { id: "evidence-analysis", label: "Evidence Analysis", icon: "analytics" },
            { id: "field-manual", label: "Field Manual", icon: "description" },
          ].map((item) => {
            const isActive = item.id === "case-dossiers";
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
            { id: "case-dossiers", label: "Case Dossiers", icon: "folder_open", fill: true },
            { id: "precinct-report", label: "Precinct Report", icon: "query_stats" },
            { id: "terminal-setting", label: "Terminal Setting", icon: "settings" },
            { id: "evidence-analysis", label: "Evidence Analysis", icon: "analytics" },
            { id: "field-manual", label: "Field Manual", icon: "description" },
          ].map((item) => {
            const isActive = item.id === "case-dossiers";
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
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Section Header (Desktop Only) */}
          <div className="hidden md:block mb-8 bg-surface-container-high border-2 border-outline-variant p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] transform -rotate-[0.5deg] max-w-xl">
            <div className="absolute top-0 right-4 transform -translate-y-1/2">
              <span className="material-symbols-outlined text-secondary opacity-80">folder_shared</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-widest border-b-2 border-primary border-dashed pb-2">
              PERSONAL CASE LOGS
            </h1>
            <p className="font-label-lg text-label-lg text-on-surface-variant mt-2">
              SECURE DOSSIER REGISTRY • SYSTEM SESSION ID: {sessionId.slice(0, 15)}...
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-primary font-bold animate-pulse uppercase text-base">
              &gt; ACCESSING ENCRYPTED FILE REGISTRY...
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              
              {/* SECTION 1: CASES YOU FILED */}
              <div>
                <div className="border-b-2 border-outline-variant pb-2 mb-6 flex justify-between items-center">
                  <h3 className="font-headline-sm text-primary tracking-widest uppercase text-lg">
                    Cases You Filed ({filedIssues.length})
                  </h3>
                  <span className="text-[10px] text-outline uppercase font-mono tracking-wider">
                    DEVICES REPORTS
                  </span>
                </div>

                {filedIssues.length === 0 ? (
                  <div className="bg-surface-container border border-outline-variant border-dashed p-6 text-center text-outline font-mono text-xs leading-relaxed my-4">
                    &gt;&gt; LOG STATUS: EMPTY
                    <p className="mt-2 text-on-surface font-sans">
                      No active leads filed yet. Tap File New Lead to start your first case.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {filedIssues.map((issue) => {
                      const stamp = getStatusStamp(issue.status);
                      const isAlsoConfirmed = issue.confirmedBy?.includes(sessionId);
                      const shortId = issue.id.slice(-5).toUpperCase();

                      return (
                        <div
                          key={issue.id}
                          onClick={() => setSelectedIssue(issue)}
                          className="bg-surface-container-low border-2 border-outline-variant hover:border-primary p-4 md:p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.5)] transition-all cursor-pointer flex flex-col md:flex-row gap-6 hover:bg-surface-variant group"
                        >
                          {/* Left: Thumbnail image with retro border */}
                          <div className="w-24 h-24 bg-[#F4EFE6] p-1.5 shadow-md border border-[#4f453f] flex-shrink-0 flex items-center justify-center overflow-hidden self-center md:self-start relative">
                            {issue.imageDataUrl ? (
                              <img
                                src={issue.imageDataUrl}
                                alt={issue.incidentType}
                                className="w-full h-full object-cover filter contrast-125 brightness-90 grayscale-[20%]"
                                referrerPolicy="no-referrer"
                              />
                            ) : issue.videoDataUrl ? (
                              <div className="w-full h-full bg-[#130d09] flex flex-col items-center justify-center text-primary text-[8px] text-center p-1 font-mono">
                                <span className="material-symbols-outlined text-3xl mb-1 text-[#92030f] animate-pulse">videocam</span>
                                <span className="text-[#92030f]">VIDEO LEAD</span>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-[#130d09] flex flex-col items-center justify-center text-[#9b8e87] text-[8px] text-center p-1 font-mono">
                                <span className="material-symbols-outlined text-lg opacity-40">image_not_supported</span>
                                <span>NO IMAGE</span>
                              </div>
                            )}
                            {issue.videoDataUrl && issue.imageDataUrl && (
                              <div className="absolute bottom-1 right-1 bg-primary text-[#F4EFE6] p-0.5 rounded shadow-sm flex items-center justify-center">
                                <span className="material-symbols-outlined text-[12px] font-bold">videocam</span>
                              </div>
                            )}
                          </div>

                          {/* Right: Metadata + Case History Log */}
                          <div className="flex-1 flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div>
                                <span className="text-[10px] font-mono tracking-widest text-outline block uppercase">
                                  EXH-{shortId} • {new Date(issue.createdAt).toLocaleDateString()}
                                </span>
                                <h4 className="font-headline-sm text-on-surface font-bold text-base md:text-lg tracking-wide uppercase mt-0.5 group-hover:text-primary transition-colors">
                                  {issue.incidentType}
                                </h4>
                              </div>

                              {/* Status stamps & tags */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold tracking-wider uppercase border ${stamp.bg}`}>
                                  {stamp.text}
                                </span>
                                <span className="bg-primary/20 text-primary px-2 py-0.5 border border-primary/30 rounded text-[9px] font-mono tracking-wider font-bold uppercase">
                                  FILED BY YOU
                                </span>
                                {isAlsoConfirmed && (
                                  <span className="bg-tertiary-container text-tertiary px-2 py-0.5 border border-tertiary/30 rounded text-[9px] font-mono tracking-wider font-bold uppercase">
                                    CONFIRMED BY YOU
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Case History Log Section */}
                            <div className="flex flex-col gap-2 border-t border-dashed border-outline-variant/50 pt-3">
                              <span className="text-[9px] font-mono text-outline uppercase tracking-wider block">
                                INLINE INCIDENT LOGS:
                              </span>
                              <div className="flex flex-col gap-2 bg-[#130d09] border border-[#4f453f] p-3 max-h-[120px] overflow-y-auto custom-scrollbar">
                                {Array.isArray(issue.caseHistory) && issue.caseHistory.length > 0 ? (
                                  issue.caseHistory.map((historyItem, idx) => (
                                    <div key={idx} className="flex flex-col gap-0.5 border-b border-dashed border-[#4f453f]/40 pb-1.5 last:border-0 last:pb-0 text-[10px]">
                                      <div className="flex justify-between items-center text-[#ede0d9]">
                                        <span className="font-bold">&gt; {historyItem.action}</span>
                                      </div>
                                      <span className="text-[9px] text-[#9b8e87]">
                                        {new Date(historyItem.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-[#9b8e87] italic font-mono">
                                    No logs registered.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: CASES YOU CONFIRMED */}
              <div>
                <div className="border-b-2 border-outline-variant pb-2 mb-6 flex justify-between items-center mt-4">
                  <h3 className="font-headline-sm text-primary tracking-widest uppercase text-lg">
                    Cases You Confirmed ({confirmedIssues.length})
                  </h3>
                  <span className="text-[10px] text-outline uppercase font-mono tracking-wider">
                    INVESTIGATOR STAMP
                  </span>
                </div>

                {confirmedIssues.length === 0 ? (
                  <div className="bg-surface-container border border-outline-variant border-dashed p-6 text-center text-outline font-mono text-xs leading-relaxed my-4">
                    &gt;&gt; LOG STATUS: EMPTY
                    <p className="mt-2 text-on-surface font-sans">
                      No active verified cases registered. Browse the Evidence Board to stamp and confirm citizen leads.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {confirmedIssues.map((issue) => {
                      const stamp = getStatusStamp(issue.status);
                      const shortId = issue.id.slice(-5).toUpperCase();

                      return (
                        <div
                          key={issue.id}
                          onClick={() => setSelectedIssue(issue)}
                          className="bg-surface-container-low border-2 border-outline-variant hover:border-primary p-4 md:p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.5)] transition-all cursor-pointer flex flex-col md:flex-row gap-6 hover:bg-surface-variant group"
                        >
                          {/* Left: Thumbnail image with retro border */}
                          <div className="w-24 h-24 bg-[#F4EFE6] p-1.5 shadow-md border border-[#4f453f] flex-shrink-0 flex items-center justify-center overflow-hidden self-center md:self-start relative">
                            {issue.imageDataUrl ? (
                              <img
                                src={issue.imageDataUrl}
                                alt={issue.incidentType}
                                className="w-full h-full object-cover filter contrast-125 brightness-90 grayscale-[20%]"
                                referrerPolicy="no-referrer"
                              />
                            ) : issue.videoDataUrl ? (
                              <div className="w-full h-full bg-[#130d09] flex flex-col items-center justify-center text-primary text-[8px] text-center p-1 font-mono">
                                <span className="material-symbols-outlined text-3xl mb-1 text-[#92030f] animate-pulse">videocam</span>
                                <span className="text-[#92030f]">VIDEO LEAD</span>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-[#130d09] flex flex-col items-center justify-center text-[#9b8e87] text-[8px] text-center p-1 font-mono">
                                <span className="material-symbols-outlined text-lg opacity-40">image_not_supported</span>
                                <span>NO IMAGE</span>
                              </div>
                            )}
                            {issue.videoDataUrl && issue.imageDataUrl && (
                              <div className="absolute bottom-1 right-1 bg-primary text-[#F4EFE6] p-0.5 rounded shadow-sm flex items-center justify-center">
                                <span className="material-symbols-outlined text-[12px] font-bold">videocam</span>
                              </div>
                            )}
                          </div>

                          {/* Right: Metadata + Case History Log */}
                          <div className="flex-1 flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div>
                                <span className="text-[10px] font-mono tracking-widest text-outline block uppercase">
                                  EXH-{shortId} • {new Date(issue.createdAt).toLocaleDateString()}
                                </span>
                                <h4 className="font-headline-sm text-on-surface font-bold text-base md:text-lg tracking-wide uppercase mt-0.5 group-hover:text-primary transition-colors">
                                  {issue.incidentType}
                                </h4>
                              </div>

                              {/* Status stamps & tags */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold tracking-wider uppercase border ${stamp.bg}`}>
                                  {stamp.text}
                                </span>
                                <span className="bg-tertiary-container text-tertiary px-2 py-0.5 border border-tertiary/30 rounded text-[9px] font-mono tracking-wider font-bold uppercase">
                                  CONFIRMED BY YOU
                                </span>
                              </div>
                            </div>

                            {/* Case History Log Section */}
                            <div className="flex flex-col gap-2 border-t border-dashed border-outline-variant/50 pt-3">
                              <span className="text-[9px] font-mono text-outline uppercase tracking-wider block">
                                INLINE INCIDENT LOGS:
                              </span>
                              <div className="flex flex-col gap-2 bg-[#130d09] border border-[#4f453f] p-3 max-h-[120px] overflow-y-auto custom-scrollbar">
                                {Array.isArray(issue.caseHistory) && issue.caseHistory.length > 0 ? (
                                  issue.caseHistory.map((historyItem, idx) => (
                                    <div key={idx} className="flex flex-col gap-0.5 border-b border-dashed border-[#4f453f]/40 pb-1.5 last:border-0 last:pb-0 text-[10px]">
                                      <div className="flex justify-between items-center text-[#ede0d9]">
                                        <span className="font-bold">&gt; {historyItem.action}</span>
                                      </div>
                                      <span className="text-[9px] text-[#9b8e87]">
                                        {new Date(historyItem.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-[#9b8e87] italic font-mono">
                                    No logs registered.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>

      {/* Persistent Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden bg-surface-container-highest dark:bg-surface-container-highest text-primary fixed bottom-0 left-0 w-full h-16 flex justify-around items-center z-50 px-4 border-t-2 border-outline-variant shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.4)]">
        <button 
          onClick={() => onNavigate("case-dossiers")}
          className="flex flex-col items-center justify-center text-tertiary font-bold scale-110 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
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

      {/* Full-screen AI Analysis Overlay */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-[#18120e] z-[100] overflow-y-auto">
          <EvidenceAnalysis
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </div>
  );
}

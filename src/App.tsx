import React, { useState, useEffect } from "react";
import NewCaseIntake from "./components/NewCaseIntake";
import EvidenceBoard from "./components/EvidenceBoard";
import FieldManual from "./components/FieldManual";
import TerminalSetting from "./components/TerminalSetting";
import PrecinctPlaceholder from "./components/Placeholders";
import PrecinctReport from "./components/PrecinctReport";
import CaseDossiers from "./components/CaseDossiers";
import AIAnalysisLab from "./components/AIAnalysisLab";
import AuthModal from "./components/AuthModal";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("evidence-board");
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(() => {
    const saved = localStorage.getItem("civic_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    // Generate a random session ID if it doesn't exist
    if (!localStorage.getItem("chSessionId")) {
      const randomId = "session_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
      localStorage.setItem("chSessionId", randomId);
    }
  }, []);

  // Sync state with localStorage to catch logins or logouts instantly
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("civic_user");
      setCurrentUser(saved ? JSON.parse(saved) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    // Also run a short periodic check because standard "storage" listener only fires on external tabs
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const renderActiveTab = () => {
    switch (currentTab) {
      case "new-case-intake":
        return <NewCaseIntake onNavigate={setCurrentTab} />;
      case "evidence-board":
        return <EvidenceBoard onNavigate={setCurrentTab} />;
      case "field-manual":
        return <FieldManual onNavigate={setCurrentTab} />;
      case "terminal-setting":
        return <TerminalSetting onNavigate={setCurrentTab} />;
      case "case-dossiers":
        return <CaseDossiers onNavigate={setCurrentTab} />;
      case "precinct-report":
        return <PrecinctReport onNavigate={setCurrentTab} />;
      case "evidence-analysis":
        return <AIAnalysisLab onNavigate={setCurrentTab} />;
      default:
        return <EvidenceBoard onNavigate={setCurrentTab} />;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0d0907] flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono text-[#ede0d9]">
        {/* Animated grid background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(to right, #92030f 1px, transparent 1px), linear-gradient(to bottom, #92030f 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        ></div>
        
        {/* Tactical scanning lines & gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(18,10,10,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
        
        <div className="w-full max-w-md text-center mb-6 z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#92030f]/10 border border-[#92030f]/30 text-[#dec1af] font-bold text-[10px] tracking-widest uppercase mb-4 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#92030f] animate-ping"></span>
            METROPOLIS CIVIC INTERACTION SYSTEM
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-[#dec1af] uppercase">
            CIVIC <span className="text-[#92030f]">DISPATCH</span>
          </h1>
          <p className="text-xs text-[#9b8e87] mt-1 uppercase tracking-widest">
            COMMUNITY CRISIS RESPONSE & EVIDENCE PORTAL
          </p>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <AuthModal 
            onClose={() => {}} 
            onSuccess={(username) => {
              setCurrentUser({ username });
            }}
            noClose={true}
          />
        </div>
        
        <div className="mt-8 text-center text-[10px] text-[#4f453f] z-10 select-none uppercase tracking-widest">
          SYSTEM_NODE: ONLINE // SECURE_ACCESS_REQUIRED
        </div>
      </div>
    );
  }

  return (
    <>
      {renderActiveTab()}
    </>
  );
}

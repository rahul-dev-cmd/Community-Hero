import React, { useState, useEffect } from "react";
import NewCaseIntake from "./components/NewCaseIntake";
import EvidenceBoard from "./components/EvidenceBoard";
import FieldManual from "./components/FieldManual";
import TerminalSetting from "./components/TerminalSetting";
import PrecinctPlaceholder from "./components/Placeholders";
import PrecinctReport from "./components/PrecinctReport";
import CaseDossiers from "./components/CaseDossiers";
import AIAnalysisLab from "./components/AIAnalysisLab";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("evidence-board");

  useEffect(() => {
    // Generate a random session ID if it doesn't exist
    if (!localStorage.getItem("chSessionId")) {
      const randomId = "session_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
      localStorage.setItem("chSessionId", randomId);
    }
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

  return (
    <>
      {renderActiveTab()}
    </>
  );
}

import React, { useState, useEffect } from "react";
import { Issue } from "../types";
import { jsPDF } from "jspdf";
import AuthModal from "./AuthModal";

interface EvidenceAnalysisProps {
  issue: Issue;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export default function EvidenceAnalysis({ issue, onClose, onNavigate }: EvidenceAnalysisProps) {
  const [analyzing, setAnalyzing] = useState<boolean>(!issue.aiCategory);
  const [currentIssue, setCurrentIssue] = useState<Issue>(issue);
  const [aiData, setAiData] = useState<{
    aiCategory?: string;
    aiSeverity?: string;
    aiSummary?: string;
  }>({
    aiCategory: issue.aiCategory,
    aiSeverity: issue.aiSeverity,
    aiSummary: issue.aiSummary,
  });
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"analysis" | "geospatial" | "chat">("analysis");

  // Geospatial states
  const [mapsLoading, setMapsLoading] = useState<boolean>(false);
  const [mapsReport, setMapsReport] = useState<string>("");
  const [mapsChunks, setMapsChunks] = useState<any[]>([]);
  const [mapsError, setMapsError] = useState<string | null>(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Detective, I've loaded the case dossier. What details or action plans do you want to explore?" }
  ]);
  const [userQuery, setUserQuery] = useState<string>("");
  const [chatSending, setChatSending] = useState<boolean>(false);

  const handleFetchMapsGrounding = async () => {
    if (mapsReport) return; // Only fetch once
    setMapsLoading(true);
    setMapsError(null);
    try {
      const response = await fetch(`/api/issues/${currentIssue.id}/maps-grounding`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to compile geospatial data");
      const data = await response.json();
      setMapsReport(data.text);
      setMapsChunks(data.groundingChunks || []);
    } catch (err: any) {
      console.error("Geospatial fetch failed:", err);
      setMapsError("Uplink failed. Unable to query Google Maps database.");
    } finally {
      setMapsLoading(false);
    }
  };

  const generatePDFReport = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Header Banner block (Dark Slate theme accent)
      doc.setFillColor(24, 18, 14);
      doc.rect(0, 0, 210, 38, "F");

      // Title/Header text
      doc.setTextColor(237, 224, 217);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("METROPOLIS CIVIL DISPATCH SYSTEM", 15, 14);
      
      doc.setTextColor(146, 3, 15); // Rust colored stamp text
      doc.setFontSize(9);
      doc.setFont("Helvetica", "bold");
      doc.text("CLASSIFIED DOSSIER // HIGH CONFIDENTIALITY REPORT", 15, 20);

      doc.setTextColor(155, 142, 135);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`REPORTING SYSTEM ID: ${currentIssue.id.toUpperCase()}`, 15, 26);
      doc.text(`EXTRACTED ON: ${new Date().toLocaleString()}`, 15, 30);

      // Basic Evidence identity section
      doc.setTextColor(24, 18, 14);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("I. BASIC EVIDENCE & INCIDENT IDENTITY", 15, 50);
      
      doc.setDrawColor(112, 90, 76);
      doc.setLineWidth(0.5);
      doc.line(15, 52, 195, 52);

      // Metadata list
      const keys = [
        "EXHIBIT ID:", "INCIDENT TYPE:", "DATE SUBMITTED:", "CITIZEN SUBMITTER:",
        "CURRENT STATUS:", "GPS LATITUDE:", "GPS LONGITUDE:", "VERIFIED LOCATION:"
      ];
      
      const displayCategory = aiData.aiCategory || currentIssue.aiCategory || "Pending Scan";
      const displaySeverity = aiData.aiSeverity || currentIssue.aiSeverity || "Pending Assessment";
      const displaySummary = aiData.aiSummary || currentIssue.aiSummary || "Awaiting mainframe response.";

      const values = [
        currentIssue.id.toUpperCase(),
        currentIssue.incidentType,
        new Date(currentIssue.createdAt).toLocaleString(),
        currentIssue.userEmail || "Anonymous Citizen",
        currentIssue.status.toUpperCase(),
        currentIssue.location?.lat?.toFixed(6) || "N/A",
        currentIssue.location?.lng?.toFixed(6) || "N/A",
        currentIssue.location?.address || "Coordinates Only"
      ];

      doc.setFontSize(9);
      let currentY = 58;
      for (let i = 0; i < keys.length; i++) {
        doc.setTextColor(79, 69, 63);
        doc.setFont("Helvetica", "bold");
        doc.text(keys[i], 15, currentY);

        doc.setTextColor(24, 18, 14);
        doc.setFont("Helvetica", "normal");
        
        if (keys[i] === "VERIFIED LOCATION:") {
          const splitAddress = doc.splitTextToSize(values[i], 135);
          doc.text(splitAddress, 55, currentY);
          currentY += (splitAddress.length * 4.5);
        } else {
          doc.text(values[i], 55, currentY);
          currentY += 6;
        }
      }

      // Citizen intelligence narrative box
      currentY += 4;
      doc.setTextColor(24, 18, 14);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("II. WITNESS & CITIZEN INTELLIGENCE STATEMENT", 15, currentY);
      
      currentY += 2;
      doc.line(15, currentY, 195, currentY);
      
      currentY += 6;
      doc.setFillColor(244, 239, 230); // light beige card accent background
      
      const descText = currentIssue.description || "No written narrative statement submitted by reporter.";
      const splitDesc = doc.splitTextToSize(`"${descText}"`, 170);
      const boxHeight = (splitDesc.length * 4.5) + 8;
      
      doc.rect(15, currentY - 4, 180, boxHeight, "F");
      doc.setDrawColor(140, 130, 117);
      doc.rect(15, currentY - 4, 180, boxHeight, "S");
      
      doc.setTextColor(37, 30, 26);
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(9.5);
      doc.text(splitDesc, 20, currentY + 1.5);
      
      currentY += boxHeight + 6;

      // AI classification box
      doc.setTextColor(24, 18, 14);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("III. MAINFRAME KORE-AI CLASSIFICATION ANALYSIS", 15, currentY);
      
      currentY += 2;
      doc.line(15, currentY, 195, currentY);
      
      currentY += 6;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      
      doc.setTextColor(79, 69, 63);
      doc.text("DETECTED CATEGORY:", 15, currentY);
      doc.setTextColor(24, 18, 14);
      doc.text(displayCategory.toUpperCase(), 55, currentY);
      
      currentY += 6;
      doc.setTextColor(79, 69, 63);
      doc.text("ASSESSED SEVERITY:", 15, currentY);
      const isHigh = displaySeverity.toUpperCase() === "HIGH";
      doc.setTextColor(isHigh ? 146 : 24, isHigh ? 3 : 18, isHigh ? 15 : 14);
      doc.text(displaySeverity.toUpperCase(), 55, currentY);
      
      currentY += 6;
      doc.setTextColor(79, 69, 63);
      doc.text("PRECINCT SUMMARY:", 15, currentY);
      
      doc.setTextColor(24, 18, 14);
      doc.setFont("Helvetica", "normal");
      const splitSummary = doc.splitTextToSize(displaySummary, 135);
      doc.text(splitSummary, 55, currentY);
      currentY += (splitSummary.length * 4.5) + 6;

      // Action and Transitions log
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setTextColor(24, 18, 14);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("IV. INCIDENT DISPATCH & REMEDIATION LOGS", 15, currentY);
      
      currentY += 2;
      doc.line(15, currentY, 195, currentY);
      
      currentY += 6;
      const history = Array.isArray(currentIssue.caseHistory) ? currentIssue.caseHistory : [];
      if (history.length === 0) {
        doc.setFont("Helvetica", "oblique");
        doc.setTextColor(110, 110, 110);
        doc.text("No formal transitions or municipal updates logged yet.", 20, currentY);
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        history.forEach((h: any) => {
          if (currentY > 275) {
            doc.addPage();
            currentY = 20;
          }
          doc.setTextColor(146, 3, 15);
          doc.setFont("Helvetica", "bold");
          doc.text(`[${new Date(h.timestamp).toLocaleString()}]`, 15, currentY);
          
          doc.setTextColor(24, 18, 14);
          doc.setFont("Helvetica", "normal");
          doc.text(`- ACTION: ${h.action.toUpperCase()}`, 55, currentY);
          
          currentY += 5.5;
        });
      }

      // Footer signature / confidentiality stamp
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(140, 130, 117);
      doc.text("METROPOLIS CIVIL INFRASTRUCTURE DISPATCH OFFICE. ALL INTELLIGENCE STAMPS VERIFIED SECURELY BY RED-VOUCHER ALGORITHM.", 15, 285);
      doc.text("PAGE 1 OF 1", 185, 285);

      const filename = `dossier_exhibit_${currentIssue.id.slice(-4).toUpperCase()}.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error("PDF generation failed:", e);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || chatSending) return;

    const newQuery = userQuery.trim();
    setUserQuery("");
    const updatedMessages = [...chatMessages, { role: "user", text: newQuery }];
    setChatMessages(updatedMessages);
    setChatSending(true);

    try {
      const response = await fetch(`/api/issues/${currentIssue.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });
      if (!response.ok) throw new Error("Assistant did not respond");
      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "assistant", text: data.text }]);
    } catch (err: any) {
      console.error("Chat message failed:", err);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "CONNECTION INTERRUPTED. Mainframe terminal is temporarily offline." }
      ]);
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    if (activeTab === "geospatial") {
      handleFetchMapsGrounding();
    }
  }, [activeTab]);

  // Check if there's a logged in user
  const loggedInUserStr = localStorage.getItem("civic_user");
  const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;
  const loggedInUsername = loggedInUser ? loggedInUser.username : "";

  // Use username if logged in; otherwise fallback to guest sessionId
  const sessionId = loggedInUsername || localStorage.getItem("chSessionId") || "";

  // Poll for real-time updates every 5 seconds
  useEffect(() => {
    const fetchLatestIssue = async () => {
      try {
        const res = await fetch(`/api/issues/${issue.id}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentIssue(data);
          // If we also loaded AI data, update it
          setAiData({
            aiCategory: data.aiCategory,
            aiSeverity: data.aiSeverity,
            aiSummary: data.aiSummary,
          });
        }
      } catch (err) {
        console.error("Failed to poll issue:", err);
      }
    };

    fetchLatestIssue(); // Initial fetch
    const interval = setInterval(fetchLatestIssue, 5000);
    return () => clearInterval(interval);
  }, [issue.id]);

  useEffect(() => {
    if (!issue.aiCategory) {
      // Trigger AI analysis fetch
      const triggerAnalysis = async () => {
        try {
          setAnalyzing(true);
          const response = await fetch(`/api/issues/${issue.id}/analyze`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) {
            throw new Error(`Analysis failed with status ${response.status}`);
          }
          const updatedIssue = await response.json();
          setCurrentIssue(updatedIssue);
          setAiData({
            aiCategory: updatedIssue.aiCategory,
            aiSeverity: updatedIssue.aiSeverity,
            aiSummary: updatedIssue.aiSummary,
          });
        } catch (err: any) {
          console.error("AI Analysis failed:", err);
          setError("Failed to run precinct AI categorization. Please try again.");
        } finally {
          setAnalyzing(false);
        }
      };
      
      // Delay slightly for dramatic scanner line loading effect
      const timer = setTimeout(() => {
        triggerAnalysis();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [issue.id, issue.aiCategory]);

  const handleVerify = async () => {
    if (!loggedInUsername) {
      setShowAuthModal(true);
      return;
    }
    if (!sessionId) return;
    setVerifying(true);
    try {
      const response = await fetch(`/api/issues/${currentIssue.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      if (!response.ok) {
        const errData = await response.json();
        alert(`VOUCHING ERROR: ${errData.error || "Failed to vouch for issue"}`);
      } else {
        const updated = await response.json();
        setCurrentIssue(updated);
      }
    } catch (err: any) {
      console.error("Vouching failed:", err);
      alert("Network conflict: Unable to submit vouch.");
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "IN_PROGRESS" | "RESOLVED") => {
    setStatusUpdating(true);
    try {
      const response = await fetch(`/api/issues/${currentIssue.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) {
        const errData = await response.json();
        alert(`STATUS TRANSITION ERROR: ${errData.error || "Failed to update status"}`);
      } else {
        const updated = await response.json();
        setCurrentIssue(updated);
      }
    } catch (err: any) {
      console.error("Status update failed:", err);
      alert("Network conflict: Unable to transition case status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const displayCategory = aiData.aiCategory || "";
  const displaySeverity = aiData.aiSeverity || "Medium";
  const displaySummary = aiData.aiSummary || "";

  const reporterSessionId = currentIssue.reporterSessionId || "";
  const confirmedBy = currentIssue.confirmedBy || [];
  const isReporter = sessionId === reporterSessionId;
  const hasAlreadyConfirmed = confirmedBy.includes(sessionId);
  const currentStatus = currentIssue.status || "REPORTED";

  // Check if confirmation button should be disabled (only if logged in and they reported or already confirmed, or if resolved)
  const cannotConfirm = currentStatus === "RESOLVED" || (!!loggedInUsername && (isReporter || hasAlreadyConfirmed));

  const getConfirmationNote = () => {
    if (currentStatus === "RESOLVED") {
      return "Case resolved";
    }
    if (!loggedInUsername) {
      return "Sign in to vouch";
    }
    if (isReporter) {
      return "You reported this case";
    }
    if (hasAlreadyConfirmed) {
      return "Already vouched";
    }
    return null;
  };

  // Pin color: red for reported, verified, in progress; green for resolved
  const isResolved = currentStatus === "RESOLVED";
  const pinColorClass = isResolved ? "bg-green-600 border-green-800" : "bg-red-600 border-red-800";
  const pinDotClass = isResolved ? "bg-green-300" : "bg-red-300";

  // Determine severity style classes based on color palette
  const getSeverityStyle = (sev: string) => {
    const s = sev.toUpperCase();
    if (s === "HIGH") {
      return "text-[#ffdad6] bg-[#660007] border border-[#ffb4ac] px-2 py-0.5 rounded text-[10px] tracking-wider font-sans font-bold";
    } else if (s === "LOW") {
      return "text-[#d2c4bc] bg-[#251e1a] border border-[#4f453f] px-2 py-0.5 rounded text-[10px] tracking-wider font-sans font-bold";
    } else {
      return "text-[#dec1af] bg-[#3d2b1f] border border-[#705a4c] px-2 py-0.5 rounded text-[10px] tracking-wider font-sans font-bold";
    }
  };

  const showMarkInProgress = currentStatus === "REPORTED" || currentStatus === "VERIFIED";
  const showMarkResolved = currentStatus === "IN_PROGRESS";

  return (
    <div className="min-h-screen w-full bg-[#18120e] text-[#ede0d9] pb-24 pt-4 md:pt-8 overflow-x-hidden flex flex-col items-center relative font-mono select-none">
      <div className="noise-bg"></div>
      
      {/* Top Banner (Stationery Header Style) */}
      <header className="w-full max-w-4xl px-4 mb-8 flex flex-col md:flex-row justify-between items-center border-b-2 border-[#4f453f] pb-4 z-10 gap-4">
        <div>
          <span className="text-[10px] tracking-widest text-[#9b8e87] block uppercase">
            METROPOLIS DISTRICT 04 CIVIC INCIDENTS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#dec1af] font-sans uppercase">
            RECONNAISSANCE ENGINE
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={generatePDFReport}
            className="flex items-center gap-2 border-2 border-red-700 hover:border-red-500 bg-red-950/40 hover:bg-red-950/80 px-4 py-2 transition-all cursor-pointer text-xs uppercase text-red-400 tracking-wider font-bold"
            title="Download this case dossier as a secure PDF"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            EXPORT PDF
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-2 border-2 border-[#4f453f] hover:border-[#dec1af] bg-[#251e1a] px-4 py-2 hover:bg-[#3d2b1f] transition-all cursor-pointer text-xs uppercase text-[#ede0d9] tracking-wider"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Evidence Board
          </button>
        </div>
      </header>

      {/* Main Content Pane */}
      <main className="w-full max-w-4xl px-4 flex flex-col md:flex-row items-center md:items-start justify-center gap-12 z-10 flex-grow py-4">
        
        {/* Left Side: Polaroid Card */}
        <div className="flex flex-col items-center">
          {/* Corkboard Mount Area */}
          <div className="relative p-12 bg-[#3d2b1f] rounded-lg shadow-2xl border border-[#4f453f] bg-[radial-gradient(#28180d_1px,transparent_1px)] bg-[size:8px_8px] flex items-center justify-center min-h-[440px] w-full max-w-[380px]">
            {/* Pushpin Visual */}
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-6 h-6 ${pinColorClass} rounded-full border shadow-md flex items-center justify-center z-30`}>
              <div className={`w-1.5 h-1.5 ${pinDotClass} rounded-full`}></div>
            </div>

            {/* Polaroid Container */}
            <div className="relative w-[290px] h-[330px] bg-[#F4EFE6] p-3 shadow-[8px_8px_20px_rgba(0,0,0,0.8)] border border-gray-300 transform -rotate-1 flex flex-col justify-between hover:rotate-0 transition-transform duration-300">
              
              {/* Image / Video Window */}
              <div className="relative w-full h-[220px] bg-black overflow-hidden border border-gray-900">
                {currentIssue.videoDataUrl ? (
                  <video
                    src={currentIssue.videoDataUrl}
                    controls
                    playsInline
                    className="w-full h-full object-cover filter contrast-125 brightness-90"
                  />
                ) : currentIssue.imageDataUrl ? (
                  <img
                    src={currentIssue.imageDataUrl}
                    alt="Reconnaissance Evidence"
                    className="w-full h-full object-cover filter contrast-125 brightness-90 grayscale-[20%]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-[#9b8e87] text-[10px]">
                    <span className="material-symbols-outlined text-3xl mb-2 opacity-50">image_not_supported</span>
                    NO IMAGE CAPTURED
                  </div>
                )}
                
                {/* Laser Scanning Bar */}
                <div 
                  className={`absolute left-0 right-0 h-1 bg-[#ff2d55] shadow-[0_0_15px_#ff2d55] z-10 ${
                    analyzing ? "scanner-line" : "scanner-line opacity-0 pointer-events-none"
                  }`}
                ></div>
              </div>

              {/* Polaroid Caption Label (Typewriter Stamped Style) */}
              <div className="text-center font-mono text-xs font-bold tracking-widest text-[#2d2722] py-2 border-t border-gray-300/40 uppercase">
                EXH-{currentIssue.id.slice(-5).toUpperCase()}: {currentIssue.incidentType}
              </div>

              {/* Dynamic Stamp Placement */}
              {!analyzing && displayCategory && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="stamp-slam transform -rotate-[22deg] border-4 border-[#92030f] text-[#92030f] font-sans font-extrabold text-2xl px-4 py-1.5 tracking-widest uppercase stamp-border select-none bg-transparent">
                    {displayCategory}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Under-photo Flashing Terminal Status */}
          {analyzing && (
            <div className="mt-4 flex items-center gap-2 text-[#ff2d55] animate-pulse font-bold text-sm tracking-wider uppercase">
              <span className="w-2.5 h-2.5 bg-[#ff2d55] rounded-full inline-block animate-ping"></span>
              ANALYZING EVIDENCE...
            </div>
          )}
        </div>

        {/* Right Side: AI Readout Details */}
        <div className="w-full max-w-[380px] flex flex-col gap-4">
          
          {/* Tab selector */}
          <div className="flex w-full bg-[#130d09] border-2 border-[#4f453f] p-1 gap-1 text-[10px] font-mono font-bold tracking-wider z-10">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`flex-1 py-2 text-center uppercase cursor-pointer transition-all ${
                activeTab === "analysis"
                  ? "bg-[#3d2b1f] text-[#ede0d9] border border-[#705a4c]"
                  : "text-[#9b8e87] hover:text-[#ede0d9]"
              }`}
            >
              Analysis
            </button>
            <button
              onClick={() => setActiveTab("geospatial")}
              className={`flex-1 py-2 text-center uppercase cursor-pointer transition-all ${
                activeTab === "geospatial"
                  ? "bg-[#3d2b1f] text-[#ede0d9] border border-[#705a4c]"
                  : "text-[#9b8e87] hover:text-[#ede0d9]"
              }`}
            >
              Geospatial
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-2 text-center uppercase cursor-pointer transition-all ${
                activeTab === "chat"
                  ? "bg-[#3d2b1f] text-[#ede0d9] border border-[#705a4c]"
                  : "text-[#9b8e87] hover:text-[#ede0d9]"
              }`}
            >
              Dossier Chat
            </button>
          </div>

          <div className="w-full bg-[#1a1412] border-2 border-[#4f453f] p-5 shadow-2xl relative overflow-hidden paper-texture min-h-[440px] flex flex-col">
            
            {/* Analysis Tab Content */}
            {activeTab === "analysis" && (
              <div className="flex flex-col flex-grow">
                {/* Header Stamp Detail */}
                <div className="border-b border-[#4f453f] pb-3 mb-4">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#9b8e87]">Precinct Analysis</div>
                  <h2 className="text-xl md:text-2xl font-bold font-sans tracking-wide text-[#ede0d9] uppercase mt-1">AI CLASSIFICATION</h2>
                </div>

                {error ? (
                  <div className="text-sm text-[#ffb4ab] bg-[#93000a]/20 p-3 border border-[#ffb4ab]/40 rounded font-mono leading-relaxed">
                    {error}
                  </div>
                ) : analyzing ? (
                  /* Skeleton Readout Lines while analyzing */
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="h-3 bg-[#4f453f]/30 w-1/3 rounded animate-pulse"></div>
                      <div className="h-4 bg-[#4f453f]/50 w-full rounded animate-pulse"></div>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-dashed border-[#4f453f] pt-3">
                      <div className="h-3 bg-[#4f453f]/30 w-1/4 rounded animate-pulse"></div>
                      <div className="h-6 bg-[#4f453f]/50 w-1/2 rounded animate-pulse"></div>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-dashed border-[#4f453f] pt-3">
                      <div className="h-3 bg-[#4f453f]/30 w-1/3 rounded animate-pulse"></div>
                      <div className="h-12 bg-[#4f453f]/30 w-full rounded animate-pulse"></div>
                    </div>
                  </div>
                ) : (
                  /* Structured AI readout */
                  <div className="font-mono text-sm text-[#d2c4bc] flex flex-col gap-4">
                    
                    {/* Field: Category */}
                    <div className="flex flex-col gap-1 border-b border-dashed border-[#4f453f] pb-3">
                      <span className="text-[#9b8e87] uppercase text-xs tracking-wider">CATEGORY:</span>
                      <span className="font-bold text-[#ede0d9] text-base uppercase font-sans tracking-wide">
                        {displayCategory}
                      </span>
                    </div>

                    {/* Field: Severity */}
                    <div className="flex flex-col gap-1 border-b border-dashed border-[#4f453f] pb-3">
                      <span className="text-[#9b8e87] uppercase text-xs tracking-wider">SEVERITY:</span>
                      <div className="mt-1">
                        <span className={getSeverityStyle(displaySeverity)}>
                          {displaySeverity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Field: Summary */}
                    <div className="flex flex-col gap-1 border-b border-dashed border-[#4f453f] pb-3">
                      <span className="text-[#9b8e87] uppercase text-xs tracking-wider">SUMMARY:</span>
                      <p className="text-[#ede0d9] leading-relaxed italic text-xs md:text-sm bg-[#130d09] p-3 border border-[#4f453f] mt-1">
                        "{displaySummary}"
                      </p>
                    </div>

                    {/* Field: Evidence ID */}
                    <div className="flex flex-col gap-1 border-b border-dashed border-[#4f453f] pb-3">
                      <span className="text-[#9b8e87] uppercase text-xs tracking-wider">EVIDENCE ID:</span>
                      <span className="font-bold text-[#dec1af] font-mono tracking-wider text-xs md:text-sm">
                        #{currentIssue.id}
                      </span>
                    </div>

                    {/* Case History Section */}
                    <div className="flex flex-col gap-2 pt-1">
                      <span className="text-[#9b8e87] uppercase text-xs tracking-wider">CASE HISTORY LOGGER:</span>
                      <div className="flex flex-col gap-2 bg-[#130d09] border border-[#4f453f] p-3 max-h-[140px] overflow-y-auto custom-scrollbar">
                        {Array.isArray(currentIssue.caseHistory) && currentIssue.caseHistory.length > 0 ? (
                          currentIssue.caseHistory.map((historyItem, idx) => (
                            <div key={idx} className="flex flex-col gap-0.5 border-b border-dashed border-[#4f453f]/40 pb-1.5 last:border-0 last:pb-0 text-xs">
                              <div className="flex justify-between items-center text-[#ede0d9]">
                                <span className="font-bold">&gt; {historyItem.action}</span>
                              </div>
                              <span className="text-[10px] text-[#9b8e87]">
                                {new Date(historyItem.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-[#9b8e87] italic">
                            No formal logs registered.
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Geospatial Maps Grounding Tab Content */}
            {activeTab === "geospatial" && (
              <div className="flex flex-col flex-grow font-mono text-sm text-[#d2c4bc]">
                <div className="border-b border-[#4f453f] pb-3 mb-4">
                  <div className="text-[11px] uppercase tracking-widest text-[#9b8e87]">Geospatial Intelligence</div>
                  <h2 className="text-xl md:text-2xl font-bold font-sans tracking-wide text-[#ede0d9] uppercase mt-1">MAPS GROUNDING</h2>
                </div>

                {mapsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 flex-grow">
                    <span className="material-symbols-outlined text-4xl text-[#ff2d55] animate-spin mb-4">orbit</span>
                    <span className="text-[11px] text-[#ff2d55] animate-pulse uppercase tracking-widest font-bold">Querying Google Maps...</span>
                  </div>
                ) : mapsError ? (
                  <div className="text-sm text-[#ffb4ab] bg-[#93000a]/20 p-3 border border-[#ffb4ab]/40 rounded leading-relaxed">
                    {mapsError}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 flex-grow">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#9b8e87] uppercase text-xs tracking-wider">ADDRESS STAMP:</span>
                      <span className="font-bold text-[#ede0d9] text-xs md:text-sm uppercase whitespace-normal break-words">
                        {currentIssue.location?.address || "Coordinates Only"}
                      </span>
                      <span className="text-[#9b8e87] text-xs">
                        Lat: {currentIssue.location?.lat.toFixed(5)}°, Lng: {currentIssue.location?.lng.toFixed(5)}°
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 border-t border-dashed border-[#4f453f] pt-2">
                      <span className="text-[#9b8e87] uppercase text-xs tracking-wider">GEOGRAPHIC INTEL BRIEFING:</span>
                      <p className="text-[#ede0d9] leading-relaxed text-xs md:text-sm bg-[#130d09] p-3 border border-[#4f453f] mt-1 whitespace-pre-wrap max-h-[140px] overflow-y-auto custom-scrollbar">
                        {mapsReport}
                      </p>
                    </div>

                    {mapsChunks.length > 0 && (
                      <div className="flex flex-col gap-1.5 border-t border-dashed border-[#4f453f] pt-2">
                        <span className="text-[#9b8e87] uppercase text-xs tracking-wider">VERIFIED MAP REFERENCES (CLICKABLE):</span>
                        <div className="flex flex-col gap-1 bg-[#130d09] p-2 border border-[#4f453f] max-h-[100px] overflow-y-auto custom-scrollbar">
                          {mapsChunks.map((chunk, idx) => {
                            const uri = chunk.maps?.uri || chunk.web?.uri;
                            const title = chunk.maps?.title || chunk.web?.title || `Google Maps Reference ${idx + 1}`;
                            if (!uri) return null;
                            return (
                              <a
                                key={idx}
                                href={uri}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs text-[#dec1af] hover:text-white underline break-all"
                              >
                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                {title}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dossier Interactive Chat Tab Content */}
            {activeTab === "chat" && (
              <div className="flex flex-col flex-grow font-mono text-sm text-[#d2c4bc]">
                <div className="border-b border-[#4f453f] pb-3 mb-3">
                  <div className="text-[11px] uppercase tracking-widest text-[#9b8e87]">Mainframe Terminal Link</div>
                  <h2 className="text-xl md:text-2xl font-bold font-sans tracking-wide text-[#ede0d9] uppercase mt-1">DOSSIER INTERACTIVE</h2>
                </div>

                {/* Messages feed */}
                <div className="flex-grow flex flex-col gap-2 overflow-y-auto max-h-[220px] mb-3 bg-[#130d09] border border-[#4f453f] p-3 custom-scrollbar">
                  {chatMessages.map((msg, idx) => {
                    const isAssistant = msg.role === "assistant";
                    return (
                      <div key={idx} className={`flex flex-col gap-0.5 ${isAssistant ? "items-start" : "items-end"}`}>
                        <span className="text-[10px] uppercase tracking-wider text-[#9b8e87]">
                          {isAssistant ? "KORE INTEL" : "INVESTIGATOR"}
                        </span>
                        <div
                          className={`p-2.5 rounded max-w-[85%] text-xs md:text-sm leading-relaxed ${
                            isAssistant
                              ? "bg-[#251e1a] text-[#ede0d9] border border-[#4f453f]/60"
                              : "bg-[#3d2b1f] text-[#ede0d9] border border-[#705a4c]"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  {chatSending && (
                    <div className="flex items-center gap-1.5 text-xs text-[#ff2d55] animate-pulse">
                      <span className="w-1.5 h-1.5 bg-[#ff2d55] rounded-full inline-block animate-ping"></span>
                      Officer Kore is compiling data...
                    </div>
                  )}
                </div>

                {/* Chat input form */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-[#4f453f] pt-3">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    disabled={chatSending}
                    placeholder="Type dispatch inquiry..."
                    className="flex-1 bg-[#130d09] border border-[#4f453f] px-3 py-2 text-xs md:text-sm text-[#ede0d9] focus:outline-none focus:border-[#dec1af] uppercase placeholder:text-[#4f453f]"
                  />
                  <button
                    type="submit"
                    disabled={chatSending || !userQuery.trim()}
                    className="bg-[#3d2b1f] hover:bg-[#4f453f] text-[#ede0d9] border border-[#705a4c] px-4 py-2 text-xs md:text-sm uppercase font-bold tracking-wider hover:text-white transition-colors cursor-pointer animate-none"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Action and Verification Block */}
          {!analyzing && (
            <div className="w-full bg-[#1a1412] border-2 border-[#4f453f] p-5 shadow-xl flex flex-col gap-3 relative paper-texture">
              <span className="font-bold text-[#dec1af] block uppercase text-[10px] tracking-wider border-b border-[#4f453f] pb-1 mb-1">
                CIVIC COUNTERMEASURES
              </span>
              
              {cannotConfirm ? (
                <div className="text-center font-mono text-[10px] text-[#9b8e87] tracking-wider border border-[#4f453f] border-dashed p-2 bg-[#130d09]/50">
                  &gt;&gt; VOUCHING SUSPENDED: {getConfirmationNote()?.toUpperCase()}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full bg-[#92030f] hover:bg-[#b00514] text-[#F4EFE6] font-sans font-extrabold text-[11px] py-2.5 px-4 tracking-widest uppercase border-2 border-[#ffb4ac] shadow-[3px_3px_0px_rgba(0,0,0,0.4)] transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    {verifying ? "VOUCHING..." : `VOUCH FOR THIS CASE (${currentIssue.verifyCount || 0} VOUCHES)`}
                  </button>
                  <p className="text-[9px] text-center text-[#9b8e87] italic">
                    *Every report is immediately dispatched to authorities. Vouches increase priority consideration rank.
                  </p>
                </div>
              )}

              {/* Advancing/Municipal transitions */}
              {(showMarkInProgress || showMarkResolved) && (
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-[9px] text-[#9b8e87] uppercase tracking-wider">PRECINCT LEVEL STATUS TRANSITION:</span>
                  <div className="flex gap-2 w-full">
                    {showMarkInProgress && (
                      <button
                        onClick={() => handleUpdateStatus("IN_PROGRESS")}
                        disabled={statusUpdating}
                        className="flex-1 bg-[#3d2b1f] hover:bg-[#4f453f] text-[#ede0d9] border border-[#705a4c] py-2 px-3 text-[10px] uppercase font-bold tracking-wider hover:text-white transition-all active:scale-95 cursor-pointer"
                      >
                        {statusUpdating ? "ADVANCING..." : "Mark In Progress"}
                      </button>
                    )}
                    {showMarkResolved && (
                      <button
                        onClick={() => handleUpdateStatus("RESOLVED")}
                        disabled={statusUpdating}
                        className="flex-1 bg-[#1c3d2b] hover:bg-[#25523a] text-[#e0f1e8] border border-[#3e7d5b] py-2 px-3 text-[10px] uppercase font-bold tracking-wider hover:text-white transition-all active:scale-95 cursor-pointer"
                      >
                        {statusUpdating ? "RESOLVING..." : "Mark Resolved"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Incident Context Note Card */}
          <div className="w-full bg-[#251e1a] border border-[#4f453f] p-4 text-[11px] leading-relaxed text-[#9b8e87]">
            <span className="font-bold text-[#dec1af] block uppercase text-[10px] tracking-wider mb-1">
              CITIZEN ACCOUNT
            </span>
            <p className="line-clamp-4 text-[#ede0d9]">
              {currentIssue.description || "No chronological report supplied."}
            </p>
            <div className="mt-3 border-t border-[#4f453f] pt-2 flex justify-between text-[9px] font-mono uppercase">
              <span>Status: {currentIssue.status}</span>
              <span>Logged: {new Date(currentIssue.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Persistent Bottom Navigation Bar (Matched to Mobile Specs) */}
      <nav className="md:hidden bg-surface-container-highest text-primary fixed bottom-0 left-0 w-full h-16 flex justify-around items-center z-50 px-4 border-t-2 border-outline-variant shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.4)]">
        <button 
          onClick={() => {
            onClose();
            onNavigate("case-dossiers");
          }}
          className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">folder_open</span>
          <span className="text-[9px] uppercase tracking-tighter mt-1">Dossiers</span>
        </button>

        <button 
          onClick={() => {
            onClose();
            onNavigate("new-case-intake");
          }}
          className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">add_box</span>
          <span className="text-[9px] uppercase tracking-tighter mt-1">Capture</span>
        </button>

        <button 
          onClick={() => {
            onClose(); // evidence board is the default or go back to board
          }}
          className="flex flex-col items-center justify-center text-tertiary font-bold scale-110 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
          <span className="text-[9px] uppercase tracking-tighter mt-1">Evidence</span>
        </button>

        <button 
          onClick={() => {
            onClose();
            onNavigate("terminal-setting");
          }}
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
            // Success callback handles any side effects; standard state will update on next read
          }}
        />
      )}
    </div>
  );
}

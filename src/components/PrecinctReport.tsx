import React, { useState, useEffect } from "react";
import { Issue } from "../types";
import EvidenceAnalysis from "./EvidenceAnalysis";
import { jsPDF } from "jspdf";

interface DashboardStats {
  totalReported: number;
  totalVerified: number;
  totalInProgress: number;
  totalResolved: number;
  categoryBreakdown: {
    "Pothole & Road Damage": number;
    "Water Leakage": number;
    Streetlight: number;
    "Waste Management": number;
    "Other Infrastructure": number;
  };
  topHotspotCategory: {
    category: string;
    count: number;
  };
}

interface PrecinctReportProps {
  onNavigate: (tab: string) => void;
}

export default function PrecinctReport({ onNavigate }: PrecinctReportProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    let city = "New York";
    try {
      const saved = localStorage.getItem("civic_user");
      const user = saved ? JSON.parse(saved) : null;
      if (user && user.city) {
        city = user.city;
      }
    } catch (e) {
      console.warn("Failed to parse civic_user in useEffect:", e);
    }

    Promise.all([
      fetch(`/api/dashboard-stats?city=${encodeURIComponent(city)}`).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }
        return res.json();
      }),
      fetch(`/api/issues?city=${encodeURIComponent(city)}`).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch issues");
        }
        return res.json();
      })
    ])
      .then(([statsData, issuesData]) => {
        setStats(statsData);
        setIssues(issuesData);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Dashboard statistics load failure:", err);
        setError("Unable to retrieve district case analytics. Link connection offline.");
        setLoading(false);
      });
  }, []);

  const exportPrecinctPDFReport = () => {
    if (!stats) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Header Banner Block
      doc.setFillColor(24, 18, 14);
      doc.rect(0, 0, 210, 38, "F");

      // Header Text
      doc.setTextColor(237, 224, 217);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("METROPOLIS CIVIL DISPATCH SYSTEM", 15, 14);
      
      doc.setTextColor(146, 3, 15); // Rust accent
      doc.setFontSize(9);
      doc.setFont("Helvetica", "bold");
      doc.text("DISTRICT 04 PRECINCT STATUS & METRIC REPORT", 15, 20);

      doc.setTextColor(155, 142, 135);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`EXTRACTED ON: ${new Date().toLocaleString()}`, 15, 26);
      doc.text("SECURITY LEVEL: DISTRICT-WIDE GENERAL INTEL", 15, 30);

      // Section I: Incident Statistics Breakdown
      doc.setTextColor(24, 18, 14);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("I. OVERALL STAGE & CASE VOLUME BREAKDOWN", 15, 50);
      
      doc.setDrawColor(112, 90, 76);
      doc.setLineWidth(0.5);
      doc.line(15, 52, 195, 52);

      // 3 Metrics
      const metrics = [
        { label: "REPORTED CASES", count: stats.totalReported },
        { label: "IN-PROGRESS CASES", count: stats.totalInProgress },
        { label: "RESOLVED CASES", count: stats.totalResolved }
      ];

      doc.setFontSize(9);
      let currentY = 60;
      metrics.forEach((m) => {
        doc.setTextColor(79, 69, 63);
        doc.setFont("Helvetica", "bold");
        doc.text(m.label + ":", 15, currentY);

        doc.setTextColor(24, 18, 14);
        doc.setFont("Helvetica", "normal");
        doc.text(String(m.count), 65, currentY);
        currentY += 6;
      });

      // Section II: Incident Category Indices
      currentY += 4;
      doc.setTextColor(24, 18, 14);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("II. INCIDENT CATEGORY CLASSIFICATION BREAKDOWN", 15, currentY);
      
      currentY += 2;
      doc.line(15, currentY, 195, currentY);
      
      currentY += 6;
      const breakdown = stats.categoryBreakdown || {
        "Pothole & Road Damage": 0,
        "Water Leakage": 0,
        Streetlight: 0,
        "Waste Management": 0,
        "Other Infrastructure": 0
      };

      const categories = Object.keys(breakdown);
      categories.forEach((cat) => {
        doc.setTextColor(79, 69, 63);
        doc.setFont("Helvetica", "bold");
        doc.text(cat.toUpperCase() + ":", 15, currentY);

        doc.setTextColor(24, 18, 14);
        doc.setFont("Helvetica", "normal");
        doc.text(String((breakdown as any)[cat]), 65, currentY);
        currentY += 6;
      });

      // Section III: Hotspot Categories
      currentY += 4;
      doc.setTextColor(24, 18, 14);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("III. CRITICAL HOTSPOT INTELLIGENCE BRIEFING", 15, currentY);
      
      currentY += 2;
      doc.line(15, currentY, 195, currentY);
      
      currentY += 6;
      doc.setFillColor(244, 239, 230); // Beige container background
      doc.rect(15, currentY - 4, 180, 20, "F");
      doc.setDrawColor(140, 130, 117);
      doc.rect(15, currentY - 4, 180, 20, "S");

      doc.setTextColor(37, 30, 26);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      
      if (stats.topHotspotCategory && stats.topHotspotCategory.count > 0) {
        doc.text(`CRITICAL HOTSPOT CATEGORY: ${stats.topHotspotCategory.category.toUpperCase()}`, 20, currentY + 3);
        doc.setFont("Helvetica", "normal");
        let infoStr = `Identified peak volume anomaly with a total of ${stats.topHotspotCategory.count} classified incidents.`;
        if (topVotedIssue) {
          infoStr = `Peak volume: ${stats.topHotspotCategory.count} cases. Most urgent concern: "${topVotedIssue.incidentType}" with ${topVotedIssue.votes} community votes.`;
        }
        doc.text(infoStr, 20, currentY + 8);
      } else {
        doc.text("CRITICAL HOTSPOT STATUS: NOMINAL", 20, currentY + 3);
        doc.setFont("Helvetica", "normal");
        doc.text("No critical volume peaks or anomalies registered at this time.", 20, currentY + 8);
      }

      currentY += 24;

      // Section IV: Incident Logs
      doc.setTextColor(24, 18, 14);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("IV. RECENT UNRESOLVED DISPATCH ENTRIES", 15, currentY);
      
      currentY += 2;
      doc.line(15, currentY, 195, currentY);
      
      currentY += 6;
      const activeLeads = issues.filter((i) => i.status !== "RESOLVED");
      
      if (activeLeads.length === 0) {
        doc.setFont("Helvetica", "oblique");
        doc.setTextColor(110, 110, 110);
        doc.text("All registered civic cases are resolved and verified.", 20, currentY);
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        activeLeads.slice(0, 15).forEach((lead) => {
          if (currentY > 275) {
            doc.addPage();
            currentY = 20;
          }
          doc.setTextColor(146, 3, 15);
          doc.setFont("Helvetica", "bold");
          doc.text(`[EXH-${lead.id.slice(-4).toUpperCase()}]`, 15, currentY);
          
          doc.setTextColor(24, 18, 14);
          doc.setFont("Helvetica", "normal");
          doc.text(`${lead.incidentType} - ${lead.status.toUpperCase()} (Submitter: ${lead.userEmail || "Anonymous"})`, 55, currentY);
          
          currentY += 5.5;
        });
      }

      // Footer
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(140, 130, 117);
      doc.text("METROPOLIS CIVIL INFRASTRUCTURE DISPATCH OFFICE. PUBLIC ACCESS LOG COPY.", 15, 285);
      doc.text("PAGE 1 OF 1", 185, 285);

      doc.save(`precinct_report_district04.pdf`);
    } catch (e) {
      console.error("Precinct Report PDF generation failed:", e);
    }
  };

  if (loading) {
    return (
      <div className="bg-background text-on-background font-body-md min-h-screen flex items-center justify-center">
        <div className="text-center py-12 text-primary font-bold animate-pulse uppercase text-lg">
          &gt; ACCESSING DATABASE ANALYTICS PROTOCOL...
        </div>
      </div>
    );
  }

  // Fallback default stats for empty or errored states
  const activeStats: DashboardStats = stats || {
    totalReported: 0,
    totalVerified: 0,
    totalInProgress: 0,
    totalResolved: 0,
    categoryBreakdown: {
      "Pothole & Road Damage": 0,
      "Water Leakage": 0,
      Streetlight: 0,
      "Waste Management": 0,
      "Other Infrastructure": 0,
    },
    topHotspotCategory: {
      category: "None",
      count: 0,
    },
  };

  const totalCases =
    activeStats.totalReported +
    activeStats.totalInProgress +
    activeStats.totalResolved;

  // Percentage helper for stacked progress bar
  const getPercentage = (count: number) => {
    if (totalCases === 0) return 0;
    return (count / totalCases) * 100;
  };

  const pctReported = getPercentage(activeStats.totalReported);
  const pctVerified = 0;
  const pctInProgress = getPercentage(activeStats.totalInProgress);
  const pctResolved = getPercentage(activeStats.totalResolved);

  let savedUser = null;
  try {
    const savedUserStr = localStorage.getItem("civic_user");
    savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  } catch (e) {
    console.warn("Failed to parse civic_user in PrecinctReport render:", e);
  }
  const currentCityName = savedUser ? savedUser.city : "New York";

  const sortedByVotes = [...issues].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const topVotedIssue = sortedByVotes.length > 0 && (sortedByVotes[0].votes || 0) > 0 ? sortedByVotes[0] : null;

  return (
    <div className="bg-background text-on-background font-body-md h-screen overflow-hidden flex flex-col md:flex-row relative">
      <div className="noise-bg"></div>

      {/* Top App Bar (Mobile) */}
      <header className="md:hidden bg-surface-container-highest dark:bg-surface-container-highest text-primary w-full border-b-2 border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] flex justify-between items-center px-margin-edge h-16 z-50 fixed top-0 left-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-on-surface-variant hover:bg-surface-variant transition-colors p-2 rounded-full cursor-pointer flex items-center justify-center"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline-md text-headline-md text-primary uppercase tracking-widest text-base">
            METRO REPORT
          </h1>
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
            { id: "precinct-report", label: "Precinct Report", icon: "query_stats", fill: true },
            { id: "terminal-setting", label: "Terminal Setting", icon: "settings" },
            { id: "evidence-analysis", label: "Evidence Analysis", icon: "analytics" },
            { id: "field-manual", label: "Field Manual", icon: "description" },
          ].map((item) => {
            const isActive = item.id === "precinct-report";
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

      {/* Side Navigation Drawer (Desktop) */}
      <nav className="hidden md:flex bg-surface-container-low text-primary h-full w-64 border-r-2 border-outline-variant shadow-[6px_0px_0px_0px_rgba(0,0,0,0.3)] fixed left-0 top-0 bottom-0 flex-col z-40 pt-6">
        <div className="px-6 mb-8 border-b border-outline-variant pb-4 relative">
          <div className="absolute top-2 right-2 text-outline opacity-50 transform rotate-12">
            <span className="material-symbols-outlined">attach_file</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm text-tertiary-fixed-dim uppercase tracking-wider">
            INVESTIGATION
          </h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 typewriter-input w-full pb-1">
            CASE FILE v1.0
          </p>
        </div>

        <ul className="flex flex-col gap-2 font-label-lg text-label-lg">
          {[
            { id: "evidence-board", label: "Evidence Board", icon: "grid_view" },
            { id: "case-dossiers", label: "Case Dossiers", icon: "folder_open" },
            { id: "precinct-report", label: "Precinct Report", icon: "query_stats" },
            { id: "terminal-setting", label: "Terminal Setting", icon: "settings" },
            { id: "evidence-analysis", label: "Evidence Analysis", icon: "analytics" },
            { id: "field-manual", label: "Field Manual", icon: "description" },
          ].map((item) => {
            const isActive = item.id === "precinct-report";
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
                  <span className="material-symbols-outlined">{item.icon}</span>
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
      <main className="flex-1 mt-16 md:mt-0 md:ml-64 relative overflow-auto corkboard-bg h-full p-6 md:p-8 flex flex-col gap-8">
        {/* Desktop Header Overlay */}
        <div className="hidden md:block bg-surface-container-high border-2 border-outline-variant p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] transform -rotate-1 max-w-fit mb-4">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="material-symbols-outlined text-secondary opacity-80">push_pin</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-widest border-b-2 border-primary border-dashed pb-2">
            DISTRICT 04 REPORT
          </h1>
          <p className="font-label-lg text-label-lg text-on-surface-variant mt-2">
            CIVIC DISPATCH METRICS & ANOMALY RESOLUTION
          </p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 border-2 border-error border-dashed max-w-2xl mx-auto font-mono text-xs shadow-lg transform rotate-1">
            <h3 className="font-headline-sm font-bold uppercase mb-2">ACCESS INTERRUPTED</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Content grid */}
        <div className="max-w-4xl w-full flex flex-col gap-8 pb-16 z-10">
          
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#251e1a] border-2 border-[#4f453f] p-4 shadow-[3px_3px_0px_rgba(0,0,0,0.4)] transform rotate-[0.5deg]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#9b8e87]">OFFICIAL MUNICIPIUM RECORD</span>
              <span className="text-xs text-[#ede0d9] font-sans font-bold uppercase">DISTRICT 04 COMPLETE ANALYTICS REPORT</span>
            </div>
            <button
              onClick={exportPrecinctPDFReport}
              className="flex items-center gap-2 border-2 border-red-700 hover:border-red-500 bg-red-950/40 hover:bg-red-950/80 px-4 py-2 text-xs uppercase text-red-400 tracking-wider font-bold transition-all cursor-pointer shadow-[2px_2px_4px_rgba(0,0,0,0.35)]"
              title="Download this district report as a classified PDF dossier"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              EXPORT PRECINCT PDF
            </button>
          </div>
          
          {/* Top Section: 3 Stat Cards in a row */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {[
              { label: "Reported", statusKey: "REPORTED", count: activeStats.totalReported, rotation: "-rotate-2", pinColor: "bg-red-600" },
              { label: "In Progress", statusKey: "IN_PROGRESS", count: activeStats.totalInProgress, rotation: "-rotate-1", pinColor: "bg-blue-600" },
              { label: "Resolved", statusKey: "RESOLVED", count: activeStats.totalResolved, rotation: "rotate-2", pinColor: "bg-green-600" },
            ].map((card, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedStatus(card.statusKey)}
                title={`Click to inspect ${card.label.toLowerCase()} cases`}
                className={`relative bg-[#F4EFE6] p-4 pt-8 pb-5 shadow-[4px_4px_10px_rgba(0,0,0,0.5)] border border-gray-300 transform ${card.rotation} transition-all duration-300 hover:rotate-0 hover:scale-105 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center cursor-pointer group`}
              >
                {/* Pushpin at top center of each card */}
                <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 ${card.pinColor} rounded-full border border-black/40 shadow-sm flex items-center justify-center`}>
                  <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                </div>

                <span className="font-sans font-bold text-4xl text-[#18120e] tracking-tight leading-none block mb-1 group-hover:text-primary transition-colors">
                  {card.count}
                </span>
                <span className="font-mono text-xs text-[#4f453f] font-bold uppercase tracking-wider text-center flex flex-col items-center gap-1">
                  <span>{card.label}</span>
                  <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-mono tracking-tighter">
                    INSPECT CASES
                  </span>
                </span>
              </div>
            ))}
          </section>

          {/* Sticky Notes & Detective annotations */}
          <section className="flex flex-col md:flex-row gap-6 items-stretch">
            {/* Horizontal Bar Chart (Category Breakdown) */}
            <div className="flex-1 bg-[#F4EFE6] p-6 shadow-[6px_6px_12px_rgba(0,0,0,0.6)] border border-gray-300 transform rotate-[0.5deg] text-[#18120e] flex flex-col relative">
              {/* Pin Accent */}
              <div className="absolute top-2 left-4 w-4 h-4 bg-red-700 rounded-full border border-black/40 shadow-sm"></div>

              <div className="border-b-2 border-gray-400 pb-2 mb-6 pl-6">
                <span className="text-xs font-mono uppercase tracking-widest text-red-800 font-bold block">
                  INCIDENT INDEX
                </span>
                <h3 className="font-headline-sm font-bold uppercase text-lg text-gray-900 leading-tight">
                  CATEGORY DISTRIBUTION
                </h3>
              </div>

              {/* Bar List */}
              <div className="flex flex-col gap-4 font-mono text-sm">
                {[
                  { key: "Pothole & Road Damage", color: "bg-[#92030f]", label: "Road & Pothole" },
                  { key: "Water Leakage", color: "bg-[#705a4c]", label: "Water Leakage" },
                  { key: "Streetlight", color: "bg-[#a38069]", label: "Streetlight" },
                  { key: "Waste Management", color: "bg-[#494740]", label: "Waste Mgmt" },
                  { key: "Other Infrastructure", color: "bg-[#9b8e87]", label: "Other Infra" },
                ].map((item) => {
                  const val = activeStats.categoryBreakdown[item.key as keyof typeof activeStats.categoryBreakdown] || 0;
                  const maxVal = Math.max(...Object.values(activeStats.categoryBreakdown), 1);
                  const barWidthPercent = (val / maxVal) * 100;

                  return (
                    <div key={item.key} className="flex items-center gap-3 w-full">
                      <span className="w-24 text-xs md:text-sm font-semibold text-gray-800 truncate" title={item.key}>
                        {item.label}
                      </span>
                      <div className="flex-1 h-6 bg-gray-200/60 relative overflow-hidden flex items-center pr-2 border border-gray-300">
                        {val > 0 ? (
                          <div
                            style={{ width: `${barWidthPercent}%` }}
                            className={`${item.color} h-full transition-all duration-500 relative flex items-center justify-end shadow-inner pr-2`}
                          >
                            <span className="text-xs font-bold text-[#F4EFE6] font-sans">
                              {val}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-400 pl-2">0</span>
                        )}
                        
                        {/* Tab-styled edge overlay for filing look */}
                        {val > 0 && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-black/10"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 border-t border-dashed border-gray-400 pt-3 flex justify-between items-center text-xs text-gray-500 font-mono">
                <span>SECTOR: 04 METROPOLIS</span>
                <span>DATA STATUS: ACTIVE</span>
              </div>
            </div>

            {/* Right Side Stack: Hotspot sticky & Status breakdown card */}
            <div className="w-full md:w-[320px] flex flex-col gap-6">
              
              {/* Top Hotspot Note: Detective sticky note */}
              <div className="bg-[#fff9c4] p-5 shadow-[6px_6px_10px_rgba(0,0,0,0.5)] border border-yellow-200/50 transform -rotate-2 text-[#1c1d16] flex flex-col relative select-none">
                {/* Visual Sticky Tape */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 shadow-sm border-b border-black/5 rotate-2 z-10"></div>
                
                <span className="text-xs font-mono tracking-widest text-yellow-800/80 uppercase font-bold block mb-1">
                  CRIMINAL / CIVIC ANOMALY ANALYSIS
                </span>
                
                {topVotedIssue ? (
                  <p className="font-mono text-xs md:text-sm leading-relaxed italic border-l-2 border-yellow-500/50 pl-2 mt-1">
                    "Most urgent concern in {currentCityName}: {topVotedIssue.incidentType} — {topVotedIssue.votes} community votes."
                  </p>
                ) : activeStats.topHotspotCategory.category && activeStats.topHotspotCategory.category !== "None" ? (
                  <p className="font-mono text-xs md:text-sm leading-relaxed italic border-l-2 border-yellow-500/50 pl-2 mt-1">
                    "Most reported issue type: {activeStats.topHotspotCategory.category} ({activeStats.topHotspotCategory.count} cases)."
                  </p>
                ) : (
                  <p className="font-mono text-xs md:text-sm leading-relaxed italic border-l-2 border-yellow-500/50 pl-2 mt-1">
                    "Intelligence update: No critical volume peaks detected yet in {currentCityName}."
                  </p>
                )}

                <span className="text-xs font-mono text-yellow-800/60 block mt-4 text-right">
                  - Detective Terminal Auto-Extract
                </span>
              </div>

              {/* Status breakdown card */}
              <div className="bg-[#F4EFE6] p-5 shadow-[6px_6px_12px_rgba(0,0,0,0.6)] border border-gray-300 transform rotate-1 text-[#18120e] flex flex-col relative">
                {/* Pushpin at top */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-700 rounded-full border border-black/40 shadow-sm"></div>

                <div className="border-b border-gray-400 pb-2 mb-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-red-800 font-bold block">
                    STAGE OVERVIEW
                  </span>
                  <h4 className="font-headline-sm font-bold uppercase text-base text-gray-900 leading-tight">
                    STATUS COMPOSITION
                  </h4>
                </div>

                {/* Stacked Horizontal Progress Bar */}
                <div className="w-full h-8 bg-gray-200 border border-gray-400 flex overflow-hidden mb-4 rounded-sm">
                  {totalCases === 0 ? (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs font-mono">
                      NO ACTIVE DATABASE RECORDS
                    </div>
                  ) : (
                    <>
                      {pctReported > 0 && (
                        <div
                          onClick={() => setSelectedStatus("REPORTED")}
                          style={{ width: `${pctReported}%` }}
                          className="bg-[#92030f] h-full transition-all duration-500 hover:opacity-90 relative group cursor-pointer"
                          title={`Reported: ${activeStats.totalReported}. Click to inspect.`}
                        ></div>
                      )}
                      {pctInProgress > 0 && (
                        <div
                          onClick={() => setSelectedStatus("IN_PROGRESS")}
                          style={{ width: `${pctInProgress}%` }}
                          className="bg-[#dec1af] h-full transition-all duration-500 hover:opacity-90 relative group cursor-pointer"
                          title={`In Progress: ${activeStats.totalInProgress}. Click to inspect.`}
                        ></div>
                      )}
                      {pctResolved > 0 && (
                        <div
                          onClick={() => setSelectedStatus("RESOLVED")}
                          style={{ width: `${pctResolved}%` }}
                          className="bg-[#2E7D5B] h-full transition-all duration-500 hover:opacity-90 relative group cursor-pointer"
                          title={`Resolved: ${activeStats.totalResolved}. Click to inspect.`}
                        ></div>
                      )}
                    </>
                  )}
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-1.5 font-mono text-xs md:text-sm text-gray-700">
                  <div 
                    onClick={() => setSelectedStatus("REPORTED")}
                    className="flex justify-between items-center cursor-pointer hover:bg-black/5 p-1 rounded transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#92030f] border border-black/20 block rounded-sm"></span>
                      <span className="font-bold group-hover:underline text-xs md:text-sm">Reported ({activeStats.totalReported})</span>
                    </div>
                    <span className="font-bold text-xs md:text-sm">{pctReported.toFixed(0)}%</span>
                  </div>
                  <div 
                    onClick={() => setSelectedStatus("IN_PROGRESS")}
                    className="flex justify-between items-center cursor-pointer hover:bg-black/5 p-1 rounded transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#dec1af] border border-black/20 block rounded-sm"></span>
                      <span className="font-bold group-hover:underline text-xs md:text-sm">In Progress ({activeStats.totalInProgress})</span>
                    </div>
                    <span className="font-bold text-xs md:text-sm">{pctInProgress.toFixed(0)}%</span>
                  </div>
                  <div 
                    onClick={() => setSelectedStatus("RESOLVED")}
                    className="flex justify-between items-center cursor-pointer hover:bg-black/5 p-1 rounded transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#2E7D5B] border border-black/20 block rounded-sm"></span>
                      <span className="font-bold group-hover:underline text-xs md:text-sm">Resolved ({activeStats.totalResolved})</span>
                    </div>
                    <span className="font-bold text-xs md:text-sm">{pctResolved.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Section: Community Concern Priority Leaderboard */}
          <section className="bg-[#1e1511] border-2 border-[#4f453f] p-6 shadow-[6px_6px_12px_rgba(0,0,0,0.65)] relative text-left">
            <div className="absolute top-2 right-4 text-[#9b8e87] opacity-40 font-mono text-xs">
              SEC-VOTE // INTEL
            </div>
            
            <div className="border-b border-[#4f453f] pb-3 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-500 font-bold block">
                COMMUNITY PRIORITY SIGNAL LEADERBOARD
              </span>
              <h3 className="font-sans font-bold uppercase text-lg text-[#ede0d9] leading-tight">
                URGENT PUBLIC CONCERNS (BY COMMUNITY VOTES)
              </h3>
              <p className="text-xs text-[#9b8e87] font-mono mt-1">
                Incidents in {currentCityName} with priority backing from local residents. More votes indicate a greater level of community distress and urgency.
              </p>
            </div>

            {sortedByVotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 italic font-mono text-xs border border-dashed border-[#4f453f] bg-black/20 p-4">
                &gt;&gt; NO COMMUNITY VOTE SIGNALS RECORDED YET IN {currentCityName.toUpperCase()}.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedByVotes.map((issue, index) => {
                  const percentOfTotal = issue.votes ? Math.min(100, (issue.votes / (sortedByVotes[0].votes || 1)) * 100) : 0;
                  const shortId = issue.id.slice(-4).toUpperCase();
                  return (
                    <div 
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="bg-[#130d09] border border-[#4f453f] hover:border-orange-500 p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Vote rank index badge */}
                        <div className="w-6 h-6 flex-shrink-0 bg-black/40 border border-[#4f453f] text-[#ffedd5] font-mono text-xs flex items-center justify-center font-bold">
                          #{index + 1}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-[#dec1af] uppercase group-hover:text-orange-400 transition-colors">
                              EXH-{shortId} • {issue.incidentType}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 font-mono uppercase border font-bold ${
                              issue.status === "RESOLVED" 
                                ? "bg-green-950/40 text-green-400 border-green-800" 
                                : issue.status === "IN_PROGRESS"
                                ? "bg-blue-950/40 text-blue-400 border-blue-800"
                                : "bg-red-950/40 text-red-400 border-red-800"
                            }`}>
                              {issue.status || "REPORTED"}
                            </span>
                          </div>
                          
                          <p className="text-xs text-[#9b8e87] truncate mt-1 italic">
                            "{issue.description || "No further intelligence logs recorded..."}"
                          </p>
                        </div>
                      </div>

                      {/* Vote indicator */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="w-32 bg-black/40 h-2 border border-[#4f453f] hidden sm:block relative overflow-hidden rounded-sm">
                          <div 
                            style={{ width: `${percentOfTotal}%` }}
                            className="bg-orange-600 h-full transition-all duration-500"
                          ></div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#7c2d12]/20 border border-[#ea580c]/30 px-3 py-1 font-mono text-xs font-bold text-orange-400">
                          <span className="material-symbols-outlined text-xs">bolt</span>
                          <span>{issue.votes || 0} VOTES</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Large Stamped Indicator at the bottom of report */}
          {activeStats.totalResolved > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="stamp font-headline-sm text-[#92030f] tracking-widest font-extrabold text-base border-4 border-[#92030f] px-3 py-1.5 uppercase inline-block bg-transparent select-none rotate-[-6deg] shadow-sm transform hover:rotate-0 transition-transform duration-200">
                RESOLVED CASES: {activeStats.totalResolved}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden bg-surface-container-highest text-primary fixed bottom-0 left-0 w-full h-16 flex justify-around items-center z-50 px-4 border-t-2 border-outline-variant shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.4)]">
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
          onClick={() => onNavigate("precinct-report")}
          className="flex flex-col items-center justify-center text-tertiary font-bold scale-110 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            query_stats
          </span>
          <span className="text-[9px] uppercase tracking-tighter mt-1">Report</span>
        </button>

        <button
          onClick={() => onNavigate("terminal-setting")}
          className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[9px] uppercase tracking-tighter mt-1">Intel</span>
        </button>
      </nav>

      {/* DETECTIVE EVIDENCE DRAWER / CASE FILES OVERLAY */}
      {selectedStatus && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#eae3d2] text-[#251e1a] border-4 border-[#4f453f] max-w-2xl w-full p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative flex flex-col gap-4 font-mono select-none overflow-hidden max-h-[85vh]">
            {/* Folder Header Pin */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-700 rounded-full border border-black/40 shadow-sm"></div>
            
            {/* Retro Folder Tab Header */}
            <div className="flex justify-between items-start border-b-2 border-[#4f453f] pb-3 pt-2">
              <div>
                <span className="text-xs text-red-800 font-bold tracking-widest block uppercase">
                  CIVIC DISPATCH FILES // CLASSIFIED
                </span>
                <h3 className="font-sans font-bold text-2xl uppercase tracking-wider text-gray-900 mt-1">
                  {selectedStatus === "IN_PROGRESS" ? "IN PROGRESS" : selectedStatus} CASE LOGS ({issues.filter(i => i.status === selectedStatus).length})
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedStatus(null)}
                className="text-[#4f453f] hover:text-black hover:border-black text-xs md:text-sm font-bold border border-[#4f453f] px-3 py-1.5 bg-white/50 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.15)] active:translate-y-0.5 transition-all"
              >
                CLOSE FOLDER
              </button>
            </div>

            {/* Content List scroll container */}
            <div className="overflow-y-auto flex-1 flex flex-col gap-4 pr-1 scrollbar-thin scrollbar-thumb-gray-400">
              {issues.filter(i => i.status === selectedStatus).length === 0 ? (
                <div className="text-center py-16 text-gray-600 italic font-mono text-sm leading-relaxed border-2 border-dashed border-[#8c8275] bg-[#fcfbf9]/40 p-4 rounded">
                  &gt;&gt; NO RECORDED LEADS REGISTERED UNDER THE '{selectedStatus}' STAGE.
                  <p className="mt-2 text-xs not-italic text-gray-500 font-sans">
                    Browse active issues on the Evidence Board to vouch, verify, or resolve them.
                  </p>
                </div>
              ) : (
                issues.filter(i => i.status === selectedStatus).map((issue) => {
                  const shortId = issue.id.slice(-4).toUpperCase();
                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="bg-[#fcfbf9] hover:bg-[#fffdfa] border-2 border-[#8c8275] hover:border-primary p-4 shadow-md hover:shadow-lg transition-all cursor-pointer flex gap-4 group"
                    >
                      {/* Left: Mini thumbnail with Polaroid-ish border */}
                      <div className="w-16 h-16 bg-[#F4EFE6] p-1 border border-[#4f453f] flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {issue.imageDataUrl ? (
                          <img
                            src={issue.imageDataUrl}
                            alt={issue.incidentType}
                            className="w-full h-full object-cover filter contrast-125 brightness-90 grayscale-[10%]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-[#4f453f] opacity-40 text-xl">image_not_supported</span>
                        )}
                      </div>

                      {/* Right details */}
                      <div className="flex-1 flex flex-col gap-1 text-xs md:text-sm font-mono text-gray-800 leading-normal">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-red-900 group-hover:text-primary transition-colors text-xs md:text-sm uppercase">
                            EXH-{shortId} • {issue.incidentType}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 line-clamp-2 italic text-xs mt-1 pr-2">
                          "{issue.description || "No further intelligence logs recorded..."}"
                        </p>
                        <div className="text-[10px] md:text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span>LOCATION: {issue.location.address ? issue.location.address.slice(0, 45) + (issue.location.address.length > 45 ? "..." : "") : `LAT: ${issue.location.lat.toFixed(4)}, LNG: ${issue.location.lng.toFixed(4)}`}</span>
                          {issue.verificationsCount !== undefined && (
                            <span>VOUCH COUNT: {issue.verificationsCount} / 3</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-[#4f453f] pt-2 text-[10px] md:text-xs text-[#4f453f] flex justify-between font-mono">
              <span>SECURITY LEVEL: INTRADISTRICT UNRESTRICTED</span>
              <span>TAP ANY CASE FILE ABOVE TO OPEN THE FULL RECON DOSSIER</span>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Evidence Analysis Detail Screen */}
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

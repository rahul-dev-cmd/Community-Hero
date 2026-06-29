import React from "react";

interface PlaceholderProps {
  title: string;
  subtitle: string;
  onNavigate: (tab: string) => void;
}

export default function PrecinctPlaceholder({ title, subtitle, onNavigate }: PlaceholderProps) {
  return (
    <div className="bg-primary-container text-on-surface font-body-md min-h-screen relative overflow-x-hidden corkboard pb-24 pt-20">
      <div className="noise-bg"></div>
      
      <header className="flex items-center justify-between px-margin-edge h-16 w-full fixed top-0 z-50 bg-surface border-b-2 border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
        <button 
          onClick={() => onNavigate("evidence-board")}
          className="text-on-surface-variant hover:bg-surface-variant transition-colors active:translate-y-0.5 p-2 rounded-full flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="font-headline-md text-primary tracking-widest uppercase">{title}</h1>
        <div className="w-10"></div>
      </header>

      <main className="relative z-10 px-margin-edge max-w-md mx-auto flex flex-col gap-stack-loose">
        <div className="text-center mt-4">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-secondary-fixed uppercase">{title}</h2>
          <p className="font-label-sm text-on-surface-variant opacity-60 mt-1">{subtitle}</p>
        </div>

        <div className="bg-[#F4EFE6] p-card-padding shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] transform rotate-1 relative text-on-secondary-fixed">
          {/* Staple Visual */}
          <div className="absolute top-4 left-4 w-6 h-1 bg-gray-600 shadow-sm rotate-45"></div>
          
          <h3 className="font-headline-sm text-on-secondary-fixed mb-4 border-b-2 border-gray-400 pb-1 uppercase">ARCHIVAL PROTOCOL</h3>
          
          <div className="flex flex-col gap-4 font-body-md text-xs leading-relaxed">
            <div className="border border-dashed border-red-800/40 p-3 bg-red-500/5">
              <p className="font-bold uppercase tracking-wider text-red-800">CLASSIFIED ENTRY DETECTED</p>
              <p className="mt-1 font-mono">
                [SYSTEM LOG: CLASSIFIED] Precinct files are currently under administrative review or archived in the secure mainframe database.
              </p>
            </div>

            <div>
              <p className="font-bold uppercase tracking-wider text-red-800">ACCESS INSTRUCTIONS</p>
              <p className="mt-1">
                To link or process new cases, verify active citizen reports on the Evidence Board or file a new anomaly with the New Lead intake protocol.
              </p>
            </div>
            
            <div className="pt-4 border-t border-gray-300 flex justify-between items-center text-[10px] font-mono text-gray-500">
              <span>STATUS: SECURE</span>
              <span>EST. DECLASSIFICATION: PENDING</span>
            </div>
          </div>
        </div>
      </main>

      {/* Shared bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 z-50 bg-surface-container-low border-t-2 border-outline-variant shadow-[0_-4px_10px_rgba(0,0,0,0.3)] md:hidden">
        <button 
          onClick={() => onNavigate("evidence-board")}
          className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-all active:scale-95 duration-100 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>folder_open</span>
        </button>
        <button 
          onClick={() => onNavigate("new-case-intake")}
          className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-all active:scale-95 duration-100 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>photo_camera</span>
        </button>
        <button 
          onClick={() => onNavigate("field-manual")}
          className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-all active:scale-95 duration-100 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>description</span>
        </button>
        <button 
          onClick={() => onNavigate("terminal-setting")}
          className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-all active:scale-95 duration-100 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>settings</span>
        </button>
      </nav>
    </div>
  );
}

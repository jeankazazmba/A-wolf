import React from "react";
import { Minus, Square, X } from "lucide-react";
import brandLogo from "../assets/logo.png";

export const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    if ((window as any).electronAPI?.minimizeWindow) {
      (window as any).electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if ((window as any).electronAPI?.maximizeWindow) {
      (window as any).electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if ((window as any).electronAPI?.closeWindow) {
      (window as any).electronAPI.closeWindow();
    }
  };

  return (
    <div
      className="w-full h-10 bg-white flex items-center justify-between px-4 select-none border-b border-slate-200"
      style={{
        WebkitAppRegion: "drag" as any,
      } as React.CSSProperties}
    >
      {/* App logo and name in the left corner */}
      <div className="flex items-center gap-2 flex-1">
        <div className="h-6 w-6 flex items-center justify-center overflow-hidden rounded p-0.5">
          <img
            src={brandLogo}
            alt="A-Wolf Logo"
            className="h-full w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="text-slate-700 font-bold text-xs tracking-wider">A-Wolf</span>
      </div>

      {/* Control buttons in the right corner */}
      <div
        className="flex gap-0.5"
        style={{ WebkitAppRegion: "no-drag" as any } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer group"
          title="Réduire"
        >
          <Minus className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer group"
          title="Agrandir"
        >
          <Square className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer group"
          title="Fermer"
        >
          <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </div>
  );
};

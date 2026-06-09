import React from "react";

interface LoadingOverlayProps {
  isOpen: boolean;
  statusText?: string;
}

export function LoadingOverlay({ isOpen, statusText }: LoadingOverlayProps) {
  if (!isOpen) return null;

  const defaultTitle = "正在發送至 Gemini AI 雲端專家";
  const defaultSubtitle = "我們正在透過 Gemini 3 Flash 模型進行高精度 OCR 智能解析與自動詞庫分類...";

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-[#FAF8F5]/95 z-[100] flex flex-col justify-center items-center p-8 text-center animate-fade-in">
      <div 
        className="w-11 h-11 border-4 border-dashed border-[#C57B83] rounded-full mb-4"
        style={{ animation: "spin 3s linear infinite" }}
      />
      <div className="text-sm font-extrabold text-[#5C524E] mb-1.5 label-title">
        {defaultTitle}
      </div>
      <div className="text-[11px] text-[#8C807A] leading-relaxed font-semibold max-w-[240px]">
        {statusText || defaultSubtitle}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

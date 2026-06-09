import React, { useRef, useState } from "react";
import { VocabItem } from "../types";

interface MainViewProps {
  vocabList: VocabItem[];
  onSimulateTimeFly: () => void;
  onStartReview: () => void;
  onSwitchView: (view: "mainView" | "manageView" | "reviewView") => void;
  onOpenCalendar: () => void;
  onOcrUpload: (imageBase64: string) => void;
  onOpenReader: (initialFilter?: "all" | "learning" | "mastered") => void;
}

export function MainView({
  vocabList,
  onSimulateTimeFly,
  onStartReview,
  onSwitchView,
  onOpenCalendar,
  onOcrUpload,
  onOpenReader
}: MainViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Compute stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const dueCount = vocabList.filter(item => {
    const isDue = item.nextReviewDate <= Date.now();
    return item.level < 5 && isDue;
  }).length;

  const masteredCount = vocabList.filter(item => item.level === 5).length;
  const totalCount = vocabList.length;

  // Handle manual clicked image selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Get the raw base64 substring
      if (result && result.includes(",")) {
        onOcrUpload(result.split(",")[1]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processImageFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      {/* Header with bunny icon */}
      <div className="text-center mb-3.5 relative">
        <div className="w-12 h-12 mx-auto mb-1 text-[#C57B83] chromatic-aberration flex items-center justify-center">
          <svg viewBox="0 0 100 100" fill="currentColor" width="100%" height="100%" className="w-full h-full select-none" style={{ overflow: "visible" }}>
            {/* Fine-detailed sitting rabbit side-profile silhouette */}
            <path d="M 22,46 C 20,44 16,42 16,39 C 16,35 22,32 28,30 C 31,29 34,28 36,28 C 44,21 59,13 77,14 C 80,14 81,18 74,22 C 59,26 45,28 40,32 C 47,27 61,22 79,21 C 82,21 83,25 75,28 C 61,33 47,35 42,38 C 42,42 46,50 51,58 C 58,68 68,73 72,79 C 75,76 78,79 78,82 C 78,85 74,87 71,85 C 65,87 55,88 45,88 C 35,88 28,88 28,88 C 26,88 24,84 24,80 C 22,70 22,54 22,46 Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-[#5C524E] tracking-tight text-shadow-sm select-none">
          單字複習
        </h1>
        <div className="text-[10px] text-[#8C807A] font-bold tracking-widest mt-0.5">
          TOEIC VOCABULARY
        </div>
      </div>

      {/* Main Spaced Repetition card with Drag & Drop overlay */}
      <div 
        className={`relative flex flex-col p-5 bg-[#FBF0F0] mb-4 transition-all duration-200 ${
          isDragging ? "scale-102 bg-[#F6E3E3] border-solid" : ""
        }`}
        style={{ border: "2.5px dashed #C57B83", borderRadius: "20px" }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div 
          className="absolute -top-3 -right-2 px-3 py-1 bg-[#E6DEC9] text-[10px] font-bold uppercase tracking-tighter transform rotate-3 text-[#5C524E]" 
          style={{ border: "1px solid #92837B", backgroundImage: "linear-gradient(90deg, #E6DEC9 50%, #EDE9DB 50%)", backgroundSize: "4px 100%" }}
        >
          TOEIC 900+
        </div>
        
        <span className="text-xs font-bold text-[#C57B83] text-left uppercase tracking-widest">Today's Goals</span>
        <h1 className="text-2xl font-black mt-1 mb-2 text-left text-[#5C524E]">今日單字卡片</h1>
        
        <div className="flex items-end justify-between mb-5">
          <div className="text-4xl font-black text-[#C57B83] text-left">
            {dueCount} <span className="text-sm text-[#8C807A] font-normal">words</span>
          </div>
          <button 
            type="button"
            onClick={() => onOpenReader("all")}
            title="查看已掌握比例進度（點擊可開啟全螢幕單字清單）"
            className="w-12 h-12 rounded-full border-2 border-[#C57B83] flex items-center justify-center text-xs font-bold text-[#C57B83] bg-transparent hover:bg-[#FBF0F0] active:scale-95 transition-all cursor-pointer focus:outline-none"
          >
            {vocabList.length > 0 ? Math.round((vocabList.filter(v => v.level === 5).length / vocabList.length) * 100) : 100}%
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={triggerFileInput}
            className="w-full h-16 flex items-center justify-center gap-3 relative overflow-hidden sticker-btn btn-import-pattern font-bold rounded-[16px]"
          >
            <span className="relative z-10 text-lg font-black tracking-widest">圖片匯入</span>
          </button>
          
          <button 
            onClick={onStartReview}
            className="w-full h-16 flex flex-col items-center justify-center relative overflow-hidden sticker-btn btn-review-pattern rounded-[16px]"
          >
            <span className="relative z-10 text-lg font-black tracking-widest uppercase">立即複習</span>
            <span className="relative z-10 text-[9px] font-bold bg-[#FAF8F5] px-2 py-0.5 rounded-full mt-1 border border-[#92837B] text-[#5C524E]">
              {dueCount} CARDS DUE TODAY
            </span>
          </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef}
          style={{ display: "none" }} 
          accept="image/*"
          onChange={handleFileChange}
        />

        {isDragging && (
          <div className="absolute inset-0 bg-[#FAF8F5]/90 rounded-[20px] flex items-center justify-center border-2 border-dashed border-[#C57B83] z-20">
            <span className="text-xs font-extrabold text-[#C57B83]">放開以匯入單字照片 ✿</span>
          </div>
        )}
      </div>

      {/* Dashboard statistics panels */}
      <div className="grid grid-cols-2 gap-3.5 mb-auto">
        <button 
          onClick={() => onOpenReader("mastered")}
          title="點擊查看已掌握單字"
          className="grid-mastered border-2 border-[#92837B] rounded-[20px] p-3 flex flex-col items-center shadow-[2px_2px_0px_#92837B] hover:bg-[#F3EFE6] active:scale-95 transition-all cursor-pointer text-center outline-none"
        >
          <span className="text-[10px] font-extrabold text-[#8C807A]">已掌握單字</span>
          <span className="text-xl font-black text-[#8FA89B] mt-1 pr-1">
            {masteredCount}
          </span>
        </button>

        <button 
          onClick={() => onOpenReader("all")}
          title="點擊滿版顯示閱讀全部單字"
          className="grid-total border-2 border-[#92837B] rounded-[20px] p-3 flex flex-col items-center shadow-[2px_2px_0px_#92837B] hover:bg-[#EEF4F8] active:scale-95 transition-all cursor-pointer text-center outline-none"
        >
          <span className="text-[10px] font-extrabold text-[#8C807A]">字庫總覽</span>
          <span className="text-xl font-black text-[#97B2C4] mt-1">
            {totalCount}
          </span>
        </button>
      </div>

      {/* Spaced repetition time-fly simulates */}
      <div className="mt-4 flex justify-between">
        <button 
          onClick={onSimulateTimeFly}
          className="sticker-btn bg-[#FEF3C7] text-[#92400E] border-2 border-[#92837B] text-[10px] font-bold py-2 px-3 rounded-xl cursor-pointer w-full text-center"
        >
          ⏰ 模擬快轉 1 天 (+1 Day SRS)
        </button>
      </div>

      {/* Notebook-styled footer timestamp descriptor */}
      <div 
        onClick={onOpenCalendar}
        className="text-center text-[10px] text-[#8C807A] font-extrabold tracking-wide mt-4 hover:text-[#C57B83] cursor-pointer underline decoration-dotted underline-offset-4"
      >
        今日日期：{new Date().getFullYear()}年{new Date().getMonth() + 1}月{new Date().getDate()}日 📅
      </div>
    </div>
  );
}

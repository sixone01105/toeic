import React, { useState, useEffect } from "react";
import { VocabItem } from "../types";
import { CarrotSilhouette } from "./CarrotSilhouette";

interface FullVocabularyReaderProps {
  isOpen: boolean;
  onClose: () => void;
  vocabList: VocabItem[];
  onToggleMastered?: (id: string) => void;
  initialFilter?: "all" | "learning" | "mastered";
}

export function FullVocabularyReader({
  isOpen,
  onClose,
  vocabList,
  onToggleMastered,
  initialFilter = "all"
}: FullVocabularyReaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "learning" | "mastered">("all");

  useEffect(() => {
    if (isOpen) {
      setSelectedFilter(initialFilter);
      setSearchQuery("");
    }
  }, [isOpen, initialFilter]);

  if (!isOpen) return null;

  // Filter list
  const filteredList = vocabList.filter((item) => {
    const matchesSearch = 
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.trans.includes(searchQuery) ||
      (item.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === "learning") {
      return matchesSearch && item.level < 5;
    }
    if (selectedFilter === "mastered") {
      return matchesSearch && item.level === 5;
    }
    return matchesSearch;
  });

  return (
    <div 
      className="absolute inset-0 bg-[#FAF8F5] z-[150] flex flex-col p-4"
      style={{ animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-dashed border-[#92837B] pb-3 mb-3 shrink-0">
        <div className="flex flex-col text-left">
          <span className="text-xs font-black text-[#C57B83] tracking-widest uppercase">Full Reader</span>
          <h2 className="text-xl font-black text-[#5C524E]">
            {selectedFilter === "mastered" ? "已掌握單字" : "字庫總覽"}
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full border-2 border-[#92837B] flex items-center justify-center text-sm font-black text-[#5C524E] bg-[#FBF0F0] hover:bg-[#EBF2EE] cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Control bar */}
      <div className="flex flex-col gap-2 shrink-0 mb-3">
        {/* Search bar */}
        <div className="relative">
          <input 
            type="text"
            className="w-full text-xs border-2 border-[#92837B] rounded-xl px-3 py-2 font-bold outline-none focus:border-[#C57B83] focus:bg-[#FBF0F0] text-[#5C524E] placeholder:text-[#A39791]"
            placeholder="搜尋單字、中文釋義、分類標籤..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C807A]"
            >
              清除
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 text-[10px] font-black">
          <button 
            type="button"
            onClick={() => setSelectedFilter("all")}
            className={`flex-1 border-1.5 border-[#92837B] rounded-lg py-1 cursor-pointer transition-all ${
              selectedFilter === "all" ? "bg-[#C57B83] text-white shadow-[1px_1px_0px_#92837B]" : "bg-white text-[#8C807A]"
            }`}
          >
            全部 ({vocabList.length})
          </button>
          <button 
            type="button"
            onClick={() => setSelectedFilter("learning")}
            className={`flex-1 border-1.5 border-[#92837B] rounded-lg py-1 cursor-pointer transition-all ${
              selectedFilter === "learning" ? "bg-[#97B2C4] text-white shadow-[1px_1px_0px_#92837B]" : "bg-white text-[#8C807A]"
            }`}
          >
            複習中 ({vocabList.filter(v => v.level < 5).length})
          </button>
          <button 
            type="button"
            onClick={() => setSelectedFilter("mastered")}
            className={`flex-1 border-1.5 border-[#92837B] rounded-lg py-1 cursor-pointer transition-all ${
              selectedFilter === "mastered" ? "bg-[#8FA89B] text-white shadow-[1px_1px_0px_#92837B]" : "bg-white text-[#8C807A]"
            }`}
          >
            已掌握 ({vocabList.filter(v => v.level === 5).length})
          </button>
        </div>
      </div>

      {/* Vocabulary Scroll List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
        {filteredList.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-2xl text-[#8C807A] block mb-2">🔍</span>
            <span className="text-xs font-bold text-[#8C807A]">無匹配的單字卡片</span>
          </div>
        ) : (
          filteredList.map((item, idx) => (
            <div 
              key={item.id || idx}
              className={`p-3.5 border-2 border-[#92837B] rounded-2xl shadow-[2px_2px_0px_#92837B] relative ${
                item.level === 5 ? "bg-[#F3EFE6]/90 border-[#A39791]" : "bg-white"
              }`}
            >
              {/* Category label */}
              {item.category && (
                <span className="absolute top-2.5 right-3 text-[#5C524E] border border-[#92837B] text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#FAF8F5] shadow-[1px_1px_0px_#92837B]">
                  {item.category}
                </span>
              )}

              {/* Heart checkbox optionally clicked to toggle mastery */}
              {onToggleMastered && (
                <button
                  type="button"
                  onClick={() => onToggleMastered(item.id)}
                  className="absolute bottom-2.5 right-3 text-xs font-bold text-[#C57B83] flex items-center gap-1 hover:opacity-80"
                >
                  <span className={`w-4 h-4 rounded-full border border-[#92837B] flex items-center justify-center bg-white ${item.level === 5 ? "bg-[#FBF0F0] text-[#C57B83]" : ""}`}>
                    {item.level === 5 ? "♥" : ""}
                  </span>
                  <span className="text-[9px] text-[#8C807A] font-extrabold">已掌握</span>
                </button>
              )}

              {/* Word, POS and Translation */}
              <div className="flex flex-col text-left gap-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-lg font-black text-[#5C524E] lowercase leading-none">
                    {item.word}
                  </span>
                  <span className="text-[10px] text-[#C57B83] font-bold italic bg-[#FBF0F0] px-1 rounded border border-[#C57B83]/30">
                    {item.pos || "n."}
                  </span>
                  <div className="inline-flex scale-90 origin-left">
                    <CarrotSilhouette level={item.level} />
                  </div>
                </div>
                <div className="text-sm font-bold text-[#8C807A] mt-1.5">
                  {item.trans}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 3.5px;
          width: 3.5px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #D2C9B9;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

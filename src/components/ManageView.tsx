import React, { useState } from "react";
import { VocabItem } from "../types";
import { CarrotSilhouette } from "./CarrotSilhouette";

interface ManageViewProps {
  vocabList: VocabItem[];
  onAddWord: (word: string, pos: string, trans: string, category: string) => void;
  onEditWord: (id: string, updated: Partial<VocabItem>) => void;
  onDeleteWord: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onSwitchView: (view: "mainView" | "manageView" | "reviewView") => void;
}

export function ManageView({
  vocabList,
  onAddWord,
  onEditWord,
  onDeleteWord,
  onToggleMastered,
  onSwitchView
}: ManageViewProps) {
  // Local state for editing form
  const [wordIdToEdit, setWordIdToEdit] = useState<string | null>(null);
  const [inputWord, setInputWord] = useState("");
  const [inputPos, setInputPos] = useState("n.");
  const [inputTrans, setInputTrans] = useState("");
  const [inputCategory, setInputCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Filter category state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("全部");

  // Compile all unique categories
  const categoriesList = ["全部"];
  vocabList.forEach((item) => {
    const cat = item.category || "未分類";
    if (!categoriesList.includes(cat)) {
      categoriesList.push(cat);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedWord = inputWord.trim();
    const trimmedTrans = inputTrans.trim();

    if (!trimmedWord || !trimmedTrans) {
      alert("請填寫英文單字與繁體中文釋義！");
      return;
    }

    const cleanWord = trimmedWord.toLowerCase();
    // Auto dot parts of speech if missing
    let cleanPos = inputPos.trim();
    if (cleanPos && !cleanPos.endsWith(".")) {
      cleanPos += ".";
    }
    if (!cleanPos) {
      cleanPos = "n.";
    }

    const cleanCategory = inputCategory.trim() || "未分類";

    if (wordIdToEdit) {
      onEditWord(wordIdToEdit, {
        word: cleanWord,
        pos: cleanPos,
        trans: trimmedTrans,
        category: cleanCategory
      });
      // Reset
      setWordIdToEdit(null);
    } else {
      onAddWord(cleanWord, cleanPos, trimmedTrans, cleanCategory);
    }

    // Reset fields
    setInputWord("");
    setInputPos("n.");
    setInputTrans("");
    setInputCategory("");
    setIsFormExpanded(false);
  };

  const handleEditClick = (item: VocabItem) => {
    setWordIdToEdit(item.id);
    setInputWord(item.word);
    setInputPos(item.pos);
    setInputTrans(item.trans);
    setInputCategory(item.category);
    setIsFormExpanded(true);
  };

  const handleCancelEdit = () => {
    setWordIdToEdit(null);
    setInputWord("");
    setInputPos("n.");
    setInputTrans("");
    setInputCategory("");
    setIsFormExpanded(false);
  };

  // Filter items based on selected category sticker filter and search query
  const filteredVocab = vocabList.filter((item) => {
    // 1. Category Filter
    if (activeCategoryFilter !== "全部") {
      const cat = item.category || "未分類";
      if (cat !== activeCategoryFilter) return false;
    }

    // 2. Search Query Filter
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const matchesWord = (item.word || "").toLowerCase().includes(query);
    const matchesPos = (item.pos || "").toLowerCase().includes(query);
    const matchesCategory = (item.category || "未分類").toLowerCase().includes(query);

    return matchesWord || matchesPos || matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      <h2 className="text-lg font-black text-[#5C524E] mb-2 text-center relative">
        單字管理
      </h2>

      {/* Search Input Field */}
      <div className="mb-3.5 shrink-0">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[#8C807A] select-none">🔍</span>
          <input
            type="text"
            className="w-full border-2 border-[#92837B] rounded-xl pl-8 pr-8 py-2 text-xs font-bold focus:border-[#C57B83] focus:bg-[#FBF0F0] text-[#5C524E] outline-none placeholder-[#8C807A]/60 bg-white shadow-[1px_1px_0px_#92837B]"
            placeholder="搜尋單字名稱、詞性或分類標籤..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C807A] hover:text-[#C57B83] font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Adding / Modifying handdrawn form card (Expandable to keep screen clean) */}
      {!isFormExpanded && !wordIdToEdit ? (
        <button
          type="button"
          onClick={() => setIsFormExpanded(true)}
          className="w-full border-2 border-dashed border-[#92837B] rounded-xl py-2.5 px-3 mb-3 bg-[#FDFCF7] hover:bg-[#FBF0F0]/50 text-[#5C524E] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:translate-y-[0.5px] transition-all"
        >
          ➕ 手動新增單字 (展開編輯)
        </button>
      ) : (
        <form 
          onSubmit={handleSubmit}
          className="bg-[#FDFCF7] border-2 border-dashed border-[#92837B] rounded-2xl p-3.5 mb-3 flex flex-col shrink-0 text-xs shadow-sm relative animate-fadeIn"
        >
          {/* Header to allow manual collapsing when not editing */}
          {!wordIdToEdit && (
            <button
              type="button"
              onClick={() => setIsFormExpanded(false)}
              className="absolute top-2 right-2.5 text-[10px] text-[#8C807A] hover:text-[#C57B83] font-bold cursor-pointer transition-colors"
            >
              收起 🔼
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5 mb-2">
            <div>
              <label className="block text-[10px] font-extrabold text-[#8C807A] mb-0.5">英文單字</label>
              <input 
                type="text" 
                className="w-full border-2 border-[#92837B] rounded-lg px-2.5 py-1.5 font-bold focus:border-[#C57B83] focus:bg-[#FBF0F0] text-[#5C524E] outline-none"
                placeholder="例如: continuous"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-[#8C807A] mb-0.5">分類標籤 (Category)</label>
              <input 
                type="text" 
                className="w-full border-2 border-[#92837B] rounded-lg px-2.5 py-1.5 font-bold focus:border-[#C57B83] focus:bg-[#FBF0F0] text-[#5C524E] outline-none"
                placeholder="預設未分類，或手動輸入分類"
                value={inputCategory}
                onChange={(e) => setInputCategory(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="col-span-1">
              <label className="block text-[10px] font-extrabold text-[#8C807A] mb-0.5">詞性</label>
              <select 
                className="w-full border-2 border-[#92837B] rounded-lg px-2 py-1.5 font-bold focus:border-[#C57B83] focus:bg-[#FBF0F0] text-[#5C524E] outline-none bg-white cursor-pointer"
                value={inputPos || "n."}
                onChange={(e) => setInputPos(e.target.value)}
              >
                <option value="n.">名詞 n.</option>
                <option value="adj.">形容詞 adj.</option>
                <option value="v.">動詞 v.</option>
                <option value="adv.">副詞 adv.</option>
                {inputPos && !["n.", "adj.", "v.", "adv."].includes(inputPos) && (
                  <option value={inputPos}>{inputPos}</option>
                )}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-extrabold text-[#8C807A] mb-0.5">繁體中文釋義</label>
              <input 
                type="text" 
                className="w-full border-2 border-[#92837B] rounded-lg px-2.5 py-1.5 font-bold focus:border-[#C57B83] focus:bg-[#FBF0F0] text-[#5C524E] outline-none"
                placeholder="連續的"
                value={inputTrans}
                onChange={(e) => setInputTrans(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-2.5 mt-1.5">
            {wordIdToEdit && (
              <button 
                type="button"
                onClick={handleCancelEdit}
                className="sticker-btn bg-white text-[#8C807A] font-extrabold rounded-xl py-1.5 px-3 flex-1 border-2 border-[#92837B] cursor-pointer text-center"
              >
                取消
              </button>
            )}

            <button 
              type="submit"
              className="sticker-btn bg-[#FBF0F0] text-[#5C524E] font-extrabold rounded-xl py-2 px-3 flex-2 border-2 border-[#92837B] cursor-pointer text-center"
            >
              {wordIdToEdit ? "儲存修改單字" : "寫入單字庫"}
            </button>
          </div>
        </form>
      )}

      {/* Dynamic horizontial category sticker filtering row */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 shrink-0 select-none scrollbar-thin">
        {categoriesList.map((cat, idx) => {
          const isActive = cat === activeCategoryFilter;
          return (
            <button
              key={`${cat}-${idx}`}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`border-1.5 border-[#92837B] rounded-xl px-2.5 py-1 text-[10px] font-black whitespace-nowrap cursor-pointer transition-all duration-100 ${
                isActive 
                  ? "bg-[#C57B83] text-white shadow-[1px_1px_0px_#92837B] translate-x-[0.5px] translate-y-[0.5px]" 
                  : "bg-white text-[#8C807A] shadow-[1.5px_1.5px_0px_#92837B] hover:bg-black/5"
              }`}
            >
              ✿ {cat}
            </button>
          );
        })}
      </div>

      {/* Scrolling Word List */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-3.5">
        {filteredVocab.length === 0 ? (
          <div className="text-center py-10 text-xs font-bold text-[#8C807A]">
            分類中尚無單字 ✿ 請手動寫入或由上方主畫面匯入圖片！
          </div>
        ) : (
          filteredVocab.map((item) => {
            const nextDate = new Date(item.nextReviewDate);
            const dateStr = `${nextDate.getMonth() + 1}/${nextDate.getDate()}`;
            return (
              <div 
                key={item.id}
                className={`vocab-item relative flex items-center bg-white border-2 border-[#92837B] rounded-2xl p-4 pt-4 shadow-[2px_2px_0px_#92837B] transition-all duration-150 ${
                  item.level === 5 ? "mastered-item bg-[#F3EFE6] shadow-[1px_1px_0px_#92837B] opacity-85" : ""
                }`}
              >
                {/* Diagonal strip paper sticker */}
                <span className="vocab-category-tag absolute top-[-8px] right-3 text-[#5C524E] border border-[#92837B] text-[8px] font-extrabold px-2 py-0.5 rounded-md shadow-[1px_1px_0px_#92837B] select-none rotate-[-1.5deg]">
                  ✿ {item.category || "未分類"}
                </span>

                {/* Left heartcheckbox */}
                <div 
                  onClick={() => onToggleMastered(item.id)}
                  className={`vocab-checkbox w-5 h-5 rounded-full border-2 border-[#92837B] flex items-center justify-center mr-3 mt-1 cursor-pointer bg-white transition-all flex-shrink-0 ${
                    item.level === 5 ? "checked bg-[#FBF0F0] border-[#C57B83]" : ""
                  }`}
                >
                  {item.level === 5 && <span className="text-[#C57B83] text-[9.5px]">♥</span>}
                </div>

                {/* Content details */}
                <div className="flex-1 min-w-0 pr-10">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="vocab-word text-sm font-black text-[#5C524E] lowercase">
                      {item.word}
                    </span>
                    <span className="vocab-pos text-[9px] text-[#8C807A] italic font-bold">
                      {item.pos}
                    </span>
                    <div className="ml-auto flex items-center">
                      <CarrotSilhouette level={item.level} />
                    </div>
                  </div>
                  <div className="vocab-trans text-[11px] text-[#8C807A] font-bold mt-0.5">
                    {item.trans}
                    <span className="text-[9px] text-[#A39791] font-normal ml-1.5 select-none">
                      (下次: {dateStr})
                    </span>
                  </div>
                </div>

                {/* Options edit / delete buttons */}
                <div className="vocab-actions flex gap-0.5 self-end absolute bottom-1.5 right-2">
                  <button 
                    onClick={() => handleEditClick(item)}
                    className="p-1 px-2 rounded-md font-bold text-[#8C807A] text-[11px] hover:bg-[#FBF0F0] hover:text-[#C57B83] cursor-pointer"
                  >
                    ✎
                  </button>
                  <button 
                    onClick={() => onDeleteWord(item.id)}
                    className="p-1 px-2 rounded-md font-bold text-[#8C807A] text-[11px] hover:bg-red-50 hover:text-red-600 cursor-pointer"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Back button */}
      <button 
        onClick={() => onSwitchView("mainView")}
        className="sticker-btn bg-[#A39791] text-white border-2 border-[#92837B] text-xs font-extrabold py-2 px-4 rounded-2xl cursor-pointer w-full mt-2.5 select-none"
      >
        ↩ 返回主畫面
      </button>

      <style>{`
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

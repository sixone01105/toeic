import React, { useState, useEffect } from "react";
import { VocabItem } from "../types";
import { CarrotSilhouette } from "./CarrotSilhouette";

interface ReviewViewProps {
  reviewPool: VocabItem[];
  onCompleteReview: (id: string, remembered: boolean) => void;
  onExitReview: () => void;
  onFinishedReview?: () => void;
}

export function ReviewView({ reviewPool, onCompleteReview, onExitReview, onFinishedReview }: ReviewViewProps) {
  const [sessionQueue, setSessionQueue] = useState<VocabItem[]>([]);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const isCompleted = sessionStarted && sessionQueue.length === 0;

  const handleSpeak = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const currentCard = sessionQueue[0];
    if (!currentCard) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentCard.word);
      utterance.lang = "en-US";
      
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith("en-US")) || voices.find(v => v.lang.startsWith("en"));
      if (engVoice) {
        utterance.voice = engVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech synthesis error:", err);
    }
  };

  // Initialize queue once
  useEffect(() => {
    if (!sessionStarted && reviewPool.length > 0) {
      setSessionQueue([...reviewPool]);
      setFailedIds(new Set());
      setSessionStarted(true);
    }
  }, [reviewPool, sessionStarted]);

  // Notify parent of review completion
  useEffect(() => {
    if (isCompleted) {
      if (onFinishedReview) {
        onFinishedReview();
      }
    }
  }, [isCompleted, onFinishedReview]);

  useEffect(() => {
    // Keyboard controller listener inside session
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) {
        if (e.key === "Enter" || e.code === "Space") {
          e.preventDefault();
          onExitReview();
        }
        return;
      }

      const activeCard = sessionQueue[0];
      if (!activeCard) return;

      // Voice read-out hotkey 'v' or 'V'
      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        handleSpeak();
        return;
      }

      if (!isFlipped) {
        if (e.key === "Enter" || e.code === "Space") {
          e.preventDefault();
          setIsFlipped(true);
        }
      } else {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSrsSubmit(true);
        } else if (e.code === "Space") {
          e.preventDefault();
          handleSrsSubmit(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionQueue, isFlipped, isCompleted, onExitReview]);

  const handleSrsSubmit = (remembered: boolean) => {
    if (isCompleted || sessionQueue.length === 0) return;
    const currentCard = sessionQueue[0];
    
    if (remembered) {
      // Check if it failed previously in this session
      const hadFailed = failedIds.has(currentCard.id);
      
      // Fire callback with success only if they never failed it during this active loop
      if (!hadFailed) {
        onCompleteReview(currentCard.id, true);
      }
      
      // Remove card from active queue
      setSessionQueue((prev) => prev.slice(1));
    } else {
      // It's a failure (don't remember)
      // Only call onCompleteReview with false once to prevent duplicate toast messages and DB saving
      if (!failedIds.has(currentCard.id)) {
        onCompleteReview(currentCard.id, false);
        setFailedIds((prev) => {
          const updated = new Set(prev);
          updated.add(currentCard.id);
          return updated;
        });
      }
      
      // Move this card to the end of the queue
      setSessionQueue((prev) => {
        if (prev.length <= 1) return prev; // keep same if only 1 card left
        return [...prev.slice(1), prev[0]];
      });
    }
    
    // Reset flip mode for the next card in queue
    setIsFlipped(false);
  };

  const toggleFlip = () => {
    if (isCompleted) return;
    setIsFlipped(!isFlipped);
  };

  if (isCompleted) {
    return (
      <div className="flex-1 flex flex-col p-4">
        {/* Header bar */}
        <div className="flex justify-between items-center mb-3">
          <button 
            className="p-1 px-2.5 rounded-lg text-sm text-[#8C807A] hover:bg-[#FBF0F0] font-bold cursor-pointer"
            onClick={onExitReview}
          >
            ✕
          </button>
          <span className="text-[13px] font-black text-[#5C524E]">✿ 單字記憶複習 ✿</span>
          <div className="bg-[#FBF0F0] border-2 border-[#C57B83] rounded-lg px-2 py-0.5 text-[10px] font-extrabold text-[#C57B83] shadow-sm select-none">
            已背完
          </div>
        </div>

        {/* Finished State Box */}
        <div className="flex-1 flex items-center justify-center mb-4">
          <div className="w-full h-[270px] bg-white border-[3.5px] border-[#92837B] rounded-[28px] shadow-[4px_4px_0px_#92837B] flex flex-col justify-center items-center p-5 text-center relative">
            <span className="absolute top-2.5 right-3.5 text-[#C57B83] text-lg opacity-60">✿</span>
            <div className="text-[10px] font-extrabold text-[#8C807A] mb-3 tracking-widest">
              ✿ 複習完畢 ✿
            </div>
            <div className="text-[20px] font-black text-[#5C524E] leading-snug">
              本輪到期單字已背完！
            </div>
            <div className="text-xs text-[#C57B83] font-extrabold mt-2">
              明天也要繼續加油喔！
            </div>
          </div>
        </div>

        {/* Finished states buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          <button 
            onClick={onExitReview}
            className="sticker-btn text-white rounded-xl py-2 px-4 text-xs font-black cursor-pointer w-full text-center"
            style={{ backgroundColor: "#C57B83" }}
          >
            返回主畫面 (Enter)
          </button>
          <p className="text-center text-[9px] text-[#8C807A] font-bold">
            熱鍵：Enter 或空白鍵返回
          </p>
        </div>
      </div>
    );
  }

  const activeCard = sessionQueue[0];

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      {/* Header bar active */}
      <div className="flex justify-between items-center mb-3">
        <button 
          className="p-1 px-2.5 rounded-lg text-sm text-[#8C807A] hover:bg-[#FBF0F0] font-bold cursor-pointer"
          onClick={onExitReview}
        >
          ✕
        </button>
        <span className="text-[13px] font-black text-[#5C524E]">✿ 單字記憶複習 ✿</span>
        <div className="bg-[#FBF0F0] border-[2px] border-[#C57B83] rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold text-[#C57B83] shadow-sm select-none animate-pulse">
          剩 {sessionQueue.length} 張
        </div>
      </div>

      {/* Interactive flipping Box */}
      <div className="flex-1 flex items-center justify-center mb-4">
        {activeCard && (
          <div 
            onClick={toggleFlip}
            className={`w-full h-[270px] bg-white border-[3.5px] border-[#92837B] rounded-[28px] shadow-[4px_4px_0px_#92837B] flex flex-col justify-center items-center p-5 text-center relative cursor-pointer select-none transition-all duration-200 hover:scale-101 ${
              isFlipped ? "bg-[#FAF8F0]/95 border-[#C07C44] scale-[0.99] shadow-[2px_2px_0px_#92837B]" : ""
            }`}
          >
            {/* Speaker icon / Pronunciation button */}
            <button
              onClick={handleSpeak}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#FFF9F5] border-2 border-[#92837B] text-[#C57B83] hover:text-[#9E5E65] hover:bg-[#FDF2F2] active:translate-y-0.5 active:shadow-[1px_1px_0px_#92837B] shadow-[2.5px_2.5px_0px_#92837B] transition-all cursor-pointer z-20"
              title="朗讀發音 (按 V 鍵)"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>

            {isFlipped ? (
              <div className="flex flex-col justify-center items-center gap-2">
                <div className="text-[13px] font-extrabold text-[#8C807A] tracking-wider mb-1 lowercase select-all decoration-dotted underline underline-offset-4 decoration-[#C57B83]">
                  {activeCard.word}
                </div>
                <div className="text-2xl font-black text-[#9E5E65] leading-snug break-all max-w-[260px]">
                  {activeCard.trans}
                </div>
                <div className="text-[12px] font-extrabold text-[#C57B83] italic">
                  詞性：{activeCard.pos}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="text-[36px] font-black text-[#5C524E] lowercase leading-snug break-all max-w-[260px]">
                  {activeCard.word}
                </div>
                <div className="text-[11px] font-bold text-[#8C807A]/80 tracking-wider mt-2.5 animate-pulse">
                  👆 點擊翻面
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spaced repetition scoring buttons */}
      <div className="flex flex-col gap-2 mt-auto">
        {!isFlipped ? (
          <button 
            onClick={toggleFlip}
            className="sticker-btn text-white rounded-xl py-2 px-4 text-xs font-black cursor-pointer w-full text-center"
            style={{ backgroundColor: "#C57B83" }}
          >
            顯示釋義 (Enter)
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleSrsSubmit(false)}
              className="sticker-btn hover:opacity-90 text-[#9E5E65] bg-[#FDF2F2] border-2 border-[#92837B] rounded-xl py-2 px-3 text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1"
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 100 100" 
                className="inline-block"
              >
                {/* Thick dark circle border */}
                <circle cx="50" cy="50" r="38" stroke="#474747" strokeWidth="12" fill="none" />
                {/* Emerald Green slanted cross (X) */}
                <line x1="28" y1="28" x2="72" y2="72" stroke="#13B584" strokeWidth="14" strokeLinecap="round" />
                <line x1="72" y1="28" x2="28" y2="72" stroke="#13B584" strokeWidth="14" strokeLinecap="round" />
              </svg>
              不記得 (Space)
            </button>
            <button 
              onClick={() => handleSrsSubmit(true)}
              className="sticker-btn hover:opacity-90 text-[#3C322E] bg-[#EBF2EE] border-2 border-[#92837B] rounded-xl py-2 px-3 text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1"
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 100 100" 
                className="inline-block"
              >
                {/* Thick dark circle border */}
                <circle cx="50" cy="50" r="38" stroke="#474747" strokeWidth="12" fill="none" />
                {/* Red checkmark (tick) */}
                <path d="M 32,50 L 46,64 L 84,20" stroke="#E54545" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              記得 (Enter)
            </button>
          </div>
        )}

        <p className="text-center text-[9px] text-[#8C807A] font-medium" id="keyboardTip">
          {isFlipped 
            ? "熱鍵：Enter 記得 ｜ Space 不記得 ｜ V 鍵朗讀" 
            : "熱鍵：Enter 或空白鍵翻頁 ｜ V 鍵朗讀"
          }
        </p>
      </div>
    </div>
  );
}

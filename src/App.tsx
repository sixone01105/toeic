import React, { useState, useEffect } from "react";
import { VocabItem, CurrentView } from "./types";
import { MainView } from "./components/MainView";
import { ManageView } from "./components/ManageView";
import { ReviewView } from "./components/ReviewView";
import { CalendarModal } from "./components/CalendarModal";
import { CustomConfirmModal } from "./components/CustomConfirmModal";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { FullVocabularyReader } from "./components/FullVocabularyReader";

// Helper for generating Unique IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Leitner Spaced Repetition Days
const LEITNER_INTERVALS = [0, 1, 2, 4, 7, 14]; // in days

const DEFAULT_VOCAB: VocabItem[] = [
  { id: "1", word: "document", pos: "n.", trans: "文件", mastered: false, level: 5, nextReviewDate: Date.now(), category: "多益470" },
  { id: "2", word: "insurance", pos: "n.", trans: "保險", mastered: false, level: 0, nextReviewDate: Date.now(), category: "多益505" },
  { id: "3", word: "madam", pos: "n.", trans: "夫人", mastered: false, level: 0, nextReviewDate: Date.now(), category: "多益550" },
  { id: "4", word: "demand", pos: "v.", trans: "要求", mastered: false, level: 0, nextReviewDate: Date.now(), category: "多益600" },
  { id: "5", word: "vivid", pos: "adj.", trans: "生動的", mastered: false, level: 0, nextReviewDate: Date.now(), category: "多益650" }
];

interface ToastConfig {
  message: string;
  visible: boolean;
}

export default function App() {
  const [currentView, setCurrentView] = useState<CurrentView>("mainView");
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  
  // Custom API configuration states
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem("vocab_gemini_api_key") || "");
  const [serverHasApiKey, setServerHasApiKey] = useState<boolean>(false);
  
  // Safe navigation interceptor state
  const [isReviewFinished, setIsReviewFinished] = useState(true);

  // Spaced repetition time-fly offset (in milliseconds)
  const [simulatedTimeOffset, setSimulatedTimeOffset] = useState<number>(0);
  
  // Overlays
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoadingOverlayOpen, setIsLoadingOverlayOpen] = useState(false);
  const [loadingProgressText, setLoadingProgressText] = useState("");
  
  // Custom toast notification state
  const [toast, setToast] = useState<ToastConfig>({ message: "", visible: false });
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [readerInitialFilter, setReaderInitialFilter] = useState<"all" | "learning" | "mastered">("all");

  // Custom Confirm Modal settings
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Safe intermediate navigation controller
  const navigateViewSafely = (targetView: CurrentView) => {
    if (currentView === "reviewView" && !isReviewFinished) {
      setConfirmModal({
        isOpen: true,
        title: "確定離開？ ⚠️",
        message: "確定要離開?複習會中斷唷!",
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setIsReviewFinished(true);
          setCurrentView(targetView);
        },
        onCancel: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      setCurrentView(targetView);
    }
  };

  // Load state on mount
  useEffect(() => {
    const localVocab = localStorage.getItem("vocab_master_list");
    if (localVocab) {
      try {
        setVocabList(JSON.parse(localVocab));
      } catch (e) {
        setVocabList(DEFAULT_VOCAB);
      }
    } else {
      setVocabList(DEFAULT_VOCAB);
    }

    const localOffset = localStorage.getItem("vocab_master_time_offset");
    if (localOffset) {
      setSimulatedTimeOffset(parseInt(localOffset, 10));
    }

    // Check backend config availability
    fetch("/api/config")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        setServerHasApiKey(!!data.hasApiKey);
      })
      .catch(() => {
        setServerHasApiKey(false);
      });
  }, []);

  // Save to localStorage when changed
  const saveVocabList = (updated: VocabItem[]) => {
    setVocabList(updated);
    localStorage.setItem("vocab_master_list", JSON.stringify(updated));
  };

  const handleSimulateTimeFly = () => {
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const newOffset = simulatedTimeOffset + oneDayInMs;
    setSimulatedTimeOffset(newOffset);
    localStorage.setItem("vocab_master_time_offset", newOffset.toString());
    showToast("⏰ 時光飛逝 1 天！已更新今日 SRS 排程到期狀況！");
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };

  // Close toast automatically
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast({ message: "", visible: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Spaced Repetition logic transition formula
  const handleCompleteReviewCard = (id: string, remembered: boolean) => {
    const updated = vocabList.map((item) => {
      if (item.id === id) {
        let newLevel = item.level;
        let newNextReviewDate = Date.now() + simulatedTimeOffset;

        if (remembered) {
          newLevel = Math.min(item.level + 1, 5);
          const intervalDays = LEITNER_INTERVALS[newLevel];
          newNextReviewDate += intervalDays * 24 * 60 * 60 * 1000;
          showToast(`♥ 熟練度提升為等級 ${newLevel}！`);
        } else {
          newLevel = 0;
          newNextReviewDate += 0; // immediate retry
          showToast(`💔 記憶熟練度已重置`);
        }

        return {
          ...item,
          level: newLevel,
          nextReviewDate: newNextReviewDate
        };
      }
      return item;
    });
    saveVocabList(updated);
  };

  // Starting a study review card session
  const [reviewPool, setReviewPool] = useState<VocabItem[]>([]);

  const handleStartReview = () => {
    const cutoffTime = Date.now() + simulatedTimeOffset;
    
    // Items are due if nextReviewDate is in the past, and has not been logged as marked mastered
    const dueVocab = vocabList.filter(item => {
      return item.level < 5 && item.nextReviewDate <= cutoffTime;
    });

    if (dueVocab.length === 0) {
      setConfirmModal({
        isOpen: true,
        title: "✿ 貼心小提示 ✿",
        message: "目前今日沒有到期的單字喔！\n是否要複習字庫中其他尚未完全掌握的單字？",
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          const unmastered = vocabList.filter(item => item.level < 5);
          if (unmastered.length === 0) {
            showToast("字庫為空或所有單字皆已掌握，請先手動寫入或由上方主畫面匯入圖片！");
            return;
          }
          initiateReviewActivity(unmastered);
        },
        onCancel: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      initiateReviewActivity(dueVocab);
    }
  };

  const initiateReviewActivity = (pool: VocabItem[]) => {
    // Shuffle the pool to give randomized Leitner decks
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setReviewPool(shuffled);
    setIsReviewFinished(false);
    setCurrentView("reviewView");
  };

  // OCR upload image processing
  const handleOcrUpload = async (imageBase64: string) => {
    setIsLoadingOverlayOpen(true);
    setLoadingProgressText("傳送至 Gemini AI 進行專家級辨識與智慧分類中...");

    let isSuccess = false;
    const apiEndpoint = "/api/ocr";

    // Exponential backoff retry loop up to 4 attempts
    let backoffDelay = 1000;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        if (attempt > 1) {
          setLoadingProgressText(`連線重試中 (第 ${attempt} 次/共 4 次)...`);
        }

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const savedCustomKey = localStorage.getItem("vocab_gemini_api_key") || customApiKey || "";
        if (savedCustomKey) {
          headers["x-gemini-api-key"] = savedCustomKey;
        }

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ imageBase64, customApiKey: savedCustomKey })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.results && Array.isArray(data.results)) {
            importOcrItems(data.results);
            isSuccess = true;
            break;
          } else {
            throw new Error("Invalid results format received from Gemini OCR service.");
          }
        } else {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `Server returned error status ${response.status}`);
        }
      } catch (e) {
        console.error(`Gemini OCR attempt ${attempt} failed:`, e);
      }

      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        backoffDelay *= 2;
      }
    }

    if (!isSuccess) {
      setIsLoadingOverlayOpen(false);
      setConfirmModal({
        isOpen: true,
        title: "辨識服務不可用 ⚠️",
        message: "Gemini AI 辨識服務目前暫時沒有回應，請稍候重試，或確認網路與 API Key 設定正常！",
        onConfirm: () => setConfirmModal(p => ({ ...p, isOpen: false })),
        onCancel: () => setConfirmModal(p => ({ ...p, isOpen: false }))
      });
    } else {
      setIsLoadingOverlayOpen(false);
    }
  };

  const importOcrItems = (items: any[]) => {
    if (!items || items.length === 0) {
      setIsLoadingOverlayOpen(false);
      setConfirmModal({
        isOpen: true,
        title: "辨識失敗 ⚠️",
        message: "我看不懂這張圖片的文字，請重新再給我一張!!",
        onConfirm: () => setConfirmModal(p => ({ ...p, isOpen: false })),
        onCancel: () => setConfirmModal(p => ({ ...p, isOpen: false }))
      });
      setCurrentView("mainView");
      return;
    }

    let addedCount = 0;
    const currentList = [...vocabList];
    const duplicates: string[] = [];

    // Format current date with offset as MMDD (e.g., 0611 for 2026/06/11)
    const d = new Date(Date.now() + simulatedTimeOffset);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const defaultDateTag = `${month}${date}`;

    items.forEach((item) => {
      const wordFormatted = item.word.toLowerCase().trim();
      const posFormatted = item.pos ? (item.pos.endsWith(".") ? item.pos : item.pos + ".") : "n.";
      const transCleaned = item.trans.trim();
      // Set default category label to today's date tag (e.g. "0611")
      const categoryLabel = defaultDateTag;

      // Verify duplication
      const exists = vocabList.some(v => v.word.toLowerCase() === wordFormatted);
      if (exists) {
        if (!duplicates.includes(wordFormatted)) {
          duplicates.push(wordFormatted);
        }
      } else if (wordFormatted.length > 1) {
        // Also check if we already added it in this single batch to prevent self-duplication
        const alreadyAdded = currentList.some(v => v.word.toLowerCase() === wordFormatted);
        if (!alreadyAdded) {
          currentList.unshift({
            id: generateId(),
            word: wordFormatted,
            pos: posFormatted,
            trans: transCleaned,
            category: categoryLabel,
            mastered: false,
            level: 0,
            nextReviewDate: Date.now() + simulatedTimeOffset
          });
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      saveVocabList(currentList);
    }
    setCurrentView("manageView");

    if (duplicates.length > 0) {
      setConfirmModal({
        isOpen: true,
        title: "有一樣的單字 ⚠️",
        message: `偵測到以下單字已存在於單字庫中，將不重複加入：\n\n${duplicates.join(", ")}`,
        onConfirm: () => setConfirmModal(p => ({ ...p, isOpen: false })),
        onCancel: () => setConfirmModal(p => ({ ...p, isOpen: false }))
      });
      if (addedCount > 0) {
        showToast(`🎉 成功匯入 ${addedCount} 個新單字！重複單字已被跳過。`);
      } else {
        showToast("⚠️ 圖片中的單字皆與現有字庫重複。");
      }
    } else {
      if (addedCount > 0) {
        showToast(`🎉 解析成功！已智慧分類並匯入 ${addedCount} 個單字。`);
      } else {
        showToast("解析完畢！未發現任何新單字。");
      }
    }
  };

  // Add vocab manually
  const handleAddWord = (word: string, pos: string, trans: string, category: string) => {
    const isDup = vocabList.some(item => item.word.toLowerCase() === word.toLowerCase());
    if (isDup) {
      showToast("此單字已存在於字庫中囉！");
      return;
    }

    const newItem: VocabItem = {
      id: generateId(),
      word: word.toLowerCase(),
      pos,
      trans,
      category: category || "未分類",
      mastered: false,
      level: 0,
      nextReviewDate: Date.now() + simulatedTimeOffset
    };

    saveVocabList([newItem, ...vocabList]);
    showToast("🎉 已成功將新單字寫入字庫！");
  };

  // Edit vocab properties
  const handleEditWord = (id: string, updatedFields: Partial<VocabItem>) => {
    const updated = vocabList.map((item) => {
      if (item.id === id) {
        return { ...item, ...updatedFields };
      }
      return item;
    });
    saveVocabList(updated);
    showToast("✎ 單字編輯成功儲存！");
  };

  // Delete vocab
  const handleDeleteWord = (id: string) => {
    const filtered = vocabList.filter(item => item.id !== id);
    saveVocabList(filtered);
    showToast("🗑 已從字庫中安全移除。");
  };

  // Toggle mastered
  const handleToggleMastered = (id: string) => {
    const updated = vocabList.map((item) => {
      if (item.id === id) {
        const nextState = item.level < 5;
        showToast(nextState ? "♥ 已加入已掌握看板（等級 5），將暫停 SRS 複習。" : "♥ 已解除掌握，重新加入複習迴圈。");
        return { ...item, mastered: nextState, level: nextState ? 5 : 0 };
      }
      return item;
    });
    saveVocabList(updated);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 overflow-hidden select-none relative bg-[#EAE3D2]" style={{ backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)", backgroundSize: "20px 100%" }}>
      {/* Editorial Decorative Watermarks */}
      <div className="absolute top-10 left-10 opacity-20 transform -rotate-12 pointer-events-none hidden md:block">
        <div className="w-32 h-32 border-4 border-dashed border-[#92837B] rounded-full flex items-center justify-center text-xl font-bold text-[#5C524E]">CUTE STATIONERY</div>
      </div>
      
      <div className="absolute bottom-10 right-10 flex flex-col items-end pointer-events-none hidden md:flex">
        <div className="w-48 h-12 bg-[#FBF0F0] border-2 border-[#92837B] mb-2 transform rotate-2 flex items-center px-4 font-bold text-sm shadow-md text-[#5C524E]">NEW WORD ARRIVED!</div>
        <div className="w-12 h-24 bg-[#C57B83] rounded-t-full" style={{ border: "3px solid #92837B" }}></div>
      </div>

      <div className="absolute bottom-16 left-4 rotate-12 gap-1 pointer-events-none hidden md:flex">
        <div className="w-6 h-10 bg-[#E2DCD5]" style={{ clipPath: "polygon(50% 0%, 100% 20%, 80% 100%, 20% 100%, 0% 20%)", filter: "grayscale(1)", opacity: 0.5 }}></div>
        <div className="w-6 h-10 bg-[#E07A5F]" style={{ clipPath: "polygon(50% 0%, 100% 20%, 80% 100%, 20% 100%, 0% 20%)" }}></div>
        <div className="w-6 h-10 bg-[#E5A93B]" style={{ clipPath: "polygon(50% 0%, 100% 20%, 80% 100%, 20% 100%, 0% 20%)" }}></div>
      </div>

      {/* Spaced repetition phone frame */}
      <div 
        className="relative w-[360px] h-[740px] bg-[#FAF8F5] overflow-hidden flex flex-col"
        style={{ border: "2.5px solid #92837B", boxShadow: "8px 8px 0px rgba(146, 131, 123, 0.2)", borderRadius: "40px" }}
      >
        {/* Phone StatusBar */}
        <div className="p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="text-xl" style={{ filter: "drop-shadow(-1.2px 0px 0px #F5B09E) drop-shadow(1.2px 0px 0px #97B2C4)" }}>❤️</div>
            <span className="font-bold text-[#5C524E] text-base">{vocabList.filter(v => v.level === 5).length}</span>
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#8C807A]">
            {new Date().getHours().toString().padStart(2, "0")}:{new Date().getMinutes().toString().padStart(2, "0")}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#8FA89B]"></div>
            <div className="w-3 h-3 rounded-full bg-[#97B2C4]"></div>
          </div>
        </div>

        {/* Dynamic Views portals */}
        {currentView === "mainView" && (
          <MainView 
            vocabList={vocabList}
            onSimulateTimeFly={handleSimulateTimeFly}
            onStartReview={handleStartReview}
            onSwitchView={navigateViewSafely}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onOcrUpload={handleOcrUpload}
            onOpenReader={(filter) => {
              setReaderInitialFilter(filter || "all");
              setIsReaderOpen(true);
            }}
            customApiKey={customApiKey}
            serverHasApiKey={serverHasApiKey}
            onSaveApiKey={(key) => {
              setCustomApiKey(key);
              localStorage.setItem("vocab_gemini_api_key", key);
              showToast("🔑 API Key 儲存成功！");
            }}
          />
        )}

        {currentView === "manageView" && (
          <ManageView 
            vocabList={vocabList}
            onAddWord={handleAddWord}
            onEditWord={handleEditWord}
            onDeleteWord={handleDeleteWord}
            onToggleMastered={handleToggleMastered}
            onSwitchView={navigateViewSafely}
          />
        )}

        {currentView === "reviewView" && (
          <ReviewView 
            reviewPool={reviewPool}
            onCompleteReview={handleCompleteReviewCard}
            onExitReview={() => navigateViewSafely("mainView")}
            onFinishedReview={() => setIsReviewFinished(true)}
          />
        )}

        {/* Bottom Pill Navigation bar for cozy Editorial style */}
        <div className="p-4 mt-auto shrink-0 z-10 w-full bg-transparent">
          <div className="flex justify-around items-center px-2 py-1.5 bg-[#FAF8F5] relative" style={{ border: "2.5px solid #92837B", borderRadius: "32px" }}>
            <button 
              onClick={() => navigateViewSafely("mainView")}
              className="flex flex-col items-center gap-0.5 flex-1 cursor-pointer group focus:outline-none relative"
            >
              {/* Hover bunny silhouette peeking above the navbar */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 translate-y-2 scale-75 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-110 transition-all duration-300 ease-out text-[#C57B83] w-5 h-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] z-20">
                <svg viewBox="0 0 100 100" fill="currentColor" width="100%" height="100%" className="bunny-wiggle-svg">
                  <path d="M50,15 C45,15 42,25 42,35 C42,38 43,40 45,42 C30,45 25,55 25,70 C25,85 35,90 50,90 C65,90 75,85 75,70 C75,55 70,45 55,42 C57,40 58,38 58,35 C58,25 55,15 50,15 Z M42,5 C38,5 34,12 35,18 C36,20 38,22 41,20 C42,15 45,10 42,5 Z M58,5 C62,5 66,12 65,18 C64,20 62,22 59,20 C58,15 55,10 58,5 Z" />
                </svg>
              </div>
              <div className={`w-9 h-9 flex items-center justify-center rounded-full text-base font-bold transition-all ${
                currentView === "mainView" || currentView === "reviewView" ? "bg-[#C57B83] text-white border-2 border-[#92837B] scale-105" : "bg-transparent text-[#8C807A] opacity-60"
              }`}>
                🏠
              </div>
              <span className={`text-[10px] font-black tracking-wider transition-colors ${
                currentView === "mainView" || currentView === "reviewView" ? "text-[#C57B83]" : "text-[#663300] opacity-70"
              }`}>
                首頁
              </span>
            </button>

            <button 
              onClick={() => navigateViewSafely("manageView")}
              className="flex flex-col items-center gap-0.5 flex-1 cursor-pointer group focus:outline-none relative"
            >
              {/* Hover bunny silhouette peeking above the navbar */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 translate-y-2 scale-75 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-110 transition-all duration-300 ease-out text-[#C57B83] w-5 h-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] z-20">
                <svg viewBox="0 0 100 100" fill="currentColor" width="100%" height="100%" className="bunny-wiggle-svg">
                  <path d="M50,15 C45,15 42,25 42,35 C42,38 43,40 45,42 C30,45 25,55 25,70 C25,85 35,90 50,90 C65,90 75,85 75,70 C75,55 70,45 55,42 C57,40 58,38 58,35 C58,25 55,15 50,15 Z M42,5 C38,5 34,12 35,18 C36,20 38,22 41,20 C42,15 45,10 42,5 Z M58,5 C62,5 66,12 65,18 C64,20 62,22 59,20 C58,15 55,10 58,5 Z" />
                </svg>
              </div>
              <div className={`w-9 h-9 flex items-center justify-center rounded-full text-base font-bold transition-all ${
                currentView === "manageView" ? "bg-[#C57B83] text-white border-2 border-[#92837B] scale-105" : "bg-transparent text-[#8C807A] opacity-60"
              }`}>
                📚
              </div>
              <span className={`text-[10px] font-black tracking-wider transition-colors ${
                currentView === "manageView" ? "text-[#C57B83]" : "text-[#663300] opacity-70"
              }`}>
                單字庫
              </span>
            </button>

            <button 
              onClick={() => {
                if (currentView === "reviewView") return;
                const unmastered = vocabList.filter(item => item.level < 5);
                if (unmastered.length > 0) initiateReviewActivity(unmastered);
                else {
                  showToast("字庫無可用複習單字！");
                }
              }}
              className="flex flex-col items-center gap-0.5 flex-1 cursor-pointer group focus:outline-none relative"
            >
              {/* Hover bunny silhouette peeking above the navbar */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 translate-y-2 scale-75 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-110 transition-all duration-300 ease-out text-[#C57B83] w-5 h-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] z-20">
                <svg viewBox="0 0 100 100" fill="currentColor" width="100%" height="100%" className="bunny-wiggle-svg">
                  <path d="M50,15 C45,15 42,25 42,35 C42,38 43,40 45,42 C30,45 25,55 25,70 C25,85 35,90 50,90 C65,90 75,85 75,70 C75,55 70,45 55,42 C57,40 58,38 58,35 C58,25 55,15 50,15 Z M42,5 C38,5 34,12 35,18 C36,20 38,22 41,20 C42,15 45,10 42,5 Z M58,5 C62,5 66,12 65,18 C64,20 62,22 59,20 C58,15 55,10 58,5 Z" />
                </svg>
              </div>
              <div className={`w-9 h-9 flex items-center justify-center rounded-full text-base font-bold transition-all ${
                currentView === "reviewView" ? "bg-[#C57B83] text-white border-2 border-[#92837B] scale-105" : "bg-transparent text-[#8C807A] opacity-60"
              }`}>
                📊
              </div>
              <span className={`text-[10px] font-black tracking-wider transition-colors ${
                currentView === "reviewView" ? "text-[#C57B83]" : "text-[#663300] opacity-70"
              }`}>
                複習
              </span>
            </button>
          </div>
        </div>

        {/* Overlays / Modals */}
      <FullVocabularyReader 
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        vocabList={vocabList}
        onToggleMastered={handleToggleMastered}
        initialFilter={readerInitialFilter}
      />

      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        currentDate={new Date(Date.now() + simulatedTimeOffset)}
      />

      <CustomConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />

      <LoadingOverlay 
        isOpen={isLoadingOverlayOpen} 
        statusText={loadingProgressText}
      />

      {/* Custom float Toast notifications */}
      {toast.visible && (
        <div 
          className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[85%] bg-[#FAF8F5] border-2 border-[#92837B] rounded-2xl p-2.5 text-center text-xs font-black shadow-[2px_2px_0px_#92837B] text-[#5C524E] z-[200] pointer-events-none select-none transition-all duration-300"
          style={{ animation: "popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
        >
          {toast.message}
        </div>
      )}
      </div>
    </div>
  );
}

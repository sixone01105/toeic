import React from "react";

interface CustomConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CustomConfirmModal({ isOpen, title, message, onConfirm, onCancel }: CustomConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-[#5C524E]/50 z-[110] flex justify-center items-center p-5 backdrop-blur-[1px]">
      <div 
        className="bg-[#FAF8F5] border-[3px] border-[#92837B] rounded-[28px] p-6 w-full max-w-[310px] shadow-[4px_4px_0px_#92837B] text-center"
        style={{ animation: "popIn 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
      >
        <div className="text-base font-extrabold mb-2.5 text-[#91585F]" id="confirmTitle">
          {title || "✿ 貼心小提示 ✿"}
        </div>
        <div className="text-xs text-[#5C524E] leading-relaxed mb-5 font-semibold whitespace-pre-line" id="confirmText">
          {message}
        </div>
        <div className="flex gap-3 justify-center">
          <button 
            className="sticker-btn bg-white text-[#5C524E] rounded-xl px-4 py-1.5 text-xs font-bold"
            onClick={onCancel}
          >
            取消
          </button>
          <button 
            className="sticker-btn text-white rounded-xl px-4 py-1.5 text-xs font-bold"
            style={{ backgroundColor: "#8FA89B" }} // success powder green
            onClick={onConfirm}
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
}

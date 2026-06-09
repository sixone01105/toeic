import React from "react";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
}

export function CalendarModal({ isOpen, onClose, currentDate }: CalendarModalProps) {
  if (!isOpen) return null;

  const monthNames = [
    "1 月 一月", "2 月 二月", "3 月 三月", "4 月 四月",
    "5 月 五月", "6 月 六月", "7 月 七月", "8 月 八月",
    "9 月 九月", "10 月 十月", "11 月 十一月", "12 月 十二月"
  ];

  const year = currentDate.getFullYear();
  const monthIdx = currentDate.getMonth();
  const day = currentDate.getDate();

  // Draw 30/31 days of June 2026 just as a cute decoration, highlighting the current simulated date
  const totalDays = new Date(year, monthIdx + 1, 0).getDate();
  const startDayOfWeek = new Date(year, monthIdx, 1).getDay(); // Weekday of day 1

  const daysArr = [];
  // Fill empty leading days
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArr.push(null);
  }
  // Fill month days
  for (let d = 1; d <= totalDays; d++) {
    daysArr.push(d);
  }

  return (
    <div 
      className="absolute top-0 left-0 w-full h-full bg-black/40 z-90 flex justify-center items-end backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF8F5] w-full border-t-[4px] border-l-[4px] border-r-[4px] border-[#92837B] rounded-t-3xl p-5 shadow-2xl transition-transform duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 0.2s ease-out" }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-extrabold text-[#5C524E]">
            ✿ {year} 年 {monthNames[monthIdx]} ✿
          </h3>
          <button 
            className="text-[#8C807A] hover:bg-[#FBF0F0] hover:text-[#C57B83] p-1.5 rounded-lg text-sm font-bold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-[#5C524E]">
          {/* Header */}
          {["日", "一", "二", "三", "四", "五", "六"].map((w, idx) => (
            <div 
              key={idx} 
              className={`pb-2 font-extrabold ${idx === 0 || idx === 6 ? "text-[#C57B83]" : "text-[#8C807A]"}`}
            >
              {w}
            </div>
          ))}

          {/* Day Grid */}
          {daysArr.map((d, index) => {
            if (d === null) {
              return <div key={`empty-${index}`} />;
            }
            const isToday = d === day;
            return (
              <div 
                key={`day-${d}`} 
                className={`py-1.5 rounded-lg flex items-center justify-center font-bold ${
                  isToday 
                    ? "bg-[#FBF0F0] border-[1.5px] border-[#C57B83] text-[#C57B83] font-black scale-105" 
                    : "text-[#5C524E] hover:bg-black/5"
                }`}
              >
                {d}
              </div>
            );
          })}
        </div>

        <div className="text-[10px] text-[#8C807A] mt-4 text-center font-bold">
          * 點擊主畫面「快轉模擬 1 天」即可觀看日期流逝與單字到期。
        </div>
      </div>
    </div>
  );
}

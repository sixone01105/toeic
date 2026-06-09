import React from "react";

interface CarrotProps {
  level: number;
}

export function CarrotSilhouette({ level }: CarrotProps) {
  const carrots = [];
  const isMax = level === 5;

  for (let i = 1; i <= 5; i++) {
    const filled = i <= level;
    
    // Level 5 stays gold, 1-4 level stays orange-red, 0 levels stay grey-clay
    const fillColor = filled 
      ? (isMax ? "#E5A93B" : "#E07A5F") 
      : "#E2DCD5";
      
    // Decorative lines inside the carrot
    const stripeColor = filled
      ? (isMax ? "#FFF4D6" : "#FFF0ED")
      : "#FAF8F5";

    carrots.push(
      <svg 
        key={i}
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        style={{ overflow: "visible" }}
        className="inline-block"
      >
        <g transform="rotate(45 12 12)">
          {/* Back leaves (Double leaf shape) */}
          <path 
            d="M 12 11 C 11 10.5, 9.5 10, 8.5 9 C 6 5, 10 4, 12 8 C 14 4, 18 5, 15.5 9 C 14.5 10, 13 10.5, 12 11 Z" 
            fill={fillColor} 
            stroke="none" 
          />
          {/* Main body of the carrot */}
          <path 
            d="M 8.2 11 C 8 13.5, 10 18, 12 21 C 14 18, 16 13.5, 15.8 11 Z" 
            fill={fillColor} 
            stroke="none" 
          />
          {/* Handdrawn texture score lines */}
          <line x1="10" y1="13.5" x2="14" y2="13.5" stroke={stripeColor} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="10.5" y1="15.5" x2="13.5" y2="15.5" stroke={stripeColor} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="11" y1="17.5" x2="13" y2="17.5" stroke={stripeColor} strokeWidth="1.3" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  return (
    <div className="flex items-center gap-[1px]" style={{ display: "inline-flex" }}>
      {carrots}
    </div>
  );
}

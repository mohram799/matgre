'use client';

import React, { useRef, useState } from 'react';

interface DraggableCarouselProps {
  children: React.ReactNode;
  className?: string;
}

export default function DraggableCarousel({ children, className = '' }: DraggableCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    setIsDown(true);
    setIsDragging(false);
    // Track cursor start position relative to container
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    // Walk represents scroll offset. Multiplier adjusts sensitivity.
    const walk = (x - startX) * 1.5;
    
    // If user dragged more than 5px, mark as dragging to block click events
    if (Math.abs(walk) > 5) {
      setIsDragging(true);
    }
    
    container.scrollLeft = scrollLeft - walk;
  };

  // Prevent link triggers if we are dragging
  const handleCaptureClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onClickCapture={handleCaptureClick}
      className={`flex overflow-x-auto scrollbar-none snap-x snap-mandatory select-none ${className}`}
      style={{ 
        cursor: isDown ? 'grabbing' : 'grab', 
        WebkitOverflowScrolling: 'touch' 
      }}
    >
      {children}
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface SpotlightProps {
  target: string; // CSS selector
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  padding?: number;
  onClickOutside?: () => void;
  className?: string;
}

export function Spotlight({ 
  target, 
  children, 
  position = 'bottom',
  offset = 16,
  padding = 8,
  onClickOutside,
  className 
}: SpotlightProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find target element
    const element = document.querySelector(target) as HTMLElement;
    if (element) {
      setTargetElement(element);
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight class
      element.classList.add('onboarding-highlight');
      
      return () => {
        element.classList.remove('onboarding-highlight');
      };
    }
  }, [target]);

  useEffect(() => {
    if (!targetElement || !popoverRef.current) return;

    const calculatePosition = () => {
      const targetRect = targetElement.getBoundingClientRect();
      const popoverRect = popoverRef.current!.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = targetRect.top - popoverRect.height - offset;
          left = targetRect.left + (targetRect.width - popoverRect.width) / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + offset;
          left = targetRect.left + (targetRect.width - popoverRect.width) / 2;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - popoverRect.height) / 2;
          left = targetRect.left - popoverRect.width - offset;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - popoverRect.height) / 2;
          left = targetRect.right + offset;
          break;
      }

      // Keep within viewport
      const viewportPadding = 16;
      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - popoverRect.height - viewportPadding));
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - popoverRect.width - viewportPadding));

      setPopoverPosition({ top, left });
    };

    calculatePosition();

    // Recalculate on scroll/resize
    const handleRecalculate = () => calculatePosition();
    window.addEventListener('scroll', handleRecalculate);
    window.addEventListener('resize', handleRecalculate);

    return () => {
      window.removeEventListener('scroll', handleRecalculate);
      window.removeEventListener('resize', handleRecalculate);
    };
  }, [targetElement, position, offset]);

  useEffect(() => {
    if (!onClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        targetElement &&
        !targetElement.contains(event.target as Node)
      ) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClickOutside, targetElement]);

  if (!targetElement) return null;

  const targetRect = targetElement.getBoundingClientRect();

  return createPortal(
    <>
      {/* Backdrop with cutout */}
      <div 
        className="fixed inset-0 z-40"
        style={{ pointerEvents: 'none' }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'auto' }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.5)"
            mask="url(#spotlight-mask)"
            className="animate-in fade-in duration-200"
          />
        </svg>
      </div>

      {/* Highlight border */}
      <div
        className="fixed z-40 pointer-events-none"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
        }}
      >
        <div className="w-full h-full rounded-lg ring-4 ring-primary/50 ring-offset-2 animate-pulse" />
      </div>

      {/* Popover content */}
      <div
        ref={popoverRef}
        className={cn(
          "fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200",
          className
        )}
        style={{
          top: popoverPosition.top,
          left: popoverPosition.left,
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}
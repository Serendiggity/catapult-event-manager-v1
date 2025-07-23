import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 7, 
  showHeader = true,
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex gap-4 p-4 border-b bg-muted/50">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton 
              key={`header-${i}`} 
              className={cn(
                "h-4",
                i === 0 ? "w-12" : "flex-1"
              )} 
            />
          ))}
        </div>
      )}
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="flex gap-4 p-4 border-b items-center min-h-[64px]"
        >
          {/* Checkbox column */}
          <Skeleton className="h-4 w-4 rounded" />
          
          {/* Data columns */}
          {Array.from({ length: columns - 1 }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className={cn(
                "h-4",
                colIndex === 0 ? "w-32" : colIndex === 1 ? "w-48" : "flex-1"
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}
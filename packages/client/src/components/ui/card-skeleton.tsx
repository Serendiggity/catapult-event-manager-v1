import React from 'react';
import { Skeleton } from './skeleton';
import { Card, CardContent, CardHeader } from './card';

interface CardSkeletonProps {
  showHeader?: boolean;
  lines?: number;
  showActions?: boolean;
  className?: string;
}

export function CardSkeleton({ 
  showHeader = true,
  lines = 3,
  showActions = true,
  className 
}: CardSkeletonProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      
      <CardContent className="space-y-3">
        {/* Content lines */}
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </div>
        ))}
        
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
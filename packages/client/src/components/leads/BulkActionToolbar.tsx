import React from 'react';
import { Button } from '../ui/button';
import { 
  Users, 
  Download, 
  Trash, 
  X,
  FolderPlus,
  Mail,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount?: number;
  onAddToGroup: () => void;
  onDelete: () => void;
  onExport: () => void;
  onSelectAll?: () => void;
  onDeselectAll: () => void;
  onAddTags?: () => void;
  onEmailSelected?: () => void;
  className?: string;
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  onAddToGroup,
  onDelete,
  onExport,
  onSelectAll,
  onDeselectAll,
  onAddTags,
  onEmailSelected,
  className
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
      "animate-in slide-in-from-bottom-2 duration-200",
      className
    )}>
      <div className="bg-background border rounded-lg shadow-lg">
        <div className="flex items-center">
          {/* Selection info */}
          <div className="px-4 py-3 border-r">
            <p className="text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? 'lead' : 'leads'} selected
              {totalCount && onSelectAll && selectedCount < totalCount && (
                <>
                  <span className="text-muted-foreground"> of {totalCount}</span>
                  <button
                    onClick={onSelectAll}
                    className="ml-2 text-primary hover:underline text-sm"
                  >
                    Select all
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddToGroup}
              className="gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add to Group</span>
            </Button>

            {onEmailSelected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEmailSelected}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
              </Button>
            )}

            {onAddTags && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddTags}
                className="gap-2"
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Tag</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            <div className="w-px h-6 bg-border mx-1" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>

          {/* Clear selection */}
          <div className="border-l px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
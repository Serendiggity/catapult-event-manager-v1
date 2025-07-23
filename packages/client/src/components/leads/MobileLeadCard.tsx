import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  Mail, 
  Building, 
  Phone,
  Globe,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  UserPlus,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@new-era-event-manager/shared';

interface MobileLeadCardProps {
  lead: Contact & { selected?: boolean };
  onSelect?: (selected: boolean) => void;
  onAction?: (action: string, leadId: string) => void;
  showCheckbox?: boolean;
  className?: string;
}

export function MobileLeadCard({ 
  lead, 
  onSelect, 
  onAction,
  showCheckbox = true,
  className 
}: MobileLeadCardProps) {
  const initials = lead.firstName && lead.lastName
    ? `${lead.firstName[0]}${lead.lastName[0]}`.toUpperCase()
    : lead.email?.[0]?.toUpperCase() || '?';

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      lead.selected && "ring-2 ring-primary",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          {showCheckbox && (
            <Checkbox
              checked={lead.selected || false}
              onCheckedChange={onSelect}
              className="mt-1"
              aria-label={`Select ${lead.firstName} ${lead.lastName}`}
            />
          )}

          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
            {initials}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-medium text-sm truncate">
                  {lead.firstName} {lead.lastName}
                </h4>
                {lead.title && (
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.title}
                  </p>
                )}
              </div>

              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => onAction?.('view', lead.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onAction?.('edit', lead.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onAction?.('add-to-group', lead.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add to Group
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onAction?.('tag', lead.id)}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Add Tag
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onAction?.('delete', lead.id)}
                    className="text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Contact details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                <a 
                  href={`mailto:${lead.email}`}
                  className="truncate text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lead.email}
                </a>
              </div>

              {lead.company && (
                <div className="flex items-center gap-2 text-xs">
                  <Building className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate text-muted-foreground">
                    {lead.company}
                  </span>
                </div>
              )}

              {lead.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                  <a 
                    href={`tel:${lead.phone}`}
                    className="truncate text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {lead.phone}
                  </a>
                </div>
              )}

              {lead.website && (
                <div className="flex items-center gap-2 text-xs">
                  <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                  <a 
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {lead.website}
                  </a>
                </div>
              )}
            </div>

            {/* Tags/Status */}
            <div className="flex items-center gap-2 mt-3">
              <Badge 
                variant={lead.source === 'manual' ? 'secondary' : 'default'}
                className="text-xs"
              >
                {lead.source === 'manual' ? 'Manual' : 'Scanned'}
              </Badge>
              
              {lead.updatedAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(lead.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { MobileLeadCard } from './MobileLeadCard';
import { BulkActionToolbar } from './BulkActionToolbar';
import { TableSkeleton } from '../ui/table-skeleton';
import { EmptyState } from '../ui/empty-state';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Users, 
  Search, 
  Filter,
  Plus,
  Upload,
  Grid3X3,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@new-era-event-manager/shared';

interface ResponsiveLeadsViewProps {
  leads: Contact[];
  loading?: boolean;
  onSelectLead?: (leadId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onAction?: (action: string, leadId: string | string[]) => void;
  onAddLead?: () => void;
  onImportLeads?: () => void;
  selectedLeads?: string[];
  className?: string;
}

export function ResponsiveLeadsView({
  leads,
  loading = false,
  onSelectLead,
  onSelectAll,
  onAction,
  onAddLead,
  onImportLeads,
  selectedLeads = [],
  className
}: ResponsiveLeadsViewProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'company'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'verified' | 'unverified'>('all');

  // Auto-switch to cards on mobile
  useEffect(() => {
    if (isMobile) {
      setViewMode('cards');
    }
  }, [isMobile]);

  // Filter and sort leads
  const processedLeads = leads
    .filter(lead => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableFields = [
          lead.firstName,
          lead.lastName,
          lead.email,
          lead.company,
          lead.title,
          lead.phone
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableFields.includes(query)) return false;
      }

      // Status filter
      if (filterBy === 'verified' && lead.source !== 'manual') return false;
      if (filterBy === 'unverified' && lead.source === 'manual') return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleBulkAction = (action: string) => {
    if (selectedLeads.length > 0) {
      onAction?.(action, selectedLeads);
    }
  };

  if (loading) {
    return viewMode === 'table' ? (
      <TableSkeleton rows={5} columns={7} />
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No leads yet"
        description="Start by adding leads from your events or importing from a file"
        action={
          onAddLead ? {
            label: "Add Your First Lead",
            onClick: onAddLead
          } : undefined
        }
        secondaryAction={
          onImportLeads ? {
            label: "Import Leads",
            onClick: onImportLeads
          } : undefined
        }
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Latest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle (desktop only) */}
          {!isMobile && (
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Add actions */}
          {(onAddLead || onImportLeads) && (
            <>
              <div className="w-px bg-border" />
              {onAddLead && (
                <Button size="sm" onClick={onAddLead}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              )}
              {onImportLeads && (
                <Button size="sm" variant="outline" onClick={onImportLeads}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {processedLeads.length === leads.length ? (
          <span>{leads.length} leads</span>
        ) : (
          <span>
            Showing {processedLeads.length} of {leads.length} leads
          </span>
        )}
        {selectedLeads.length > 0 && (
          <span className="ml-2">
            • {selectedLeads.length} selected
          </span>
        )}
      </div>

      {/* Content */}
      {viewMode === 'cards' || isMobile ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processedLeads.map(lead => (
            <MobileLeadCard
              key={lead.id}
              lead={{
                ...lead,
                selected: selectedLeads.includes(lead.id)
              }}
              onSelect={(selected) => onSelectLead?.(lead.id, selected)}
              onAction={onAction}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Company</th>
                <th className="text-left p-4 font-medium">Phone</th>
                <th className="text-left p-4 font-medium">Added</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {processedLeads.map(lead => (
                <tr 
                  key={lead.id} 
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={(e) => onSelectLead?.(lead.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                      {lead.title && (
                        <p className="text-sm text-muted-foreground">{lead.title}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <a 
                      href={`mailto:${lead.email}`}
                      className="text-primary hover:underline"
                    >
                      {lead.email}
                    </a>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {lead.company || '-'}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {lead.phone || '-'}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAction?.('view', lead.id)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk action toolbar */}
      {selectedLeads.length > 0 && (
        <BulkActionToolbar
          selectedCount={selectedLeads.length}
          totalCount={leads.length}
          onAddToGroup={() => handleBulkAction('add-to-group')}
          onDelete={() => handleBulkAction('delete')}
          onExport={() => handleBulkAction('export')}
          onSelectAll={() => onSelectAll?.(true)}
          onDeselectAll={() => onSelectAll?.(false)}
          onAddTags={() => handleBulkAction('add-tags')}
          onEmailSelected={() => handleBulkAction('email')}
        />
      )}
    </div>
  );
}
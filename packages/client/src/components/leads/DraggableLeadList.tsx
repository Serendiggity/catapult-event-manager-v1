import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { GripVertical, Mail, Phone, Building, X, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
}

interface LeadGroup {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  leads: Lead[];
}

interface DraggableLeadListProps {
  groups: LeadGroup[];
  unassignedLeads: Lead[];
  onGroupsChange: (groups: LeadGroup[], unassignedLeads: Lead[]) => void;
}

function SortableLeadItem({ lead, groupId }: { lead: Lead; groupId: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${groupId}-${lead.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white border rounded-lg p-3 mb-2",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 cursor-grab hover:bg-gray-100 rounded p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm">
              {lead.firstName} {lead.lastName}
            </h4>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            {lead.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                <span>{lead.company}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableGroup({
  group,
  onRemoveLead,
}: {
  group: LeadGroup;
  onRemoveLead: (groupId: string, leadId: string) => void;
}) {
  const { setNodeRef } = useSortable({ id: group.id });

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{group.name}</h3>
          <Badge variant="secondary">{group.leads.length} leads</Badge>
        </div>
        
        <div
          ref={setNodeRef}
          className="min-h-[200px] max-h-[400px] overflow-y-auto"
        >
          <SortableContext
            items={group.leads.map(lead => `${group.id}-${lead.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {group.leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[150px] text-gray-400">
                <UserPlus className="h-8 w-8 mb-2" />
                <p className="text-sm">Drag leads here</p>
              </div>
            ) : (
              group.leads.map((lead) => (
                <SortableLeadItem
                  key={lead.id}
                  lead={lead}
                  groupId={group.id}
                />
              ))
            )}
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  );
}

export function DraggableLeadList({
  groups,
  unassignedLeads,
  onGroupsChange,
}: DraggableLeadListProps) {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Parse the IDs to get group and lead information
    const [activeGroupId, activeLeadId] = activeId.includes('-') 
      ? activeId.split('-')
      : ['unassigned', activeId];
    
    const [overGroupId] = overId.includes('-')
      ? overId.split('-')
      : [overId, null];

    if (activeGroupId === overGroupId) {
      // Reordering within the same group
      if (activeGroupId === 'unassigned') {
        const oldIndex = unassignedLeads.findIndex(l => l.id === activeLeadId);
        const newIndex = unassignedLeads.findIndex(l => `unassigned-${l.id}` === overId);
        
        if (oldIndex !== newIndex) {
          const newUnassigned = arrayMove(unassignedLeads, oldIndex, newIndex);
          onGroupsChange(groups, newUnassigned);
        }
      } else {
        const groupIndex = groups.findIndex(g => g.id === activeGroupId);
        if (groupIndex !== -1) {
          const group = groups[groupIndex];
          const oldIndex = group.leads.findIndex(l => l.id === activeLeadId);
          const newIndex = group.leads.findIndex(l => `${activeGroupId}-${l.id}` === overId);
          
          if (oldIndex !== newIndex) {
            const newLeads = arrayMove(group.leads, oldIndex, newIndex);
            const newGroups = [...groups];
            newGroups[groupIndex] = { ...group, leads: newLeads };
            onGroupsChange(newGroups, unassignedLeads);
          }
        }
      }
    } else {
      // Moving between groups
      let lead: Lead | undefined;
      let newGroups = [...groups];
      let newUnassigned = [...unassignedLeads];

      // Remove from source
      if (activeGroupId === 'unassigned') {
        const leadIndex = unassignedLeads.findIndex(l => l.id === activeLeadId);
        if (leadIndex !== -1) {
          lead = unassignedLeads[leadIndex];
          newUnassigned = newUnassigned.filter(l => l.id !== activeLeadId);
        }
      } else {
        const groupIndex = groups.findIndex(g => g.id === activeGroupId);
        if (groupIndex !== -1) {
          const group = groups[groupIndex];
          const leadIndex = group.leads.findIndex(l => l.id === activeLeadId);
          if (leadIndex !== -1) {
            lead = group.leads[leadIndex];
            newGroups[groupIndex] = {
              ...group,
              leads: group.leads.filter(l => l.id !== activeLeadId),
            };
          }
        }
      }

      // Add to destination
      if (lead) {
        if (overGroupId === 'unassigned') {
          newUnassigned.push(lead);
        } else {
          const groupIndex = newGroups.findIndex(g => g.id === overGroupId);
          if (groupIndex !== -1) {
            newGroups[groupIndex] = {
              ...newGroups[groupIndex],
              leads: [...newGroups[groupIndex].leads, lead],
            };
          }
        }

        onGroupsChange(newGroups, newUnassigned);
        
        toast({
          title: "Lead moved",
          description: `${lead.firstName} ${lead.lastName} has been moved successfully.`,
        });
      }
    }

    setActiveId(null);
  };

  const handleRemoveLead = (groupId: string, leadId: string) => {
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex !== -1) {
      const group = groups[groupIndex];
      const lead = group.leads.find(l => l.id === leadId);
      
      if (lead) {
        const newGroups = [...groups];
        newGroups[groupIndex] = {
          ...group,
          leads: group.leads.filter(l => l.id !== leadId),
        };
        
        onGroupsChange(newGroups, [...unassignedLeads, lead]);
        
        toast({
          title: "Lead removed",
          description: `${lead.firstName} ${lead.lastName} has been removed from ${group.name}.`,
        });
      }
    }
  };

  // Find the active lead for the drag overlay
  let activeLead: Lead | undefined;
  if (activeId) {
    const [groupId, leadId] = activeId.includes('-')
      ? activeId.split('-')
      : ['unassigned', activeId];
    
    if (groupId === 'unassigned') {
      activeLead = unassignedLeads.find(l => l.id === leadId);
    } else {
      const group = groups.find(g => g.id === groupId);
      activeLead = group?.leads.find(l => l.id === leadId);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6">
        {/* Unassigned Leads */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Unassigned Leads</h3>
              <Badge variant="outline">{unassignedLeads.length} leads</Badge>
            </div>
            
            <div className="min-h-[150px] max-h-[300px] overflow-y-auto">
              <SortableContext
                items={unassignedLeads.map(lead => `unassigned-${lead.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {unassignedLeads.length === 0 ? (
                  <div className="flex items-center justify-center h-[100px] text-gray-400">
                    <p className="text-sm">No unassigned leads</p>
                  </div>
                ) : (
                  unassignedLeads.map((lead) => (
                    <SortableLeadItem
                      key={lead.id}
                      lead={lead}
                      groupId="unassigned"
                    />
                  ))
                )}
              </SortableContext>
            </div>
          </CardContent>
        </Card>

        {/* Lead Groups */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <DroppableGroup
              key={group.id}
              group={group}
              onRemoveLead={handleRemoveLead}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeId && activeLead && (
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <h4 className="font-medium text-sm">
                    {activeLead.firstName} {activeLead.lastName}
                  </h4>
                  <p className="text-xs text-gray-600">{activeLead.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
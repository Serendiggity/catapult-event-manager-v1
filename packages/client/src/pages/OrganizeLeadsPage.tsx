import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DraggableLeadList } from '../components/leads/DraggableLeadList';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
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
  description: string | null;
  color: string;
  leads: Lead[];
}

export function OrganizeLeadsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [eventTitle, setEventTitle] = useState<string>('');
  const [groups, setGroups] = useState<LeadGroup[]>([]);
  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const fetchData = async () => {
    try {
      // Fetch event details
      const eventResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events/${eventId}`);
      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        setEventTitle(eventData.title || '');
      }

      // Fetch lead groups
      const groupsResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lead-groups/event/${eventId}`
      );
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        
        // Fetch leads for each group
        const groupsWithLeads = await Promise.all(
          groupsData.groups.map(async (group: any) => {
            const contactsResponse = await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lead-groups/${group.id}/contacts`
            );
            
            if (contactsResponse.ok) {
              const contactsData = await contactsResponse.json();
              return {
                ...group,
                leads: contactsData.contacts || [],
              };
            }
            
            return { ...group, leads: [] };
          })
        );
        
        setGroups(groupsWithLeads);
      }

      // Fetch all leads for the event
      const leadsResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts/event/${eventId}`
      );
      
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        
        // Filter out leads that are already in groups
        const assignedLeadIds = new Set(
          groups.flatMap(g => g.leads.map(l => l.id))
        );
        
        const unassigned = leadsData.filter((lead: Lead) => !assignedLeadIds.has(lead.id));
        setUnassignedLeads(unassigned);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load leads and groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGroupsChange = (newGroups: LeadGroup[], newUnassigned: Lead[]) => {
    setGroups(newGroups);
    setUnassignedLeads(newUnassigned);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Update each group's members
      for (const group of groups) {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lead-groups/${group.id}/contacts`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contactIds: group.leads.map(l => l.id),
            }),
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to update group ${group.name}`);
        }
      }
      
      toast({
        title: "Changes saved",
        description: "Lead group assignments have been updated successfully.",
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!eventId) {
    return <div>Event ID is required</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-600 mb-4">
        <Link to="/events" className="hover:text-blue-600">Events</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to={`/events/${eventId}`} className="hover:text-blue-600">
          {eventTitle || 'Event'}
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link to={`/events/${eventId}/lead-groups`} className="hover:text-blue-600">
          Lead Groups
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900">Organize Leads</span>
      </nav>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(`/events/${eventId}/lead-groups`)}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lead Groups
            </Button>
            
            <h1 className="text-3xl font-bold">Organize Leads</h1>
            <p className="text-gray-600 mt-2">
              Drag and drop leads between groups to organize them
            </p>
          </div>
          
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>

        {/* Instructions Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 mb-2">How to organize leads:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Drag leads from the unassigned section to any group</li>
              <li>• Drag leads between groups to reorganize them</li>
              <li>• Click the X button to remove a lead from a group</li>
              <li>• Don't forget to save your changes when done</li>
            </ul>
          </CardContent>
        </Card>

        {/* Drag and Drop Interface */}
        <DraggableLeadList
          groups={groups}
          unassignedLeads={unassignedLeads}
          onGroupsChange={handleGroupsChange}
        />
      </div>
    </div>
  );
}
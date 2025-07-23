import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { EventCardNew } from '@/components/events/EventCardNew';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Filter, ArrowUpDown, Plus, Loader2, Calendar, Clock, Users, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

export function EventsPage() {
  const navigate = useNavigate();
  const { events, loading, error } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [contactStats, setContactStats] = useState<Record<string, { total: number; verified: number; pending: number }>>({});
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'leads'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterOptions, setFilterOptions] = useState({
    upcoming: true,
    past: true,
    hasLeads: false,
    noLeads: false,
  });

  // Fetch contact stats for each event
  useEffect(() => {
    if (!events || events.length === 0) return;
    
    const fetchStats = async () => {
      const stats: Record<string, { total: number; verified: number; pending: number }> = {};
      
      // Fetch stats for each event
      for (const event of events) {
        try {
          const contacts = await api.getEventContacts(event.id);
          stats[event.id] = {
            total: contacts.length,
            verified: contacts.filter((c: any) => !c.needsReview).length,
            pending: contacts.filter((c: any) => c.needsReview).length
          };
        } catch (err) {
          stats[event.id] = { total: 0, verified: 0, pending: 0 };
        }
      }
      
      setContactStats(stats);
    };
    
    fetchStats();
  }, [events]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }
    
    // Apply date filters
    const now = new Date();
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.date);
      const isUpcoming = eventDate >= now;
      const isPast = eventDate < now;
      
      if (filterOptions.upcoming && isUpcoming) return true;
      if (filterOptions.past && isPast) return true;
      if (!filterOptions.upcoming && !filterOptions.past) return true;
      
      return false;
    });
    
    // Apply lead filters
    if (filterOptions.hasLeads || filterOptions.noLeads) {
      filtered = filtered.filter(event => {
        const leadCount = contactStats[event.id]?.total || 0;
        if (filterOptions.hasLeads && leadCount > 0) return true;
        if (filterOptions.noLeads && leadCount === 0) return true;
        if (!filterOptions.hasLeads && !filterOptions.noLeads) return true;
        return false;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'leads':
          const aLeads = contactStats[a.id]?.total || 0;
          const bLeads = contactStats[b.id]?.total || 0;
          comparison = aLeads - bLeads;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [events, searchQuery, filterOptions, sortBy, sortOrder, contactStats]);

  const handleCreateEvent = () => {
    navigate('/events/new');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="text-lg font-semibold text-destructive">Error loading events</div>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Event management</h1>
            <p className="text-gray-600">Track and manage leads across all your events</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-accent border-0 rounded-xl text-base"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="secondary" 
              className="h-12 px-6 rounded-xl bg-accent hover:bg-accent/80 text-accent-foreground"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filterOptions.upcoming}
              onCheckedChange={(checked) => 
                setFilterOptions(prev => ({ ...prev, upcoming: checked }))
              }
            >
              <Calendar className="mr-2 h-4 w-4" />
              Upcoming Events
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterOptions.past}
              onCheckedChange={(checked) => 
                setFilterOptions(prev => ({ ...prev, past: checked }))
              }
            >
              <Clock className="mr-2 h-4 w-4" />
              Past Events
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filter by Leads</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filterOptions.hasLeads}
              onCheckedChange={(checked) => 
                setFilterOptions(prev => ({ ...prev, hasLeads: checked }))
              }
            >
              <Users className="mr-2 h-4 w-4" />
              Has Leads
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterOptions.noLeads}
              onCheckedChange={(checked) => 
                setFilterOptions(prev => ({ ...prev, noLeads: checked }))
              }
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              No Leads Yet
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="secondary" 
              className="h-12 px-6 rounded-xl bg-accent hover:bg-accent/80 text-accent-foreground"
            >
              <ArrowUpDown className="h-5 w-5 mr-2" />
              Sort: {sortBy === 'date' ? 'Date' : sortBy === 'name' ? 'Name' : 'Leads'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                setSortBy('date');
                setSortOrder('desc');
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Date (Newest First)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortBy('date');
                setSortOrder('asc');
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Date (Oldest First)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortBy('name');
                setSortOrder('asc');
              }}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Name (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortBy('name');
                setSortOrder('desc');
              }}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Name (Z-A)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortBy('leads');
                setSortOrder('desc');
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Most Leads
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortBy('leads');
                setSortOrder('asc');
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Fewest Leads
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          onClick={handleCreateEvent}
          className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium ml-auto"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Event
        </Button>
      </div>
      </Card>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-2xl font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-8">
            {searchQuery ? 'Try adjusting your search terms' : 'Create your first event to get started'}
          </p>
          {!searchQuery && (
            <Button 
              onClick={handleCreateEvent}
              className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Event
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 pt-10">
          {filteredEvents.map((event) => (
            <EventCardNew 
              key={event.id} 
              event={{
                ...event,
                totalLeads: contactStats[event.id]?.total || 0,
                verifiedLeads: contactStats[event.id]?.verified || 0,
                pendingLeads: contactStats[event.id]?.pending || 0
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
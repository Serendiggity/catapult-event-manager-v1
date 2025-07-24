import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Mail, TrendingUp, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { LeadsDistributionChart } from '@/components/charts/LeadsDistributionChart';

interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  totalLeads: number;
  verifiedLeads: number;
  pendingReview: number;
  totalCampaigns: number;
  activeCampaigns: number;
  recentActivity: any[];
  eventLeadData: Array<{
    eventId: string;
    eventName: string;
    leads: number;
    fill: string;
  }>;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    totalLeads: 0,
    verifiedLeads: 0,
    pendingReview: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    recentActivity: [],
    eventLeadData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch events
      const eventsResponse = await api.get('/api/events');
      const events = eventsResponse.data || [];
      const now = new Date();
      const upcomingEvents = events.filter((e: any) => new Date(e.date) > now);
      
      // Fetch all contacts
      const contactsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts`);
      const contactsData = await contactsResponse.json();
      const contacts = contactsData.contacts || [];
      
      // Build event lead data
      const eventLeadMap = new Map<string, { eventName: string; leads: number }>();
      
      // Initialize with all events
      events.forEach((event: any) => {
        eventLeadMap.set(event.id, { eventName: event.title, leads: 0 });
      });
      
      // Count leads per event
      contacts.forEach((contact: any) => {
        if (contact.eventId && eventLeadMap.has(contact.eventId)) {
          const current = eventLeadMap.get(contact.eventId)!;
          current.leads += 1;
        }
      });
      
      // Convert to array format for chart
      const eventLeadData = Array.from(eventLeadMap.entries())
        .filter(([_, data]) => data.leads > 0) // Only show events with leads
        .map(([eventId, data], index) => ({
          eventId,
          eventName: data.eventName,
          leads: data.leads,
          fill: '' // Will be handled by the chart component
        }));
      
      // Calculate stats
      setStats({
        totalEvents: events.length,
        upcomingEvents: upcomingEvents.length,
        totalLeads: contacts.length,
        verifiedLeads: contacts.filter((c: any) => !c.needsReview).length,
        pendingReview: contacts.filter((c: any) => c.needsReview).length,
        totalCampaigns: 0, // TODO: Fetch campaigns
        activeCampaigns: 0, // TODO: Fetch active campaigns
        recentActivity: [], // TODO: Implement activity tracking
        eventLeadData
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, subtitle, onClick }: any) => (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col" onClick={onClick}>
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2 lg:py-4 py-6">
        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className="text-2xl sm:text-3xl font-bold">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to New Era Events Manager</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Button
          onClick={() => navigate('/events/new')}
          className="h-16 text-left justify-start"
          variant="outline"
        >
          <Plus className="h-5 w-5 mr-3" />
          <div>
            <div className="font-semibold">Create Event</div>
            <div className="text-xs text-muted-foreground">Start organizing a new event</div>
          </div>
        </Button>
        
        <Button
          onClick={() => navigate('/contacts')}
          className="h-16 text-left justify-start"
          variant="outline"
        >
          <Users className="h-5 w-5 mr-3" />
          <div>
            <div className="font-semibold">Add Leads</div>
            <div className="text-xs text-muted-foreground">Import business cards</div>
          </div>
        </Button>
        
        <Button
          onClick={() => navigate('/campaigns')}
          className="h-16 text-left justify-start"
          variant="outline"
        >
          <Mail className="h-5 w-5 mr-3" />
          <div>
            <div className="font-semibold">Send Campaign</div>
            <div className="text-xs text-muted-foreground">Reach out to your leads</div>
          </div>
        </Button>
      </div>

      {/* Stats Grid - 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 items-stretch">
        <div className="h-full lg:dashboard-stat-rect">
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={Calendar}
            subtitle={`${stats.upcomingEvents} upcoming`}
            onClick={() => navigate('/events')}
          />
        </div>
        
        <div className="h-full lg:dashboard-stat-rect">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            icon={Users}
            subtitle={`${stats.verifiedLeads} verified`}
            onClick={() => navigate('/contacts')}
          />
        </div>
        
        <div className="h-full lg:dashboard-stat-rect">
          <StatCard
            title="Needs Review"
            value={stats.pendingReview}
            icon={AlertCircle}
            subtitle="Pending verification"
            onClick={() => navigate('/contacts?status=needs-review')}
          />
        </div>
        
        <div className="h-full lg:dashboard-stat-rect">
          <StatCard
            title="Campaigns"
            value={stats.totalCampaigns}
            icon={Mail}
            subtitle={`${stats.activeCampaigns} active`}
            onClick={() => navigate('/campaigns')}
          />
        </div>
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Lead Distribution Chart */}
        {stats.eventLeadData.length > 0 && (
          <div className="lg:col-span-1">
            <LeadsDistributionChart data={stats.eventLeadData} />
          </div>
        )}
        
        {/* Quick Insights - Adjust span based on chart presence */}
        <Card className={stats.eventLeadData.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pendingReview > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Review Required</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.pendingReview} contacts need verification
                    </p>
                  </div>
                </div>
              )}
              
              {stats.upcomingEvents > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Upcoming Events</p>
                    <p className="text-sm text-muted-foreground">
                      You have {stats.upcomingEvents} events scheduled
                    </p>
                  </div>
                </div>
              )}
              
              {stats.totalLeads > 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Lead Collection</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round((stats.verifiedLeads / stats.totalLeads) * 100)}% of leads verified
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {/* Activity items would go here */}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No recent activity to display
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Mail, TrendingUp, Clock, CheckCircle, AlertCircle, Plus, UserPlus, Timer } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { LeadsDistributionChart } from '@/components/charts/LeadsDistributionChart';
import { LeadsTimelineChart } from '@/components/charts/LeadsTimelineChart';

interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  totalLeads: number;
  verifiedLeads: number;
  pendingReview: number;
  totalCampaigns: number;
  activeCampaigns: number;
  recentActivity: any[];
  newLeadsWeek: number;
  agingLeads: number;
  eventLeadData: Array<{
    eventId: string;
    eventName: string;
    leads: number;
    fill: string;
  }>;
  monthlyLeadsData: Array<{
    month: string;
    leads: number;
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
    newLeadsWeek: 0,
    agingLeads: 0,
    eventLeadData: [],
    monthlyLeadsData: []
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
      if (!contactsResponse.ok) {
        throw new Error(`Failed to fetch contacts: ${contactsResponse.status}`);
      }
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
        .sort((a, b) => b[1].leads - a[1].leads) // Sort by lead count descending
        .slice(0, 8) // Limit to top 8 events
        .map(([eventId, data], index) => ({
          eventId,
          eventName: data.eventName,
          leads: data.leads,
          fill: '' // Will be handled by the chart component
        }));
      
      // Add "Others" category if there are more events
      const remainingEvents = Array.from(eventLeadMap.entries())
        .filter(([_, data]) => data.leads > 0)
        .slice(8);
      
      if (remainingEvents.length > 0) {
        const othersLeads = remainingEvents.reduce((sum, [_, data]) => sum + data.leads, 0);
        eventLeadData.push({
          eventId: 'others',
          eventName: `Others (${remainingEvents.length} events)`,
          leads: othersLeads,
          fill: ''
        });
      }
      
      // Calculate date-based metrics
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newLeadsWeek = contacts.filter((c: any) => 
        new Date(c.createdAt) >= sevenDaysAgo
      ).length;
      
      const agingLeads = contacts.filter((c: any) => 
        new Date(c.createdAt) < thirtyDaysAgo && c.needsReview
      ).length;
      
      // Calculate monthly leads data for the last 6 months
      const monthlyLeadsData = [];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      try {
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthName = monthNames[date.getMonth()];
          const year = date.getFullYear();
          
          // Count leads created in this month
          const monthLeads = contacts.filter((c: any) => {
            if (!c.createdAt) return false;
            const createdDate = new Date(c.createdAt);
            return createdDate.getMonth() === date.getMonth() && 
                   createdDate.getFullYear() === year;
          }).length;
          
          monthlyLeadsData.push({
            month: monthName,
            leads: monthLeads
          });
        }
      } catch (err) {
        console.error('Error calculating monthly leads:', err);
      }
      
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
        newLeadsWeek,
        agingLeads,
        eventLeadData,
        monthlyLeadsData
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, subtitle, onClick }: any) => (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col" onClick={onClick}>
      <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2 py-6 lg:py-3">
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

      {/* Stats Grid - 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 items-stretch">
        <div className="aspect-square lg:aspect-auto">
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={Calendar}
            subtitle={`${stats.upcomingEvents} upcoming`}
            onClick={() => navigate('/events')}
          />
        </div>
        
        <div className="aspect-square lg:aspect-auto">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            icon={Users}
            subtitle={`${stats.verifiedLeads} verified`}
            onClick={() => navigate('/contacts')}
          />
        </div>
        
        <div className="aspect-square lg:aspect-auto">
          <StatCard
            title="New This Week"
            value={stats.newLeadsWeek}
            icon={UserPlus}
            subtitle="Last 7 days"
            onClick={() => navigate('/contacts')}
          />
        </div>
        
        <div className="aspect-square lg:aspect-auto">
          <StatCard
            title="Aging Leads"
            value={stats.agingLeads}
            icon={Timer}
            subtitle="30+ days unreviewed"
            onClick={() => navigate('/contacts?status=needs-review')}
          />
        </div>
        
        <div className="aspect-square lg:aspect-auto">
          <StatCard
            title="Needs Review"
            value={stats.pendingReview}
            icon={AlertCircle}
            subtitle="Pending verification"
            onClick={() => navigate('/contacts?status=needs-review')}
          />
        </div>
        
        <div className="aspect-square lg:aspect-auto">
          <StatCard
            title="Campaigns"
            value={stats.totalCampaigns}
            icon={Mail}
            subtitle={`${stats.activeCampaigns} active`}
            onClick={() => navigate('/campaigns')}
          />
        </div>
      </div>

      {/* Charts Section */}
      {(stats.eventLeadData.length > 0 || stats.monthlyLeadsData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Lead Distribution Chart */}
          {stats.eventLeadData.length > 0 && (
            <div>
              <LeadsDistributionChart data={stats.eventLeadData} />
            </div>
          )}
          
          {/* Monthly Leads Timeline Chart */}
          {stats.monthlyLeadsData.length > 0 && (
            <div>
              <LeadsTimelineChart data={stats.monthlyLeadsData} />
            </div>
          )}
        </div>
      )}

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
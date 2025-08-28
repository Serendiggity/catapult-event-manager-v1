import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Mail, Users, Clock, Edit, Trash2, Sparkles } from 'lucide-react';
import { CreateCampaignModalEnhanced } from './CreateCampaignModalEnhanced';
import { EditCampaignModal } from './EditCampaignModal';
import { CampaignDetails } from './CampaignDetails';
import type { EmailCampaign, CampaignGroup } from '@new-era-event-manager/shared';

interface CampaignsListProps {
  eventId: string;
}

interface CampaignWithGroups extends EmailCampaign {
  campaignGroups: CampaignGroup[];
}

export function CampaignsList({ eventId }: CampaignsListProps) {
  const [campaigns, setCampaigns] = useState<CampaignWithGroups[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithGroups | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithGroups | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, [eventId]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/campaigns`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete campaign');
      await fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      generating: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      sent: 'bg-purple-100 text-purple-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.draft}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading campaigns...</div>;
  }

  if (selectedCampaign) {
    return (
      <CampaignDetails
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Campaigns</h2>
        <Button onClick={() => setIsCreateModalOpen(true)} data-onboarding="create-campaign-button">
          <Sparkles className="h-4 w-4 mr-2" />
          New AI Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No email campaigns yet. Create your first campaign to start sending personalized emails.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4" data-onboarding="create-campaign-button">
              <Sparkles className="h-4 w-4 mr-2" />
              Create AI Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription className="mt-1">{campaign.subject}</CardDescription>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>
                      {(campaign.campaignGroups || []).length} group{(campaign.campaignGroups || []).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {campaign.variables && campaign.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {campaign.variables.map((variable) => (
                        <span
                          key={variable}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCampaign(campaign)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateCampaignModalEnhanced
        eventId={eventId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchCampaigns();
        }}
      />

      {editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          isOpen={!!editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSuccess={() => {
            setEditingCampaign(null);
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { ScrollArea } from '../../ui/scroll-area';
import { Users, Info } from 'lucide-react';
import type { WizardState } from '../CampaignWizard';
import type { CampaignGroup } from '@new-era-event-manager/shared';

interface AudienceStepProps {
  data: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
}

export function AudienceStep({ data, onUpdate }: AudienceStepProps) {
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaignGroups();
  }, [data.audience.eventId]);

  const fetchCampaignGroups = async () => {
    if (!data.audience.eventId) {
      setError('No event selected');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/campaign-groups/event/${data.audience.eventId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch campaign groups');
      
      const result = await response.json();
      const groups = result.groups || result;
      setCampaignGroups(Array.isArray(groups) ? groups : []);
    } catch (err) {
      console.error('Error fetching campaign groups:', err);
      setError('Failed to load campaign groups');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    const newGroups = data.audience.campaignGroups.includes(groupId)
      ? data.audience.campaignGroups.filter(id => id !== groupId)
      : [...data.audience.campaignGroups, groupId];

    // Calculate estimated recipients
    const selectedGroups = campaignGroups.filter(g => newGroups.includes(g.id));
    const estimatedRecipients = selectedGroups.reduce((sum, g) => sum + (g.contactCount || 0), 0);

    onUpdate({
      audience: {
        ...data.audience,
        campaignGroups: newGroups,
        estimatedRecipients
      }
    });
  };

  const selectAll = () => {
    const allIds = campaignGroups.map(g => g.id);
    const totalRecipients = campaignGroups.reduce((sum, g) => sum + (g.contactCount || 0), 0);
    
    onUpdate({
      audience: {
        ...data.audience,
        campaignGroups: allIds,
        estimatedRecipients: totalRecipients
      }
    });
  };

  const deselectAll = () => {
    onUpdate({
      audience: {
        ...data.audience,
        campaignGroups: [],
        estimatedRecipients: 0
      }
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading campaign groups...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (campaignGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Campaign Groups Found</h3>
        <p className="text-muted-foreground">
          Create campaign groups first to organize your contacts for campaigns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Email Recipients</h3>
        <p className="text-sm text-muted-foreground">
          Choose which campaign groups should receive this campaign. You can select multiple groups.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {data.audience.campaignGroups.length} of {campaignGroups.length} groups selected
          {data.audience.estimatedRecipients > 0 && (
            <span className="ml-2">
              • {data.audience.estimatedRecipients} recipients
            </span>
          )}
        </div>
        <div className="space-x-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-sm text-primary hover:underline"
          >
            Select All
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-sm text-primary hover:underline"
          >
            Deselect All
          </button>
        </div>
      </div>

      <ScrollArea className="h-[300px] border rounded-md">
        <div className="p-4 space-y-3">
          {campaignGroups.map((group) => (
            <label
              key={group.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              <Checkbox
                checked={data.audience.campaignGroups.includes(group.id)}
                onCheckedChange={() => handleGroupToggle(group.id)}
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="font-medium">{group.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {group.contactCount || 0} contacts
                  </Badge>
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground">
                    {group.description}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </ScrollArea>

      {data.audience.campaignGroups.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please select at least one campaign group to continue.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
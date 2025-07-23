import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Info, Sparkles } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import type { EmailCampaign, CampaignGroup } from '@new-era-event-manager/shared';

interface CampaignWithGroups extends EmailCampaign {
  campaignGroups: CampaignGroup[];
}

interface EditCampaignModalProps {
  campaign: CampaignWithGroups;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCampaignModal({ campaign, isOpen, onClose, onSuccess }: EditCampaignModalProps) {
  const [name, setName] = useState(campaign.name);
  const [subject, setSubject] = useState(campaign.subject);
  const [templateBody, setTemplateBody] = useState(campaign.templateBody);
  const [variables, setVariables] = useState<string[]>(campaign.variables);
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    campaign.campaignGroups.map(g => g.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCampaignGroups();
    }
  }, [isOpen]);

  useEffect(() => {
    extractVariables();
  }, [templateBody]);

  const fetchCampaignGroups = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaign-groups/event/${campaign.eventId}`);
      if (!response.ok) throw new Error('Failed to fetch campaign groups');
      const data = await response.json();
      setCampaignGroups(data);
    } catch (error) {
      console.error('Error fetching campaign groups:', error);
    }
  };

  const extractVariables = async () => {
    if (!templateBody) {
      setVariables([]);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/extract-variables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateBody }),
      });
      if (!response.ok) throw new Error('Failed to extract variables');
      const data = await response.json();
      setVariables(data.variables);
    } catch (error) {
      console.error('Error extracting variables:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          templateBody,
          variables,
          campaignGroupIds: selectedGroupIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update campaign');
      }

      onSuccess();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const availableVariables = [
    'firstName', 'lastName', 'email', 'company', 'position', 
    'phone', 'website', 'notes', 'eventName', 'eventDate'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Email Campaign</DialogTitle>
          <DialogDescription>
            Update your email campaign template and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Follow-up Campaign"
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Great meeting you at {{eventName}}"
                required
              />
            </div>

            <div>
              <Label htmlFor="templateBody">Email Template</Label>
              <Textarea
                id="templateBody"
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                placeholder="Hi {{firstName}},

It was great meeting you at {{eventName}}. I'd love to continue our conversation about...

Best regards,
[Your Name]"
                rows={8}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use {"{{variable}}"} format to insert personalization variables
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Available variables:</strong> {availableVariables.join(', ')}
              </AlertDescription>
            </Alert>

            {variables.length > 0 && (
              <div>
                <Label>Detected Variables</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {variables.map((variable) => (
                    <span
                      key={variable}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Select Campaign Groups</Label>
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {campaignGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No campaign groups available</p>
                ) : (
                  campaignGroups.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedGroupIds.includes(group.id)}
                        onCheckedChange={() => toggleGroupSelection(group.id)}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-sm">{group.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({group.contactCount} contacts)
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedGroupIds.length === 0}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
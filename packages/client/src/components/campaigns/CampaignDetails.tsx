import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  Sparkles, 
  Mail, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Send,
  Eye,
  Users,
  Download
} from 'lucide-react';
import { DraftEditModal } from './DraftEditModal';
import type { EmailCampaign, EmailDraft, Contact } from '@new-era-event-manager/shared';

interface CampaignDetailsProps {
  campaign: EmailCampaign;
  onBack: () => void;
}

export function CampaignDetails({ campaign, onBack }: CampaignDetailsProps) {
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<EmailDraft | null>(null);
  const [contacts, setContacts] = useState<Map<string, Contact>>(new Map());

  useEffect(() => {
    fetchDrafts();
  }, [campaign.id]);

  const fetchDrafts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaign.id}/drafts`);
      if (!response.ok) throw new Error('Failed to fetch drafts');
      const draftsData = await response.json();
      setDrafts(draftsData);

      // Fetch contact details for each draft
      const contactIds = [...new Set(draftsData.map((d: EmailDraft) => d.contactId))];
      for (const contactId of contactIds) {
        const contactResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/contacts/${contactId}`);
        if (contactResponse.ok) {
          const contact = await contactResponse.json();
          setContacts(prev => new Map(prev).set(contactId as string, contact));
        }
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDrafts = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaign.id}/generate-drafts`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to start generation');
      
      // Poll for updates
      const pollInterval = setInterval(async () => {
        await fetchDrafts();
        const updatedCampaign = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaign.id}`);
        const campaignData = await updatedCampaign.json();
        
        if (campaignData.status !== 'generating') {
          clearInterval(pollInterval);
          setIsGenerating(false);
        }
      }, 2000);
    } catch (error) {
      console.error('Error generating drafts:', error);
      setIsGenerating(false);
    }
  };

  const handleUpdateDraftStatus = async (draftId: string, status: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/drafts/${draftId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update draft status');
      await fetchDrafts();
    } catch (error) {
      console.error('Error updating draft status:', error);
    }
  };

  const handleUpdateDraftContent = async (draftId: string, updates: { subject: string; body: string }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/drafts/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update draft');
      await fetchDrafts();
    } catch (error) {
      console.error('Error updating draft:', error);
      throw error;
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaign.id}/export-csv`);
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to export CSV');
        return;
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `campaign_export_${new Date().toISOString().split('T')[0]}.csv`;

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const handleSendDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to send this email?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/drafts/${draftId}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to send email');
        return;
      }

      await fetchDrafts();
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const handleSendAllApproved = async () => {
    const approvedDrafts = drafts.filter(d => d.status === 'approved');
    if (approvedDrafts.length === 0) {
      alert('No approved drafts to send');
      return;
    }

    if (!confirm(`Are you sure you want to send ${approvedDrafts.length} emails?`)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaign.id}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to send emails');
        return;
      }

      const result = await response.json();
      await fetchDrafts();
      alert(`Emails sent!\nSuccessful: ${result.sent}\nFailed: ${result.failed}`);
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send emails');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Mail },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      sent: { color: 'bg-purple-100 text-purple-800', icon: Send },
    };
    
    const { color, icon: Icon } = config[status as keyof typeof config] || config.draft;
    
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading campaign details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{campaign.name}</h2>
          <p className="text-muted-foreground">Subject: {campaign.subject}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onBack} variant="outline" className="w-full sm:w-auto">
            Back to Campaigns
          </Button>
          <Button 
            onClick={handleGenerateDrafts} 
            disabled={isGenerating || campaign.status === 'generating'}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Drafts
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Template</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-md">
            {campaign.templateBody}
          </pre>
          {campaign.variables.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Variables:</p>
              <div className="flex flex-wrap gap-2">
                {campaign.variables.map((variable) => (
                  <Badge key={variable} variant="secondary">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Generated Drafts ({drafts.length})</CardTitle>
              <CardDescription>
                Review and approve email drafts before sending
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {drafts.filter(d => d.status === 'approved').length > 0 && (
                <>
                  <Button onClick={handleSendAllApproved} size="sm" className="w-full sm:w-auto">
                    <Send className="h-4 w-4 mr-2" />
                    Send All ({drafts.filter(d => d.status === 'approved').length} approved)
                  </Button>
                  <Button onClick={handleExportCSV} variant="outline" size="sm" className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No drafts generated yet. Click "Generate Drafts" to create personalized emails.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => {
                const contact = contacts.get(draft.contactId);
                return (
                  <div
                    key={draft.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {contact ? `${contact.firstName} ${contact.lastName}` : 'Loading...'}
                        </p>
                        <p className="text-sm text-muted-foreground">{contact?.email}</p>
                      </div>
                      {getStatusBadge(draft.status)}
                    </div>
                    <p className="text-sm font-medium mt-2">Subject: {draft.subject}</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDraft(draft)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      {draft.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateDraftStatus(draft.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateDraftStatus(draft.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {draft.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendDraft(draft.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DraftEditModal
        draft={selectedDraft}
        contact={selectedDraft ? contacts.get(selectedDraft.contactId) : undefined}
        isOpen={!!selectedDraft}
        onClose={() => setSelectedDraft(null)}
        onSave={handleUpdateDraftContent}
        onStatusChange={handleUpdateDraftStatus}
        onSend={handleSendDraft}
      />
    </div>
  );
}
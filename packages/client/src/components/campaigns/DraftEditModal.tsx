import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Save, 
  X, 
  Edit, 
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
  User,
  Mail,
  Building,
  Briefcase,
  History
} from 'lucide-react';
import { DraftVersionHistory } from './DraftVersionHistory';
import type { EmailDraft, Contact } from '@new-era-event-manager/shared';

interface DraftEditModalProps {
  draft: EmailDraft | null;
  contact: Contact | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSave: (draftId: string, updates: { subject: string; body: string }) => Promise<void>;
  onStatusChange: (draftId: string, status: string) => Promise<void>;
  onSend: (draftId: string) => Promise<void>;
}

export function DraftEditModal({
  draft,
  contact,
  isOpen,
  onClose,
  onSave,
  onStatusChange,
  onSend
}: DraftEditModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    if (draft) {
      setEditedSubject(draft.subject);
      setEditedBody(draft.body);
      setIsEditing(false);
      setError('');
    }
  }, [draft]);

  const handleSave = async () => {
    if (!draft) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      await onSave(draft.id, {
        subject: editedSubject,
        body: editedBody
      });
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (draft) {
      setEditedSubject(draft.subject);
      setEditedBody(draft.body);
    }
    setIsEditing(false);
    setError('');
  };

  const handleStatusChange = async (status: string) => {
    if (!draft) return;
    
    try {
      await onStatusChange(draft.id, status);
    } catch (error: any) {
      setError(error.message || 'Failed to update status');
    }
  };

  const handleSend = async () => {
    if (!draft || !confirm('Are you sure you want to send this email?')) return;
    
    try {
      await onSend(draft.id);
    } catch (error: any) {
      setError(error.message || 'Failed to send email');
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

  if (!draft) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <DialogTitle>Email Draft</DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'}</span>
                  </div>
                  {contact?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact?.company && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>{contact.company}</span>
                    </div>
                  )}
                  {contact?.title && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{contact.title}</span>
                    </div>
                  )}
                </div>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(draft.status)}
              {!isEditing && draft.status !== 'sent' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowVersionHistory(true)}
                  >
                    <History className="h-4 w-4 mr-1" />
                    History
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="subject">Subject</Label>
            {isEditing ? (
              <Input
                id="subject"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 p-2 bg-muted rounded">{draft.subject}</p>
            )}
          </div>

          <div>
            <Label htmlFor="body">Body</Label>
            {isEditing ? (
              <Textarea
                id="body"
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={15}
                className="mt-1 font-mono text-sm"
              />
            ) : (
              <pre className="mt-1 whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-md">
                {draft.body}
              </pre>
            )}
          </div>

          {!isEditing && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Generated with {draft.aiModel || 'AI'}</p>
                    <p className="text-muted-foreground">
                      {new Date(draft.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  {draft.approvedAt && (
                    <p className="text-muted-foreground">
                      Approved: {new Date(draft.approvedAt).toLocaleString()}
                    </p>
                  )}
                  {draft.sentAt && (
                    <p className="text-muted-foreground">
                      Sent: {new Date(draft.sentAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {draft.status === 'draft' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('rejected')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleStatusChange('approved')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </>
              )}
              {draft.status === 'approved' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('draft')}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Revert to Draft
                  </Button>
                  <Button
                    onClick={handleSend}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send Email
                  </Button>
                </>
              )}
              {draft.status === 'rejected' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('draft')}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Revert to Draft
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {draft && (
      <DraftVersionHistory
        draftId={draft.id}
        currentSubject={editedSubject}
        currentBody={editedBody}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={(version) => {
          setEditedSubject(version.subject);
          setEditedBody(version.body);
          setIsEditing(true);
          setShowVersionHistory(false);
        }}
      />
    )}
    </>
  );
}
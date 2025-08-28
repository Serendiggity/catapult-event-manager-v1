import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Info, 
  Users, 
  Send,
  Eye,
  Variable,
  Loader2
} from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { CampaignGroup } from '@new-era-event-manager/shared';

interface CreateCampaignModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VariableConfig {
  name: string;
  enabled: boolean;
  description: string;
}

interface SenderVariable {
  name: string;
  enabled: boolean;
  value: string;
  description: string;
  placeholder: string;
}

const defaultVariables: VariableConfig[] = [
  { name: 'firstName', enabled: true, description: 'Recipient\'s first name' },
  { name: 'lastName', enabled: true, description: 'Recipient\'s last name' },
  { name: 'email', enabled: true, description: 'Recipient\'s email address' },
  { name: 'company', enabled: true, description: 'Recipient\'s company' },
  { name: 'position', enabled: true, description: 'Recipient\'s job title' },
  { name: 'phone', enabled: false, description: 'Recipient\'s phone number' },
  { name: 'website', enabled: false, description: 'Recipient\'s website' },
  { name: 'notes', enabled: false, description: 'Notes about the recipient' },
  { name: 'eventName', enabled: true, description: 'Event the recipient attended' },
  { name: 'eventDate', enabled: true, description: 'Date of the event' },
];

const defaultSenderVariables: SenderVariable[] = [
  { name: 'senderName', enabled: false, value: '', description: 'Your full name', placeholder: 'John Smith' },
  { name: 'senderCompany', enabled: false, value: '', description: 'Your company name', placeholder: 'Acme Corporation' },
  { name: 'senderPosition', enabled: false, value: '', description: 'Your job title', placeholder: 'Sales Director' },
  { name: 'senderEmail', enabled: false, value: '', description: 'Your email address', placeholder: 'john.smith@acme.com' },
  { name: 'senderPhone', enabled: false, value: '', description: 'Your phone number', placeholder: '+1 (555) 123-4567' },
  { name: 'senderLinkedIn', enabled: false, value: '', description: 'Your LinkedIn profile', placeholder: 'linkedin.com/in/johnsmith' },
];

export function CreateCampaignModalEnhanced({ eventId, isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
  const { toast } = useToast();
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  
  // Variable configuration state
  const [variableConfigs, setVariableConfigs] = useState<VariableConfig[]>(defaultVariables);
  const [senderVariables, setSenderVariables] = useState<SenderVariable[]>(defaultSenderVariables);
  const [activeTab, setActiveTab] = useState('template');
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: '', body: '' });

  useEffect(() => {
    if (isOpen) {
      fetchCampaignGroups();
      // Add initial AI message
      if (chatMessages.length === 0) {
        setChatMessages([{
          role: 'assistant',
          content: 'Hi! I can help you create an effective email template. You can ask me to:\n• Make the tone more professional or casual\n• Add urgency or calls to action\n• Focus on specific value propositions\n• Adjust the length or structure\n\nWhat would you like to achieve with this email campaign?',
          timestamp: new Date()
        }]);
      }
    } else {
      resetForm();
    }
  }, [isOpen, eventId]);

  useEffect(() => {
    // Auto-scroll chat to bottom
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchCampaignGroups = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaign-groups/event/${eventId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch campaign groups');
      const data = await response.json();
      const groups = data.groups || data;
      setCampaignGroups(Array.isArray(groups) ? groups : []);
    } catch (error) {
      console.error('Error fetching campaign groups:', error);
      setError('Failed to load campaign groups.');
    }
  };

  const handleAIPrompt = async () => {
    if (!currentPrompt.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: currentPrompt,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentPrompt('');
    setIsProcessingPrompt(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaigns/refine-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          currentTemplate: {
            subject,
            body: templateBody
          },
          enabledVariables: variableConfigs.filter(v => v.enabled).map(v => v.name),
          enabledSenderVariables: senderVariables
            .filter(v => v.enabled && v.value)
            .reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {}),
          context: chatMessages.slice(-4) // Send last 4 messages for context
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to process prompt: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Track if template was actually updated
      let wasUpdated = false;
      
      // Update template with AI suggestion
      if (result.subject) {
        setSubject(result.subject);
        wasUpdated = true;
      }
      if (result.body) {
        setTemplateBody(result.body);
        wasUpdated = true;
      }
      
      // Add AI response to chat with clear indication of what happened
      if (wasUpdated) {
        // Switch to template tab to show the changes
        setActiveTab('template');
        
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Template updated successfully! I\'ve switched to the Template tab so you can see the changes.\n\n' + 
                   (result.explanation || 'Your email template has been refined based on your request.'),
          timestamp: new Date()
        }]);
        
        // Also show a toast notification
        toast({
          title: "Template Updated",
          description: "Your email template has been updated. Check the Template tab to review.",
        });
      } else {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: result.explanation || 'I processed your request. Please try rephrasing if you need different changes.',
          timestamp: new Date()
        }]);
      }
      
    } catch (error) {
      console.error('Error processing AI prompt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error processing your request: ${errorMessage}. Please try again.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessingPrompt(false);
    }
  };

  const handleVariableToggle = (variableName: string) => {
    setVariableConfigs(prev => 
      prev.map(v => 
        v.name === variableName ? { ...v, enabled: !v.enabled } : v
      )
    );
  };

  const handleSenderVariableToggle = (variableName: string) => {
    setSenderVariables(prev => 
      prev.map(v => 
        v.name === variableName ? { ...v, enabled: !v.enabled } : v
      )
    );
  };

  const handleSenderVariableValue = (variableName: string, value: string) => {
    setSenderVariables(prev => 
      prev.map(v => 
        v.name === variableName ? { ...v, value } : v
      )
    );
  };

  const handlePreview = async () => {
    try {
      // Get a sample preview with mock data
      const enabledVars = variableConfigs.filter(v => v.enabled).map(v => v.name);
      const mockData: Record<string, string> = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Example Corp',
        position: 'Marketing Manager',
        phone: '(555) 123-4567',
        website: 'www.example.com',
        notes: 'Met at networking event',
        eventName: 'Tech Conference 2024',
        eventDate: new Date().toLocaleDateString()
      };
      
      let previewSubject = subject;
      let previewBody = templateBody;
      
      // Replace lead variables with mock data
      enabledVars.forEach(varName => {
        const placeholder = `{{${varName}}}`;
        const value = mockData[varName] || '';
        previewSubject = previewSubject.replace(new RegExp(placeholder, 'g'), value);
        previewBody = previewBody.replace(new RegExp(placeholder, 'g'), value);
      });
      
      // Replace sender variables with actual values
      senderVariables.filter(v => v.enabled && v.value).forEach(senderVar => {
        const placeholder = `{{${senderVar.name}}}`;
        previewSubject = previewSubject.replace(new RegExp(placeholder, 'g'), senderVar.value);
        previewBody = previewBody.replace(new RegExp(placeholder, 'g'), senderVar.value);
      });
      
      setPreviewContent({ subject: previewSubject, body: previewBody });
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Extract only enabled variables
      const enabledVariables = variableConfigs
        .filter(v => v.enabled)
        .map(v => v.name);
      
      // Extract enabled sender variables with values
      const enabledSenderVars = senderVariables
        .filter(v => v.enabled && v.value)
        .reduce((acc, v) => ({ ...acc, [v.name]: v.value }), {});

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name,
          subject,
          templateBody,
          variables: enabledVariables,
          senderVariables: enabledSenderVars,
          campaignGroupIds: selectedGroupIds,
          aiChatHistory: chatMessages // Store chat history for reference
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      toast({
        title: "Campaign created",
        description: "Your email campaign has been created successfully.",
      });
      
      onSuccess();
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSubject('');
    setTemplateBody('');
    setSelectedGroupIds([]);
    setError('');
    setChatMessages([]);
    setCurrentPrompt('');
    setVariableConfigs(defaultVariables);
    setActiveTab('template');
    setShowPreview(false);
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create AI-Enhanced Email Campaign</DialogTitle>
          <DialogDescription>
            Create a personalized email campaign with AI assistance and variable customization.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="variables">Lead Variables</TabsTrigger>
            <TabsTrigger value="ai-chat">Event Assistant</TabsTrigger>
            <TabsTrigger value="sender-variables">Sender Variables</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="template" className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
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
                <div className="flex gap-2">
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Great meeting you at {{eventName}}"
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handlePreview}
                    title="Preview with sample data"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="templateBody">Email Template</Label>
                <Textarea
                  id="templateBody"
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  placeholder="Hi {{firstName}},

It was great meeting you at {{eventName}}..."
                  rows={10}
                  required
                />
              </div>

              <div>
                <Label>Select Campaign Groups</Label>
                <ScrollArea className="h-32 border rounded-md p-3">
                  {campaignGroups.length === 0 ? (
                    <div className="text-center py-4">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No campaign groups available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {campaignGroups.map((group) => (
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
                              ({group.contactCount} leads)
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="ai-chat" className="space-y-4 max-h-[calc(90vh-200px)]">
              <div className="flex flex-col h-full">
                <Card className="flex-1 overflow-hidden">
                  <ScrollArea className="h-[400px] p-4" ref={chatScrollRef}>
                    <div className="space-y-4">
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isProcessingPrompt && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        value={currentPrompt}
                        onChange={(e) => setCurrentPrompt(e.target.value)}
                        placeholder="Ask me to adjust the template..."
                        rows={2}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAIPrompt();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleAIPrompt}
                        disabled={!currentPrompt.trim() || isProcessingPrompt}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="variables" className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
              <Alert>
                <Variable className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Toggle which recipient information the AI should personalize when generating drafts.</p>
                    <p className="text-sm font-medium">All variables represent information about the email recipient, not the sender.</p>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                {variableConfigs.map((variable) => (
                  <Card key={variable.name}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {`{{${variable.name}}}`}
                          </code>
                          <span className="text-sm text-muted-foreground">
                            {variable.description}
                          </span>
                        </div>
                      </div>
                      <Switch
                        checked={variable.enabled}
                        onCheckedChange={() => handleVariableToggle(variable.name)}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sender-variables" className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure your sender information to personalize your signature and make your emails more professional.
                  Enable the variables you want to include and fill in your details.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                {senderVariables.map((variable) => (
                  <Card key={variable.name}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {`{{${variable.name}}}`}
                            </code>
                            <span className="text-sm text-muted-foreground">
                              {variable.description}
                            </span>
                          </div>
                          {variable.enabled && (
                            <Input
                              value={variable.value}
                              onChange={(e) => handleSenderVariableValue(variable.name, e.target.value)}
                              placeholder={variable.placeholder}
                              className="mt-2"
                            />
                          )}
                        </div>
                        <Switch
                          checked={variable.enabled}
                          onCheckedChange={() => handleSenderVariableToggle(variable.name)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || selectedGroupIds.length === 0 || !name || !subject || !templateBody}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Campaign'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>

        {/* Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Preview</DialogTitle>
              <DialogDescription>
                Preview with sample data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <p className="p-2 bg-muted rounded">{previewContent.subject}</p>
              </div>
              <div>
                <Label>Body</Label>
                <div className="p-4 bg-muted rounded whitespace-pre-wrap">
                  {previewContent.body}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
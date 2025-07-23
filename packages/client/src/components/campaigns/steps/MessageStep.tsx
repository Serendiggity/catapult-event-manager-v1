import React, { useState } from 'react';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Card, CardContent } from '../../ui/card';
import { Alert, AlertDescription } from '../../ui/alert';
import { Button } from '../../ui/button';
import { 
  Sparkles, 
  Eye, 
  Variable,
  MessageSquare,
  Info
} from 'lucide-react';
import type { WizardState } from '../CampaignWizard';

interface MessageStepProps {
  data: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
}

export function MessageStep({ data, onUpdate }: MessageStepProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const availableVariables = [
    { name: 'firstName', description: 'Recipient\'s first name' },
    { name: 'lastName', description: 'Recipient\'s last name' },
    { name: 'company', description: 'Recipient\'s company' },
    { name: 'position', description: 'Recipient\'s job title' },
    { name: 'eventName', description: 'Event name' },
    { name: 'eventDate', description: 'Event date' },
  ];

  const handleVariableToggle = (varName: string) => {
    const newVars = data.message.enabledVariables.includes(varName)
      ? data.message.enabledVariables.filter(v => v !== varName)
      : [...data.message.enabledVariables, varName];

    onUpdate({
      message: {
        ...data.message,
        enabledVariables: newVars
      }
    });
  };

  const handleGenerateTemplate = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // This would call your AI endpoint to generate a template
      // For now, we'll just show a sample template
      const sampleTemplate = `Hi {{firstName}},

It was great meeting you at {{eventName}}! I enjoyed our conversation about {{company}}.

I'd love to continue our discussion and explore how we might work together.

Would you be available for a brief call next week?

Best regards,
[Your name]`;

      onUpdate({
        message: {
          ...data.message,
          template: sampleTemplate
        }
      });
    } catch (error) {
      console.error('Error generating template:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const insertVariable = (varName: string) => {
    const cursorPos = (document.getElementById('template') as HTMLTextAreaElement)?.selectionStart || data.message.template.length;
    const before = data.message.template.slice(0, cursorPos);
    const after = data.message.template.slice(cursorPos);
    
    onUpdate({
      message: {
        ...data.message,
        template: `${before}{{${varName}}}${after}`
      }
    });
  };

  const previewContent = () => {
    const mockData: Record<string, string> = {
      firstName: 'John',
      lastName: 'Doe',
      company: 'Acme Corp',
      position: 'Marketing Manager',
      eventName: 'Tech Conference 2024',
      eventDate: 'March 15, 2024'
    };

    let preview = data.message.template;
    data.message.enabledVariables.forEach(varName => {
      preview = preview.replace(new RegExp(`{{${varName}}}`, 'g'), mockData[varName] || '');
    });

    return preview;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Compose Your Message</h3>
        <p className="text-sm text-muted-foreground">
          Create your email template with personalization variables
        </p>
      </div>

      <div>
        <Label htmlFor="campaign-name">Campaign Name *</Label>
        <Input
          id="campaign-name"
          value={data.message.name}
          onChange={(e) => onUpdate({
            message: { ...data.message, name: e.target.value }
          })}
          placeholder="e.g., March Follow-up Campaign"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="subject">Email Subject *</Label>
        <Input
          id="subject"
          value={data.message.subject}
          onChange={(e) => onUpdate({
            message: { ...data.message, subject: e.target.value }
          })}
          placeholder="e.g., Great meeting you at {{eventName}}"
          className="mt-1"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>AI Template Assistant</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={data.message.useAI}
              onCheckedChange={(checked) => onUpdate({
                message: { ...data.message, useAI: checked }
              })}
            />
            <span className="text-sm text-muted-foreground">
              Use AI to enhance drafts
            </span>
          </div>
        </div>

        {data.message.useAI && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the tone and purpose of your email..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerateTemplate}
                  disabled={!aiPrompt.trim() || isGenerating}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Example: "Professional follow-up email after networking event, friendly tone"
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="template">Email Template *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>
        
        {!showPreview ? (
          <Textarea
            id="template"
            value={data.message.template}
            onChange={(e) => onUpdate({
              message: { ...data.message, template: e.target.value }
            })}
            placeholder="Hi {{firstName}},

It was great meeting you at {{eventName}}..."
            rows={10}
            className="font-mono text-sm"
          />
        ) : (
          <Card>
            <CardContent className="p-4">
              <pre className="whitespace-pre-wrap text-sm">{previewContent()}</pre>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Variable className="h-4 w-4" />
          Personalization Variables
        </Label>
        
        <div className="grid grid-cols-2 gap-3">
          {availableVariables.map((variable) => (
            <div
              key={variable.name}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {`{{${variable.name}}}`}
                </code>
                <p className="text-xs text-muted-foreground mt-1">
                  {variable.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertVariable(variable.name)}
                >
                  Insert
                </Button>
                <Switch
                  checked={data.message.enabledVariables.includes(variable.name)}
                  onCheckedChange={() => handleVariableToggle(variable.name)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Variables will be automatically replaced with recipient information when sending emails. 
          Only enabled variables will be used for AI personalization.
        </AlertDescription>
      </Alert>
    </div>
  );
}
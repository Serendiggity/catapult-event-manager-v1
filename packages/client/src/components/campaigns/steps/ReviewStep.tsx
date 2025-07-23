import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Users, 
  Mail, 
  Clock, 
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { WizardState } from '../CampaignWizard';

interface ReviewStepProps {
  data: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
}

export function ReviewStep({ data, onUpdate }: ReviewStepProps) {
  const mockData: Record<string, string> = {
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Corp',
    position: 'Marketing Manager',
    eventName: 'Tech Conference 2024',
    eventDate: 'March 15, 2024'
  };

  const getPreviewContent = (template: string) => {
    let preview = template;
    data.message.enabledVariables.forEach(varName => {
      preview = preview.replace(new RegExp(`{{${varName}}}`, 'g'), mockData[varName] || '');
    });
    return preview;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review Your Campaign</h3>
        <p className="text-sm text-muted-foreground">
          Review all details before creating your campaign
        </p>
      </div>

      {/* Campaign Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Campaign Name</Label>
              <p className="font-medium">{data.message.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Recipients</Label>
              <p className="font-medium">
                {data.audience.estimatedRecipients} contacts in {data.audience.campaignGroups.length} groups
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Message Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Subject</Label>
            <p className="font-medium">{getPreviewContent(data.message.subject)}</p>
          </div>
          
          <div>
            <Label className="text-muted-foreground">Message</Label>
            <div className="mt-2 p-4 bg-muted rounded-lg">
              <pre className="whitespace-pre-wrap text-sm font-sans">
                {getPreviewContent(data.message.template)}
              </pre>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Active Variables</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.message.enabledVariables.map(varName => (
                <Badge key={varName} variant="secondary">
                  {{varName}}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Delivery Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={data.schedule.sendTime}
            onValueChange={(value: 'now' | 'scheduled') => 
              onUpdate({
                schedule: { ...data.schedule, sendTime: value }
              })
            }
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
              <RadioGroupItem value="now" id="now" />
              <Label htmlFor="now" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">Generate drafts now</p>
                  <p className="text-sm text-muted-foreground">
                    Create personalized drafts immediately for review and sending
                  </p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent">
              <RadioGroupItem value="scheduled" id="scheduled" />
              <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">Schedule for later</p>
                  <p className="text-sm text-muted-foreground">
                    Set a specific date and time to generate and send
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {data.schedule.sendTime === 'scheduled' && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <Label htmlFor="schedule-date">Schedule Date & Time</Label>
              <input
                type="datetime-local"
                id="schedule-date"
                className="mt-2 w-full px-3 py-2 border rounded-md"
                onChange={(e) => onUpdate({
                  schedule: { 
                    ...data.schedule, 
                    scheduledDate: new Date(e.target.value) 
                  }
                })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Checklist */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Ready to create your campaign!</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>✓ {data.audience.estimatedRecipients} recipients selected</li>
            <li>✓ Email template configured with {data.message.enabledVariables.length} variables</li>
            <li>✓ AI enhancement {data.message.useAI ? 'enabled' : 'disabled'}</li>
            <li>✓ Delivery option selected</li>
          </ul>
        </AlertDescription>
      </Alert>

      {data.message.useAI && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Enhancement Active:</strong> Each draft will be personalized using AI based on recipient information. 
            This may take a few moments depending on the number of recipients.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
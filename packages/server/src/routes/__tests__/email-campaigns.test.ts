import { describe, it, expect } from '@jest/globals';

describe('Email Campaigns API', () => {
  describe('Campaign Template Variable Extraction', () => {
    it('should extract variables from template correctly', () => {
      const template = `Hi {{firstName}},

It was great meeting you at {{eventName}}. 
I'd love to continue our conversation about {{company}}.

Best regards,
[Your Name]`;

      const variablePattern = /\{\{(\w+)\}\}/g;
      const variables = new Set<string>();
      let match;

      while ((match = variablePattern.exec(template)) !== null) {
        variables.add(match[1]);
      }

      expect(Array.from(variables)).toEqual(['firstName', 'eventName', 'company']);
    });

    it('should handle templates with no variables', () => {
      const template = `Hi there,

It was great meeting you today.

Best regards,
[Your Name]`;

      const variablePattern = /\{\{(\w+)\}\}/g;
      const variables = new Set<string>();
      let match;

      while ((match = variablePattern.exec(template)) !== null) {
        variables.add(match[1]);
      }

      expect(Array.from(variables)).toEqual([]);
    });

    it('should handle duplicate variables', () => {
      const template = `Hi {{firstName}} {{firstName}},

Welcome to {{eventName}}!

Best,
{{firstName}}`;

      const variablePattern = /\{\{(\w+)\}\}/g;
      const variables = new Set<string>();
      let match;

      while ((match = variablePattern.exec(template)) !== null) {
        variables.add(match[1]);
      }

      expect(Array.from(variables)).toEqual(['firstName', 'eventName']);
    });
  });

  describe('Variable Replacement', () => {
    it('should replace variables with actual values', () => {
      const template = 'Hi {{firstName}}, welcome to {{eventName}}!';
      const variables = {
        firstName: 'John',
        eventName: 'Tech Conference 2024'
      };

      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder, 'g'), value);
      }

      expect(result).toBe('Hi John, welcome to Tech Conference 2024!');
    });

    it('should handle missing variable values gracefully', () => {
      const template = 'Hi {{firstName}}, from {{company}}!';
      const variables = {
        firstName: 'John',
        company: ''
      };

      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder, 'g'), value);
      }

      expect(result).toBe('Hi John, from !');
    });
  });
});
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';

interface ContractTemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'list';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

interface ContractTemplateSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isOptional: boolean;
  variables: string[]; // Variable names used in this section
}

interface CreateContractTemplateData {
  name: string;
  description?: string;
  category: string;
  content: string; // Template content with variable placeholders
  variables: ContractTemplateVariable[];
  sections: ContractTemplateSection[];
  isActive?: boolean;
  metadata?: Record<string, any>;
}

interface UpdateContractTemplateData {
  name?: string;
  description?: string;
  category?: string;
  content?: string;
  variables?: ContractTemplateVariable[];
  sections?: ContractTemplateSection[];
  isActive?: boolean;
  metadata?: Record<string, any>;
}

interface ContractTemplateQuery {
  page: number;
  limit: number;
  category?: string;
  isActive?: boolean;
  searchTerm?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ContractTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  content: string;
  variables: ContractTemplateVariable[];
  sections: ContractTemplateSection[];
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface GenerateContractData {
  templateId: string;
  variableValues: Record<string, any>;
  selectedSections?: string[]; // Section IDs to include
  customSections?: ContractTemplateSection[];
  clientId?: string;
  quotationId?: string;
  opportunityId?: string;
}

interface GeneratedContract {
  content: string;
  title: string;
  variables: Record<string, any>;
  metadata: {
    templateId: string;
    templateName: string;
    generatedAt: Date;
    variablesUsed: string[];
    sectionsIncluded: string[];
  };
}

class ContractTemplateService {
  async createTemplate(tenantId: string, createdBy: string, data: CreateContractTemplateData): Promise<ContractTemplate> {
    // Validate template content has valid variable placeholders
    this.validateTemplateContent(data.content, data.variables);

    // Create the template using a raw object since we don't have a Prisma model yet
    const template: ContractTemplate = {
      id: this.generateId(),
      tenantId,
      name: data.name,
      description: data.description,
      category: data.category,
      content: data.content,
      variables: data.variables,
      sections: data.sections,
      isActive: data.isActive ?? true,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real implementation, this would be stored in the database
    // For now, we'll return the template object
    return template;
  }

  async getTemplates(tenantId: string, query: ContractTemplateQuery): Promise<{
    templates: ContractTemplate[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    // Mock implementation - in reality this would query the database
    const mockTemplates: ContractTemplate[] = [
      {
        id: 'template-1',
        tenantId,
        name: 'Standard Membership Agreement',
        description: 'Standard membership contract for hot desk and dedicated desk plans',
        category: 'membership',
        content: `MEMBERSHIP AGREEMENT

This Membership Agreement ("Agreement") is entered into on {{start_date}} between {{company_name}} ("Company") and {{client_name}} ("Member").

1. MEMBERSHIP DETAILS
   - Plan Type: {{plan_type}}
   - Monthly Fee: {{monthly_fee}}
   - Start Date: {{start_date}}
   - Duration: {{contract_duration}} months

2. TERMS AND CONDITIONS
{{terms_content}}

3. PAYMENT TERMS
{{payment_terms}}

Member Signature: _________________________  Date: {{signature_date}}
Company Representative: ___________________ Date: {{signature_date}}`,
        variables: [
          {
            name: 'client_name',
            type: 'text',
            label: 'Client Name',
            required: true,
          },
          {
            name: 'company_name',
            type: 'text',
            label: 'Company Name',
            required: true,
            defaultValue: 'SweetSpot Coworking',
          },
          {
            name: 'plan_type',
            type: 'list',
            label: 'Plan Type',
            required: true,
            validation: {
              options: ['Hot Desk', 'Dedicated Desk', 'Private Office', 'Virtual Office'],
            },
          },
          {
            name: 'monthly_fee',
            type: 'currency',
            label: 'Monthly Fee',
            required: true,
          },
          {
            name: 'start_date',
            type: 'date',
            label: 'Start Date',
            required: true,
          },
          {
            name: 'contract_duration',
            type: 'number',
            label: 'Contract Duration (months)',
            required: true,
            defaultValue: 12,
          },
          {
            name: 'signature_date',
            type: 'date',
            label: 'Signature Date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0],
          },
        ],
        sections: [
          {
            id: 'section-1',
            title: 'Membership Details',
            content: 'Basic membership information and pricing',
            order: 1,
            isOptional: false,
            variables: ['plan_type', 'monthly_fee', 'start_date', 'contract_duration'],
          },
          {
            id: 'section-2',
            title: 'Terms and Conditions',
            content: 'Standard terms and conditions',
            order: 2,
            isOptional: false,
            variables: ['terms_content'],
          },
        ],
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'template-2',
        tenantId,
        name: 'Event Space Rental Agreement',
        description: 'Contract template for event space rentals',
        category: 'events',
        content: `EVENT SPACE RENTAL AGREEMENT

This Agreement is for the rental of event space at {{company_name}} by {{client_name}}.

EVENT DETAILS:
- Event Date: {{event_date}}
- Event Time: {{event_start_time}} to {{event_end_time}}
- Space: {{space_name}}
- Capacity: {{guest_count}} guests
- Rental Fee: {{rental_fee}}
- Security Deposit: {{security_deposit}}

TERMS:
{{event_terms}}

Total Amount Due: {{total_amount}}
Payment Due Date: {{payment_due_date}}`,
        variables: [
          {
            name: 'client_name',
            type: 'text',
            label: 'Client Name',
            required: true,
          },
          {
            name: 'event_date',
            type: 'date',
            label: 'Event Date',
            required: true,
          },
          {
            name: 'event_start_time',
            type: 'text',
            label: 'Start Time',
            required: true,
          },
          {
            name: 'event_end_time',
            type: 'text',
            label: 'End Time',
            required: true,
          },
          {
            name: 'space_name',
            type: 'text',
            label: 'Space Name',
            required: true,
          },
          {
            name: 'guest_count',
            type: 'number',
            label: 'Number of Guests',
            required: true,
          },
          {
            name: 'rental_fee',
            type: 'currency',
            label: 'Rental Fee',
            required: true,
          },
          {
            name: 'security_deposit',
            type: 'currency',
            label: 'Security Deposit',
            required: true,
          },
        ],
        sections: [
          {
            id: 'section-1',
            title: 'Event Details',
            content: 'Basic event information',
            order: 1,
            isOptional: false,
            variables: ['event_date', 'event_start_time', 'event_end_time', 'space_name'],
          },
        ],
        isActive: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Apply filters
    let filteredTemplates = mockTemplates;

    if (query.category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === query.category);
    }

    if (query.isActive !== undefined) {
      filteredTemplates = filteredTemplates.filter(t => t.isActive === query.isActive);
    }

    if (query.searchTerm) {
      const searchLower = query.searchTerm.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    const paginatedTemplates = filteredTemplates.slice(offset, offset + query.limit);

    return {
      templates: paginatedTemplates,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: filteredTemplates.length,
        pages: Math.ceil(filteredTemplates.length / query.limit),
      },
    };
  }

  async getTemplateById(tenantId: string, templateId: string): Promise<ContractTemplate> {
    // Mock implementation
    const templates = await this.getTemplates(tenantId, { page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
    const template = templates.templates.find(t => t.id === templateId);

    if (!template) {
      throw new NotFoundError('Contract template not found');
    }

    return template;
  }

  async updateTemplate(tenantId: string, templateId: string, data: UpdateContractTemplateData): Promise<ContractTemplate> {
    const template = await this.getTemplateById(tenantId, templateId);

    if (data.content && data.variables) {
      this.validateTemplateContent(data.content, data.variables);
    }

    // Update template - in reality this would update the database
    const updatedTemplate: ContractTemplate = {
      ...template,
      ...data,
      updatedAt: new Date(),
    };

    return updatedTemplate;
  }

  async deleteTemplate(tenantId: string, templateId: string): Promise<{ success: boolean }> {
    const template = await this.getTemplateById(tenantId, templateId);
    
    // Check if template is being used by any contracts
    // In reality, this would query the contracts table
    
    return { success: true };
  }

  async generateContract(tenantId: string, data: GenerateContractData): Promise<GeneratedContract> {
    const template = await this.getTemplateById(tenantId, data.templateId);

    // Validate required variables are provided
    const missingRequired = template.variables
      .filter(v => v.required)
      .filter(v => !(v.name in data.variableValues))
      .map(v => v.name);

    if (missingRequired.length > 0) {
      throw new ValidationError(`Missing required variables: ${missingRequired.join(', ')}`);
    }

    // Merge default values with provided values
    const allVariables: Record<string, any> = {};
    template.variables.forEach(variable => {
      if (data.variableValues[variable.name] !== undefined) {
        allVariables[variable.name] = this.formatVariableValue(
          data.variableValues[variable.name], 
          variable.type
        );
      } else if (variable.defaultValue !== undefined) {
        allVariables[variable.name] = this.formatVariableValue(
          variable.defaultValue, 
          variable.type
        );
      }
    });

    // Replace placeholders in content
    let processedContent = template.content;
    
    Object.entries(allVariables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processedContent = processedContent.replace(placeholder, String(value));
    });

    // Generate title from template name and variables
    const title = `${template.name} - ${allVariables.client_name || 'Contract'}`;

    // Determine which sections were included
    const sectionsIncluded = data.selectedSections || template.sections.map(s => s.id);

    return {
      content: processedContent,
      title,
      variables: allVariables,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        generatedAt: new Date(),
        variablesUsed: Object.keys(allVariables),
        sectionsIncluded,
      },
    };
  }

  async getTemplateCategories(tenantId: string): Promise<Array<{ category: string; count: number }>> {
    const templates = await this.getTemplates(tenantId, { page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc' });
    
    const categoryMap = new Map<string, number>();
    templates.templates.forEach(template => {
      const count = categoryMap.get(template.category) || 0;
      categoryMap.set(template.category, count + 1);
    });

    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }

  async validateTemplate(tenantId: string, templateId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const template = await this.getTemplateById(tenantId, templateId);
    
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

    try {
      this.validateTemplateContent(template.content, template.variables);
    } catch (error) {
      validation.isValid = false;
      validation.errors.push(error instanceof Error ? error.message : 'Template validation failed');
    }

    // Check for unused variables
    const usedVariables = this.extractVariablesFromContent(template.content);
    const definedVariables = template.variables.map(v => v.name);
    
    const unusedVariables = definedVariables.filter(v => !usedVariables.includes(v));
    if (unusedVariables.length > 0) {
      validation.warnings.push(`Unused variables: ${unusedVariables.join(', ')}`);
    }

    const undefinedVariables = usedVariables.filter(v => !definedVariables.includes(v));
    if (undefinedVariables.length > 0) {
      validation.isValid = false;
      validation.errors.push(`Undefined variables in content: ${undefinedVariables.join(', ')}`);
    }

    return validation;
  }

  async duplicateTemplate(tenantId: string, templateId: string, newName: string): Promise<ContractTemplate> {
    const originalTemplate = await this.getTemplateById(tenantId, templateId);

    const duplicatedTemplate: ContractTemplate = {
      ...originalTemplate,
      id: this.generateId(),
      name: newName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return duplicatedTemplate;
  }

  async previewTemplate(tenantId: string, templateId: string, sampleData?: Record<string, any>): Promise<{
    content: string;
    missingVariables: string[];
  }> {
    const template = await this.getTemplateById(tenantId, templateId);

    // Use sample data or generate default values
    const previewData: Record<string, any> = {};
    template.variables.forEach(variable => {
      if (sampleData && sampleData[variable.name] !== undefined) {
        previewData[variable.name] = sampleData[variable.name];
      } else if (variable.defaultValue !== undefined) {
        previewData[variable.name] = variable.defaultValue;
      } else {
        // Generate sample data based on type
        previewData[variable.name] = this.generateSampleValue(variable);
      }
    });

    let previewContent = template.content;
    const missingVariables: string[] = [];

    // Replace variables and track missing ones
    template.variables.forEach(variable => {
      const placeholder = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
      if (previewData[variable.name] !== undefined) {
        previewContent = previewContent.replace(
          placeholder, 
          String(this.formatVariableValue(previewData[variable.name], variable.type))
        );
      } else {
        missingVariables.push(variable.name);
        previewContent = previewContent.replace(placeholder, `[${variable.label}]`);
      }
    });

    return {
      content: previewContent,
      missingVariables,
    };
  }

  private validateTemplateContent(content: string, variables: ContractTemplateVariable[]): void {
    const variableNames = variables.map(v => v.name);
    const usedVariables = this.extractVariablesFromContent(content);
    
    const undefinedVariables = usedVariables.filter(v => !variableNames.includes(v));
    if (undefinedVariables.length > 0) {
      throw new ValidationError(`Template uses undefined variables: ${undefinedVariables.join(', ')}`);
    }
  }

  private extractVariablesFromContent(content: string): string[] {
    const variableRegex = /{{[\s]*([a-zA-Z_][a-zA-Z0-9_]*)[\s]*}}/g;
    const matches = content.match(variableRegex) || [];
    return matches.map(match => match.replace(/[{}]/g, '').trim());
  }

  private formatVariableValue(value: any, type: string): string {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(value));
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'number':
        return Number(value).toString();
      default:
        return String(value);
    }
  }

  private generateSampleValue(variable: ContractTemplateVariable): any {
    switch (variable.type) {
      case 'text':
        return `[Sample ${variable.label}]`;
      case 'number':
        return 100;
      case 'currency':
        return 1000;
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'boolean':
        return true;
      case 'list':
        return variable.validation?.options?.[0] || 'Option 1';
      default:
        return `[${variable.label}]`;
    }
  }

  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const contractTemplateService = new ContractTemplateService();
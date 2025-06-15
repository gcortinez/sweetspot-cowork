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
    variables: string[];
}
interface CreateContractTemplateData {
    name: string;
    description?: string;
    category: string;
    content: string;
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
    selectedSections?: string[];
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
declare class ContractTemplateService {
    createTemplate(tenantId: string, createdBy: string, data: CreateContractTemplateData): Promise<ContractTemplate>;
    getTemplates(tenantId: string, query: ContractTemplateQuery): Promise<{
        templates: ContractTemplate[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getTemplateById(tenantId: string, templateId: string): Promise<ContractTemplate>;
    updateTemplate(tenantId: string, templateId: string, data: UpdateContractTemplateData): Promise<ContractTemplate>;
    deleteTemplate(tenantId: string, templateId: string): Promise<{
        success: boolean;
    }>;
    generateContract(tenantId: string, data: GenerateContractData): Promise<GeneratedContract>;
    getTemplateCategories(tenantId: string): Promise<Array<{
        category: string;
        count: number;
    }>>;
    validateTemplate(tenantId: string, templateId: string): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    duplicateTemplate(tenantId: string, templateId: string, newName: string): Promise<ContractTemplate>;
    previewTemplate(tenantId: string, templateId: string, sampleData?: Record<string, any>): Promise<{
        content: string;
        missingVariables: string[];
    }>;
    private validateTemplateContent;
    private extractVariablesFromContent;
    private formatVariableValue;
    private generateSampleValue;
    private generateId;
}
export declare const contractTemplateService: ContractTemplateService;
export {};
//# sourceMappingURL=contractTemplateService.d.ts.map
import {
  PrismaClient,
  Quotation,
  QuotationStatus,
  Contract,
  ContractStatus,
  PipelineStage,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError, NotFoundError, ValidationError } from "../utils/errors";

interface QuotationItem {
  id?: string;
  description: string;
  planType?: string;
  spaceType?: string;
  quantity: number;
  unitPrice: number;
  duration: number; // in months
  billingCycle?: string;
  total: number;
  metadata?: Record<string, any>;
}

interface CreateQuotationData {
  clientId?: string;
  opportunityId?: string;
  leadId?: string;
  title: string;
  description?: string;
  items: QuotationItem[];
  discounts?: number;
  taxes?: number;
  currency?: string;
  validUntil: string;
  terms?: string;
  notes?: string;
}

interface UpdateQuotationData {
  title?: string;
  description?: string;
  items?: QuotationItem[];
  discounts?: number;
  taxes?: number;
  validUntil?: string;
  terms?: string;
  notes?: string;
  status?: QuotationStatus;
}

interface QuotationsQuery {
  page: number;
  limit: number;
  status?: QuotationStatus;
  clientId?: string;
  opportunityId?: string;
  leadId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface QuotationWithRelations extends Quotation {
  client?: {
    id: string;
    name: string;
    email: string;
  } | null;
  opportunity?: {
    id: string;
    title: string;
    stage: PipelineStage;
  } | null;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  contract?: {
    id: string;
    number: string;
    status: ContractStatus;
  } | null;
}

interface ConvertToContractData {
  title: string;
  description?: string;
  terms?: string;
  startDate: string;
  endDate?: string;
  autoRenew?: boolean;
  renewalPeriod?: string;
}

class QuotationService {
  async createQuotation(
    tenantId: string,
    createdBy: string,
    data: CreateQuotationData
  ): Promise<Quotation> {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const discounts = data.discounts || 0;
    const taxes = data.taxes || (subtotal - discounts) * 0.1; // Default 10% tax
    const total = subtotal - discounts + taxes;

    // Check if quotation is for a valid client/lead/opportunity
    let clientId = data.clientId;

    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: data.clientId, tenantId },
      });
      if (!client) {
        throw new NotFoundError("Client not found");
      }
    } else if (!data.leadId && !data.opportunityId) {
      // If no client, lead, or opportunity, throw error
      throw new ValidationError(
        "Quotation must be associated with a client, lead, or opportunity"
      );
    }

    if (data.opportunityId) {
      const opportunity = await prisma.opportunity.findFirst({
        where: { id: data.opportunityId, tenantId },
      });
      if (!opportunity) {
        throw new NotFoundError("Opportunity not found");
      }
      // If opportunity has a clientId, use it
      if (opportunity.clientId && !clientId) {
        clientId = opportunity.clientId;
      }
    }

    if (data.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: data.leadId, tenantId },
      });
      if (!lead) {
        throw new NotFoundError("Lead not found");
      }
      // If lead has a clientId, use it
      if (lead.clientId && !clientId) {
        clientId = lead.clientId;
      }
    }

    // If we still don't have a clientId, create a placeholder client from lead/opportunity info
    if (!clientId) {
      // For now, we'll require a clientId
      throw new ValidationError("Unable to determine client for quotation");
    }

    // Generate quotation number
    const lastQuotation = await prisma.quotation.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: { number: true },
    });

    const nextNumber = this.generateQuotationNumber(lastQuotation?.number);

    const quotation = await prisma.quotation.create({
      data: {
        tenantId,
        clientId,
        opportunityId: data.opportunityId || null,
        leadId: data.leadId || null,
        number: nextNumber,
        title: data.title,
        description: data.description,
        items: {
          create: data.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
        subtotal,
        discounts,
        taxes,
        total,
        currency: data.currency || "USD",
        validUntil: new Date(data.validUntil),
        notes: data.notes || data.terms, // Map terms to notes if provided
        createdBy,
        status: "DRAFT",
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            stage: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return quotation;
  }

  async getQuotations(
    tenantId: string,
    query: QuotationsQuery
  ): Promise<{
    quotations: QuotationWithRelations[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page,
      limit,
      status,
      clientId,
      opportunityId,
      leadId,
      dateFrom,
      dateTo,
      searchTerm,
      sortBy,
      sortOrder,
    } = query;
    const offset = (page - 1) * limit;

    const where: any = { tenantId };

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (opportunityId) where.opportunityId = opportunityId;
    if (leadId) where.leadId = leadId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { number: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          opportunity: {
            select: {
              id: true,
              title: true,
              stage: true,
            },
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          contract: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      prisma.quotation.count({ where }),
    ]);

    return {
      quotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getQuotationById(
    tenantId: string,
    quotationId: string
  ): Promise<QuotationWithRelations> {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        contract: {
          include: {
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    return quotation;
  }

  async updateQuotation(
    tenantId: string,
    quotationId: string,
    data: UpdateQuotationData
  ): Promise<Quotation> {
    const existingQuotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
    });

    if (!existingQuotation) {
      throw new NotFoundError("Quotation not found");
    }

    // Check if quotation can be updated
    if (
      existingQuotation.status === "CONVERTED" ||
      existingQuotation.status === "EXPIRED"
    ) {
      throw new ValidationError("Cannot update converted or expired quotation");
    }

    // Recalculate totals if items are updated
    let updateData: any = { ...data };

    if (data.items) {
      const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const discounts =
        data.discounts || existingQuotation.discounts.toNumber();
      const taxes = data.taxes || (subtotal - discounts) * 0.1;
      const total = subtotal - discounts + taxes;

      updateData = {
        ...updateData,
        items: data.items,
        subtotal,
        taxes,
        total,
      };
    }

    if (data.validUntil) {
      updateData.validUntil = new Date(data.validUntil);
    }

    const quotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            stage: true,
          },
        },
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return quotation;
  }

  async deleteQuotation(
    tenantId: string,
    quotationId: string
  ): Promise<{ success: boolean }> {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
      include: {
        contract: true,
      },
    });

    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    if (quotation.contract) {
      throw new ValidationError(
        "Cannot delete quotation with associated contract"
      );
    }

    await prisma.quotation.delete({
      where: { id: quotationId },
    });

    return { success: true };
  }

  async sendQuotation(
    tenantId: string,
    quotationId: string
  ): Promise<Quotation> {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
    });

    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    if (quotation.status !== "DRAFT") {
      throw new ValidationError("Only draft quotations can be sent");
    }

    // Check if quotation is still valid
    if (quotation.validUntil < new Date()) {
      throw new ValidationError("Cannot send expired quotation");
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "SENT" },
    });

    // TODO: Implement actual email sending logic here
    // await emailService.sendQuotation(quotation);

    return updatedQuotation;
  }

  async markQuotationAsViewed(
    tenantId: string,
    quotationId: string
  ): Promise<Quotation> {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
    });

    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    if (quotation.status === "SENT") {
      const updatedQuotation = await prisma.quotation.update({
        where: { id: quotationId },
        data: { status: "VIEWED" },
      });

      return updatedQuotation;
    }

    return quotation;
  }

  async acceptQuotation(
    tenantId: string,
    quotationId: string,
    approvedBy: string
  ): Promise<Quotation> {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
    });

    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    if (!["SENT", "VIEWED"].includes(quotation.status)) {
      throw new ValidationError(
        "Only sent or viewed quotations can be accepted"
      );
    }

    if (quotation.validUntil < new Date()) {
      throw new ValidationError("Cannot accept expired quotation");
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: "ACCEPTED",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    return updatedQuotation;
  }

  async rejectQuotation(
    tenantId: string,
    quotationId: string,
    reason?: string
  ): Promise<Quotation> {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
    });

    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    if (!["SENT", "VIEWED"].includes(quotation.status)) {
      throw new ValidationError(
        "Only sent or viewed quotations can be rejected"
      );
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: "REJECTED",
        notes: reason
          ? `${quotation.notes || ""}\n\nRejection reason: ${reason}`.trim()
          : quotation.notes,
      },
    });

    return updatedQuotation;
  }

  async convertToContract(
    tenantId: string,
    quotationId: string,
    createdBy: string,
    contractData: ConvertToContractData
  ): Promise<Contract> {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
      include: {
        client: true,
      },
    });

    if (!quotation) {
      throw new NotFoundError("Quotation not found");
    }

    if (quotation.status !== "ACCEPTED") {
      throw new ValidationError(
        "Only accepted quotations can be converted to contracts"
      );
    }

    if (!quotation.clientId) {
      throw new ValidationError(
        "Quotation must be associated with a client to create a contract"
      );
    }

    // Generate contract number
    const lastContract = await prisma.contract.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: { number: true },
    });

    const contractNumber = this.generateContractNumber(lastContract?.number);

    const contract = await prisma.contract.create({
      data: {
        tenantId,
        clientId: quotation.clientId,
        quotationId: quotation.id,
        number: contractNumber,
        title: contractData.title,
        description: contractData.description,
        terms: contractData.terms,
        amount: quotation.total,
        currency: quotation.currency,
        status: "DRAFT",
        startDate: new Date(contractData.startDate),
        endDate: contractData.endDate
          ? new Date(contractData.endDate)
          : undefined,
        autoRenew: contractData.autoRenew || false,
        renewalPeriod: contractData.renewalPeriod as any,
        createdBy,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quotation: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
      },
    });

    // Update quotation status
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "CONVERTED" },
    });

    return contract;
  }

  async getQuotationStats(tenantId: string): Promise<{
    total: number;
    byStatus: Array<{
      status: QuotationStatus;
      count: number;
      percentage: number;
    }>;
    totalValue: number;
    acceptanceRate: number;
    averageValue: number;
    expiringThisWeek: number;
    recentQuotations: Array<{
      id: string;
      number: string;
      title: string;
      status: QuotationStatus;
      total: number;
      clientName?: string;
      createdAt: Date;
    }>;
  }> {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalQuotations,
      statusStats,
      totalSent,
      totalAccepted,
      expiringQuotations,
      recentQuotations,
    ] = await Promise.all([
      prisma.quotation.count({ where: { tenantId } }),
      prisma.quotation.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { status: true },
        _sum: { total: true },
      }),
      prisma.quotation.count({
        where: {
          tenantId,
          status: { in: ["SENT", "VIEWED", "ACCEPTED", "REJECTED"] },
        },
      }),
      prisma.quotation.count({
        where: { tenantId, status: "ACCEPTED" },
      }),
      prisma.quotation.count({
        where: {
          tenantId,
          status: { in: ["SENT", "VIEWED"] },
          validUntil: { gte: now, lte: weekFromNow },
        },
      }),
      prisma.quotation.findMany({
        where: { tenantId },
        include: {
          client: {
            select: { name: true },
          },
          lead: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const byStatus = statusStats.map(({ status, _count, _sum }) => ({
      status,
      count: _count.status,
      percentage:
        totalQuotations > 0 ? (_count.status / totalQuotations) * 100 : 0,
    }));

    const totalValue = statusStats.reduce(
      (sum, stat) => sum + (stat._sum.total?.toNumber() || 0),
      0
    );
    const averageValue = totalQuotations > 0 ? totalValue / totalQuotations : 0;
    const acceptanceRate =
      totalSent > 0 ? (totalAccepted / totalSent) * 100 : 0;

    return {
      total: totalQuotations,
      byStatus,
      totalValue,
      acceptanceRate,
      averageValue,
      expiringThisWeek: expiringQuotations,
      recentQuotations: recentQuotations.map((q) => ({
        id: q.id,
        number: q.number,
        title: q.title,
        status: q.status,
        total: q.total.toNumber(),
        clientName:
          q.client?.name ||
          (q.lead ? `${q.lead.firstName} ${q.lead.lastName}` : undefined),
        createdAt: q.createdAt,
      })),
    };
  }

  async duplicateQuotation(
    tenantId: string,
    quotationId: string,
    createdBy: string
  ): Promise<Quotation> {
    const originalQuotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
      include: {
        items: true,
      },
    });

    if (!originalQuotation) {
      throw new NotFoundError("Quotation not found");
    }

    // Generate new quotation number
    const lastQuotation = await prisma.quotation.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: { number: true },
    });

    const nextNumber = this.generateQuotationNumber(lastQuotation?.number);

    const quotation = await prisma.quotation.create({
      data: {
        tenantId,
        clientId: originalQuotation.clientId,
        opportunityId: originalQuotation.opportunityId,
        leadId: originalQuotation.leadId,
        number: nextNumber,
        title: `${originalQuotation.title} (Copy)`,
        description: originalQuotation.description,
        items: {
          create: originalQuotation.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
        subtotal: originalQuotation.subtotal,
        discounts: originalQuotation.discounts,
        taxes: originalQuotation.taxes,
        total: originalQuotation.total,
        currency: originalQuotation.currency,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes: originalQuotation.notes,
        createdBy,
        status: "DRAFT",
      },
    });

    return quotation;
  }

  private generateQuotationNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return "QUO-001";
    }

    const match = lastNumber.match(/QUO-(\d+)/);
    if (!match) {
      return "QUO-001";
    }

    const nextNumber = parseInt(match[1]) + 1;
    return `QUO-${nextNumber.toString().padStart(3, "0")}`;
  }

  private generateContractNumber(lastNumber?: string): string {
    if (!lastNumber) {
      return "CON-001";
    }

    const match = lastNumber.match(/CON-(\d+)/);
    if (!match) {
      return "CON-001";
    }

    const nextNumber = parseInt(match[1]) + 1;
    return `CON-${nextNumber.toString().padStart(3, "0")}`;
  }
}

export const quotationService = new QuotationService();

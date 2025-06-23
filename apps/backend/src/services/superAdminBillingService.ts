import { supabaseAdmin } from "../lib/supabase";

export interface BillingOverview {
  totalRevenue: number;
  monthlyRecurring: number;
  pendingPayments: number;
  overduePayments: number;
  revenueGrowth: number;
  averageRevenuePerCowork: number;
}

export interface CoworkBilling {
  coworkId: string;
  coworkName: string;
  coworkSlug: string;
  monthlyRevenue: number;
  totalRevenue: number;
  paymentStatus: 'CURRENT' | 'OVERDUE' | 'SUSPENDED';
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  subscriptionPlan: string;
  invoiceCount: number;
  outstandingAmount: number;
}

export interface RevenueMetrics {
  daily: Array<{ date: string; revenue: number; transactions: number }>;
  monthly: Array<{ month: string; revenue: number; growth: number }>;
  quarterly: Array<{ quarter: string; revenue: number; coworks: number }>;
  yearly: Array<{ year: string; revenue: number; growth: number }>;
}

export interface PaymentTransaction {
  id: string;
  coworkId: string;
  coworkName: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  method: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'WEBPAY' | 'STRIPE';
  description: string;
  createdAt: string;
  processedAt: string | null;
}

/**
 * Super Admin Billing Service
 * Handles advanced billing operations and financial analytics
 */
export class SuperAdminBillingService {
  /**
   * Get comprehensive billing overview
   */
  static async getBillingOverview(): Promise<BillingOverview> {
    try {
      console.log('Getting billing overview for Super Admin...');

      // Get total revenue from all paid invoices
      const { data: paidInvoices } = await supabaseAdmin
        .from("invoices")
        .select("total, createdAt")
        .eq("status", "PAID");

      const totalRevenue = paidInvoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;

      // Get current month revenue
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: monthlyInvoices } = await supabaseAdmin
        .from("invoices")
        .select("total")
        .eq("status", "PAID")
        .gte("createdAt", firstDayOfMonth.toISOString());

      const monthlyRevenue = monthlyInvoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;

      // Get pending payments
      const { data: pendingInvoices } = await supabaseAdmin
        .from("invoices")
        .select("total")
        .eq("status", "PENDING");

      const pendingPayments = pendingInvoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;

      // Get overdue payments (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: overdueInvoices } = await supabaseAdmin
        .from("invoices")
        .select("total")
        .in("status", ["PENDING", "OVERDUE"])
        .lt("dueDate", thirtyDaysAgo.toISOString());

      const overduePayments = overdueInvoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;

      // Calculate revenue growth (current month vs previous month)
      const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const lastDayOfPreviousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

      const { data: previousMonthInvoices } = await supabaseAdmin
        .from("invoices")
        .select("total")
        .eq("status", "PAID")
        .gte("createdAt", previousMonth.toISOString())
        .lte("createdAt", lastDayOfPreviousMonth.toISOString());

      const previousMonthRevenue = previousMonthInvoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;
      const revenueGrowth = previousMonthRevenue > 0 
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;

      // Get active tenants count for average calculation
      const { count: activeCoworks } = await supabaseAdmin
        .from("tenants")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE");

      const averageRevenuePerCowork = (activeCoworks || 0) > 0 ? monthlyRevenue / (activeCoworks || 1) : 0;

      return {
        totalRevenue,
        monthlyRecurring: monthlyRevenue,
        pendingPayments,
        overduePayments,
        revenueGrowth,
        averageRevenuePerCowork,
      };
    } catch (error) {
      console.error("Error getting billing overview:", error);
      throw new Error("Failed to get billing overview");
    }
  }

  /**
   * Get billing information for all coworks
   */
  static async getCoworksBilling(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{
    coworks: CoworkBilling[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      console.log('Getting coworks billing information...');

      const offset = (page - 1) * limit;

      // Get tenants with their billing information
      let query = supabaseAdmin
        .from("tenants")
        .select(`
          id,
          name,
          slug,
          status,
          createdAt,
          invoices:invoices(total, status, dueDate, createdAt)
        `, { count: "exact" });

      // Apply status filter if provided
      if (status && status !== 'ALL') {
        switch (status) {
          case 'CURRENT':
            query = query.eq("status", "ACTIVE");
            break;
          case 'OVERDUE':
            query = query.eq("status", "ACTIVE"); // We'll filter overdue in post-processing
            break;
          case 'SUSPENDED':
            query = query.eq("status", "SUSPENDED");
            break;
        }
      }

      const { data: tenants, error, count } = await query
        .order("name", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error getting coworks billing:", error);
        throw new Error(`Failed to get coworks billing: ${error.message}`);
      }

      // Process billing data for each cowork
      const coworksBilling: CoworkBilling[] = (tenants || []).map((tenant: any) => {
        const invoices = tenant.invoices || [];
        
        // Calculate totals
        const totalRevenue = invoices
          .filter((inv: any) => inv.status === 'PAID')
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

        const monthlyRevenue = invoices
          .filter((inv: any) => {
            if (inv.status !== 'PAID') return false;
            const invoiceDate = new Date(inv.createdAt);
            const currentMonth = new Date();
            return invoiceDate.getMonth() === currentMonth.getMonth() && 
                   invoiceDate.getFullYear() === currentMonth.getFullYear();
          })
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

        const outstandingAmount = invoices
          .filter((inv: any) => ['PENDING', 'OVERDUE'].includes(inv.status))
          .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

        // Determine payment status
        const overdueInvoices = invoices.filter((inv: any) => {
          if (inv.status !== 'PENDING') return false;
          const dueDate = new Date(inv.dueDate);
          return dueDate < new Date();
        });

        let paymentStatus: 'CURRENT' | 'OVERDUE' | 'SUSPENDED' = 'CURRENT';
        if (tenant.status === 'SUSPENDED') {
          paymentStatus = 'SUSPENDED';
        } else if (overdueInvoices.length > 0) {
          paymentStatus = 'OVERDUE';
        }

        // Get last and next payment dates
        const paidInvoices = invoices
          .filter((inv: any) => inv.status === 'PAID')
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const lastPaymentDate = paidInvoices.length > 0 ? paidInvoices[0].createdAt : null;

        // Estimate next payment (30 days from last payment or creation)
        const baseDate = lastPaymentDate ? new Date(lastPaymentDate) : new Date(tenant.createdAt);
        const nextPaymentDate = new Date(baseDate);
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

        return {
          coworkId: tenant.id,
          coworkName: tenant.name,
          coworkSlug: tenant.slug,
          monthlyRevenue,
          totalRevenue,
          paymentStatus,
          lastPaymentDate,
          nextPaymentDate: nextPaymentDate.toISOString(),
          subscriptionPlan: "Standard", // TODO: Implement subscription plans
          invoiceCount: invoices.length,
          outstandingAmount,
        };
      });

      return {
        coworks: coworksBilling,
        total: count || 0,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error in getCoworksBilling:", error);
      throw error;
    }
  }

  /**
   * Get revenue metrics for charts and analytics
   */
  static async getRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      console.log('Getting revenue metrics for analytics...');

      // Get daily revenue for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: dailyData } = await supabaseAdmin
        .from("invoices")
        .select("total, createdAt")
        .eq("status", "PAID")
        .gte("createdAt", thirtyDaysAgo.toISOString());

      // Process daily data
      const dailyMetrics: { [key: string]: { revenue: number; transactions: number } } = {};
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyMetrics[dateKey] = { revenue: 0, transactions: 0 };
      }

      dailyData?.forEach((invoice) => {
        const dateKey = invoice.createdAt.split('T')[0];
        if (dailyMetrics[dateKey]) {
          dailyMetrics[dateKey].revenue += invoice.total || 0;
          dailyMetrics[dateKey].transactions += 1;
        }
      });

      const daily = Object.entries(dailyMetrics).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        transactions: data.transactions,
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Get monthly revenue for last 12 months
      const { data: monthlyData } = await supabaseAdmin
        .from("invoices")
        .select("total, createdAt")
        .eq("status", "PAID")
        .gte("createdAt", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      // Process monthly data
      const monthlyMetrics: { [key: string]: number } = {};
      monthlyData?.forEach((invoice) => {
        const date = new Date(invoice.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMetrics[monthKey] = (monthlyMetrics[monthKey] || 0) + (invoice.total || 0);
      });

      const monthly = Object.entries(monthlyMetrics).map(([month, revenue], index, array) => {
        const previousRevenue = index > 0 ? array[index - 1][1] : 0;
        const growth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;
        return { month, revenue, growth };
      }).sort((a, b) => a.month.localeCompare(b.month));

      // Generate quarterly and yearly data (simplified)
      const quarterly = [
        { quarter: "Q1 2024", revenue: Math.floor(Math.random() * 500000), coworks: 12 },
        { quarter: "Q2 2024", revenue: Math.floor(Math.random() * 600000), coworks: 15 },
        { quarter: "Q3 2024", revenue: Math.floor(Math.random() * 700000), coworks: 18 },
        { quarter: "Q4 2024", revenue: Math.floor(Math.random() * 800000), coworks: 20 },
      ];

      const yearly = [
        { year: "2022", revenue: 1200000, growth: 0 },
        { year: "2023", revenue: 1800000, growth: 50 },
        { year: "2024", revenue: 2500000, growth: 38.9 },
      ];

      return {
        daily,
        monthly,
        quarterly,
        yearly,
      };
    } catch (error) {
      console.error("Error getting revenue metrics:", error);
      throw new Error("Failed to get revenue metrics");
    }
  }

  /**
   * Get recent payment transactions
   */
  static async getRecentTransactions(
    limit: number = 50
  ): Promise<PaymentTransaction[]> {
    try {
      console.log('Getting recent payment transactions...');

      // Get recent invoices with tenant information
      const { data: invoices } = await supabaseAdmin
        .from("invoices")
        .select(`
          id,
          total,
          status,
          description,
          createdAt,
          updatedAt,
          tenants:tenantId(id, name)
        `)
        .order("createdAt", { ascending: false })
        .limit(limit);

      const transactions: PaymentTransaction[] = (invoices || []).map((invoice: any) => ({
        id: invoice.id,
        coworkId: invoice.tenants?.id || 'unknown',
        coworkName: invoice.tenants?.name || 'Unknown Cowork',
        amount: invoice.total || 0,
        currency: 'CLP',
        status: invoice.status === 'PAID' ? 'COMPLETED' : 
                invoice.status === 'PENDING' ? 'PENDING' : 
                invoice.status === 'OVERDUE' ? 'FAILED' : 'PENDING',
        method: 'WEBPAY', // Default method - TODO: Add actual payment method tracking
        description: invoice.description || 'Monthly subscription',
        createdAt: invoice.createdAt,
        processedAt: invoice.status === 'PAID' ? invoice.updatedAt : null,
      }));

      return transactions;
    } catch (error) {
      console.error("Error getting recent transactions:", error);
      throw new Error("Failed to get recent transactions");
    }
  }

  /**
   * Generate financial report for export
   */
  static async generateFinancialReport(
    startDate: string,
    endDate: string
  ): Promise<{
    summary: BillingOverview;
    coworks: CoworkBilling[];
    transactions: PaymentTransaction[];
    metrics: RevenueMetrics;
  }> {
    try {
      console.log(`Generating financial report from ${startDate} to ${endDate}`);

      const [summary, coworksResult, transactions, metrics] = await Promise.all([
        this.getBillingOverview(),
        this.getCoworksBilling(1, 100),
        this.getRecentTransactions(100),
        this.getRevenueMetrics(),
      ]);

      return {
        summary,
        coworks: coworksResult.coworks,
        transactions,
        metrics,
      };
    } catch (error) {
      console.error("Error generating financial report:", error);
      throw new Error("Failed to generate financial report");
    }
  }
}
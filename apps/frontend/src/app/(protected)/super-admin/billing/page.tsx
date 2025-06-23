"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  Download,
  Filter,
  RefreshCw,
  Search,
  Eye,
  Loader2,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface BillingOverview {
  totalRevenue: number;
  monthlyRecurring: number;
  pendingPayments: number;
  overduePayments: number;
  revenueGrowth: number;
  averageRevenuePerCowork: number;
}

interface CoworkBilling {
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

interface RevenueMetrics {
  daily: Array<{ date: string; revenue: number; transactions: number }>;
  monthly: Array<{ month: string; revenue: number; growth: number }>;
  quarterly: Array<{ quarter: string; revenue: number; coworks: number }>;
  yearly: Array<{ year: string; revenue: number; growth: number }>;
}

interface PaymentTransaction {
  id: string;
  coworkId: string;
  coworkName: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  method: string;
  description: string;
  createdAt: string;
  processedAt: string | null;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function SuperAdminBilling() {
  const [billingOverview, setBillingOverview] = useState<BillingOverview | null>(null);
  const [coworksBilling, setCoworksBilling] = useState<CoworkBilling[]>([]);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const api = useApi();

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      console.log('Loading comprehensive billing data...');

      const [overviewRes, metricsRes, transactionsRes, coworksRes] = await Promise.all([
        api.get('/api/super-admin/billing/overview'),
        api.get('/api/super-admin/billing/metrics'),
        api.get('/api/super-admin/billing/transactions?limit=10'),
        api.get('/api/super-admin/billing/coworks?limit=10'),
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setBillingOverview(overviewData.data);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setRevenueMetrics(metricsData.data);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.data.transactions);
      }

      if (coworksRes.ok) {
        const coworksData = await coworksRes.json();
        setCoworksBilling(coworksData.data.coworks);
      }

      console.log('✅ Billing data loaded successfully');
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: "Error al cargar datos de facturación",
        description: "No se pudieron cargar los datos de facturación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CURRENT': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CURRENT':
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'OVERDUE':
      case 'FAILED': return <XCircle className="h-4 w-4" />;
      case 'SUSPENDED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getChartData = () => {
    if (!revenueMetrics) return [];
    
    switch (chartPeriod) {
      case 'daily':
        return revenueMetrics.daily.slice(-30).map(item => ({
          ...item,
          displayDate: new Date(item.date).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })
        }));
      case 'yearly':
        return revenueMetrics.yearly;
      default:
        return revenueMetrics.monthly.slice(-12);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard de Facturación</h1>
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Facturación</h1>
          <p className="text-gray-600 mt-1">
            Panel financiero completo de todos los coworks del sistema
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadBillingData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {billingOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(billingOverview.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Recurrente Mensual</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(billingOverview.monthlyRecurring)}
                  </p>
                  <p className="text-xs text-blue-600">
                    Crecimiento: {billingOverview.revenueGrowth.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Pagos Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {formatCurrency(billingOverview.pendingPayments)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Pagos Vencidos</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(billingOverview.overduePayments)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Chart */}
      {revenueMetrics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendencia de Ingresos
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    {chartPeriod === 'daily' ? 'Diario' : chartPeriod === 'monthly' ? 'Mensual' : 'Anual'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setChartPeriod('daily')}>
                    Vista Diaria (30 días)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartPeriod('monthly')}>
                    Vista Mensual (12 meses)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartPeriod('yearly')}>
                    Vista Anual
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={chartPeriod === 'daily' ? 'displayDate' : chartPeriod === 'yearly' ? 'year' : 'month'} 
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                    labelFormatter={(label) => `Período: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coworks Billing Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Estado de Facturación por Cowork
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {coworksBilling.slice(0, 5).map((cowork) => (
                <div key={cowork.coworkId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{cowork.coworkName}</p>
                    <p className="text-sm text-gray-500">
                      Mensual: {formatCurrency(cowork.monthlyRevenue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(cowork.paymentStatus)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(cowork.paymentStatus)}
                        {cowork.paymentStatus}
                      </span>
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {cowork.outstandingAmount > 0 && `Pendiente: ${formatCurrency(cowork.outstandingAmount)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transacciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.coworkName}</p>
                    <p className="text-sm text-gray-500">{transaction.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(transaction.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                    <Badge size="sm" className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      {billingOverview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Promedio por Cowork</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(billingOverview.averageRevenuePerCowork)}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Crecimiento Mensual</p>
                  <p className="text-xl font-bold text-gray-900">
                    {billingOverview.revenueGrowth > 0 ? '+' : ''}{billingOverview.revenueGrowth.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className={`h-6 w-6 ${billingOverview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Coworks</p>
                  <p className="text-xl font-bold text-gray-900">{coworksBilling.length}</p>
                </div>
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
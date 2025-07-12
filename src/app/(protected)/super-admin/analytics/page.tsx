"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface SystemOverview {
  totalCoworks: number;
  activeCoworks: number;
  suspendedCoworks: number;
  inactiveCoworks: number;
  totalUsers: number;
  totalClients: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

interface UserGrowthData {
  date: string;
  users: number;
  coworks: number;
  revenue: number;
}

interface CoworkStatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

interface PerformanceMetrics {
  userEngagement: number;
  systemUptime: number;
  averageResponseTime: number;
  errorRate: number;
  activeUsersToday: number;
  newSignupsThisWeek: number;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastBackup: string;
  databaseSize: string;
  activeConnections: number;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function SuperAdminAnalytics() {
  const [systemOverview, setSystemOverview] = useState<SystemOverview | null>(null);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<CoworkStatusDistribution[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { toast } = useToast();
  const api = useApi();

  useEffect(() => {
    loadAnalyticsData();
  }, [chartPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('Loading comprehensive analytics data...');

      // Load system overview
      const analyticsRes = await api.get('/api/super-admin/analytics');
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setSystemOverview(analyticsData.data.overview);
      }

      // Generate mock data for demonstration
      generateMockAnalyticsData();

      console.log('✅ Analytics data loaded successfully');
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error al cargar analíticas",
        description: "No se pudieron cargar los datos de analíticas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalyticsData = () => {
    // Generate user growth data
    const growthData: UserGrowthData[] = [];
    const days = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : chartPeriod === '90d' ? 90 : 365;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      growthData.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 50) + 100 + (days - i) * 2,
        coworks: Math.floor(Math.random() * 5) + 10 + Math.floor((days - i) / 10),
        revenue: Math.floor(Math.random() * 100000) + 50000 + (days - i) * 1000,
      });
    }
    setUserGrowthData(growthData);

    // Generate status distribution
    setStatusDistribution([
      { status: 'ACTIVE', count: 18, percentage: 72 },
      { status: 'SUSPENDED', count: 4, percentage: 16 },
      { status: 'INACTIVE', count: 3, percentage: 12 },
    ]);

    // Generate performance metrics
    setPerformanceMetrics({
      userEngagement: 87.5,
      systemUptime: 99.9,
      averageResponseTime: 145,
      errorRate: 0.12,
      activeUsersToday: 1247,
      newSignupsThisWeek: 89,
    });

    // Generate system health
    setSystemHealth({
      status: 'healthy',
      uptime: process.uptime ? process.uptime() : 2847392,
      lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      databaseSize: '2.4 GB',
      activeConnections: 47,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE': return 'bg-red-100 text-red-800';
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics del Sistema</h1>
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Analytics del Sistema</h1>
          <p className="text-gray-600 mt-1">
            Métricas globales y análisis de rendimiento de la plataforma
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {systemOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Coworks</p>
                  <p className="text-2xl font-bold text-blue-900">{systemOverview.totalCoworks}</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12% este mes
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Usuarios Totales</p>
                  <p className="text-2xl font-bold text-green-900">{systemOverview.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +{systemOverview.monthlyGrowth}% crecimiento
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(systemOverview.totalRevenue)}
                  </p>
                  <p className="text-xs text-purple-600 flex items-center mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +18.5% último trimestre
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Coworks Activos</p>
                  <p className="text-2xl font-bold text-orange-900">{systemOverview.activeCoworks}</p>
                  <p className="text-xs text-orange-600">
                    {((systemOverview.activeCoworks / systemOverview.totalCoworks) * 100).toFixed(1)}% del total
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Crecimiento del Sistema
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    {chartPeriod === '7d' ? 'Última semana' : 
                     chartPeriod === '30d' ? 'Último mes' : 
                     chartPeriod === '90d' ? 'Últimos 3 meses' : 'Último año'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setChartPeriod('7d')}>
                    Última semana
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartPeriod('30d')}>
                    Último mes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartPeriod('90d')}>
                    Últimos 3 meses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartPeriod('1y')}>
                    Último año
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('es-CL', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Usuarios"
                  />
                  <Area
                    type="monotone"
                    dataKey="coworks"
                    stackId="2"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Coworks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Estado de Coworks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {statusDistribution.map((item, index) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rendimiento del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Participación de Usuarios</span>
                <span className="text-sm font-medium">{performanceMetrics.userEngagement}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${performanceMetrics.userEngagement}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Uptime del Sistema</span>
                <span className="text-sm font-medium">{performanceMetrics.systemUptime}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${performanceMetrics.systemUptime}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tiempo de Respuesta</span>
                <span className="text-sm font-medium">{performanceMetrics.averageResponseTime}ms</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Usuarios Activos Hoy</p>
                  <p className="text-xs text-green-600">En línea en las últimas 24h</p>
                </div>
                <span className="text-2xl font-bold text-green-900">
                  {performanceMetrics.activeUsersToday.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900">Nuevos Registros</p>
                  <p className="text-xs text-blue-600">Esta semana</p>
                </div>
                <span className="text-2xl font-bold text-blue-900">
                  {performanceMetrics.newSignupsThisWeek}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-red-900">Tasa de Errores</p>
                  <p className="text-xs text-red-600">Promedio últimas 24h</p>
                </div>
                <span className="text-2xl font-bold text-red-900">
                  {performanceMetrics.errorRate}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          {systemHealth && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Estado del Sistema
                  <Badge className={getStatusColor(systemHealth.status)}>
                    <span className="flex items-center gap-1">
                      {getHealthIcon(systemHealth.status)}
                      {systemHealth.status}
                    </span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Uptime del Servidor</span>
                  <span className="text-sm font-medium">{formatUptime(systemHealth.uptime)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Último Backup</span>
                  <span className="text-sm font-medium">
                    {new Date(systemHealth.lastBackup).toLocaleDateString('es-CL')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tamaño BD</span>
                  <span className="text-sm font-medium">{systemHealth.databaseSize}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conexiones Activas</span>
                  <span className="text-sm font-medium">{systemHealth.activeConnections}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
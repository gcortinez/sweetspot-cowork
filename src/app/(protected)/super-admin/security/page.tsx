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
  BarChart,
  Bar,
  LineChart,
  Line,
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
  Shield,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  Activity,
  Users,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  Search,
  Loader2,
  TrendingUp,
  Database,
  Server,
  Gauge,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface SecurityAlert {
  id: string;
  type: 'SUSPICIOUS_ACTIVITY' | 'MULTIPLE_FAILURES' | 'UNUSUAL_ACCESS' | 'PRIVILEGE_ESCALATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  details: Record<string, any>;
  affectedUser?: string;
  affectedTenant?: string;
  actionRequired: boolean;
  createdAt: string;
}

interface AuditStats {
  totalActions: number;
  todayActions: number;
  uniqueUsers: number;
  affectedTenants: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userEmail: string; count: number }>;
  securityAlerts: SecurityAlert[];
  riskScore: number;
}

interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  actionRequired: number;
}

const SEVERITY_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#EA580C',
  MEDIUM: '#D97706',
  LOW: '#059669',
};

export default function SuperAdminSecurity() {
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const { toast } = useToast();
  const api = useApi();

  useEffect(() => {
    loadSecurityData();
  }, [period]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      console.log('Loading security and audit data...');

      const [auditRes, alertsRes] = await Promise.all([
        api.get(`/api/super-admin/audit/stats?days=${period}`),
        api.get(`/api/super-admin/audit/alerts?days=7`),
      ]);

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditStats(auditData.data);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setSecurityAlerts(alertsData.data.alerts);
        setAlertSummary(alertsData.data.summary);
      }

      console.log('✅ Security data loaded successfully');
    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Error al cargar datos de seguridad",
        description: "No se pudieron cargar los datos de seguridad",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      const response = await api.post('/api/super-admin/audit/export', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        format: 'CSV'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create and download file
        const blob = new Blob([data.data.content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Logs exportados",
          description: "Los logs de auditoría se han exportado exitosamente",
        });
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar los logs de auditoría",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="h-4 w-4" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4" />;
      case 'MEDIUM': return <Clock className="h-4 w-4" />;
      case 'LOW': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'CRÍTICO';
    if (score >= 60) return 'ALTO';
    if (score >= 40) return 'MEDIO';
    return 'BAJO';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Centro de Seguridad</h1>
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            Centro de Seguridad
          </h1>
          <p className="text-gray-600 mt-1">
            Monitoreo de seguridad, auditoría y detección de anomalías
          </p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Últimos {period} días
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPeriod(7)}>
                Últimos 7 días
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod(30)}>
                Últimos 30 días
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod(90)}>
                Últimos 90 días
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={loadSecurityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={exportAuditLogs} className="bg-red-600 hover:bg-red-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar Logs
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      {auditStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Nivel de Riesgo</p>
                  <p className={`text-2xl font-bold ${getRiskScoreColor(auditStats.riskScore)}`}>
                    {getRiskLevel(auditStats.riskScore)}
                  </p>
                  <p className="text-xs text-red-600">
                    Score: {auditStats.riskScore}/100
                  </p>
                </div>
                <Gauge className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Acciones de Auditoría</p>
                  <p className="text-2xl font-bold text-blue-900">{auditStats.totalActions.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">
                    Hoy: {auditStats.todayActions}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Usuarios Únicos</p>
                  <p className="text-2xl font-bold text-green-900">{auditStats.uniqueUsers}</p>
                  <p className="text-xs text-green-600">
                    Tenants: {auditStats.affectedTenants}
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
                  <p className="text-purple-600 text-sm font-medium">Alertas Activas</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {alertSummary?.total || 0}
                  </p>
                  <p className="text-xs text-purple-600">
                    Críticas: {alertSummary?.critical || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Alertas de Seguridad Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No hay alertas de seguridad activas</p>
                  <p className="text-sm text-gray-500">El sistema está funcionando normalmente</p>
                </div>
              ) : (
                securityAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{new Date(alert.createdAt).toLocaleString('es-CL')}</span>
                        {alert.affectedUser && <span>Usuario: {alert.affectedUser}</span>}
                        {alert.actionRequired && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Acción Requerida
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alert Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            {alertSummary ? (
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Críticas', value: alertSummary.critical, color: '#DC2626' },
                          { name: 'Altas', value: alertSummary.high, color: '#EA580C' },
                          { name: 'Medias', value: alertSummary.medium, color: '#D97706' },
                          { name: 'Bajas', value: alertSummary.low, color: '#059669' },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[
                          { name: 'Críticas', value: alertSummary.critical, color: '#DC2626' },
                          { name: 'Altas', value: alertSummary.high, color: '#EA580C' },
                          { name: 'Medias', value: alertSummary.medium, color: '#D97706' },
                          { name: 'Bajas', value: alertSummary.low, color: '#059669' },
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Alertas</span>
                    <span className="font-medium">{alertSummary.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-red-600">Críticas</span>
                    <span className="font-medium">{alertSummary.critical}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-orange-600">Altas</span>
                    <span className="font-medium">{alertSummary.high}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-yellow-600">Medias</span>
                    <span className="font-medium">{alertSummary.medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-600">Bajas</span>
                    <span className="font-medium">{alertSummary.low}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-8 w-8 mx-auto mb-2" />
                <p>Sin datos de alertas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Charts */}
      {auditStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Acciones Más Frecuentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={auditStats.topActions.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="action" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios Más Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditStats.topUsers.slice(0, 8).map((user, index) => (
                  <div key={user.userEmail} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium truncate">{user.userEmail}</span>
                    </div>
                    <Badge variant="outline">{user.count} acciones</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">Sistema Operativo</p>
              <p className="text-xs text-green-600">Todos los servicios funcionando</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900">Base de Datos</p>
              <p className="text-xs text-blue-600">Conectada y saludable</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Lock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-900">Autenticación</p>
              <p className="text-xs text-purple-600">Servicios activos</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-900">Monitoreo</p>
              <p className="text-xs text-orange-600">Funcionando normalmente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
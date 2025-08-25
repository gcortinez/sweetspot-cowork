import { 
  Receipt, 
  DollarSign, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Download,
  Send,
  Plus,
  Calendar,
  Filter,
  Search,
  Eye,
  Edit,
  MoreHorizontal
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface FacturacionTabProps {
  dashboardData: any
}

export default function FacturacionTab({ dashboardData }: FacturacionTabProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getInvoiceStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'PAID': 'bg-green-100 text-green-800 border-green-300',
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'OVERDUE': 'bg-red-100 text-red-800 border-red-300',
      'DRAFT': 'bg-gray-100 text-gray-800 border-gray-300',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-300'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      'PAID': 'Pagada',
      'PENDING': 'Pendiente',
      'OVERDUE': 'Vencida',
      'DRAFT': 'Borrador',
      'CANCELLED': 'Cancelada'
    }
    return statusLabels[status] || status
  }

  const getStatusIcon = (status: string) => {
    const statusIcons: { [key: string]: any } = {
      'PAID': CheckCircle,
      'PENDING': Clock,
      'OVERDUE': AlertCircle,
      'DRAFT': FileText,
      'CANCELLED': AlertCircle
    }
    return statusIcons[status] || Clock
  }

  // Mock data for demonstration
  const recentInvoices = [
    {
      id: 'INV-001',
      clientName: 'TechCorp Solutions',
      amount: 2500000,
      dueDate: '2024-01-15',
      status: 'PAID',
      invoiceDate: '2024-01-01'
    },
    {
      id: 'INV-002',
      clientName: 'StartupXYZ',
      amount: 1800000,
      dueDate: '2024-01-20',
      status: 'PENDING',
      invoiceDate: '2024-01-05'
    },
    {
      id: 'INV-003',
      clientName: 'Creative Agency',
      amount: 3200000,
      dueDate: '2024-01-10',
      status: 'OVERDUE',
      invoiceDate: '2023-12-28'
    },
    {
      id: 'INV-004',
      clientName: 'Digital Marketing Co',
      amount: 1500000,
      dueDate: '2024-01-25',
      status: 'DRAFT',
      invoiceDate: '2024-01-08'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Billing Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facturación y Pagos</h2>
          <p className="text-gray-600">Gestiona facturas, pagos y finanzas</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Ingresos del Mes</p>
                <p className="text-3xl font-bold text-green-900">
                  {formatCurrency(dashboardData?.billing?.monthlyRevenue || 15480000)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-600 font-medium">+8.2%</span>
                  <span className="text-xs text-gray-500 ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Facturas Pendientes</p>
                <p className="text-3xl font-bold text-blue-900">
                  {dashboardData?.billing?.pendingInvoices || 8}
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  {formatCurrency(5200000)} por cobrar
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Facturas Vencidas</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {dashboardData?.billing?.overdueInvoices || 2}
                </p>
                <p className="text-sm text-red-600 mt-2 font-medium">
                  {formatCurrency(3200000)} vencido
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Métodos de Pago</p>
                <p className="text-3xl font-bold text-purple-900">
                  {dashboardData?.billing?.paymentMethods || 5}
                </p>
                <p className="text-sm text-purple-600 mt-2">
                  Configurados
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <div className="text-center">
                <Plus className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Nueva Factura</div>
              </div>
            </Button>
            <Button variant="outline" className="h-20">
              <div className="text-center">
                <Send className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Enviar Recordatorio</div>
              </div>
            </Button>
            <Button variant="outline" className="h-20">
              <div className="text-center">
                <Download className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Exportar Datos</div>
              </div>
            </Button>
            <Button variant="outline" className="h-20">
              <div className="text-center">
                <CreditCard className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Configurar Pagos</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              Facturas Recientes
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Buscar facturas..." 
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Factura</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Monto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Fecha Venc.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => {
                  const StatusIcon = getStatusIcon(invoice.status)
                  return (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Receipt className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{invoice.id}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{invoice.clientName}</p>
                          <p className="text-sm text-gray-500">
                            Emitida: {new Date(invoice.invoiceDate).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className={`text-sm ${
                            new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID' 
                              ? 'text-red-600 font-medium' 
                              : 'text-gray-600'
                          }`}>
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`${getInvoiceStatusColor(invoice.status)} border flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {getStatusLabel(invoice.status)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination or Load More */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando 4 de 24 facturas
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Métodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Transferencias</p>
                    <p className="text-sm text-gray-600">Cuenta bancaria</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Activo
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">PSE</p>
                    <p className="text-sm text-gray-600">Pagos en línea</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  Activo
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Tarjetas de Crédito</p>
                    <p className="text-sm text-gray-600">Visa, Mastercard</p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  Activo
                </Badge>
              </div>
            </div>
            
            <Button variant="outline" className="w-full mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Configurar Nuevo Método
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Ingresos este mes:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(15480000)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Por cobrar:</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(5200000)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Vencido:</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(3200000)}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-medium">Balance neto:</span>
                  <span className="font-bold text-xl text-gray-900">
                    {formatCurrency(17480000)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
                <FileText className="h-4 w-4 mr-2" />
                Ver Reporte Detallado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
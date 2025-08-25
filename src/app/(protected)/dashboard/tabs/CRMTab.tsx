import Link from 'next/link'
import { 
  Target, 
  DollarSign, 
  Building2, 
  UserCheck, 
  Star, 
  ArrowRight,
  Mail,
  User,
  TrendingUp,
  Activity,
  Calendar,
  Plus,
  Users
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CRMTabProps {
  dashboardData: any
  openQuickView: (data: any, type: 'prospect' | 'client' | 'opportunity') => void
}

export default function CRMTab({ dashboardData, openQuickView }: CRMTabProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-purple hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Oportunidades Activas</p>
                <p className="text-3xl font-bold text-purple-900">
                  {dashboardData?.opportunities?.stats?.active || 0}
                </p>
                <p className="text-xs text-purple-600 flex items-center mt-2">
                  <Target className="h-3 w-3 mr-1" />
                  Pipeline en progreso
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Valor Pipeline</p>
                <p className="text-3xl font-bold text-green-900">
                  {formatCurrency(dashboardData?.opportunities?.stats?.pipelineValue || 0)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-2">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Potencial de ingresos
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Clientes Activos</p>
                <p className="text-3xl font-bold text-blue-900">
                  {dashboardData?.clients?.stats?.active || 0}
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-2">
                  <Building2 className="h-3 w-3 mr-1" />
                  Empresas registradas
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Prospectos Nuevos</p>
                <p className="text-3xl font-bold text-orange-900">
                  {dashboardData?.leads?.stats?.new || 0}
                </p>
                <p className="text-xs text-orange-600 flex items-center mt-2">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Este mes
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities Section */}
      <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-100 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">Pipeline de Oportunidades</CardTitle>
                <p className="text-purple-100 mt-1">Gestiona tu pipeline de ventas</p>
              </div>
            </div>
            <Link href="/opportunities" prefetch={true}>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                Ver Pipeline Completo
              </Button>
            </Link>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {dashboardData?.opportunities?.recent?.length === 0 ? (
            <div className="text-center py-8 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 border border-purple-100 rounded-xl">
              <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No hay oportunidades creadas aún</p>
              <Link href="/opportunities" prefetch={true}>
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Oportunidad
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(dashboardData?.opportunities?.recent || []).map((opportunity: any) => (
                <div 
                  key={opportunity.id} 
                  className="bg-gradient-to-r from-white to-purple-50/50 border border-purple-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  onClick={() => openQuickView(opportunity, 'opportunity')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{opportunity.title}</p>
                        <p className="text-purple-600 font-medium">
                          {opportunity.client?.name || 'Sin cliente'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Cierre: {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(opportunity.value)}
                      </p>
                      <Badge className="bg-purple-100 text-purple-800">
                        {opportunity.probability}% probabilidad
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
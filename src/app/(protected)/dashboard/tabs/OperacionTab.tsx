import { 
  Settings, 
  Calendar, 
  Users, 
  Bell,
  BarChart3,
  TrendingUp,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function OperacionTab() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Settings className="h-5 w-5" />
              Espacios de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Disponibles:</span>
                <span className="font-bold text-2xl text-blue-600">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ocupados:</span>
                <span className="font-bold text-2xl text-green-600">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tasa Ocupación:</span>
                <span className="font-bold text-lg text-purple-600">67%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Calendar className="h-5 w-5" />
              Reservas Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confirmadas:</span>
                <span className="font-bold text-2xl text-green-600">15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pendientes:</span>
                <span className="font-bold text-2xl text-orange-600">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Check-ins:</span>
                <span className="font-bold text-lg text-blue-600">12</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Users className="h-5 w-5" />
              Miembros Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Presentes:</span>
                <span className="font-bold text-2xl text-orange-600">25</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Membresías:</span>
                <span className="font-bold text-2xl text-purple-600">45</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nuevos:</span>
                <span className="font-bold text-lg text-green-600">5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Gestión Operativa</CardTitle>
          <p className="text-sm text-gray-600">Herramientas para administrar tu coworking</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              <div className="text-center">
                <Settings className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Configurar Espacios</div>
              </div>
            </Button>
            <Button className="h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
              <div className="text-center">
                <Calendar className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Gestionar Reservas</div>
              </div>
            </Button>
            <Button className="h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Administrar Miembros</div>
              </div>
            </Button>
            <Button className="h-16 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white">
              <div className="text-center">
                <Bell className="h-6 w-6 mx-auto mb-1" />
                <div className="text-sm">Notificaciones</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nueva reserva confirmada</p>
                <p className="text-xs text-gray-600">Sala de reuniones A - 14:00 a 16:00</p>
                <p className="text-xs text-gray-500">Hace 5 minutos</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Check-in de miembro</p>
                <p className="text-xs text-gray-600">María González - Escritorio 15</p>
                <p className="text-xs text-gray-500">Hace 12 minutos</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Mantenimiento programado</p>
                <p className="text-xs text-gray-600">Aire acondicionado - Área 2</p>
                <p className="text-xs text-gray-500">En 1 hora</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
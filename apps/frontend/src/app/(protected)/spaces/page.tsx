"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Building2, Users, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface Space {
  id: string;
  name: string;
  type: string;
  capacity: number;
  hourlyRate: number;
  dailyRate: number;
  description: string;
  amenities: string[];
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  images: string[];
}

const SpacesPage: React.FC = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const { toast } = useToast();

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/spaces');
      
      if (!response.ok) {
        throw new Error(`Failed to load spaces: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSpaces(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load spaces');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load spaces';
      setError(errorMessage);
      toast({
        title: "Error al cargar espacios",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpaceSelect = (space: Space) => {
    console.log("Selecting space:", space.name);
    // TODO: Navigate to space details page
  };

  const handleSpaceBook = (space: Space) => {
    console.log("Booking space:", space.name);
    // TODO: Implement booking flow
  };

  const handleSpaceFavorite = (spaceId: string) => {
    console.log("Toggling favorite for space:", spaceId);
    // TODO: Implement favorite functionality
  };

  const handleSpaceShare = (space: Space) => {
    console.log("Sharing space:", space.name);
    // TODO: Implement share functionality
  };

  if (loading) {
    return (
      <div className="h-full bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando espacios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-surface-secondary flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar espacios</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadSpaces} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-h1 font-semibold text-gray-900">Espacios</h1>
              <p className="text-body text-gray-600 mt-1">
                Descubre y reserva el espacio de trabajo perfecto para tus necesidades
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Calendario
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Reservar Espacio
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Espacios</p>
                  <p className="text-2xl font-semibold text-gray-900">{spaces.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Disponibles</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {spaces.filter(s => s.status === 'AVAILABLE').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Ocupados</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {spaces.filter(s => s.status === 'OCCUPIED').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Mantenimiento</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {spaces.filter(s => s.status === 'MAINTENANCE').length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {spaces.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay espacios disponibles</h3>
            <p className="text-gray-600">Aún no se han configurado espacios en este cowork.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {space.images && space.images.length > 0 ? (
                    <img 
                      src={space.images[0]} 
                      alt={space.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                    space.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                    space.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {space.status === 'AVAILABLE' ? 'Disponible' :
                     space.status === 'OCCUPIED' ? 'Ocupado' : 'Mantenimiento'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{space.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{space.type}</p>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{space.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      {space.capacity} personas
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${space.hourlyRate?.toLocaleString()}/hora
                      </p>
                      {space.dailyRate && (
                        <p className="text-xs text-gray-500">
                          ${space.dailyRate?.toLocaleString()}/día
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleSpaceSelect(space)}
                      className="flex-1"
                    >
                      Ver Detalles
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSpaceBook(space)}
                      disabled={space.status !== 'AVAILABLE'}
                    >
                      Reservar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpacesPage;
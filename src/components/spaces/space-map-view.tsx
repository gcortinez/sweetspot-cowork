'use client'

import { SpaceMap } from './space-map'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface Space {
  id: string
  name: string
  coordinates?: {
    lat: number
    lng: number
  } | null
  type: string
  capacity: number
  isActive: boolean
  floor?: string | null
  zone?: string | null
  hourlyRate?: number | null
}

interface SpaceMapViewProps {
  space: Space
  height?: string
}

export function SpaceMapView({ space, height = "300px" }: SpaceMapViewProps) {
  if (!space.coordinates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Ubicación
          </CardTitle>
          <CardDescription>
            No se han establecido coordenadas para este espacio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center bg-muted rounded-lg text-muted-foreground"
            style={{ height }}
          >
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay datos de ubicación disponibles</p>
              <p className="text-xs">Edita el espacio para agregar coordenadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Map
        </CardTitle>
        <CardDescription>
          Mapa interactivo que muestra la ubicación exacta de este espacio
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <SpaceMap
          spaces={[space]}
          center={space.coordinates}
          zoom={15}
          height={height}
          interactive={true}
        />
      </CardContent>
    </Card>
  )
}
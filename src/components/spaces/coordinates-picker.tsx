'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, RotateCcw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const useMapEvents = dynamic(
  () => import('react-leaflet').then((mod) => mod.useMapEvents),
  { ssr: false }
)

interface Coordinates {
  lat: number
  lng: number
}

interface CoordinatesPickerProps {
  value?: Coordinates | null
  onChange: (coordinates: Coordinates | null) => void
  defaultCenter?: Coordinates
  height?: string
}

function MapClickHandler({
  onLocationSelect
}: {
  onLocationSelect: (coords: Coordinates) => void
}) {
  useMapEvents({
    click: (e) => {
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      })
    },
  })
  return null
}

export function CoordinatesPicker({
  value,
  onChange,
  defaultCenter = { lat: -33.4489, lng: -70.6693 }, // Santiago, Chile
  height = '300px',
}: CoordinatesPickerProps) {
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState<any>(null)
  const [manualCoords, setManualCoords] = useState({
    lat: value?.lat?.toString() || '',
    lng: value?.lng?.toString() || '',
  })

  useEffect(() => {
    setIsClient(true)
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)

      // Fix for default markers
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })
    })
  }, [])

  useEffect(() => {
    setManualCoords({
      lat: value?.lat?.toString() || '',
      lng: value?.lng?.toString() || '',
    })
  }, [value])

  const handleLocationSelect = useCallback((coords: Coordinates) => {
    onChange(coords)
    setManualCoords({
      lat: coords.lat.toString(),
      lng: coords.lng.toString(),
    })
  }, [onChange])

  const handleManualCoordsChange = (field: 'lat' | 'lng', value: string) => {
    setManualCoords(prev => ({ ...prev, [field]: value }))
  }

  const handleManualCoordsSubmit = () => {
    const lat = parseFloat(manualCoords.lat)
    const lng = parseFloat(manualCoords.lng)

    if (isNaN(lat) || isNaN(lng)) {
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return
    }

    onChange({ lat, lng })
  }

  const handleClear = () => {
    onChange(null)
    setManualCoords({ lat: '', lng: '' })
  }

  const mapCenter = value || defaultCenter

  if (!isClient || !L) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Location
          </CardTitle>
          <CardDescription>
            Click on the map or enter coordinates manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[300px] rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Location
        </CardTitle>
        <CardDescription>
          Click on the map to set coordinates or enter them manually below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        <div style={{ height }} className="w-full rounded-lg overflow-hidden border">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onLocationSelect={handleLocationSelect} />

            {value && (
              <Marker position={[value.lat, value.lng]} />
            )}
          </MapContainer>
        </div>

        {/* Manual coordinate input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              placeholder="-33.4489"
              value={manualCoords.lat}
              onChange={(e) => handleManualCoordsChange('lat', e.target.value)}
              onBlur={handleManualCoordsSubmit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              type="number"
              step="any"
              placeholder="-70.6693"
              value={manualCoords.lng}
              onChange={(e) => handleManualCoordsChange('lng', e.target.value)}
              onBlur={handleManualCoordsSubmit}
            />
          </div>
        </div>

        {/* Current coordinates display and actions */}
        {value && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <span className="font-medium">Selected:</span>{' '}
              {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {!value && (
          <div className="text-center p-6 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click on the map to select a location</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
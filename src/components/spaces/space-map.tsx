'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
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
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

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

interface SpaceMapProps {
  spaces: Space[]
  selectedSpaceId?: string
  onSpaceSelect?: (spaceId: string) => void
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  interactive?: boolean
}

export function SpaceMap({
  spaces,
  selectedSpaceId,
  onSpaceSelect,
  center = { lat: -33.4489, lng: -70.6693 }, // Santiago, Chile default
  zoom = 13,
  height = '400px',
  interactive = true,
}: SpaceMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState<any>(null)

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

  if (!isClient || !L) {
    return (
      <div style={{ height }} className="w-full">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    )
  }

  const spacesWithCoordinates = spaces.filter(space => space.coordinates)

  // Custom icon for different space types
  const getSpaceIcon = (space: Space) => {
    if (!L) return undefined

    const color = space.isActive ? '#10b981' : '#ef4444' // green for active, red for inactive

    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 10.9 12.5 28.5 12.5 28.5s12.5-17.6 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
          <circle cx="12.5" cy="12.5" r="7.5" fill="white"/>
          <text x="12.5" y="17" text-anchor="middle" font-size="10" fill="${color}">${space.type.charAt(0).toUpperCase()}</text>
        </svg>
      `)}`,
      iconSize: [25, 41],
      iconAnchor: [12.5, 41],
      popupAnchor: [0, -41],
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Free'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        scrollWheelZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {spacesWithCoordinates.map((space) => (
          <Marker
            key={space.id}
            position={[space.coordinates!.lat, space.coordinates!.lng]}
            icon={getSpaceIcon(space)}
            eventHandlers={{
              click: () => {
                if (onSpaceSelect) {
                  onSpaceSelect(space.id)
                }
              },
            }}
          >
            <Popup>
              <div className="min-w-48 p-2">
                <h3 className="font-semibold text-sm mb-1">{space.name}</h3>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="capitalize">{space.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span>{space.capacity} people</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span>{formatCurrency(space.hourlyRate)}/hour</span>
                  </div>
                  {space.floor && (
                    <div className="flex justify-between">
                      <span>Floor:</span>
                      <span>{space.floor}</span>
                    </div>
                  )}
                  {space.zone && (
                    <div className="flex justify-between">
                      <span>Zone:</span>
                      <span>{space.zone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${space.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {space.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {onSpaceSelect && (
                  <button
                    onClick={() => onSpaceSelect(space.id)}
                    className="mt-2 w-full bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    View Details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
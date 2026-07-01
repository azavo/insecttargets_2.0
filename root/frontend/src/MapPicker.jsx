import { MapContainer, TileLayer, Marker, useMapEvents, useMap} from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'


const customIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
      fill="#cc244e" stroke="#b62249" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
})



delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

function RecenterMap({ lat, lon }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon])
  }, [lat, lon, map])
  return null
}

function InvalidateOnMount() {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
  }, [map])
  return null
}

function ClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapPicker({ lat, lon, onLocationChange }) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={7}
      style={{ height: '180px', width: '100%' }}
      maxBounds={[[35, -91], [48, -66]]}
      maxBoundsViscosity={1.0}
      minZoom={4}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[lat, lon]}
        draggable={true}
        icon={customIcon}
        eventHandlers={{
          dragend: (e) => {
            const newPos = e.target.getLatLng()
            onLocationChange(newPos.lat, newPos.lng)
          },
        }}
      />
      <ClickHandler onLocationChange={onLocationChange} />
      <InvalidateOnMount />
      <RecenterMap lat={lat} lon={lon} />
    </MapContainer>
  )
}


export default MapPicker
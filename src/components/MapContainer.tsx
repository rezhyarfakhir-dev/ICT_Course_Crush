import React from 'react'
import { MapContainer as LeafletMap, TileLayer, GeoJSON } from 'react-leaflet'
import { ClimateData } from '../App'
import governoratesData from '../data/governorates.json'
import { FeatureCollection, Feature, Geometry } from 'geojson'

interface MapContainerProps {
  onSelectGovernorate: (data: ClimateData | null) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({ onSelectGovernorate }) => {
  const mapCenter: [number, number] = [35.5, 44.5] // Center of KRI

  const getColor = (risk: number) => {
    return risk > 80 ? '#800026' :
           risk > 70 ? '#BD0026' :
           risk > 60 ? '#E31A1C' :
           risk > 50 ? '#FC4E2A' :
           risk > 40 ? '#FD8D3C' :
           risk > 30 ? '#FEB24C' :
           risk > 20 ? '#FED976' :
                       '#FFEDA0'
  }

  const style = (feature: any) => {
    return {
      fillColor: getColor(feature.properties.droughtRisk),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    }
  }

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        const l = e.target
        l.setStyle({
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.9
        })
        l.bringToFront()
      },
      mouseout: (e: any) => {
        const l = e.target
        l.setStyle(style(feature))
      },
      click: () => {
        onSelectGovernorate({
          governorate: feature.properties.name,
          droughtRisk: feature.properties.droughtRisk,
          tempIncrease: feature.properties.tempIncrease,
          desertification: feature.properties.desertification,
          description: feature.properties.description
        })
      }
    })
  }

  return (
    <div className="map-wrapper">
      <LeafletMap center={mapCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON 
          data={governoratesData as FeatureCollection<Geometry, any>} 
          style={style} 
          onEachFeature={onEachFeature}
        />
      </LeafletMap>
      <div className="legend">
        <h4>Drought Risk Level</h4>
        <div className="legend-item"><div className="legend-color" style={{backgroundColor: '#800026'}}></div> Critical (&gt;80%)</div>
        <div className="legend-item"><div className="legend-color" style={{backgroundColor: '#FC4E2A'}}></div> High (50-80%)</div>
        <div className="legend-item"><div className="legend-color" style={{backgroundColor: '#FD8D3C'}}></div> Moderate (30-50%)</div>
        <div className="legend-item"><div className="legend-color" style={{backgroundColor: '#FFEDA0'}}></div> Low (&lt;30%)</div>
      </div>
    </div>
  )
}

export default MapContainer

import React, { useState } from 'react'
import MapContainer from './components/MapContainer'
import InfoPanel from './components/InfoPanel'
import './styles/App.css'

export interface ClimateData {
  governorate: string;
  droughtRisk: number; // 0-100
  tempIncrease: number; // degrees Celsius
  desertification: number; // 0-100
  description: string;
}

function App() {
  const [selectedGov, setSelectedGov] = useState<ClimateData | null>(null)

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Climate Change Impact: Kurdish Region of Iraq</h1>
      </header>
      <main className="content">
        <MapContainer onSelectGovernorate={setSelectedGov} />
        <InfoPanel data={selectedGov} />
      </main>
    </div>
  )
}

export default App

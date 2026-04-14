import React from 'react'
import { ClimateData } from '../App'

interface InfoPanelProps {
  data: ClimateData | null;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ data }) => {
  if (!data) {
    return (
      <aside className="info-panel">
        <h2>Region Details</h2>
        <p>Click on a governorate to view specific climate change impact data.</p>
        <div className="summary-card">
          <p>The Kurdish Region of Iraq (KRI) is highly vulnerable to climate change, experiencing rapid temperature increases, decreased rainfall, and expanding desertification.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="info-panel">
      <h2>{data.governorate}</h2>
      <p className="description">{data.description}</p>
      
      <div className="climate-stat drought">
        <span className="stat-label">Drought Risk: {data.droughtRisk}%</span>
        <div className="stat-bar-bg">
          <div className="stat-bar-fill" style={{ width: `${data.droughtRisk}%` }}></div>
        </div>
      </div>

      <div className="climate-stat temp">
        <span className="stat-label">Temp Increase: +{data.tempIncrease}°C</span>
        <div className="stat-bar-bg">
          <div className="stat-bar-fill" style={{ width: `${(data.tempIncrease / 5) * 100}%` }}></div>
        </div>
      </div>

      <div className="climate-stat desert">
        <span className="stat-label">Desertification: {data.desertification}%</span>
        <div className="stat-bar-bg">
          <div className="stat-bar-fill" style={{ width: `${data.desertification}%` }}></div>
        </div>
      </div>

      <div className="key-findings">
        <h3>Climate Vulnerability</h3>
        <ul>
          <li>Water resource depletion</li>
          <li>Loss of biodiversity</li>
          <li>Impact on rain-fed agriculture</li>
          <li>Increased frequency of dust storms</li>
        </ul>
      </div>
    </aside>
  )
}

export default InfoPanel

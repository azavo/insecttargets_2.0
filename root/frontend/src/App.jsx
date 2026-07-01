import { useState, useEffect } from 'react'
import MapPicker from './MapPicker'
import './App.css'

function ResultCard({ prediction }) {
  return (
    <li>
      <div className="species-info">
        <span className="common-name">{prediction.rank}. {prediction.common_name}</span>
        <span className="scientific-name">{prediction.species}</span>
      </div>
      <span className="probability">{(prediction.probability * 100).toFixed(1)}%</span>
    </li>
  )
}

function PredictionForm({ datetimeStr, setDatetimeStr, inatusername, setInatUsername,
                           unseen, setUnseen, onSubmit }) {
  return (
    <div className="form-panel">
      <label className="panel-label">
        <span>DATE<span className="required">*</span></span>
        <input
          type="datetime-local"
          value={datetimeStr}
          onChange={(e) => setDatetimeStr(e.target.value)}
        />
      </label>

      <label className="panel-label">
        INAT USER
        <input
          type="text"
          value={inatusername}
          onChange={(e) => setInatUsername(e.target.value)}
        />
      </label>

      <label className="panel-label unseen-label">
        UNSEEN
        <input
          type="checkbox"
          checked={unseen}
          onChange={(e) => setUnseen(e.target.checked)}
        />
      </label>

      <button className="submit-button" onClick={onSubmit}>
        DEPLOY
      </button>
    </div>
  )
}

function App() {
  const [lat, setLat] = useState(42.28)
  const [lon, setLon] = useState(-83.72)
  const [datetimeStr, setDatetimeStr] = useState('')
  const [inatusername, setInatUsername] = useState('')
  const [unseen, setUnseen] = useState(false)
  const [order, setOrder] = useState('')
  const mode = unseen ? "unseen" : "all"

  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLon(position.coords.longitude)
      },
      () => {}
    )
  }, [])

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      lat,
      lon,
      datetime_str: datetimeStr,
      inat_username: inatusername,
      mode,
      order,
    })

    try {
      const response = await fetch(`http://127.0.0.1:8000/predict?${params}`)
      if (!response.ok) throw new Error(`Server responded with ${response.status}`)
      const data = await response.json()
      setPredictions(data.predictions)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        <div className="header">
          <h1 className="title">BUG<span className="secondhalfoftitle">FINDER</span></h1>
          <img src="../../public/icon2.png" alt="" className="header-icon" />
        </div>

        <div className="layout">

          <div className="location-panel">
            <span className="panel-label">LOCATION <span className="required">*</span></span>
            <div className="map-wrapper">
              <MapPicker
                lat={lat}
                lon={lon}
                onLocationChange={(newLat, newLon) => {
                  setLat(newLat)
                  setLon(newLon)
                }}
              />
            </div>
            <div className="latlon-display">
              <label>lat: <input type="number" value={lat} onChange={(e) => setLat(e.target.value)} /></label>
              <label>lon: <input type="number" value={lon} onChange={(e) => setLon(e.target.value)} /></label>
            </div>
          </div>

          <PredictionForm
            datetimeStr={datetimeStr} setDatetimeStr={setDatetimeStr}
            inatusername={inatusername} setInatUsername={setInatUsername}
            unseen={unseen} setUnseen={setUnseen}
            onSubmit={handleSubmit}
          />
          <div className="results-column">
            <div className="results-meta">
              <span className="results-title">TOP <span>20↓</span></span>
              <label className="panel-label">
                SORT BY ORDER: <span> </span>
                <input className="order-input" type="text" value={order} onChange={(e) => setOrder(e.target.value)} />
              </label>
            </div>
            <div className="results-panel">
              
              {loading && <p><span className="standby">PLEASE STAND BY...</span></p>}
              {error && <p>Error: {error}</p>}

              {predictions && (
                <ol className="results-list">
                  {predictions.map((p) => (
                    <ResultCard key={p.species} prediction={p} />
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
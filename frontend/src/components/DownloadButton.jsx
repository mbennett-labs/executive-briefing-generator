import { useState } from 'react'
import api from '../services/api'

function DownloadButton({ assessmentId, label = 'Download Executive Briefing', className = '' }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setIsDownloading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(api.getReportDownloadUrl(assessmentId), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Executive-Briefing-${assessmentId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Failed to download. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="download-button-container">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`btn btn-primary ${className}`}
      >
        {isDownloading ? (
          <>
            <span className="btn-spinner"></span>
            Downloading...
          </>
        ) : (
          label
        )}
      </button>
      {error && (
        <div className="alert alert-error" style={{ marginTop: '8px' }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default DownloadButton

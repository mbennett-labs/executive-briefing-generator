import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'

// Risk level interpretation text
const RISK_INTERPRETATIONS = {
  LOW: "Your organization has a relatively low quantum risk exposure. While quantum threats are still years away, your current security posture provides a solid foundation. We recommend beginning planning within the next 12-18 months to stay ahead of the curve.",
  MODERATE: "Your organization has moderate quantum risk exposure. Some vulnerabilities exist that should be addressed. We recommend starting your quantum migration planning within the next 6 months to ensure adequate preparation time.",
  HIGH: "Your organization faces significant quantum risk exposure. Multiple vulnerability areas require attention. We strongly recommend beginning migration planning immediately to protect your sensitive data before quantum threats materialize.",
  CRITICAL: "Your organization has critical quantum risk exposure. Urgent action is required to address serious vulnerabilities. Your data retention policies and security posture put you at elevated risk. Immediate intervention is recommended.",
  SEVERE: "Your organization faces severe quantum risk exposure requiring emergency response. Multiple high-risk factors compound your vulnerability. We recommend engaging security consultants immediately to begin remediation."
}

// Color mapping for risk levels
const RISK_COLORS = {
  LOW: '#28a745',
  MODERATE: '#ffc107',
  HIGH: '#fd7e14',
  CRITICAL: '#dc3545',
  SEVERE: '#721c24'
}

function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const { assessment, scoring } = location.state || {}

  const [isGenerating, setIsGenerating] = useState(false)
  const [isEmailing, setIsEmailing] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // If no assessment data, redirect to dashboard
  if (!assessment || !scoring) {
    navigate('/dashboard')
    return null
  }

  const riskColor = RISK_COLORS[scoring.riskLevel] || '#666'
  const interpretation = RISK_INTERPRETATIONS[scoring.riskLevel] || ''

  // Calculate gauge rotation (0-180 degrees for 0-100 score)
  const gaugeRotation = (scoring.totalScore / 100) * 180

  const handleDownloadReport = async () => {
    setIsGenerating(true)
    setMessage({ type: '', text: '' })

    try {
      // Generate the report first
      await api.generateReport(assessment.id)

      // Then trigger download
      const downloadUrl = api.getReportDownloadUrl(assessment.id)
      const token = localStorage.getItem('token')

      // Create a temporary link to trigger download with auth
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Quantum-Risk-Report-${assessment.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage({ type: 'success', text: 'Report downloaded successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to generate report. Please try again.' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEmailReport = async () => {
    setIsEmailing(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await api.emailReport(assessment.id)
      setMessage({
        type: 'success',
        text: `Report sent to ${result.email}! Check your inbox.`
      })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.data?.error || 'Failed to send email. Please try again.'
      })
    } finally {
      setIsEmailing(false)
    }
  }

  return (
    <div className="page-container">
      <div className="results-card">
        <h1 className="results-title">Your Quantum Risk Assessment</h1>

        {/* Score Gauge */}
        <div className="score-section">
          <div className="gauge-container">
            <div className="gauge">
              <div className="gauge-body">
                <div
                  className="gauge-fill"
                  style={{
                    transform: `rotate(${gaugeRotation}deg)`,
                    backgroundColor: riskColor
                  }}
                />
                <div className="gauge-cover">
                  <span className="score-value" style={{ color: riskColor }}>
                    {scoring.totalScore}
                  </span>
                  <span className="score-label">Risk Score</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="risk-level-badge"
            style={{ backgroundColor: riskColor }}
          >
            {scoring.riskLevel} RISK
          </div>

          <p className="urgency-text">{scoring.urgency}</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Interpretation */}
        <div className="interpretation-section">
          <h2>What This Means</h2>
          <p>{interpretation}</p>
        </div>

        {/* Top 3 Vulnerability Areas */}
        <div className="vulnerabilities-section">
          <h2>Top Vulnerability Areas</h2>
          <div className="vulnerability-list">
            {scoring.weakestAreas.map((area, index) => (
              <div key={area.questionId} className="vulnerability-item">
                <div className="vulnerability-rank">#{index + 1}</div>
                <div className="vulnerability-content">
                  <div className="vulnerability-category">
                    {area.question?.category?.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="vulnerability-question">
                    {area.question?.text}
                  </div>
                  <div className="vulnerability-score">
                    Score: {area.score}/10
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="results-actions">
          <button
            onClick={handleDownloadReport}
            disabled={isGenerating || isEmailing}
            className="btn btn-primary"
          >
            {isGenerating ? (
              <>
                <span className="btn-spinner"></span>
                Generating...
              </>
            ) : (
              'Download PDF Report'
            )}
          </button>
          <button
            onClick={handleEmailReport}
            disabled={isEmailing || isGenerating}
            className="btn btn-secondary"
          >
            {isEmailing ? (
              <>
                <span className="btn-spinner"></span>
                Sending...
              </>
            ) : (
              'Email Report'
            )}
          </button>
          <button
            onClick={() => navigate('/assessment')}
            className="btn btn-outline"
          >
            New Assessment
          </button>
        </div>
      </div>
    </div>
  )
}

export default Results

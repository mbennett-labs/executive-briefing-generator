import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import DownloadButton from '../components/DownloadButton'

// Risk level configuration matching backend scoring.js
const RISK_LEVELS = {
  Critical: { color: '#dc3545', description: 'Urgent action required. Your organization faces critical vulnerabilities requiring immediate attention.' },
  High: { color: '#fd7e14', description: 'Significant vulnerabilities exist. We strongly recommend beginning migration planning immediately.' },
  Moderate: { color: '#ffc107', description: 'Some vulnerabilities require attention. Begin quantum migration planning within the next 6 months.' },
  Low: { color: '#28a745', description: 'Good security posture with minor improvements possible. Continue monitoring and planning.' },
  Prepared: { color: '#17a2b8', description: 'Excellent quantum readiness. Your organization is well-positioned for the post-quantum era.' }
}

// Category display names
const CATEGORY_NAMES = {
  data_sensitivity: 'Data Sensitivity',
  encryption: 'Encryption',
  compliance: 'Compliance',
  vendor_risk: 'Vendor Risk',
  incident_response: 'Incident Response',
  quantum_readiness: 'Quantum Readiness'
}

function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const { assessmentId } = useParams()

  const [assessment, setAssessment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Report generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportId, setReportId] = useState(null)
  const [reportError, setReportError] = useState('')

  // Email state
  const [isEmailing, setIsEmailing] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState('')

  // Get scores from navigation state if available
  const stateScores = location.state?.scores

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!assessmentId) {
        navigate('/dashboard')
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const data = await api.getAssessment(assessmentId)
        setAssessment(data)
      } catch (err) {
        if (err.status === 401) {
          navigate('/login')
        } else if (err.status === 404) {
          setError('Assessment not found.')
        } else {
          setError('Failed to load assessment. Please try again.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    // If we have scores from state, we can use them directly
    if (stateScores) {
      setAssessment({
        id: assessmentId,
        scores: stateScores
      })
      setIsLoading(false)
    } else {
      fetchAssessment()
    }
  }, [assessmentId, stateScores, navigate])

  if (isLoading) {
    return (
      <div className="page-container page-centered">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container page-centered">
        <div className="error-card">
          <div className="alert alert-error">{error}</div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!assessment?.scores) {
    navigate('/dashboard')
    return null
  }

  const { scores } = assessment
  const overallScore = scores.overall_score || scores.overallScore || 0
  const categoryScores = scores.category_scores || scores.categoryScores || {}
  const riskLevel = scores.risk_level || scores.riskLevel || 'Moderate'
  const percentile = scores.percentile || 50

  const riskConfig = RISK_LEVELS[riskLevel] || RISK_LEVELS.Moderate

  // Calculate gauge rotation (0-180 degrees for 0-100 score)
  const gaugeRotation = (overallScore / 100) * 180

  // Get category score with risk level
  const getCategoryRiskLevel = (score) => {
    if (score <= 30) return 'Critical'
    if (score <= 50) return 'High'
    if (score <= 70) return 'Moderate'
    if (score <= 85) return 'Low'
    return 'Prepared'
  }

  // Handle report generation
  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setReportError('')

    try {
      console.log('[Report Generation] Starting request for assessment:', assessmentId)
      const result = await api.generateReport(assessmentId)
      console.log('[Report Generation] Response received:', JSON.stringify(result, null, 2))
      console.log('[Report Generation] Response success:', result.success)
      console.log('[Report Generation] Response reportId:', result.reportId || result.id)

      // First check if backend indicates success
      if (result.success === true) {
        const newReportId = result.id || result.reportId
        if (newReportId) {
          console.log('[Report Generation] Success! Report ID:', newReportId)
          setReportId(newReportId)
        } else {
          console.error('[Report Generation] Success but no report ID in response:', result)
          setReportError('Report generated but no ID returned. Please try again.')
        }
      } else if (result.success === false) {
        // Backend explicitly returned success: false
        console.error('[Report Generation] Backend returned success=false:', result)
        setReportError(result.error || result.message || 'Report generation failed. Please try again.')
      } else {
        // Fallback: check for report ID even if success flag is missing
        const newReportId = result.id || result.reportId
        if (newReportId) {
          console.log('[Report Generation] No success flag but found reportId:', newReportId)
          setReportId(newReportId)
        } else {
          console.error('[Report Generation] Unexpected response format:', result)
          setReportError('Unexpected response from server. Please try again.')
        }
      }
    } catch (err) {
      console.error('[Report Generation] Error:', err)
      console.error('[Report Generation] Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      })

      if (err.status === 401) {
        navigate('/login')
      } else {
        const errorMessage = err.data?.error || err.message || 'Failed to generate report. Please try again.'
        setReportError(errorMessage)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle email report
  const handleEmailReport = async () => {
    setIsEmailing(true)
    setReportError('')
    setEmailSuccess('')

    try {
      const result = await api.emailReport(assessmentId)
      setEmailSuccess(`Report sent to ${result.email}! Check your inbox.`)
    } catch (err) {
      if (err.status === 401) {
        navigate('/login')
      } else {
        setReportError(err.data?.error || 'Failed to send email. Please try again.')
      }
    } finally {
      setIsEmailing(false)
    }
  }

  return (
    <div className="page-container">
      <div className="results-container">
        <h1 className="results-title">Your Quantum Risk Assessment Results</h1>

        {/* Score Gauge Section */}
        <div className="score-section">
          <div className="gauge-container">
            <div className="gauge">
              <div className="gauge-body">
                <div
                  className="gauge-fill"
                  style={{
                    transform: `rotate(${gaugeRotation}deg)`,
                    backgroundColor: riskConfig.color
                  }}
                />
                <div className="gauge-cover">
                  <span className="score-value" style={{ color: riskConfig.color }}>
                    {Math.round(overallScore)}
                  </span>
                  <span className="score-label">Overall Score</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="risk-level-badge"
            style={{ backgroundColor: riskConfig.color }}
          >
            {riskLevel} Risk
          </div>

          {/* Industry Percentile */}
          <div className="percentile-section">
            <div className="percentile-badge">
              <span className="percentile-value">{percentile}th</span>
              <span className="percentile-label">Percentile</span>
            </div>
            <p className="percentile-text">
              Your organization scores better than {percentile}% of healthcare organizations in our benchmark.
            </p>
          </div>
        </div>

        {/* Risk Interpretation */}
        <div className="interpretation-section">
          <h2>What This Means</h2>
          <p>{riskConfig.description}</p>
        </div>

        {/* Category Scores */}
        <div className="category-scores-section">
          <h2>Category Breakdown</h2>
          <div className="category-scores-grid">
            {Object.entries(CATEGORY_NAMES).map(([key, name]) => {
              const score = categoryScores[key] || 0
              const categoryRisk = getCategoryRiskLevel(score)
              const categoryColor = RISK_LEVELS[categoryRisk]?.color || '#666'

              return (
                <div key={key} className="category-score-card">
                  <div className="category-score-header">
                    <h3>{name}</h3>
                    <span
                      className="category-risk-badge"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {categoryRisk}
                    </span>
                  </div>
                  <div className="category-score-bar">
                    <div
                      className="category-score-fill"
                      style={{
                        width: `${score}%`,
                        backgroundColor: categoryColor
                      }}
                    />
                  </div>
                  <div className="category-score-value">
                    <span style={{ color: categoryColor }}>{Math.round(score)}</span>
                    <span className="category-score-max">/ 100</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Report Generation Section */}
        <div className="report-generation-section">
          <h2>Get Your Executive Briefing</h2>
          <p className="report-description">
            Generate a personalized executive briefing with detailed recommendations,
            remediation roadmap, and compliance analysis.
          </p>

          {reportError && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              {reportError}
            </div>
          )}

          {isGenerating ? (
            <div className="generating-state">
              <div className="spinner"></div>
              <p>Generating your personalized briefing...</p>
              <p className="generating-note">This may take up to 60 seconds</p>
            </div>
          ) : reportId ? (
            <div className="report-ready">
              <div className="report-ready-icon">&#10003;</div>
              <p>Your executive briefing is ready!</p>

              {emailSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                  {emailSuccess}
                </div>
              )}

              <div className="report-actions">
                <DownloadButton
                  assessmentId={assessmentId}
                  label="Download PDF"
                  className="btn-large"
                />
                <button
                  onClick={handleEmailReport}
                  disabled={isEmailing}
                  className="btn btn-secondary btn-large"
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
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateReport}
              className="btn btn-primary btn-large"
            >
              Generate Executive Briefing
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="results-actions">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            Back to Dashboard
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

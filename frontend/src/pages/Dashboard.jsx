import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

// Color mapping for risk levels (matching backend scoring.js)
const RISK_COLORS = {
  Critical: '#dc3545',
  High: '#fd7e14',
  Moderate: '#ffc107',
  Low: '#28a745',
  Prepared: '#17a2b8',
  // Legacy uppercase support
  LOW: '#28a745',
  MODERATE: '#ffc107',
  HIGH: '#fd7e14',
  CRITICAL: '#dc3545',
  SEVERE: '#721c24'
}

function Dashboard() {
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getAssessments()
      setAssessments(data.assessments || [])
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      } else {
        setError('Failed to load assessments. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleViewAssessment = (assessmentId) => {
    navigate(`/results/${assessmentId}`)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Manage your quantum risk assessments</p>
      </div>

      <div className="dashboard-content">
        {/* Action Card */}
        <div className="dashboard-card action-card">
          <h2>Quantum Risk Assessment</h2>
          <p>
            Evaluate your organization's quantum computing risk exposure and receive
            a personalized executive briefing with recommendations.
          </p>
          <button
            onClick={() => navigate('/assessment')}
            className="btn btn-primary btn-large"
          >
            Start New Assessment
          </button>
        </div>

        {/* Assessment History */}
        <div className="dashboard-card">
          <h2>Assessment History</h2>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading assessments...</p>
            </div>
          ) : assessments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>You haven't completed any assessments yet.</p>
              <p>Start your first assessment to evaluate your quantum risk exposure.</p>
            </div>
          ) : (
            <div className="assessment-list">
              {assessments.map((assessment) => {
                const score = assessment.overall_score || assessment.risk_score || 0
                const riskLevel = assessment.risk_level || 'Moderate'
                const orgName = assessment.organization_name || 'Assessment'

                return (
                  <div
                    key={assessment.id}
                    className="assessment-item"
                    onClick={() => handleViewAssessment(assessment.id)}
                  >
                    <div className="assessment-main">
                      <div className="assessment-org-name">{orgName}</div>
                      <div className="assessment-date">
                        {formatDate(assessment.created_at)}
                      </div>
                    </div>
                    <div className="assessment-info">
                      <div className="assessment-score">
                        <span className="score-number">{Math.round(score)}</span>
                        <span className="score-label">Score</span>
                      </div>
                      <div
                        className="assessment-level"
                        style={{ backgroundColor: RISK_COLORS[riskLevel] || '#666' }}
                      >
                        {riskLevel}
                      </div>
                    </div>
                    <div className="assessment-arrow">→</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

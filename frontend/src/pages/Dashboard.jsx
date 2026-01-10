import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

// Color mapping for risk levels
const RISK_COLORS = {
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

  const handleViewAssessment = async (assessmentId) => {
    try {
      setLoading(true)
      const data = await api.getAssessment(assessmentId)
      navigate('/results', { state: data })
    } catch (err) {
      setError('Failed to load assessment details. Please try again.')
      setLoading(false)
    }
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
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="assessment-item"
                  onClick={() => handleViewAssessment(assessment.id)}
                >
                  <div className="assessment-date">
                    {formatDate(assessment.created_at)}
                  </div>
                  <div className="assessment-info">
                    <div className="assessment-score">
                      <span className="score-number">{assessment.risk_score}</span>
                      <span className="score-label">Risk Score</span>
                    </div>
                    <div
                      className="assessment-level"
                      style={{ backgroundColor: RISK_COLORS[assessment.risk_level] }}
                    >
                      {assessment.risk_level}
                    </div>
                  </div>
                  <div className="assessment-arrow">→</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

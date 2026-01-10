import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function Assessment() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const data = await api.getQuestions()
      setQuestions(data.questions)
      const initialResponses = {}
      data.questions.forEach(q => {
        initialResponses[q.id] = q.type === 'multiselect' ? [] : ''
      })
      setResponses(initialResponses)
    } catch (err) {
      setError('Failed to load questions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const currentQuestion = questions[currentStep]
  const totalQuestions = questions.length
  const progress = ((currentStep + 1) / totalQuestions) * 100

  const handleDropdownChange = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }))
  }

  const handleCheckboxChange = (questionId, value, checked) => {
    setResponses(prev => {
      const current = prev[questionId] || []
      if (checked) {
        return { ...prev, [questionId]: [...current, value] }
      } else {
        return { ...prev, [questionId]: current.filter(v => v !== value) }
      }
    })
  }

  const isCurrentQuestionAnswered = () => {
    if (!currentQuestion) return false
    const response = responses[currentQuestion.id]
    if (currentQuestion.type === 'multiselect') {
      return Array.isArray(response) && response.length > 0
    }
    return response !== ''
  }

  const areAllQuestionsAnswered = () => {
    return questions.every(q => {
      const response = responses[q.id]
      if (q.type === 'multiselect') {
        return Array.isArray(response) && response.length > 0
      }
      return response !== ''
    })
  }

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!areAllQuestionsAnswered()) {
      setError('Please answer all questions before submitting.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await api.submitAssessment(responses)
      navigate('/results', { state: { assessment: result.assessment, scoring: result.scoring } })
    } catch (err) {
      if (err.status === 401) {
        navigate('/login')
      } else {
        setError(err.data?.error || 'Failed to submit assessment. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="page-container page-centered">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (error && questions.length === 0) {
    return (
      <div className="page-container page-centered">
        <div className="error-card">
          <div className="alert alert-error">{error}</div>
          <button onClick={fetchQuestions} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container page-centered">
      <div className="assessment-card">
        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">
            Question {currentStep + 1} of {totalQuestions}
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="question-section">
            <h2 className="question-text">{currentQuestion.text}</h2>

            {/* Dropdown for single-select */}
            {currentQuestion.type === 'dropdown' && (
              <div className="form-group">
                <select
                  value={responses[currentQuestion.id] || ''}
                  onChange={(e) => handleDropdownChange(currentQuestion.id, e.target.value)}
                  className="question-select"
                >
                  <option value="">Select an option...</option>
                  {currentQuestion.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Checkboxes for multi-select */}
            {currentQuestion.type === 'multiselect' && (
              <div className="checkbox-group">
                {currentQuestion.options.map(option => (
                  <label key={option.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(responses[currentQuestion.id] || []).includes(option.value)}
                      onChange={(e) => handleCheckboxChange(currentQuestion.id, option.value, e.target.checked)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-error" style={{ marginTop: '20px' }}>
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="navigation-buttons">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="btn btn-secondary"
          >
            Previous
          </button>

          {currentStep < totalQuestions - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered()}
              className="btn btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!areAllQuestionsAnswered() || isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner"></span>
                  Submitting...
                </>
              ) : (
                'Submit Assessment'
              )}
            </button>
          )}
        </div>

        {/* Question Dots Navigation */}
        <div className="question-dots">
          {questions.map((q, index) => {
            const isAnswered = q.type === 'multiselect'
              ? (responses[q.id] || []).length > 0
              : responses[q.id] !== ''
            return (
              <button
                key={q.id}
                onClick={() => setCurrentStep(index)}
                className={`dot ${index === currentStep ? 'active' : ''} ${isAnswered ? 'answered' : ''}`}
                title={`Question ${index + 1}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Assessment

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import OrganizationProfileForm from '../components/OrganizationProfileForm'
import CategoryNav from '../components/CategoryNav'
import QuestionCard from '../components/QuestionCard'

function Assessment() {
  const navigate = useNavigate()
  const [step, setStep] = useState('profile') // 'profile' | 'questions'
  const [orgProfile, setOrgProfile] = useState(null)
  const [categories, setCategories] = useState([])
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [responses, setResponses] = useState({})
  const [completedCategories, setCompletedCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Try to restore from localStorage
    const savedProfile = localStorage.getItem('assessment_profile')
    const savedResponses = localStorage.getItem('assessment_responses')
    const savedCategory = localStorage.getItem('assessment_category')

    if (savedProfile) {
      setOrgProfile(JSON.parse(savedProfile))
      setStep('questions')
      fetchQuestions()
    }
    if (savedResponses) {
      setResponses(JSON.parse(savedResponses))
    }
    if (savedCategory) {
      setCurrentCategoryIndex(parseInt(savedCategory, 10))
    }
  }, [])

  const fetchQuestions = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await api.getQuestions()
      setCategories(data.categories || [])
    } catch (err) {
      setError('Failed to load questions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileSubmit = (profile) => {
    setOrgProfile(profile)
    localStorage.setItem('assessment_profile', JSON.stringify(profile))
    setStep('questions')
    fetchQuestions()
  }

  const handleResponseChange = (questionId, value) => {
    const newResponses = { ...responses, [questionId]: value }
    setResponses(newResponses)
    localStorage.setItem('assessment_responses', JSON.stringify(newResponses))
  }

  const currentCategory = categories[currentCategoryIndex]
  const currentQuestions = currentCategory?.questions || []

  const isCategoryComplete = (category) => {
    if (!category?.questions) return false
    return category.questions.every(q => {
      const response = responses[q.id]
      if (q.answer_type === 'multi-select') {
        return Array.isArray(response) && response.length > 0
      }
      return response !== undefined && response !== null && response !== ''
    })
  }

  const handleNextCategory = () => {
    if (isCategoryComplete(currentCategory)) {
      const categoryKey = currentCategory.key
      if (!completedCategories.includes(categoryKey)) {
        setCompletedCategories([...completedCategories, categoryKey])
      }

      if (currentCategoryIndex < categories.length - 1) {
        const nextIndex = currentCategoryIndex + 1
        setCurrentCategoryIndex(nextIndex)
        localStorage.setItem('assessment_category', nextIndex.toString())
      }
    }
  }

  const handlePreviousCategory = () => {
    if (currentCategoryIndex > 0) {
      const prevIndex = currentCategoryIndex - 1
      setCurrentCategoryIndex(prevIndex)
      localStorage.setItem('assessment_category', prevIndex.toString())
    }
  }

  const handleCategoryClick = (categoryKey) => {
    const index = categories.findIndex(c => c.key === categoryKey)
    if (index !== -1) {
      setCurrentCategoryIndex(index)
      localStorage.setItem('assessment_category', index.toString())
    }
  }

  const areAllQuestionsAnswered = () => {
    return categories.every(cat => isCategoryComplete(cat))
  }

  const handleSubmit = async () => {
    if (!areAllQuestionsAnswered()) {
      setError('Please answer all questions before submitting.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await api.submitAssessment({
        organization_name: orgProfile.organization_name,
        organization_type: orgProfile.organization_type,
        employee_count: orgProfile.employee_count,
        responses
      })

      // Clear localStorage on successful submission
      localStorage.removeItem('assessment_profile')
      localStorage.removeItem('assessment_responses')
      localStorage.removeItem('assessment_category')

      navigate(`/results/${result.id}`, { state: { scores: result.scores } })
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

  // Profile step
  if (step === 'profile') {
    return (
      <div className="page-container page-centered">
        <div className="assessment-card profile-card">
          <OrganizationProfileForm
            onSubmit={handleProfileSubmit}
            initialValues={orgProfile || {}}
          />
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="page-container page-centered">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading assessment questions...</p>
        </div>
      </div>
    )
  }

  // Error state with no categories
  if (error && categories.length === 0) {
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

  const isLastCategory = currentCategoryIndex === categories.length - 1
  const canProceed = isCategoryComplete(currentCategory)

  return (
    <div className="page-container">
      <div className="assessment-container">
        {/* Category Navigation */}
        <CategoryNav
          categories={categories}
          currentCategory={currentCategory?.key}
          completedCategories={completedCategories}
          onCategoryClick={handleCategoryClick}
        />

        {/* Questions Section */}
        <div className="questions-section">
          <div className="category-header">
            <h2>{currentCategory?.name}</h2>
            <span className="question-count">
              {currentQuestions.length} questions
            </span>
          </div>

          <div className="questions-list">
            {currentQuestions.map(question => (
              <QuestionCard
                key={question.id}
                question={question}
                response={responses[question.id]}
                onChange={(value) => handleResponseChange(question.id, value)}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error" style={{ marginTop: '20px' }}>
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="navigation-buttons">
            <button
              onClick={handlePreviousCategory}
              disabled={currentCategoryIndex === 0}
              className="btn btn-secondary"
            >
              Previous Category
            </button>

            {!isLastCategory ? (
              <button
                onClick={handleNextCategory}
                disabled={!canProceed}
                className="btn btn-primary"
              >
                Next Category
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!areAllQuestionsAnswered() || isSubmitting}
                className="btn btn-primary btn-submit"
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
        </div>
      </div>
    </div>
  )
}

export default Assessment

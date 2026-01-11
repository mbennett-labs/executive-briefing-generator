function QuestionCard({ question, response, onChange }) {
  const handleMultiSelectChange = (option, checked) => {
    const currentSelections = Array.isArray(response) ? response : []
    if (checked) {
      onChange([...currentSelections, option])
    } else {
      onChange(currentSelections.filter(item => item !== option))
    }
  }

  const handleRangeChange = (option) => {
    onChange(option)
  }

  const handleYesNoChange = (option) => {
    onChange(option)
  }

  const renderInput = () => {
    const options = typeof question.answer_options === 'string'
      ? JSON.parse(question.answer_options)
      : question.answer_options

    switch (question.answer_type) {
      case 'multi-select':
        return (
          <div className="checkbox-group">
            {options.map((option, index) => {
              const isChecked = Array.isArray(response) && response.includes(option)
              return (
                <label key={index} className={`checkbox-label ${isChecked ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleMultiSelectChange(option, e.target.checked)}
                  />
                  <span className="checkbox-text">{option}</span>
                </label>
              )
            })}
          </div>
        )

      case 'range':
        return (
          <div className="radio-group">
            {options.map((option, index) => {
              const isSelected = response === option
              return (
                <label key={index} className={`radio-label ${isSelected ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => handleRangeChange(option)}
                  />
                  <span className="radio-text">{option}</span>
                </label>
              )
            })}
          </div>
        )

      case 'yes-no':
        return (
          <div className="radio-group yes-no-group">
            {options.map((option, index) => {
              const isSelected = response === option
              return (
                <label key={index} className={`radio-label yes-no-label ${isSelected ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={isSelected}
                    onChange={() => handleYesNoChange(option)}
                  />
                  <span className="radio-text">{option}</span>
                </label>
              )
            })}
          </div>
        )

      default:
        return <p>Unknown question type</p>
    }
  }

  const isAnswered = () => {
    if (question.answer_type === 'multi-select') {
      return Array.isArray(response) && response.length > 0
    }
    return response !== undefined && response !== null && response !== ''
  }

  return (
    <div className={`question-card ${isAnswered() ? 'answered' : ''}`}>
      <div className="question-header">
        <span className="question-number">Q{question.order_index || question.id}</span>
        {isAnswered() && <span className="answered-badge">Answered</span>}
      </div>
      <h3 className="question-text">{question.question_text}</h3>
      <div className="question-input">
        {renderInput()}
      </div>
    </div>
  )
}

export default QuestionCard

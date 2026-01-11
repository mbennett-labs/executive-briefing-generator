const CATEGORY_LABELS = {
  data_sensitivity: 'Data Sensitivity',
  encryption: 'Encryption',
  compliance: 'Compliance',
  vendor_risk: 'Vendor Risk',
  incident_response: 'Incident Response',
  quantum_readiness: 'Quantum Readiness'
}

function CategoryNav({ categories, currentCategory, completedCategories, onCategoryClick }) {
  return (
    <nav className="category-nav">
      <div className="category-tabs">
        {categories.map((category, index) => {
          const isActive = category.key === currentCategory
          const isCompleted = completedCategories.includes(category.key)
          const canClick = isCompleted || index === 0 || completedCategories.includes(categories[index - 1]?.key)

          return (
            <button
              key={category.key}
              onClick={() => canClick && onCategoryClick(category.key)}
              className={`category-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              disabled={!canClick}
              title={CATEGORY_LABELS[category.key] || category.name}
            >
              <span className="category-number">{index + 1}</span>
              <span className="category-name">{category.name}</span>
              {isCompleted && <span className="checkmark">&#10003;</span>}
            </button>
          )
        })}
      </div>
      <div className="category-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(completedCategories.length / categories.length) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {completedCategories.length} of {categories.length} categories completed
        </span>
      </div>
    </nav>
  )
}

export default CategoryNav

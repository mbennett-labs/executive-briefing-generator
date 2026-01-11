import { useState } from 'react'

const ORG_TYPES = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'research', label: 'Research' },
  { value: 'other', label: 'Other' }
]

const EMPLOYEE_COUNTS = [
  { value: '1-50', label: '1-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1,000 employees' },
  { value: '1001-5000', label: '1,001-5,000 employees' },
  { value: '5001+', label: '5,001+ employees' }
]

function OrganizationProfileForm({ onSubmit, initialValues = {} }) {
  const [formData, setFormData] = useState({
    organization_name: initialValues.organization_name || '',
    organization_type: initialValues.organization_type || '',
    employee_count: initialValues.employee_count || ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Organization name is required'
    }
    if (!formData.organization_type) {
      newErrors.organization_type = 'Organization type is required'
    }
    if (!formData.employee_count) {
      newErrors.employee_count = 'Employee count is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="org-profile-form">
      <h2>Organization Profile</h2>
      <p className="form-description">
        Please provide information about your organization to personalize your assessment.
      </p>

      <div className="form-group">
        <label htmlFor="organization_name">Organization Name *</label>
        <input
          type="text"
          id="organization_name"
          name="organization_name"
          value={formData.organization_name}
          onChange={handleChange}
          placeholder="Enter your organization name"
          className={errors.organization_name ? 'input-error' : ''}
        />
        {errors.organization_name && (
          <span className="error-message">{errors.organization_name}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="organization_type">Organization Type *</label>
        <select
          id="organization_type"
          name="organization_type"
          value={formData.organization_type}
          onChange={handleChange}
          className={errors.organization_type ? 'input-error' : ''}
        >
          <option value="">Select organization type...</option>
          {ORG_TYPES.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.organization_type && (
          <span className="error-message">{errors.organization_type}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="employee_count">Number of Employees *</label>
        <select
          id="employee_count"
          name="employee_count"
          value={formData.employee_count}
          onChange={handleChange}
          className={errors.employee_count ? 'input-error' : ''}
        >
          <option value="">Select employee count...</option>
          {EMPLOYEE_COUNTS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.employee_count && (
          <span className="error-message">{errors.employee_count}</span>
        )}
      </div>

      <button type="submit" className="btn btn-primary btn-full">
        Continue to Assessment
      </button>
    </form>
  )
}

export default OrganizationProfileForm

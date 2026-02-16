import { useState, useEffect } from 'react'
import './Profile.css'

function Profile({ onLogout }) {
  const profileFields = [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'age', label: 'Age', type: 'number', required: true, min: 18, max: 120 },
    { key: 'gender', label: 'Gender', type: 'select', required: false, options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
    { key: 'bio', label: 'Bio', type: 'textarea', required: false, placeholder: 'Tell us about yourself...' },
    { key: 'looking_for', label: 'Looking For', type: 'text', required: false, placeholder: 'What are you looking for?' },
    { key: 'latitude', label: 'Latitude', type: 'number', required: false, placeholder: 'e.g., 40.7128' },
    { key: 'longitude', label: 'Longitude', type: 'number', required: false, placeholder: 'e.g., -74.0060' },
  ]

  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    gender: '',
    bio: '',
    looking_for: '',
    latitude: '',
    longitude: '',
  })
  const [profileImage, setProfileImage] = useState(null)
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [profileId, setProfileId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load profile data from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Failed to load profile')
        const profile = data.profile
        if (profile) {
          setProfileId(profile.id)
          setProfileData({
            name: profile.name || '',
            age: profile.age || '',
            gender: profile.gender || '',
            bio: profile.bio || '',
            looking_for: profile.looking_for || '',
            latitude: profile.latitude || '',
            longitude: profile.longitude || '',
          })
          // Fetch profile image
          if (profile.id) {
            try {
              const imgRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/${profile.id}/image`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
              if (imgRes.ok) {
                const blob = await imgRes.blob()
                setProfileImageUrl(URL.createObjectURL(blob))
              }
            } catch { /* no image */ }
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = async () => {
    if (!profileData.name || !profileData.age) {
      alert('Please fill in all required fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const method = profileId ? 'PUT' : 'POST'
      const url = profileId
        ? `${import.meta.env.VITE_BACKEND_URL}/profiles/${profileId}`
        : `${import.meta.env.VITE_BACKEND_URL}/profiles`

      // Build body, including image as base64 if selected
      const bodyData = { ...profileData }
      if (profileImage) {
        const arrayBuffer = await profileImage.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        bytes.forEach(b => binary += String.fromCharCode(b))
        bodyData.profile_image = btoa(binary)
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save profile')
      setProfileId(data.profile.id)
      setProfileData({
        name: data.profile.name || '',
        age: data.profile.age || '',
        gender: data.profile.gender || '',
        bio: data.profile.bio || '',
        looking_for: data.profile.looking_for || '',
        latitude: data.profile.latitude || '',
        longitude: data.profile.longitude || '',
      })
      // Refresh image
      if (data.profile.id) {
        try {
          const imgRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/${data.profile.id}/image`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (imgRes.ok) {
            const blob = await imgRes.blob()
            setProfileImageUrl(URL.createObjectURL(blob))
          }
        } catch { /* ignore */ }
      }
      setIsEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setLoading(true)
    setError('')
    fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/me`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        const profile = data.profile
        if (profile) {
          setProfileId(profile.id)
          setProfileData({
            name: profile.name || '',
            age: profile.age || '',
            gender: profile.gender || '',
            bio: profile.bio || '',
            looking_for: profile.looking_for || '',
            latitude: profile.latitude || '',
            longitude: profile.longitude || '',
          })
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  // Compute profile completion
  const getCompletion = () => {
    const fields = ['name', 'age', 'gender', 'bio', 'looking_for']
    const hasImage = !!profileImageUrl
    const filled = fields.filter(f => profileData[f]).length + (hasImage ? 1 : 0)
    return Math.round((filled / (fields.length + 1)) * 100)
  }

  const genderMap = {
    'm': 'Male', 'f': 'Female', 'male': 'Male', 'female': 'Female',
    'non-binary': 'Non-binary', 'prefer not to say': 'Prefer not to say',
    'M': 'Male', 'F': 'Female',
  }

  const displayGender = (g) => genderMap[g] || (g ? g.charAt(0).toUpperCase() + g.slice(1) : '')

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="loading-spinner" />
          <span className="loading-text">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <p className="error-message">{error}</p>
        </div>
      </div>
    )
  }

  const completion = getCompletion()

  return (
    <div className="profile-container">
      {!isEditing ? (
        /* ============ VIEW MODE ============ */
        <div className="profile-view">
          {/* Hero / Avatar */}
          <div className="profile-hero">
            <div className="profile-avatar-ring">
              <div className="profile-avatar-inner">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt={profileData.name} className="profile-main-image" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-identity">
              <h1 className="profile-name-display">
                {profileData.name || 'Your Name'}
                {profileData.age && <span className="age-badge">{profileData.age}</span>}
              </h1>

              <div className="profile-meta-row">
                {profileData.gender && (
                  <span className="profile-meta-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    {displayGender(profileData.gender)}
                  </span>
                )}
                {(profileData.latitude && profileData.longitude) && (
                  <span className="profile-meta-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {`${parseFloat(profileData.latitude).toFixed(1)}°, ${parseFloat(profileData.longitude).toFixed(1)}°`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Completion */}
          {completion < 100 && (
            <div className="profile-completion">
              <div className="completion-bar-track">
                <div className="completion-bar-fill" style={{ width: `${completion}%` }} />
              </div>
              <span className="completion-label">{completion}% complete</span>
            </div>
          )}

          {/* Info Cards */}
          <div className="profile-cards">
            {profileData.bio ? (
              <div className="profile-info-card">
                <div className="info-card-label">About</div>
                <p className="info-card-value">{profileData.bio}</p>
              </div>
            ) : (
              <div className="profile-info-card" onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
                <div className="info-card-label">About</div>
                <p className="info-card-empty">Tap to add a bio ✍️</p>
              </div>
            )}

            {profileData.looking_for ? (
              <div className="profile-info-card">
                <div className="info-card-label">Looking For</div>
                <p className="info-card-value">{profileData.looking_for}</p>
              </div>
            ) : (
              <div className="profile-info-card" onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
                <div className="info-card-label">Looking For</div>
                <p className="info-card-empty">Tap to add preferences 💫</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="profile-actions-bar">
            <button className="profile-action-btn edit-btn" onClick={() => setIsEditing(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </button>
            <button className="profile-action-btn logout-btn" onClick={onLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      ) : (
        /* ============ EDIT MODE ============ */
        <div className="profile-edit">
          <div className="profile-edit-header">
            <h1>Edit Profile</h1>
            <button className="close-btn" onClick={handleCancel}>✕</button>
          </div>

          <div className="profile-edit-scroll">
            <form className="profile-form">
              {profileFields.map((field) => (
                <div key={field.key} className="form-group">
                  <label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.key}
                      name={field.key}
                      placeholder={field.placeholder}
                      value={profileData[field.key]}
                      onChange={handleInputChange}
                      className="form-input textarea"
                      rows="3"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={field.key}
                      name={field.key}
                      value={profileData[field.key]}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options && field.options.map((option) => (
                        <option key={option} value={option.toLowerCase()}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={field.key}
                      type={field.type}
                      name={field.key}
                      placeholder={field.placeholder}
                      value={profileData[field.key]}
                      onChange={handleInputChange}
                      className="form-input"
                      min={field.min}
                      max={field.max}
                      step={field.type === 'number' ? '0.0001' : undefined}
                    />
                  )}
                </div>
              ))}

              {/* Image upload */}
              <div className="form-group">
                <label>Profile Photo</label>
                <div className="image-upload-area">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>{profileImage ? profileImage.name : 'Click to upload a photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setProfileImage(e.target.files[0])}
                  />
                </div>
              </div>
            </form>

            {profileImage && (
              <div className="profile-image-preview">
                <img src={URL.createObjectURL(profileImage)} alt="Preview" />
              </div>
            )}
          </div>

          <div className="profile-edit-actions">
            <button type="button" className="profile-action-btn secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className="profile-action-btn primary" onClick={handleSaveProfile}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile

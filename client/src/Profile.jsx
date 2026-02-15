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
    // profile_image field removed for blob upload
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
          // Try to fetch image blob if available
          // if (profile.id) {
          //   fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/${profile.id}`, {
          //     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          //   })
          //     .then(res => res.ok ? res.blob() : null)
          //     .then(blob => {
          //       if (blob) setProfileImageUrl(URL.createObjectURL(blob))
          //       else setProfileImageUrl('')
          //     })
          // }
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
      // Save profile data (except image)
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
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
      // If image file selected, upload it
      if (profileImage) {
        const imgForm = new FormData()
        imgForm.append('image', profileImage)
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/${data.profile.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: imgForm
        })
      }
      // Refresh image preview
      if (data.profile.id) {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/${data.profile.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.ok ? res.blob() : null)
          .then(blob => {
            if (blob) setProfileImageUrl(URL.createObjectURL(blob))
            else setProfileImageUrl('')
          })
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
    // Re-fetch profile
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
            profile_image: profile.profile_image || '',
          })
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  if (loading) {
    return <div className="profile-container"><div className="profile-card"><p>Loading...</p></div></div>
  }
  if (error) {
    return <div className="profile-container"><div className="profile-card"><p className="error-message">{error}</p></div></div>
  }

  return (
    <div className="profile-container">
      {!isEditing ? (
        // View Mode
        <div className="profile-view">
          <div className="profile-image-section">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={profileData.name} className="profile-main-image" />
            ) : (
              <div className="profile-image-placeholder">No Image</div>
            )}
          </div>
          <div className="profile-info-section">
            <div className="profile-header-info">
              <h1 className="profile-name">
                {profileData.name} <span className="profile-age">{profileData.age}</span>
              </h1>
              {profileData.gender && (
                <p className="profile-gender">{profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1)}</p>
              )}
            </div>
            {(profileData.latitude || profileData.longitude) && (
              <div className="profile-location">
                <span className="location-icon">📍</span>
                <span>{profileData.latitude && profileData.longitude ? `${parseFloat(profileData.latitude).toFixed(2)}, ${parseFloat(profileData.longitude).toFixed(2)}` : 'Location unknown'}</span>
              </div>
            )}
            {profileData.bio && (
              <div className="profile-bio">
                <p>{profileData.bio}</p>
              </div>
            )}
            {profileData.looking_for && (
              <div className="profile-looking-for">
                <label>Looking for:</label>
                <p>{profileData.looking_for}</p>
              </div>
            )}
            <div className="profile-actions">
              <button 
                className="profile-button edit-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
              <button onClick={onLogout} className="profile-button logout-btn">
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className="profile-edit">
          <div className="profile-edit-header">
            <h1>Edit Profile</h1>
            <button 
              className="close-btn"
              onClick={handleCancel}
            >
              ✕
            </button>
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
              <div className="form-group">
                <label htmlFor="profile_image">Profile Image (Upload)</label>
                <input
                  id="profile_image"
                  type="file"
                  accept="image/*"
                  onChange={e => setProfileImage(e.target.files[0])}
                  className="form-input"
                />
              </div>
            </form>
            {profileImage && (
              <div className="profile-image-preview">
                <img src={URL.createObjectURL(profileImage)} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 12 }} />
              </div>
            )}
          </div>
          <div className="profile-edit-actions">
            <button
              type="button"
              className="profile-button secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="profile-button primary"
              onClick={handleSaveProfile}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile

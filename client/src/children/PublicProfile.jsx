import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import "./modules/functional/ProfilePage/Profile.css"

function PublicProfile() {
  const { id } = useParams()

  const [profile, setProfile] = useState(null)
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError("")

      try {
        const token = localStorage.getItem("token")

        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/profiles/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || "Profile not found")

        setProfile(data.profile)

        // Fetch image separately
        try {
          const imgRes = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/profiles/${id}/image`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          if (imgRes.ok) {
            const blob = await imgRes.blob()
            setImageUrl(URL.createObjectURL(blob))
          }
        } catch {
          // image optional
        }

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [id])

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

  if (!profile) return null

  return (
    <div className="profile-container">
      <div className="profile-view">

        {/* Hero */}
        <div className="profile-hero">
          <div className="profile-avatar-ring">
            <div className="profile-avatar-inner">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={profile.name}
                  className="profile-main-image"
                />
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
              {profile.name}
              {profile.age && (
                <span className="age-badge">{profile.age}</span>
              )}
            </h1>

            <div className="profile-meta-row">
              {profile.gender && (
                <span className="profile-meta-chip">
                  {profile.gender}
                </span>
              )}

              {(profile.latitude && profile.longitude) && (
                <span className="profile-meta-chip">
                  {`${parseFloat(profile.latitude).toFixed(1)}°, ${parseFloat(profile.longitude).toFixed(1)}°`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="profile-cards">
          {profile.bio && (
            <div className="profile-info-card">
              <div className="info-card-label">About</div>
              <p className="info-card-value">{profile.bio}</p>
            </div>
          )}

          {profile.looking_for && (
            <div className="profile-info-card">
              <div className="info-card-label">Looking For</div>
              <p className="info-card-value">{profile.looking_for}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PublicProfile

import { useState, useEffect } from 'react'
import './Home.css'

function Home() {
  const [profiles, setProfiles] = useState([])
  const [swipeHistory, setSwipeHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    fetchCurrentUserId()
  }, [])

  const fetchCurrentUserId = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to get current user profile')
      const data = await res.json()
      setCurrentUserId(data.profile.user_id)
      fetchProfiles(data.profile.user_id)
    } catch (err) {
      setError('Could not load your profile')
      setLoading(false)
    }
  }

  const fetchProfiles = async (userId = currentUserId) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch profiles feed')
      const data = await response.json()
      // Filter out own profile by user_id
      const filtered = (data.profiles || []).filter(p => p.user_id !== userId)
      setProfiles(filtered)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch and cache blob URLs for profile images
  const [imageUrls, setImageUrls] = useState({})

  useEffect(() => {
    // Fetch images for all profiles in the deck
    const fetchImages = async () => {
      const token = localStorage.getItem('token')
      const newUrls = {}
      for (const p of profiles.slice(0, 3)) { // Only fetch for first 3 for perf
        if (p.id && !imageUrls[p.id]) {
          try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/${p.id}/image`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
              const blob = await res.blob()
              newUrls[p.id] = URL.createObjectURL(blob)
            } else {
              newUrls[p.id] = ''
            }
          } catch {
            newUrls[p.id] = ''
          }
        }
      }
      if (Object.keys(newUrls).length > 0) {
        setImageUrls(prev => ({ ...prev, ...newUrls }))
      }
    }
    if (profiles.length > 0) fetchImages()
    // eslint-disable-next-line
  }, [profiles])

  const sendSwipe = async (swipeeId, direction) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/swipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          swipee_id: swipeeId,
          direction
        })
      })

      if (!response.ok) throw new Error('Failed to send swipe')
      return await response.json()
    } catch (err) {
      console.error('Error sending swipe:', err)
    }
  }

  const handleSwipe = async (direction) => {
    if (profiles.length === 0) return

    const currentProfile = profiles[0]
    
    // Save to history for undo
    setSwipeHistory([...swipeHistory, { profile: currentProfile, direction }])
    
    // Send swipe to backend
    await sendSwipe(currentProfile.id, direction)
    
    // Remove current profile and show next
    setProfiles(profiles.slice(1))
  }

  const handleUndo = () => {
    if (swipeHistory.length === 0) return

    const lastSwipe = swipeHistory[swipeHistory.length - 1]
    const newHistory = swipeHistory.slice(0, -1)
    
    setSwipeHistory(newHistory)
    setProfiles([lastSwipe.profile, ...profiles])
  }

  const handlePass = () => handleSwipe('L')
  const handleLike = () => handleSwipe('R')
  const handleSuperlike = () => handleSwipe('R') // Could be different direction in future
  const handleBoost = () => {
    // Boost functionality - could refresh profiles or prioritize
    console.log('Boost clicked')
  }

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">
          <p>Loading profiles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={() => fetchProfiles()}>Retry</button>
        </div>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="home-container">
        <div className="no-profiles">
          <h2>No more profiles</h2>
          <p>Come back later for more matches!</p>
          <button onClick={() => fetchProfiles()}>Refresh</button>
        </div>
      </div>
    )
  }

  const currentProfile = profiles[0]
  
  // Parse interests from bio or use placeholder
  const interests = currentProfile.looking_for ? currentProfile.looking_for.split(',').map(i => i.trim()).slice(0, 5) : []

  return (
    <div className="home-container">
      <div className="swipe-container">
        <div className="profile-card">
          {imageUrls[currentProfile.id] ? (
            <img src={imageUrls[currentProfile.id]} alt={currentProfile.name} className="card-image" />
          ) : (
            <div className="card-image card-image-placeholder">No Image</div>
          )}
          <div className="card-overlay"></div>
          {interests.length > 0 && (
            <div className="interests-tags">
              {interests.map((interest, idx) => (
                <span key={idx} className="tag">{interest}</span>
              ))}
            </div>
          )}
          <div className="card-info">
            <div className="profile-header">
              <h2>{currentProfile.name} <span className="age">{currentProfile.age}</span></h2>
              <span className="verified">✓</span>
            </div>
            {currentProfile.bio && <p className="bio">{currentProfile.bio}</p>}
            {currentProfile.gender && <p className="gender">{currentProfile.gender}</p>}
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="action-btn undo-btn" 
          onClick={handleUndo} 
          title="Undo"
          disabled={swipeHistory.length === 0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6M21 17v-6h-6M7 7a8 8 0 0 0-8 8" />
          </svg>
        </button>

        <button 
          className="action-btn pass-btn" 
          onClick={handlePass} 
          title="Pass"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button 
          className="action-btn superlike-btn" 
          onClick={handleSuperlike} 
          title="Superlike"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>

        <button 
          className="action-btn like-btn" 
          onClick={handleLike} 
          title="Like"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <button 
          className="action-btn boost-btn" 
          onClick={handleBoost} 
          title="Boost"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Home

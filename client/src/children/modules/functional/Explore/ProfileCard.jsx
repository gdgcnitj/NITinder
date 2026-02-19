import { useNavigate } from "react-router-dom"

export default function ProfileCard({imageUrls, profile}) {
    const navigate = useNavigate()
    const goToProfile = (e) => {
      if (e.target.closest(".explore-card-btn")) return
      navigate(`/profiles/${profile.id}`)
    }
    return (
        <div className="explore-profile-card" onClick={goToProfile}>
              <div className="explore-card-image-wrap">
                {imageUrls[profile.id] ? (
                  <img
                    src={imageUrls[profile.id]}
                    alt={profile.name}
                    className="explore-card-image"
                  />
                ) : (
                  <div className="explore-card-image-placeholder">
                    <span>No Image</span>
                  </div>
                )}
                <div className="explore-card-overlay" />
              </div>

              <div className="explore-card-content">
                <div className="explore-card-header">
                  <h3 className="explore-card-name">{profile.name}</h3>
                  <span className="explore-card-age">{profile.age} yrs</span>
                </div>

                <p className="explore-card-gender">{profile.gender}</p>

                <p className="explore-card-bio">
                  {profile.bio || "No bio provided"}
                </p>

                <button 
                  className="explore-card-btn" 
                  onClick={(e) => { e.stopPropagation(); navigate(`/profiles/${profile.id}`) }}
                >
                  View Profile
                </button>
              </div>
            </div>
    )
}
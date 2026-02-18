import { useNavigate } from "react-router-dom"

export default function ProfileCard({imageUrls, profile}) {
    const navigate = useNavigate()
    return (
        <div className="match-card" style={{width: "300px"}}>
              
              {imageUrls[profile.id] ? (
                <img
                  src={imageUrls[profile.id]}
                  alt={profile.name}
                  style={{
                    width: "100%",
                    height: "250px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "250px",
                    background: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                  }}
                >
                  No Image
                </div>
              )}

              <div className="match-profile">
                <div className="profile-header">
                  <h3 className="profile-name">{profile.name}</h3>
                  <p className="profile-age">
                    {profile.age} years old
                  </p>
                </div>

                <div className="profile-details">
                  <p className="detail-item">
                    <span className="label">Gender:</span>
                    <span className="value">{profile.gender}</span>
                  </p>
                </div>

                <div className="profile-bio">
                  <p className="label">Bio</p>
                  <p className="bio-text">
                    {profile.bio || "No bio provided"}
                  </p>
                </div>

                <div className="profile-actions">
                  <button className="btn-view" onClick={()=>{navigate(`/profiles/${profile.id}`)}}>
                    View Profile
                  </button>
                </div>
              </div>
            </div>
    )
}
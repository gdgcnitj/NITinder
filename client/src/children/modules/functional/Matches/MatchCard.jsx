export default function MatchCard({
  match,
  otherUser,
  createOrOpenConversation,
}) {
  return (
    <div className="match-card">
      <div className="match-profile">
        <div className="profile-header">
          <h3 className="profile-name">{otherUser.name}</h3>
          <p className="profile-age">{otherUser.age} years old</p>
        </div>

        <div className="profile-details">
          <p className="detail-item">
            <span className="label">Gender:</span>
            <span className="value">{otherUser.gender}</span>
          </p>
          <p className="detail-item">
            <span className="label">Email:</span>
            <span className="value">{otherUser.email}</span>
          </p>
        </div>

        <div className="profile-bio">
          <p className="label">Bio</p>
          <p className="bio-text">{otherUser.bio || "No bio provided"}</p>
        </div>

        <div className="profile-actions">
          <button
            className="btn-message"
            onClick={() =>
              createOrOpenConversation(match.id, otherUser.id, otherUser.name)
            }
          >
            Send Message
          </button>
          <button className="btn-view">View Profile</button>
        </div>
      </div>
    </div>
  );
}

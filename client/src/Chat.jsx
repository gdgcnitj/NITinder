import { useEffect, useState } from "react";
import "./Chat.css";

function Chat() {
  const [self, setSelf] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSelf() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/profiles/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch self");
        const data = await res.json();
        setSelf(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching self:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSelf();
  }, []);

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/matches`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch matches");
        const data = await res.json();
        setMatches(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  const getOtherUser = (match) => {
    // Get current user ID directly from localStorage
    if(!self) return null;
    let currentUserId = self.profile.user_id;

    if (!currentUserId) return null;

    if (match.user1.id === currentUserId) {
      return match.user2;
    } else if (match.user2.id === currentUserId) {
      return match.user1;
    }

    return null;
  };

  return (
    <div className="chat-page">
      <h2>Your Matches</h2>
      {loading && <p className="loading">Loading matches...</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && matches.length === 0 && (
        <p className="no-matches">No matches found yet.</p>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="matches-container">
          {matches.map((match) => {
            const otherUser = getOtherUser(match);

            if (!otherUser) return null;

            return (
              <div key={match.id} className="match-card">
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
                    <p className="bio-text">
                      {otherUser.bio || "No bio provided"}
                    </p>
                  </div>

                  <div className="profile-actions">
                    <button className="btn-message">Send Message</button>
                    <button className="btn-view">View Profile</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Chat;

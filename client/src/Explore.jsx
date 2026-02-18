import { useEffect, useState } from "react";
import "./Chat.css";

export default function Explore() {
  const [self, setSelf] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSelf();
  }, []);

  const fetchSelf = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/profiles/me`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch self");

      const data = await res.json();
      setSelf(data.profile);

      // Fetch profiles after self is known
      fetchProfiles(data.profile.user_id);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching self:", err);
      setLoading(false);
    }
  };

  const fetchProfiles = async (userId) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/profiles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok)
        throw new Error("Failed to fetch profiles");

      const data = await response.json();

      const filtered = (data.profiles || []).filter(
        (p) => p.user_id !== userId
      );

      setProfiles(filtered);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <h2>Explore Profiles</h2>

      {loading && <p className="loading">Loading profiles...</p>}

      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && profiles.length === 0 && (
        <p className="no-matches">No profiles found.</p>
      )}

      {!loading && !error && profiles.length > 0 && (
        <div className="matches-container">
          {profiles.map((profile) => (
            <div key={profile.id} className="match-card">
              <div className="match-profile">
                <div className="profile-header">
                  <h3 className="profile-name">
                    {profile.name}
                  </h3>
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
                  <button className="btn-view">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
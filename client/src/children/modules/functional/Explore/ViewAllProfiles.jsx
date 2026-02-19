import { useEffect, useState } from "react";
import "./Chat.css";

// eslint-disable-next-line no-unused-vars
export default function ViewAllProfiles({ ProfileCard }) {
  // eslint-disable-next-line no-unused-vars
  const [self, setSelf] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSelf();
  }, []);

  useEffect(() => {
    if (profiles.length > 0) {
      fetchImages();
    }
    // eslint-disable-next-line
  }, [profiles]);

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
        },
      );

      if (!res.ok) throw new Error("Failed to fetch self");

      const data = await res.json();
      setSelf(data.profile);

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
        },
      );

      if (!response.ok) throw new Error("Failed to fetch profiles");

      const data = await response.json();

      const filtered = (data.profiles || []).filter(
        (p) => p.user_id !== userId,
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

  const fetchImages = async () => {
    const token = localStorage.getItem("token");
    const newUrls = {};

    for (const profile of profiles) {
      if (!imageUrls[profile.id]) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/profiles/${profile.id}/image`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (res.ok) {
            const blob = await res.blob();
            newUrls[profile.id] = URL.createObjectURL(blob);
          } else {
            newUrls[profile.id] = "";
          }
        } catch {
          newUrls[profile.id] = "";
        }
      }
    }

    if (Object.keys(newUrls).length > 0) {
      setImageUrls((prev) => ({ ...prev, ...newUrls }));
    }
  };

  return (
    <>
      {loading && <p className="loading">Loading profiles...</p>}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && profiles.length === 0 && (
        <p className="no-matches">No profiles found.</p>
      )}

      {!loading && !error && profiles.length > 0 && (
        <div className="explore-grid">
          {profiles.map((profile) =>
            ProfileCard ? (
              <ProfileCard
                key={profile.id}
                imageUrls={imageUrls}
                profile={profile}
              />
            ) : (
              <div
                style={{
                  width: "80%",
                  color: "#e0e0e0",
                  textWrap: "wrap",
                  wordBreak: "break-word",
                }}
              >
                {JSON.stringify(profile)}
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}

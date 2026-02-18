import { useEffect, useState } from "react";
import "./Chat.css";

function Chat() {
  const [self, setSelf] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);
  const [dateSuggestions, setDateSuggestions] = useState([]);
  const [loadingDateSuggestions, setLoadingDateSuggestions] = useState(false);
  const [dateSuggestionsError, setDateSuggestionsError] = useState(null);

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

  useEffect(() => {
    async function fetchConversations() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/conversations`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        setConversations(data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    }

    fetchConversations();
  }, []);

  const fetchConversationMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/conversations/${conversationId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data.messages || []);
      setSelectedConversation(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching messages:", err);
    }
  };

  const createOrOpenConversation = async (matchId, otherUserId, otherUserName) => {
    try {
      const token = localStorage.getItem("token");

      // Check if conversation already exists
      const existingConv = conversations.find((c) => c.match_id === matchId);

      if (existingConv) {
        await fetchConversationMessages(existingConv.id);
      } else {
        // Create new conversation
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ match_id: matchId }),
        });

        if (!res.ok) throw new Error("Failed to create conversation");
        const data = await res.json();

        const newConversation = {
          id: data.conversation.id,
          match_id: matchId,
          other_user_id: otherUserId,
          other_user_name: otherUserName,
          last_message: null,
          last_message_at: null,
          created_at: data.conversation.created_at,
        };

        setConversations([...conversations, newConversation]);
        setSelectedConversation({
          id: data.conversation.id,
          match_id: matchId,
          other_user_id: otherUserId,
          created_at: data.conversation.created_at,
        });
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error creating/opening conversation:", err);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/conversations/${selectedConversation.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: messageInput }),
        }
      );

      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();

      setMessages([
        ...messages,
        {
          id: data.data.id,
          sender_id: data.data.sender_id,
          sender_name: data.data.sender_name,
          content: data.data.content,
          created_at: data.data.created_at,
        },
      ]);
      setMessageInput("");
    } catch (err) {
      setError(err.message);
      console.error("Error sending message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const fetchDateSuggestions = async () => {
    if (!selectedConversation) return;

    setLoadingDateSuggestions(true);
    setDateSuggestionsError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/date-suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          match_id: selectedConversation.match_id,
          suggestion_count: 5,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch date suggestions");
      const data = await res.json();
      setDateSuggestions(data.suggestions || []);
      setShowDateSuggestions(true);
    } catch (err) {
      setDateSuggestionsError(err.message);
      console.error("Error fetching date suggestions:", err);
    } finally {
      setLoadingDateSuggestions(false);
    }
  };

  const handleBackToMatches = () => {
    setSelectedConversation(null);
    setMessages([]);
    setMessageInput("");
    setShowDateSuggestions(false);
    setDateSuggestions([]);
  };

  const getOtherUser = (match) => {
    // Get current user ID directly from localStorage
    if (!self) return null;
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
      {!selectedConversation ? (
        <>
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
                        <button
                          className="btn-message"
                          onClick={() =>
                            createOrOpenConversation(
                              match.id,
                              otherUser.id,
                              otherUser.name
                            )
                          }
                        >
                          Send Message
                        </button>
                        <button className="btn-view">View Profile</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="chat-view">
          <div className="chat-header">
            <button className="btn-back" onClick={handleBackToMatches}>
              ← Back to Matches
            </button>
            <h2>{selectedConversation.other_user_id ? "Chat" : "New Chat"}</h2>
            <button
              className="btn-date-suggestions"
              onClick={fetchDateSuggestions}
              disabled={loadingDateSuggestions}
            >
              {loadingDateSuggestions ? "Loading..." : "💡 Suggest Date Ideas"}
            </button>
          </div>

          {showDateSuggestions && (
            <div className="date-suggestions-modal">
              <div className="date-suggestions-header">
                <h3>Date Ideas for You Two</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowDateSuggestions(false)}
                >
                  ✕
                </button>
              </div>

              {dateSuggestionsError && (
                <p className="error-message">{dateSuggestionsError}</p>
              )}

              {dateSuggestions.length > 0 ? (
                <div className="suggestions-list">
                  {dateSuggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-card">
                      <div className="suggestion-title">{suggestion.title}</div>
                      <div className="suggestion-body">
                        <p className="suggestion-plan">
                          <strong>Plan:</strong> {suggestion.plan}
                        </p>
                        <p className="suggestion-fit">
                          <strong>Why it fits:</strong> {suggestion.why_it_fits}
                        </p>
                        <div className="suggestion-details">
                          <span className="detail">
                            📍 {suggestion.location_hint}
                          </span>
                          <span className="detail">
                            💰 {suggestion.estimated_cost}
                          </span>
                          <span className="detail">
                            🕐 {suggestion.ideal_time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-suggestions">No suggestions generated yet.</p>
              )}
            </div>
          )}

          <div className="messages-container">
            {messages.length === 0 ? (
              <p className="no-messages">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${
                    msg.sender_id === self?.profile?.user_id ? "sent" : "received"
                  }`}
                >
                  <p className="message-sender">{msg.sender_name}</p>
                  <p className="message-content">{msg.content}</p>
                  <p className="message-time">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="message-input-container">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !sendingMessage) {
                  sendMessage();
                }
              }}
              placeholder="Type your message..."
              className="message-input"
              disabled={sendingMessage}
            />
            <button
              onClick={sendMessage}
              className="btn-send"
              disabled={sendingMessage || !messageInput.trim()}
            >
              {sendingMessage ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;

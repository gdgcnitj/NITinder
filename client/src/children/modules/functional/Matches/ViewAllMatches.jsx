import { useEffect, useState } from "react";
import "./Chat.css";
import NewMatchesCard from "./NewMatchesCard";
import MessageListItem from "./MessageListItem";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

// eslint-disable-next-line no-unused-vars
export default function ViewAllMatches({MatchCard, NewMatchesCard: NewMatchesCardComponent, MessageListItem: MessageListItemComponent, ChatHeader: ChatHeaderComponent, MessageBubble: MessageBubbleComponent, MessageInput: MessageInputComponent}) {
  const NewMatchesCardToUse = NewMatchesCardComponent || NewMatchesCard;
  const MessageListItemToUse = MessageListItemComponent || MessageListItem;
  const ChatHeaderToUse = ChatHeaderComponent || ChatHeader;
  const MessageBubbleToUse = MessageBubbleComponent || MessageBubble;
  const MessageInputToUse = MessageInputComponent || MessageInput;
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
  const [imageUrls, setImageUrls] = useState({});

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

  useEffect(() => {
    if (matches.length > 0 || conversations.length > 0) {
      fetchImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, conversations]);

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

  const fetchImages = async () => {
    const token = localStorage.getItem("token");
    const newUrls = {};
    const userIdsToFetch = new Set();

    // Collect user IDs from matches
    matches.forEach((match) => {
      const otherUser = getOtherUser(match);
      if (otherUser && otherUser.id) {
        userIdsToFetch.add(otherUser.id);
      }
    });

    // Collect user IDs from conversations
    conversations.forEach((conv) => {
      if (conv.other_user_id) {
        userIdsToFetch.add(conv.other_user_id);
      }
    });

    // Fetch images for each user
    for (const userId of userIdsToFetch) {
      if (!imageUrls[userId]) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/profiles/${userId}/image`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (res.ok) {
            const blob = await res.blob();
            newUrls[userId] = URL.createObjectURL(blob);
          } else {
            newUrls[userId] = "";
          }
        } catch {
          newUrls[userId] = "";
        }
      }
    }

    if (Object.keys(newUrls).length > 0) {
      setImageUrls((prev) => ({ ...prev, ...newUrls }));
    }
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

  const getOtherUserFromConversation = () => {
    if (!selectedConversation || !matches.length) return null;
    const match = matches.find(m => m.id === selectedConversation.match_id);
    if (!match) return null;
    return getOtherUser(match);
  };

  const getMatchDate = () => {
    if (!selectedConversation || !matches.length) return null;
    const match = matches.find(m => m.id === selectedConversation.match_id);
    if (!match || !match.created_at) return null;
    return new Date(match.created_at).toLocaleDateString();
  };

  return (
    <>
      {!selectedConversation ? (
        <div className="messages-list-view">
          {/* New Matches Section */}
          <div className="new-matches-section">
            <h2 className="section-title">New matches</h2>
            <NewMatchesCardToUse likesCount={matches.length} />
          </div>

          {/* Messages Section */}
          <div className="messages-section">
            <h2 className="section-title">Messages</h2>
            {loading && <p className="loading">Loading messages...</p>}
            {error && <p className="error">Error: {error}</p>}
            {!loading && !error && conversations.length === 0 && (
              <p className="no-messages-text">No messages yet.</p>
            )}
            {!loading && !error && conversations.length > 0 && (
              <div className="messages-list">
                {conversations.map((conv) => {
                  const match = matches.find(m => m.id === conv.match_id);
                  const otherUser = match ? getOtherUser(match) : null;
                  const userId = otherUser?.id || conv.other_user_id;
                  
                  return (
                    <MessageListItemToUse
                      key={conv.id}
                      name={conv.other_user_name || otherUser?.name || "Unknown"}
                      messagePreview={conv.last_message || "No messages yet"}
                      avatar={userId ? imageUrls[userId] : null}
                      isActive={true}
                      hasLikesYou={true}
                      onClick={() => fetchConversationMessages(conv.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="chat-view-new">
          <ChatHeaderToUse
            name={selectedConversation.other_user_name || "Chat"}
            profilePicture={getOtherUserFromConversation()?.id ? imageUrls[getOtherUserFromConversation().id] : null}
            onBack={handleBackToMatches}
            onMenuClick={() => fetchDateSuggestions()}
          />

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

          <div className="messages-container-new">
            {getMatchDate() && (
              <p className="match-notification">
                You matched with {selectedConversation.other_user_name || "them"} on {getMatchDate()}
              </p>
            )}
            {messages.length === 0 ? (
              <p className="no-messages-new">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                const isSent = msg.sender_id === self?.profile?.user_id;
                const otherUser = getOtherUserFromConversation();
                const avatarUrl = !isSent && otherUser?.id ? imageUrls[otherUser.id] : null;
                
                return (
                  <MessageBubbleToUse
                    key={msg.id}
                    content={msg.content}
                    isSent={isSent}
                    senderName={msg.sender_name}
                    timestamp={msg.created_at}
                    avatar={avatarUrl}
                  />
                );
              })
            )}
          </div>

          <MessageInputToUse
            value={messageInput}
            onChange={setMessageInput}
            onSend={sendMessage}
            disabled={sendingMessage}
          />
        </div>
      )}
    </>
  );
}

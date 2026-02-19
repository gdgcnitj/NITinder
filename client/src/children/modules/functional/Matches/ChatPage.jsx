import NewMatchesCard from "./NewMatchesCard";
import MessageListItem from "./MessageListItem";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

export default function ChatPage({
  selectedConversation,
  messages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  sendingMessage,
  loading,
  error,
  conversations,
  matches,
  imageUrls,
  showDateSuggestions,
  dateSuggestions,
  dateSuggestionsError,
  onBackToMatches,
  onFetchDateSuggestions,
  onCloseDateSuggestions,
  onOpenConversation,
  getOtherUser,
  getOtherUserFromConversation,
  getMatchDate,
  self,
}) {
  if (!selectedConversation) {
    return (
      <div className="messages-list-view">
        <div className="new-matches-section">
          <h2 className="section-title">New matches</h2>
          <NewMatchesCard likesCount={matches.length} />
        </div>

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
                const match = matches.find((m) => m.id === conv.match_id);
                const otherUser = match ? getOtherUser(match) : null;
                const userId = otherUser?.id || conv.other_user_id;

                return (
                  <MessageListItem
                    key={conv.id}
                    name={conv.other_user_name || otherUser?.name || "Unknown"}
                    messagePreview={conv.last_message || "No messages yet"}
                    avatar={userId ? imageUrls[userId] : null}
                    isActive={true}
                    hasLikesYou={true}
                    onClick={() => onOpenConversation(conv.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view-new">
      <ChatHeader
        name={selectedConversation.other_user_name || "Chat"}
        profilePicture={
          getOtherUserFromConversation()?.id
            ? imageUrls[getOtherUserFromConversation().id]
            : null
        }
        onBack={onBackToMatches}
        onMenuClick={onFetchDateSuggestions}
      />

      {showDateSuggestions && (
        <div className="date-suggestions-modal">
          <div className="date-suggestions-header">
            <h3>Date Ideas for You Two</h3>
            <button className="close-btn" onClick={onCloseDateSuggestions}>
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
            You matched with {selectedConversation.other_user_name || "them"} on{" "}
            {getMatchDate()}
          </p>
        )}
        {messages.length === 0 ? (
          <p className="no-messages-new">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isSent = msg.sender_id === self?.profile?.user_id;
            const otherUser = getOtherUserFromConversation();
            const avatarUrl =
              !isSent && otherUser?.id ? imageUrls[otherUser.id] : null;

            return (
              <MessageBubble
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

      <MessageInput
        value={messageInput}
        onChange={onMessageInputChange}
        onSend={onSendMessage}
        disabled={sendingMessage}
      />
    </div>
  );
}

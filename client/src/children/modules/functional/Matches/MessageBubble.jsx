export default function MessageBubble({
  content,
  isSent = false,
  senderName,
  timestamp,
  avatar,
  onLike,
  isLiked = false,
}) {
  return (
    <div className={`message-bubble-wrapper ${isSent ? "sent" : "received"}`}>
      {!isSent && avatar && (
        <img src={avatar} alt={senderName} className="message-bubble-avatar" />
      )}
      <div className={`message-bubble ${isSent ? "sent" : "received"}`}>
        {!isSent && senderName && (
          <p className="message-bubble-sender">{senderName}</p>
        )}
        <p className="message-bubble-content">{content}</p>
        {timestamp && (
          <p className="message-bubble-time">
            {isSent && "✓✓ "}
            {new Date(timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        )}
      </div>
      {isSent && (
        <button 
          className={`message-like-btn ${isLiked ? "liked" : ""}`}
          onClick={onLike}
        >
          {isLiked ? "❤️" : "🤍"}
        </button>
      )}
    </div>
  );
}

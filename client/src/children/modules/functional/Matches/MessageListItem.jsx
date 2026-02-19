export default function MessageListItem({
  avatar,
  name,
  messagePreview,
  isActive = false,
  hasLikesYou = false,
  unreadCount = 0,
  onClick,
}) {
  return (
    <div className="message-list-item" onClick={onClick}>
      <div className="message-avatar-container">
        {avatar ? (
          <img src={avatar} alt={name} className="message-avatar" />
        ) : (
          <div className="message-avatar-placeholder" />
        )}
        <div className={`status-dot ${isActive ? "active" : "inactive"}`} />
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-name">{name}</span>
          {hasLikesYou && <span className="likes-you-tag">Likes You</span>}
        </div>
        <p className="message-preview">{messagePreview || "No messages yet"}</p>
      </div>
      {unreadCount > 0 && (
        <div className="unread-badge">{unreadCount}</div>
      )}
    </div>
  );
}

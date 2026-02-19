export default function MessageInput({
  value,
  onChange,
  onSend,
  placeholder = "Type a message ...",
  disabled = false,
}) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="message-input-wrapper">
      <input
        type="text"
        className="message-input-new"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button 
        className="message-send-btn"
        onClick={onSend}
        disabled={disabled || !value.trim()}
      >
        SEND
      </button>
    </div>
  );
}

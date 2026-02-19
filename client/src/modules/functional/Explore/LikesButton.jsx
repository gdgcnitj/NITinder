export default function LikesButton({ onClick }) {
  return (
    <div className="likes-button-container">
      <div className="brand-icon">🔥</div>
      <button className="likes-button" onClick={onClick}>
        See who likes you
      </button>
    </div>
  );
}

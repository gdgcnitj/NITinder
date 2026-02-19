export default function NewMatchesCard({ likesCount = 0 }) {
  return (
    <div className="new-matches-card">
      <div className="new-matches-gradient">
        <div className="new-matches-count">{likesCount}+</div>
      </div>
      <div className="new-matches-footer">
        <div className="heart-icon">❤️</div>
        <span className="new-matches-text">{likesCount}+ likes</span>
      </div>
    </div>
  );
}

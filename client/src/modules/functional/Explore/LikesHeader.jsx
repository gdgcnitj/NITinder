export default function LikesHeader({ likesCount = 0, onFilterClick }) {
  return (
    <div className="likes-header">
      <h2 className="likes-count">{likesCount}+ likes</h2>
      <button className="filter-btn" onClick={onFilterClick}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M5 10h10M7 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

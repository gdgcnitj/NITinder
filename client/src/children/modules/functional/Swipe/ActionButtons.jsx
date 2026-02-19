import "./Home.css"

export default function ActionButtons({handleUndo, swipeHistory, handleBoost, handlePass, handleSuperlike, handleLike}) {
    return (
        <div className="action-buttons">
        <button 
          className="action-btn undo-btn" 
          onClick={handleUndo} 
          title="Undo"
          disabled={swipeHistory.length === 0}
        >
          <svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  width="20"
  height="20"
>
  <polyline points="9 14 4 9 9 4" />
  <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
</svg>

        </button>

        <button 
          className="action-btn pass-btn" 
          onClick={handlePass} 
          title="Pass"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <button 
          className="action-btn superlike-btn" 
          onClick={handleSuperlike} 
          title="Superlike"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>

        <button 
          className="action-btn like-btn" 
          onClick={handleLike} 
          title="Like"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <button 
          className="action-btn boost-btn" 
          onClick={handleBoost} 
          title="Boost"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </button>
      </div>
    )
}
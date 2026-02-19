export default function FilterChip({ label, isActive = false, onClick }) {
  return (
    <button 
      className={`filter-chip ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function BlurredProfileCard({ imageUrl, onClick }) {
  return (
    <div className="blurred-profile-card" onClick={onClick}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Profile" 
          className="blurred-profile-image"
        />
      ) : (
        <div className="blurred-profile-placeholder" />
      )}
      <div className="blurred-profile-text-placeholder">
        <div className="text-line" />
        <div className="text-line" />
      </div>
    </div>
  );
}

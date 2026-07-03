
import './AttributesCard.css'; 

function AttributesCard({ activeCharacter }) {

  const { physique, instinct, mind } = activeCharacter?.attributes || {};

  return (
    <div className="attributes-card">
      <h3 className="block-title">STATS & PROFILE</h3>
      

      <div className="profile-row">
        <div><strong>NAME:</strong> {activeCharacter?.name}</div>
        <div><strong>LEVEL:</strong> {activeCharacter?.level}</div>
      </div>
      
      <div className="profile-row">
        <div><strong>XP:</strong> {activeCharacter?.xp}</div>
        <div><strong>COINS:</strong> {activeCharacter?.coins}</div>
      </div>

      <hr />

      <h4>ATTRIBUTES</h4>
      <div className="attributes-row">
        <div className="attribute-stat">
          <span>💪 PHYSIQUE</span>
          <div className="stat-number">{physique}</div>
        </div>
        
        <div className="attribute-stat">
          <span>👁️ INSTINCT</span>
          <div className="stat-number">{instinct}</div>
        </div>
        
        <div className="attribute-stat">
          <span>🧠 MIND</span>
          <div className="stat-number">{mind}</div>
        </div>
      </div>
    </div>
  )
}

export default AttributesCard;
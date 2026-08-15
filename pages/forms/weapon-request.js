import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const DEPARTMENTS = [
  { id: 'db', name: 'DB', emoji: '🕵️' },
  { id: 'spd', name: 'SPD', emoji: '🚔' },
  { id: 'sai', name: 'SAI', emoji: '🔍' },
  { id: 'sa', name: 'SA', emoji: '🎓' },
  { id: 'k9', name: 'K9', emoji: '🐕' },
  { id: 'seb', name: 'SEB', emoji: '💥' },
  { id: 'iad', name: 'IAD', emoji: '⚖️' },
  { id: 'af', name: 'AF', emoji: '✈️' },
  { id: 'ted', name: 'TED', emoji: '🔫' },
  { id: 'dvd', name: 'DVD', emoji: '🚗' },
  { id: 'srt', name: 'SRT', emoji: '🛡️' },
  { id: 'nred', name: 'NRED', emoji: '🚨' },
  { id: 'med', name: 'MED', emoji: '🏥' },
  { id: 'halt', name: 'HALT', emoji: '🚁' }
];

const RANKS = [
  { value: '1', label: '1' }, { value: '2', label: '2' },
  { value: '3', label: '3' }, { value: '4', label: '4' },
  { value: '5', label: '5' }, { value: '6', label: '6' },
  { value: '7', label: '7' }, { value: '8', label: '8' },
  { value: '9', label: '9' }, { value: '10', label: '10' },
  { value: '11', label: '11' }, { value: '12', label: '12' },
  { value: '13', label: '13' }, { value: '14', label: '14' },
  { value: '15', label: '15' }
];

const WEAPONS = [
  { value: 'drone', label: '🚁 Дрон', requiresDept: ['k9', 'db'] },
  { value: 'combat-mg', label: '🔫 Combat MG', requiresDept: null },
  { value: 'combat-mg-mk2', label: '🔫 Combat MG Mk2', requiresDept: null },
  { value: 'marksman-rifle-mk2', label: '🎯 Marksman Rifle Mk2', requiresDept: null },
  { value: 'sniper-rifle', label: '🎯 Sniper Rifle', requiresDept: null },
  { value: 'heavy-sniper', label: '🎯 Heavy Sniper', requiresDept: null },
  { value: 'heavy-sniper-mk2', label: '🎯 Heavy Sniper Mk2', requiresDept: null },
  { value: 'precision-rifle', label: '🎯 Precision Rifle', requiresDept: null }
];

export default function WeaponRequestForm() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState({ fullName: '', department: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
    rank: '',
    weapon: ''
  });

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/');
          return;
        }
        setUser(data.user);
      });
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data.profile);
        setFormData(prev => ({
          ...prev,
          fullName: data.profile.fullName || '',
          department: data.profile.department || ''
        }));
        setLoading(false);
      });
  }, []);

  const selectedWeapon = WEAPONS.find(w => w.value === formData.weapon);
  const isDroneBlocked = selectedWeapon?.requiresDept && 
    !selectedWeapon.requiresDept.includes(formData.department);

  const isFormValid = () => {
    if (!formData.fullName.trim()) return false;
    if (!formData.department) return false;
    if (!formData.rank) return false;
    if (!formData.weapon) return false;
    if (isDroneBlocked) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      if (isDroneBlocked) {
        alert('❌ Дрон доступен только для отделов K9 и DB!');
        return;
      }
      alert('❌ Пожалуйста, заполните все обязательные поля!');
      return;
    }

    setSubmitting(true);
    
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weapon-request',
          fullName: formData.fullName,
          department: formData.department,
          rank: formData.rank,
          weapon: selectedWeapon?.label || formData.weapon
        })
      });

      if (res.ok) {
        alert('✅ Запрос на спец вооружение успешно отправлен!');
        router.push('/dashboard');
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      alert('❌ Ошибка при отправке запроса: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <button onClick={() => router.push('/dashboard')} className="back-btn">
        ← Назад к выбору
      </button>
      
      <div className="form-container">
        <h1>🔫 Запрос на спец вооружение</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя Фамилия + Статик * {profile.fullName && <span style={{ color:'#4CAF50',fontSize:'12px' }}>(из профиля)</span>}</label>
            <input 
              type="text" 
              required
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              placeholder="Например: Sanya Suspect 270726"
              disabled={!!profile.fullName}
              className={profile.fullName ? 'disabled-input' : ''}
            />
          </div>

          <div className="form-group">
            <label>Отдел * {profile.department && <span style={{ color:'#4CAF50',fontSize:'12px' }}>(из профиля)</span>}</label>
            <select
              required
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value, weapon: ''})}
              className="select-input"
              disabled={!!profile.department}
              style={profile.department ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <option value="">-- Выберите отдел --</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.emoji} {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Ранг *</label>
            <select
              required
              value={formData.rank}
              onChange={(e) => setFormData({...formData, rank: e.target.value})}
              className="select-input"
            >
              <option value="">-- Выберите ранг --</option>
              {RANKS.map(rank => (
                <option key={rank.value} value={rank.value}>{rank.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Какое оружие запрашивается *</label>
            <select
              required
              value={formData.weapon}
              onChange={(e) => setFormData({...formData, weapon: e.target.value})}
              className="select-input"
            >
              <option value="">-- Выберите оружие --</option>
              {WEAPONS.map(weapon => (
                <option 
                  key={weapon.value} 
                  value={weapon.value}
                  disabled={weapon.requiresDept && !weapon.requiresDept.includes(formData.department)}
                >
                  {weapon.label}
                  {weapon.requiresDept && !weapon.requiresDept.includes(formData.department) ? ' (K9/DB)' : ''}
                </option>
              ))}
            </select>
            {isDroneBlocked && (
              <div className="warning-box">
                <span className="warning-icon">⚠️</span>
                <span className="warning-text">Дрон доступен только для отделов K9 и DB</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Discord ID</label>
            <input 
              type="text" 
              value={`${user.username} (${user.id})`}
              disabled 
              className="disabled-input" 
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={submitting || !isFormValid()}
          >
            {submitting ? '⏳ Отправка...' : '📤 Отправить запрос'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .form-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%);
          padding: 30px;
        }
        .back-btn {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: all 0.2s;
          font-size: 14px;
        }
        .back-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .form-container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        h1 {
          color: white;
          margin-bottom: 30px;
          font-size: 28px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          color: #8b8ba7;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        input, textarea, .select-input {
          width: 100%;
          padding: 12px 15px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: white;
          font-size: 15px;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .select-input {
          appearance: none;
          cursor: pointer;
        }
        .select-input option {
          background: #1a1a3e;
          color: white;
        }
        .select-input option:disabled {
          color: #666;
        }
        input:focus, textarea:focus, .select-input:focus {
          outline: none;
          border-color: #5865F2;
          background: rgba(255, 255, 255, 0.08);
        }
        .disabled-input {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.03);
        }
        textarea {
          resize: vertical;
          min-height: 100px;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #FF5722;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 10px;
        }
        .submit-btn:hover:not(:disabled) {
          background: #E64A19;
          transform: translateY(-1px);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .warning-box {
          background: rgba(255, 152, 0, 0.15);
          border: 1px solid #FF9800;
          border-radius: 10px;
          padding: 12px 16px;
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .warning-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        .warning-text {
          color: #FFB74D;
          font-size: 14px;
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #0a0a1a;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(88, 101, 242, 0.2);
          border-top-color: #5865F2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-container p {
          color: #8b8ba7;
        }
      `}</style>
    </div>
  );
}

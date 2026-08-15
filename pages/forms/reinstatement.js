import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

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

export default function ReinstatementForm() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState({ fullName: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    rankAtDismissal: '',
    rankProof: '',
    wasWarned: '',
    stateFractionsProof: ''
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
        if (data.profile.fullName) {
          setFormData(prev => ({ ...prev, fullName: data.profile.fullName }));
        }
        setLoading(false);
      });
  }, []);

  const isFormValid = () => {
    if (!formData.fullName.trim()) return false;
    if (!formData.rankAtDismissal) return false;
    if (!formData.rankProof.trim()) return false;
    if (!formData.wasWarned) return false;
    if (formData.wasWarned === 'yes' && !formData.stateFractionsProof.trim()) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      alert('❌ Пожалуйста, заполните все обязательные поля!');
      return;
    }

    setSubmitting(true);
    
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reinstatement',
          fullName: formData.fullName,
          rankAtDismissal: formData.rankAtDismissal,
          rankProof: formData.rankProof,
          wasWarned: formData.wasWarned,
          stateFractionsProof: formData.stateFractionsProof
        })
      });

      if (res.ok) {
        alert('✅ Заявка на восстановление успешно отправлена!');
        router.push('/dashboard');
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      alert('❌ Ошибка при отправке заявки: ' + error.message);
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
        <h1>🔄 Восстановление в LSCSD</h1>
        
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
            <label>Ранг на момент увольнения *</label>
            <select
              required
              value={formData.rankAtDismissal}
              onChange={(e) => setFormData({...formData, rankAtDismissal: e.target.value})}
              className="select-input"
            >
              <option value="">-- Выберите ранг --</option>
              {RANKS.map(rank => (
                <option key={rank.value} value={rank.value}>{rank.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Доказательство ранга (скриншот планшета) *</label>
            <textarea 
              required
              value={formData.rankProof}
              onChange={(e) => setFormData({...formData, rankProof: e.target.value})}
              placeholder="Вставьте ссылку на скриншот планшета с рангом..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Вы были уволены после Ban/Warn? *</label>
            <select
              required
              value={formData.wasWarned}
              onChange={(e) => setFormData({...formData, wasWarned: e.target.value, stateFractionsProof: ''})}
              className="select-input"
            >
              <option value="">-- Выберите ответ --</option>
              <option value="yes">✅ Да</option>
              <option value="no">❌ Нет</option>
            </select>
          </div>

          {formData.wasWarned === 'yes' && (
            <div className="form-group extra-field">
              <label>Скриншот одобрения из State Fractions *</label>
              <textarea 
                required
                value={formData.stateFractionsProof}
                onChange={(e) => setFormData({...formData, stateFractionsProof: e.target.value})}
                placeholder="Вставьте ссылку на скриншот одобрения из State Fractions..."
                rows="3"
              />
            </div>
          )}

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
            {submitting ? '⏳ Отправка...' : '📤 Отправить заявку'}
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
          background: #9C27B0;
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
          background: #7B1FA2;
          transform: translateY(-1px);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .extra-field {
          background: rgba(156, 39, 176, 0.08);
          border: 1px solid rgba(156, 39, 176, 0.25);
          border-radius: 12px;
          padding: 18px;
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
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

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

const LEAVE_TYPES = [
  { value: 'ooc', label: '🌍 OOC (по реальной жизни)' },
  { value: 'ic', label: '🎮 IC (по игре/RP)' }
];

export default function LeaveForm() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState({ fullName: '', department: '' });
  const [formData, setFormData] = useState({
    leaveType: '', fullName: '', department: '', reason: '', startDate: '', endDate: ''
  });

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/'); return; }
      setUser(d.user);
    });
    fetch('/api/profile').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setFormData(prev => ({
        ...prev,
        fullName: d.profile.fullName || '',
        department: d.profile.department || ''
      }));
      setLoading(false);
    });
  }, []);

  const isValid = () => formData.leaveType && formData.fullName.trim() && formData.department && formData.reason.trim() && formData.startDate.trim() && formData.endDate.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid()) { alert('Заполните все поля!'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'leave', leaveType: formData.leaveType, fullName: formData.fullName, department: formData.department, reason: formData.reason, startDate: formData.startDate, endDate: formData.endDate })
      });
      if (res.ok) { alert('✅ Отправлено!'); router.push('/dashboard'); }
      else { const err = await res.json(); throw new Error(err.error); }
    } catch (e) { alert('❌ ' + e.message); }
    finally { setSubmitting(false); }
  };

if (loading || !user) return <div style={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#0a0a1a',color:'white' }}>Загрузка...</div>;

  const s = { width:'100%',padding:'12px 15px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'8px',color:'white',fontSize:'15px',boxSizing:'border-box' };

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%)',padding:'30px',color:'white' }}>
      <button onClick={() => router.push('/dashboard')} style={{ background:'rgba(255,255,255,0.1)',color:'white',border:'1px solid rgba(255,255,255,0.2)',padding:'10px 20px',borderRadius:'8px',cursor:'pointer',marginBottom:'20px' }}>← Назад</button>
      <div style={{ maxWidth:'600px',margin:'0 auto',background:'rgba(255,255,255,0.05)',borderRadius:'20px',padding:'40px',border:'1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ marginBottom:'30px',fontSize:'28px' }}>🏖️ Заявление на отпуск</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Тип отпуска *</label>
            <select required value={formData.leaveType} onChange={e => setFormData({...formData,leaveType:e.target.value})} style={{...s,appearance:'none',cursor:'pointer'}}>
              <option value="">-- Выберите тип --</option>
              {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Имя Фамилия + Статик * {profile.fullName && <span style={{ color:'#4CAF50',fontSize:'12px' }}>(из профиля)</span>}</label>
            <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData,fullName:e.target.value})} placeholder="Sanya Suspect 270726" disabled={!!profile.fullName} style={{...s,opacity:profile.fullName?0.5:1,cursor:profile.fullName?'not-allowed':'text'}} />
          </div>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Отдел * {profile.department && <span style={{ color:'#4CAF50',fontSize:'12px' }}>(из профиля)</span>}</label>
            <select required value={formData.department} onChange={e => setFormData({...formData,department:e.target.value})} disabled={!!profile.department} style={{...s,appearance:'none',cursor:profile.department?'not-allowed':'pointer',opacity:profile.department?0.5:1}}>
              <option value="">-- Выберите отдел --</option>
              {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Причина *</label>
            <textarea required value={formData.reason} onChange={e => setFormData({...formData,reason:e.target.value})} placeholder="Опишите причину..." rows="3" style={{...s,resize:'vertical',minHeight:'100px'}} />
          </div>
          <div style={{ display:'flex',gap:'15px',marginBottom:'20px' }}>
            <div style={{ flex:1 }}>
              <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Дата начала *</label>
              <input type="text" required value={formData.startDate} onChange={e => setFormData({...formData,startDate:e.target.value})} placeholder="15.08.2024" style={s} />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Дата окончания *</label>
              <input type="text" required value={formData.endDate} onChange={e => setFormData({...formData,endDate:e.target.value})} placeholder="20.08.2024" style={s} />
            </div>
          </div>
          <button type="submit" disabled={submitting || !isValid()} style={{ width:'100%',padding:'14px',background:'#00BCD4',color:'white',border:'none',borderRadius:'10px',fontSize:'16px',fontWeight:600,cursor:submitting?'not-allowed':'pointer',opacity:submitting?0.5:1,marginTop:'10px' }}>
            {submitting ? '⏳ Отправка...' : '📤 Отправить'}
          </button>
        </form>
      </div>
    </div>
  );
}

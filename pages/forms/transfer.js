import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const DEPARTMENTS = [
  { id: 'db', name: 'DB', emoji: '🕵️' },
  { id: 'spd', name: 'SPD', emoji: '🚔' },
  { id: 'sai', name: 'SAI', emoji: '🔍' },
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
  { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' },
  { value: '4', label: '4' }, { value: '5', label: '5' }, { value: '6', label: '6' },
  { value: '7', label: '7' }, { value: '8', label: '8' }, { value: '9', label: '9' },
  { value: '10', label: '10' }
];

const RATING_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function TransferForm() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState({ fullName: '', department: '' });
  const [formData, setFormData] = useState({
    fullName: '', rank: '', currentDepartment: '', targetDepartment: '', reason: '',
    dbWhatIs: '', dbExperience: '', dbExamples: '', dbServers: '', dbKnowledge: '', dbLawKnowledge: ''
  });

  const targetDept = formData.targetDepartment;
  const currentDept = formData.currentDepartment;
  const showDbFields = targetDept === 'db';
  const isSameDepartment = currentDept && targetDept && currentDept === targetDept;
  const isDbComplete = !showDbFields || (formData.dbWhatIs.trim() && formData.dbExperience && formData.dbExamples.trim() && formData.dbServers.trim() && formData.dbKnowledge && formData.dbLawKnowledge);

  const isFormValid = () => {
    if (!formData.fullName.trim()) return false;
    if (!formData.rank) return false;
    if (!formData.currentDepartment) return false;
    if (!formData.targetDepartment) return false;
    if (!formData.reason.trim()) return false;
    if (isSameDepartment) return false;
    if (!isDbComplete) return false;
    return true;
  };

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
        currentDepartment: d.profile.department || ''
      }));
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      if (isSameDepartment) { alert('❌ Нельзя перевестись в тот же отдел!'); return; }
      alert('❌ Заполните все обязательные поля!'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'transfer', targetDepartment: formData.targetDepartment,
          fullName: formData.fullName, rank: formData.rank,
          currentDepartment: formData.currentDepartment, reason: formData.reason,
          dbWhatIs: formData.dbWhatIs, dbExperience: formData.dbExperience,
          dbExamples: formData.dbExamples, dbServers: formData.dbServers,
          dbKnowledge: formData.dbKnowledge, dbLawKnowledge: formData.dbLawKnowledge
        })
      });
      if (res.ok) { alert('✅ Заявка отправлена!'); router.push('/dashboard'); }
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
        <h1 style={{ marginBottom:'30px',fontSize:'28px' }}>🔄 Перевод в отдел</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Имя Фамилия + Статик * {profile.fullName && <span style={{ color:'#4CAF50',fontSize:'12px' }}>(из профиля)</span>}</label>
            <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData,fullName:e.target.value})} placeholder="Sanya Suspect 270726" disabled={!!profile.fullName} style={{...s,opacity:profile.fullName?0.5:1,cursor:profile.fullName?'not-allowed':'text'}} />
          </div>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Ваш ранг *</label>
            <select required value={formData.rank} onChange={e => setFormData({...formData,rank:e.target.value})} style={{...s,appearance:'none',cursor:'pointer'}}>
              <option value="">-- Выберите ранг --</option>
              {RANKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Текущий отдел * {profile.department && <span style={{ color:'#4CAF50',fontSize:'12px' }}>(из профиля)</span>}</label>
            <select required value={formData.currentDepartment} onChange={e => setFormData({...formData,currentDepartment:e.target.value})} disabled={!!profile.department} style={{...s,appearance:'none',cursor:profile.department?'not-allowed':'pointer',opacity:profile.department?0.5:1}}>
              <option value="">-- Выберите отдел --</option>
              {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Желаемый отдел *</label>
            <select required value={formData.targetDepartment} onChange={e => setFormData({...formData,targetDepartment:e.target.value,dbWhatIs:'',dbExperience:'',dbExamples:'',dbServers:'',dbKnowledge:'',dbLawKnowledge:''})} style={{...s,appearance:'none',cursor:'pointer'}}>
              <option value="">-- Выберите отдел --</option>
              {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
            </select>
          </div>
          {isSameDepartment && <div style={{ background:'rgba(244,67,54,0.15)',border:'1px solid #F44336',borderRadius:'10px',padding:'14px 18px',marginBottom:'20px',color:'#EF9A9A',fontSize:'14px' }}>❌ Нельзя перевестись в тот же отдел!</div>}
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Причина перевода *</label>
            <textarea required value={formData.reason} onChange={e => setFormData({...formData,reason:e.target.value})} placeholder="Опишите причину..." rows="4" style={{...s,resize:'vertical',minHeight:'100px'}} />
          </div>
          {showDbFields && (
            <div style={{ background:'rgba(33,150,243,0.08)',border:'1px solid rgba(33,150,243,0.25)',borderRadius:'12px',padding:'20px',marginBottom:'20px' }}>
              <h3 style={{ marginBottom:'20px',fontSize:'18px',borderBottom:'1px solid rgba(255,255,255,0.1)',paddingBottom:'10px' }}>📋 Дополнительные вопросы для DB</h3>
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Чем занимается DB? *</label>
                <textarea required value={formData.dbWhatIs} onChange={e => setFormData({...formData,dbWhatIs:e.target.value})} placeholder="Опишите чем занимается отдел DB..." rows="3" style={{...s,resize:'vertical',minHeight:'100px'}} />
              </div>
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Опыт работы в DB? *</label>
                <select required value={formData.dbExperience} onChange={e => setFormData({...formData,dbExperience:e.target.value})} style={{...s,appearance:'none',cursor:'pointer'}}>
                  <option value="">-- Выберите --</option>
                  <option value="Нет опыта, но хочу попробовать">Нет опыта, но хочу попробовать</option>
                  <option value="Был средним составом в подобных отделах">Был средним составом</option>
                  <option value="Занимал руководящую должность">Занимал руководящую должность</option>
                </select>
              </div>
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Примеры работ *</label>
                <textarea required value={formData.dbExamples} onChange={e => setFormData({...formData,dbExamples:e.target.value})} placeholder="Приведите примеры ваших работ..." rows="3" style={{...s,resize:'vertical',minHeight:'100px'}} />
              </div>
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>На каких серверах были в DB? *</label>
                <textarea required value={formData.dbServers} onChange={e => setFormData({...formData,dbServers:e.target.value})} placeholder="Укажите серверы..." rows="3" style={{...s,resize:'vertical',minHeight:'100px'}} />
              </div>
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Знания по работе DB (1-10) *</label>
                <select required value={formData.dbKnowledge} onChange={e => setFormData({...formData,dbKnowledge:e.target.value})} style={{...s,appearance:'none',cursor:'pointer'}}>
                  <option value="">-- Оцените --</option>
                  {RATING_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block',marginBottom:'8px',color:'#8b8ba7' }}>Знания по законке (1-10) *</label>
                <select required value={formData.dbLawKnowledge} onChange={e => setFormData({...formData,dbLawKnowledge:e.target.value})} style={{...s,appearance:'none',cursor:'pointer'}}>
                  <option value="">-- Оцените --</option>
                  {RATING_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          )}
          <button type="submit" disabled={submitting || !isFormValid()} style={{ width:'100%',padding:'14px',background:'#2196F3',color:'white',border:'none',borderRadius:'10px',fontSize:'16px',fontWeight:600,cursor:submitting?'not-allowed':'pointer',opacity:submitting?0.5:1,marginTop:'10px' }}>
            {submitting ? '⏳ Отправка...' : '📤 Отправить'}
          </button>
        </form>
      </div>
    </div>
  );
}

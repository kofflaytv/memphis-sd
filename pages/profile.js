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

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ fullName: '', department: '' });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDept, setEditingDept] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/'); return; }
      setUser(d.user);
      setLoading(false);
    });
    fetch('/api/profile').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setNewName(d.profile.fullName || '');
    });
  }, []);

  const saveName = async () => {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: newName })
    });
    const d = await res.json();
    if (res.ok) {
      setProfile(d.profile);
      setEditingName(false);
    }
  };

  const saveDepartment = async (deptId) => {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department: deptId })
    });
    const d = await res.json();
    if (res.ok) {
      setProfile(d.profile);
      setEditingDept(false);
    }
  };

  const copyId = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !user) return (
    <div style={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#0a0a1a',color:'white' }}>
      Загрузка...
    </div>
  );

  const currentDept = DEPARTMENTS.find(d => d.id === profile.department);

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%)',padding:'30px',color:'white' }}>
      <button onClick={() => router.push('/dashboard')} style={{ background:'rgba(255,255,255,0.1)',color:'white',border:'1px solid rgba(255,255,255,0.2)',padding:'10px 20px',borderRadius:'8px',cursor:'pointer',marginBottom:'20px' }}>
        ← Назад
      </button>

      <div style={{ maxWidth:'600px',margin:'0 auto' }}>
        <div style={{ background:'rgba(255,255,255,0.05)',borderRadius:'20px',padding:'30px',border:'1px solid rgba(255,255,255,0.1)',textAlign:'center',marginBottom:'20px' }}>
          <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="Avatar" style={{ width:'80px',height:'80px',borderRadius:'50%',border:'2px solid #5865F2' }} />
          <h1 style={{ margin:'15px 0 5px',fontSize:'24px' }}>{user.username}</h1>
          <p style={{ color:'#8b8ba7',fontSize:'14px',marginBottom:'15px' }}>{user.id}</p>
          <button onClick={copyId} style={{ background:'rgba(255,255,255,0.08)',color:'white',border:'1px solid rgba(255,255,255,0.15)',padding:'8px 16px',borderRadius:'8px',cursor:'pointer' }}>
            {copied ? '✅ Скопировано' : '📋 Копировать ID'}
          </button>
        </div>

        <div style={{ background:'rgba(255,255,255,0.05)',borderRadius:'20px',padding:'30px',border:'1px solid rgba(255,255,255,0.1)',marginBottom:'20px' }}>
          <h2 style={{ fontSize:'18px',marginBottom:'15px' }}>🎮 Игровые данные</h2>
          {editingName ? (
            <div>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Имя Фамилия + Статик"
                style={{ width:'100%',padding:'12px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'8px',color:'white',marginBottom:'10px' }}
              />
              <button onClick={saveName} style={{ background:'#4CAF50',color:'white',border:'none',padding:'10px 20px',borderRadius:'8px',cursor:'pointer' }}>Сохранить</button>
            </div>
          ) : (
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ color: profile.fullName ? 'white' : '#8b8ba7' }}>
                {profile.fullName || 'Не указано'}
              </span>
              <button onClick={() => setEditingName(true)} style={{ background:'rgba(255,255,255,0.08)',color:'white',border:'1px solid rgba(255,255,255,0.15)',padding:'8px 16px',borderRadius:'8px',cursor:'pointer' }}>
                Изменить
              </button>
            </div>
          )}
        </div>

        <div style={{ background:'rgba(255,255,255,0.05)',borderRadius:'20px',padding:'30px',border:'1px solid rgba(255,255,255,0.1)',marginBottom:'20px' }}>
          <h2 style={{ fontSize:'18px',marginBottom:'15px' }}>🏢 Отдел</h2>
          {editingDept ? (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:'10px' }}>
              {DEPARTMENTS.map(d => (
                <button key={d.id} onClick={() => saveDepartment(d.id)} style={{ background: profile.department === d.id ? 'rgba(88,101,242,0.2)' : 'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'10px',padding:'15px',cursor:'pointer',color:'white',textAlign:'center' }}>
                  <div style={{ fontSize:'24px' }}>{d.emoji}</div>
                  <div style={{ fontSize:'13px',marginTop:'5px' }}>{d.name}</div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ color: currentDept ? 'white' : '#8b8ba7', fontSize:'16px' }}>
                {currentDept ? `${currentDept.emoji} ${currentDept.name}` : 'Не выбран'}
              </span>
              <button onClick={() => setEditingDept(true)} style={{ background:'rgba(255,255,255,0.08)',color:'white',border:'1px solid rgba(255,255,255,0.15)',padding:'8px 16px',borderRadius:'8px',cursor:'pointer' }}>
                Сменить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

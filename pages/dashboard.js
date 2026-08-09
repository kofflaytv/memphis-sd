import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const sections = [
  { id: 'promotion', title: 'Запрос на повышение', description: 'Подать запрос на повышение', icon: '📈', color: '#4CAF50' },
  { id: 'transfer', title: 'Перевод в отдел', description: 'Подать заявку на перевод в другой отдел', icon: '🔄', color: '#2196F3' },
  { id: 'report', title: 'Отчёт о повышении', description: 'Подать отчёт о повышении для своего отдела', icon: '📋', color: '#FF9800' },
  { id: 'high-rank-report', title: 'Отчёт на повышение (Хай Ранги)', description: 'Повышение для старшего состава', icon: '🌟', color: '#FF69B4' },
  { id: 'resignation', title: 'Заявление на увольнение', description: 'Подать заявление на увольнение из LSCSD', icon: '🚪', color: '#DC3545' },
  { id: 'reinstatement', title: 'Восстановление в LSCSD', description: 'Подать заявку на восстановление в LSCSD', icon: '🔄', color: '#9C27B0' },
  { id: 'transfer-to-lscsd', title: 'Перевод в LSCSD', description: 'Подать заявку на перевод в LSCSD из другой организации', icon: '🏛️', color: '#00BCD4' },
  { id: 'hiring', title: 'Трудоустройство в LSCSD', description: 'Подать заявку на вступление в LSCSD', icon: '📝', color: '#4CAF50' },
  { id: 'weapon-request', title: 'Запрос на спец вооружение', description: 'Подать запрос на получение спец вооружения', icon: '🔫', color: '#FF5722' },
  { id: 'leave', title: 'Заявление на отпуск', description: 'Подать заявление на OOC или IC отпуск', icon: '🏖️', color: '#00BCD4' }
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, today: 0 });

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/'); return; }
      setUser(d.user); setLoading(false);
    });
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) return (
    <div style={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#0a0a1a',color:'white' }}>
      Загрузка...
    </div>
  );

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%)',padding:'30px',color:'white' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',maxWidth:'1200px',margin:'0 auto 30px',padding:'20px',background:'rgba(255,255,255,0.03)',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.08)' }}>
        <h1 style={{ fontSize:'28px',margin:0 }}>🏛️ LSCSD Forms</h1>
        <div style={{ display:'flex',alignItems:'center',gap:'15px',color:'#8b8ba7' }}>
          <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="Avatar" style={{ width:'40px',height:'40px',borderRadius:'50%' }} />
          <span>{user.username}</span>
          <button onClick={handleLogout} style={{ background:'rgba(255,255,255,0.08)',color:'white',border:'1px solid rgba(255,255,255,0.15)',padding:'8px 16px',borderRadius:'8px',cursor:'pointer' }}>Выйти</button>
        </div>
      </div>

      <div style={{ maxWidth:'1200px',margin:'0 auto 30px',display:'flex',gap:'15px' }}>
        <div style={{ flex:1,background:'rgba(88,101,242,0.1)',border:'1px solid rgba(88,101,242,0.3)',borderRadius:'12px',padding:'20px',textAlign:'center' }}>
          <div style={{ fontSize:'32px',fontWeight:700,color:'#5865F2' }}>{stats.today}</div>
          <div style={{ color:'#8b8ba7',fontSize:'14px',marginTop:'5px' }}>Сегодня</div>
        </div>
        <div style={{ flex:1,background:'rgba(76,175,80,0.1)',border:'1px solid rgba(76,175,80,0.3)',borderRadius:'12px',padding:'20px',textAlign:'center' }}>
          <div style={{ fontSize:'32px',fontWeight:700,color:'#4CAF50' }}>{stats.total}</div>
          <div style={{ color:'#8b8ba7',fontSize:'14px',marginTop:'5px' }}>Всего</div>
        </div>
        <div style={{ flex:1,background:'rgba(255,152,0,0.1)',border:'1px solid rgba(255,152,0,0.3)',borderRadius:'12px',padding:'20px',textAlign:'center',cursor:'pointer' }} onClick={() => router.push('/history')}>
          <div style={{ fontSize:'32px',fontWeight:700,color:'#FF9800' }}>📋</div>
          <div style={{ color:'#8b8ba7',fontSize:'14px',marginTop:'5px' }}>Мои заявки</div>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'20px',maxWidth:'1200px',margin:'0 auto' }}>
        {sections.map(s => (
          <div key={s.id} onClick={() => router.push(`/forms/${s.id}`)} style={{ background:'rgba(255,255,255,0.03)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'30px',cursor:'pointer',textAlign:'center',position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',top:0,left:0,width:'4px',height:'100%',background:s.color }}></div>
            <div style={{ fontSize:'48px',marginBottom:'15px' }}>{s.icon}</div>
            <h3 style={{ fontSize:'18px',marginBottom:'10px' }}>{s.title}</h3>
            <p style={{ color:'#8b8ba7',fontSize:'14px',margin:0 }}>{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

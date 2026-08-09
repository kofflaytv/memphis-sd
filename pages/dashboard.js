import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const categories = [
  {
    title: '📝 Электронные заявления',
    color: '#4CAF50',
    items: [
      { id: 'hiring', title: 'Трудоустройство', description: 'Подать заявку на вступление в LSCSD', icon: '📝' },
      { id: 'transfer-to-lscsd', title: 'Перевод в LSCSD', description: 'Перевод из другой организации', icon: '🏛️' },
      { id: 'reinstatement', title: 'Восстановление', description: 'Восстановление в LSCSD', icon: '🔄' }
    ]
  },
  {
    title: '📋 Секретариат',
    color: '#2196F3',
    items: [
      { id: 'promotion', title: 'Запрос на повышение', description: 'Подать запрос на повышение', icon: '📈' },
      { id: 'resignation', title: 'Заявление на увольнение', description: 'Подать заявление на увольнение', icon: '🚪' },
      { id: 'leave', title: 'Отпуск', description: 'OOC или IC отпуск', icon: '🏖️' },
      { id: 'weapon-request', title: 'Спец вооружение', description: 'Запрос на получение спец вооружения', icon: '🔫' }
    ]
  },
  {
    title: '🏢 Отделы',
    color: '#FF9800',
    items: [
      { id: 'transfer', title: 'Перевод в отдел', description: 'Перевод в другой отдел LSCSD', icon: '🔄' },
      { id: 'report', title: 'Отчёт о повышении', description: 'Отчёт для своего отдела', icon: '📋' }
    ]
  }
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
      {/* Хедер */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',maxWidth:'1200px',margin:'0 auto 30px',padding:'20px',background:'rgba(255,255,255,0.03)',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.08)' }}>
        <h1 style={{ fontSize:'28px',margin:0 }}>🏛️ LSCSD Forms</h1>
        <div style={{ display:'flex',alignItems:'center',gap:'15px',color:'#8b8ba7' }}>
          <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="Avatar" style={{ width:'40px',height:'40px',borderRadius:'50%' }} />
          <span>{user.username}</span>
          <button onClick={handleLogout} style={{ background:'rgba(255,255,255,0.08)',color:'white',border:'1px solid rgba(255,255,255,0.15)',padding:'8px 16px',borderRadius:'8px',cursor:'pointer' }}>Выйти</button>
        </div>
      </div>

      {/* Статистика */}
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

      {/* Категории */}
      <div style={{ maxWidth:'1200px',margin:'0 auto' }}>
        {categories.map(cat => (
          <div key={cat.title} style={{ marginBottom:'35px' }}>
            <h2 style={{ 
              fontSize:'22px',marginBottom:'20px',paddingBottom:'10px',
              borderBottom:`2px solid ${cat.color}`,display:'inline-block'
            }}>
              {cat.title}
            </h2>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'15px' }}>
              {cat.items.map(item => (
                <div key={item.id} onClick={() => router.push(`/forms/${item.id}`)} 
                  style={{ 
                    background:'rgba(255,255,255,0.03)',backdropFilter:'blur(10px)',
                    border:`1px solid rgba(255,255,255,0.08)`,borderRadius:'16px',
                    padding:'25px',cursor:'pointer',textAlign:'center',
                    transition:'all 0.3s',position:'relative',overflow:'hidden'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.borderColor = cat.color;
                    e.currentTarget.style.boxShadow = `0 10px 30px ${cat.color}20`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div style={{ position:'absolute',top:0,left:0,width:'4px',height:'100%',background:cat.color }}></div>
                  <div style={{ fontSize:'36px',marginBottom:'10px' }}>{item.icon}</div>
                  <h3 style={{ fontSize:'16px',marginBottom:'8px' }}>{item.title}</h3>
                  <p style={{ color:'#8b8ba7',fontSize:'13px',margin:0 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

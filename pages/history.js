import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function History() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d.history) setHistory(d.history);
      setLoading(false);
    }).catch(() => router.push('/'));
  }, []);

  if (loading) return (
    <div style={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',background:'#0a0a1a',color:'white' }}>
      Загрузка...
    </div>
  );

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%)',padding:'30px',color:'white' }}>
      <button onClick={() => router.push('/dashboard')} style={{ background:'rgba(255,255,255,0.1)',color:'white',border:'1px solid rgba(255,255,255,0.2)',padding:'10px 20px',borderRadius:'8px',cursor:'pointer',marginBottom:'20px' }}>← Назад</button>
      
      <div style={{ maxWidth:'700px',margin:'0 auto' }}>
        <h1 style={{ marginBottom:'30px',fontSize:'28px' }}>📋 Мои заявки</h1>
        
        {history.length === 0 ? (
          <p style={{ color:'#8b8ba7' }}>У вас пока нет заявок</p>
        ) : (
          history.map((item, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'20px',marginBottom:'15px' }}>
              <h3 style={{ marginBottom:'8px' }}>{item.title}</h3>
              <p style={{ color:'#8b8ba7',fontSize:'14px' }}>{new Date(item.date).toLocaleString('ru-RU')}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

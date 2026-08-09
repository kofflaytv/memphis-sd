import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // ========== CANVAS ==========
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);

    let width, height;
    const particles = [];
    const confetti = [];
    const smokeTrails = [];
    const mouse = { x: -100, y: -100, prevX: -100, prevY: -100, speed: 0 };

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ========== ДЫМКА (градиентовый шлейф) ==========
    class SmokeParticle {
      constructor(x, y, speed) {
        this.x = x + (Math.random() - 0.5) * 10;
        this.y = y + (Math.random() - 0.5) * 10;
        this.size = 15 + speed * 2 + Math.random() * 20;
        this.life = 1;
        this.decay = 0.008 + Math.random() * 0.012;
        this.hue = Math.random() * 40 + 220; // сине-фиолетовый
      }
      update() {
        this.x += (Math.random() - 0.5) * 0.3;
        this.y += (Math.random() - 0.5) * 0.3;
        this.size += 0.5;
        this.life -= this.decay;
      }
      draw(ctx) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        g.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${this.life * 0.15})`);
        g.addColorStop(0.4, `hsla(${this.hue}, 60%, 50%, ${this.life * 0.08})`);
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    }

    // ========== ЧАСТИЦЫ ПОД КУРСОРОМ ==========
    class Particle {
      constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        const power = Math.min(speed / 5, 1);
        this.vx = (Math.random() - 0.5) * 6 * (0.5 + power);
        this.vy = (Math.random() - 0.5) * 6 * (0.5 + power);
        this.life = 1;
        this.size = Math.random() * 3 + 1 + power * 6;
        this.hue = Math.random() * 60 + 200;
        this.decay = 0.015 + Math.random() * 0.02;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.97; this.vy *= 0.97;
        this.life -= this.decay;
      }
      draw(ctx) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        g.addColorStop(0, `hsla(${this.hue}, 100%, 70%, ${this.life})`);
        g.addColorStop(0.5, `hsla(${this.hue}, 100%, 55%, ${this.life * 0.6})`);
        g.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
      }
    }

    // ========== КОНФЕТТИ ==========
    class Confetti {
      constructor() { this.reset(true); }
      reset(init) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : -20;
        this.size = Math.random() * 5 + 3;
        this.speedY = Math.random() * 1 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.rotation = Math.random() * 360;
        this.rotSpeed = (Math.random() - 0.5) * 2;
        this.opacity = Math.random() * 0.25 + 0.1;
        this.isGold = Math.random() < 0.4;
      }
      update() {
        this.y += this.speedY; this.x += this.speedX;
        this.rotation += this.rotSpeed;
        if (this.y > height + 40) this.reset(false);
      }
      draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.isGold ? '#FFD700' : '#5865F2';
        ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        ctx.restore();
      }
    }

    for (let i = 0; i < 60; i++) confetti.push(new Confetti());

    document.addEventListener('mousemove', e => {
      const dx = e.clientX - mouse.x;
      const dy = e.clientY - mouse.y;
      mouse.prevX = mouse.x; mouse.prevY = mouse.y;
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.speed = Math.sqrt(dx * dx + dy * dy);

      // Частицы
      const count = Math.floor(mouse.speed / 3) + 1;
      for (let i = 0; i < Math.min(count, 12); i++) {
        particles.push(new Particle(mouse.x, mouse.y, mouse.speed));
      }

      // Дымка (1-3 облачка за кадр, зависит от скорости)
      const smokeCount = Math.floor(mouse.speed / 8) + 1;
      for (let i = 0; i < Math.min(smokeCount, 3); i++) {
        smokeTrails.push(new SmokeParticle(mouse.x, mouse.y, mouse.speed));
      }
    });

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Дымка (рисуем ПЕРВОЙ чтобы была под всем)
      for (let i = smokeTrails.length - 1; i >= 0; i--) {
        smokeTrails[i].update();
        smokeTrails[i].draw(ctx);
        if (smokeTrails[i].life <= 0) smokeTrails.splice(i, 1);
      }

      // Конфетти
      confetti.forEach(c => { c.update(); c.draw(ctx); });

      // Частицы
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) particles.splice(i, 1);
      }

      // Свечение под курсором
      const glowSize = 20 + mouse.speed * 1.5;
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowSize);
      g.addColorStop(0, `rgba(88, 101, 242, ${0.2 + mouse.speed * 0.01})`);
      g.addColorStop(1, 'rgba(88, 101, 242, 0)');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, glowSize, 0, Math.PI * 2); ctx.fill();

      mouse.speed *= 0.85;

      requestAnimationFrame(animate);
    }
    animate();

    return () => canvas.remove();
  }, []);

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: #0a0a1a;
          color: white;
        }
        input, textarea, button {
          font-family: inherit;
        }
        a, button, input, textarea, select, [onclick], .card, .back-btn, .submit-btn, .logout-btn, .copy-btn {
          cursor: pointer;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}

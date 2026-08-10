export default function App({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: #0a0a1a; color: white;
        }
        input, textarea, button { font-family: inherit; }
        a, button, input, textarea, select, [onclick], .card, .back-btn, .submit-btn, .logout-btn, .copy-btn { cursor: pointer; }
        select option { background: #1a1a3e; color: white; }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}

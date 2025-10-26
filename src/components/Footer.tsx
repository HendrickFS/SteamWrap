export default function Footer() {
  return (
    <div style={{ marginTop: 40, textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
      <div>Built with React · Vite · TypeScript · Ant Design · Canvas API</div>
      <div style={{ marginTop: 6 }}>Author: HendrickFS · © {new Date().getFullYear()}</div>
      <div style={{ marginTop: 6 }}><a href="https://github.com/HendrickFS/steamWrap" target="_blank" rel="noopener noreferrer">GitHub Repository</a></div>
      <div style={{height: 16}}></div>
    </div>
  );
}

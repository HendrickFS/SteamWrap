import { ConfigProvider, theme as antdTheme, Layout, Button, Space } from 'antd';
import 'antd/dist/reset.css';
import { useState } from 'react';
import HomePage from './pages/home';
import SteamWrapPage from './pages/steamwrap';
import TutorialPage from './pages/tutorial';
import { Gamepad } from 'lucide-react';
import AppFooter from './components/Footer';

const { Header, Content } = Layout;

function App() {
  const [page, setPage] = useState<'home' | 'steamwrap' | 'tutorial'>('home');

  return (
    <ConfigProvider theme={{ algorithm: antdTheme.darkAlgorithm }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}>
              <Gamepad size={32} color="#00d4ff" style={{ display: 'block' }} />
            </span>
            <h1 style={{ color: 'white', fontWeight: 600, fontFamily: 'Arial, sans-serif', margin: 0 }}>SteamWrap</h1>
          </div>
          <Space>
            <Button type={page === 'home' ? 'primary' : 'default'} onClick={() => setPage('home')}>Home</Button>
            <Button type={page === 'steamwrap' ? 'primary' : 'default'} onClick={() => setPage('steamwrap')}>Steam Wrap</Button>
            <Button type={page === 'tutorial' ? 'primary' : 'default'} onClick={() => setPage('tutorial')}>Tutorial</Button>
          </Space>
        </Header>

        <Content style={{ padding: 24 }}>
          {page === 'home' ? <HomePage onNavigate={setPage} /> : page === 'steamwrap' ? <SteamWrapPage /> : page === 'tutorial' ? <TutorialPage /> : null}
        </Content>
        {/* Global footer rendered at the app level */}
        <AppFooter />
      </Layout>
    </ConfigProvider>
  );
}

export default App;

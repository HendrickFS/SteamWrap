import { Button, Card, Col, Row, Typography, Space, Tag, Divider } from 'antd';
import Footer from '../components/Footer';
import { RocketOutlined, ClockCircleOutlined, BarChartOutlined, ShareAltOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

type Props = {
  onNavigate?: (p: 'home' | 'steamwrap' | 'tutorial') => void;
};

export default function HomePage({ onNavigate }: Props) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 12px' }}>
      <Card bodyStyle={{ padding: 48, borderRadius: 12 }} style={{ background: 'linear-gradient(180deg,#071023,#071829)' }}>
        <Row gutter={24} align="middle">
          <Col xs={24} md={12}>
            <div style={{ color: 'white' }}>
              <Title style={{ color: 'white', lineHeight: 1.05, fontSize: 42 }}>SteamWrap, beautiful Steam activity snapshots</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.78)', fontSize: 16 }}>
                Generate a privacy-first summary of your recent Steam activity. Create a compact, shareable PNG of your top games, completion progress and playtime, all generated client-side in your browser.
              </Paragraph>

              <Space style={{ marginTop: 20 }}>
                <Button type="primary" size="large" onClick={() => onNavigate?.('steamwrap')}>Generate my Steam Wrap</Button>
                <Button size="large" onClick={() => onNavigate?.('tutorial')}>How to do it</Button>
              </Space>

              <div style={{ marginTop: 28 }}>
                <Tag color="geekblue">Privacy-first</Tag>
                <Tag color="volcano">Client-side export</Tag>
                <Tag icon={<ClockCircleOutlined />} color="purple">Fast results</Tag>
              </div>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 360 }}>
                <Card style={{ borderRadius: 12, background: '#071826' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 10, background: '#00283a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RocketOutlined style={{ color: '#40a9ff', fontSize: 24 }} />
                    </div>

                    <div>
                      <Text strong style={{ color: 'white' }}>Instant preview</Text>
                      <div>
                        <Text type="secondary">See your top games & playtime instantly. No signup required.</Text>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <Row gutter={12}>
                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <BarChartOutlined style={{ color: '#ffd666', fontSize: 20 }} />
                          <div style={{ color: 'white', fontWeight: 600 }}>Realtime</div>
                          <Text type="secondary">Preview</Text>
                        </div>
                      </Col>

                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <LockOutlined style={{ color: '#73d13d', fontSize: 20 }} />
                          <div style={{ color: 'white', fontWeight: 600 }}>Privacy</div>
                          <Text type="secondary">Client-only export</Text>
                        </div>
                      </Col>

                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <ShareAltOutlined style={{ color: '#7cb305', fontSize: 20 }} />
                          <div style={{ color: 'white', fontWeight: 600 }}>Shareable</div>
                          <Text type="secondary">PNG snapshot</Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <div style={{ marginTop: 28 }}>
        <Row gutter={24}>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ borderRadius: 12, background: '#081829' }}>
              <Title level={4} style={{ color: 'white' }}>Designed for players</Title>
              <Text type="secondary">Clear visuals and short summaries that highlight what matters: your top games and completion progress.</Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} style={{ borderRadius: 12, background: '#081829' }}>
              <Title level={4} style={{ color: 'white' }}>Privacy-first</Title>
              <Text type="secondary">We only fetch public Steam data. Image export happens in your browser, no servers, no tracking.</Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} style={{ borderRadius: 12, background: '#081829' }}>
              <Title level={4} style={{ color: 'white' }}>Customizable</Title>
              <Text type="secondary">Pick gradient colors, tweak the layout, and generate a PNG optimized for sharing on socials.</Text>
            </Card>
          </Col>
        </Row>

        <Divider style={{ background: 'rgba(255,255,255,0.06)', margin: '28px 0' }} />

        <Row gutter={24}>
          <Col xs={24} md={8}>
            <Card bordered={false} style={{ borderRadius: 12, background: '#081829' }}>
              <Title level={4} style={{ color: 'white' }}>How it works</Title>
              <ol style={{ color: 'rgba(255,255,255,0.8)', paddingLeft: 16 }}>
                <li>Enter a public Steam ID (no login required).</li>
                <li>We fetch public playtime and achievement summaries.</li>
                <li>Customize gradient colors and export a client-side PNG.</li>
                <li>Share your snapshot anywhere, image is generated in your browser.</li>
              </ol>
            </Card>
          </Col>

          <Col xs={24} md={16}>
            <Card bordered={false} style={{ borderRadius: 12, background: '#081829' }}>
              <Title level={4} style={{ color: 'white' }}>Ready to try?</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.75)' }}>
                Generate a SteamWrap to see your recent playtime & top games. Export a PNG and post it to socials, or save it for later.
              </Paragraph>
              <Space>
                <Button type="primary" onClick={() => onNavigate?.('steamwrap')}>Generate my Steam Wrap</Button>
                <Button onClick={() => onNavigate?.('tutorial')}>Learn more</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

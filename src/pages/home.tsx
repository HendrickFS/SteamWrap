import { Button, Card, Col, Row, Typography, Space, Tag } from 'antd';
import { RocketOutlined, ClockCircleOutlined, BarChartOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

type Props = {
  onNavigate?: (p: 'home' | 'steamwrap' | 'tutorial' | 'landing') => void;
};

export default function HomePage({ onNavigate }: Props) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card bodyStyle={{ padding: 48, borderRadius: 12 }} style={{ background: 'linear-gradient(180deg,#071023,#071829)' }}>
        <Row gutter={24} align="middle">
          <Col xs={24} md={12}>
            <div style={{ color: 'white' }}>
              <Title style={{ color: 'white', lineHeight: 1.05, fontSize: 44 }}>Your personal Steam timeline, redesigned.</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16 }}>
                Discover summaries of playtime, top games and trends. Fast and beautiful, built for players.
              </Paragraph>

              <Space style={{ marginTop: 20 }}>
                <Button type="primary" size="large" onClick={() => onNavigate?.('steamwrap')}>Generate my Steam Wrap</Button>
                <Button size="large" onClick={() => onNavigate?.('tutorial')}>How it works</Button>
              </Space>

              <div style={{ marginTop: 28 }}>
                <Tag color="geekblue">Privacy-first</Tag>
                <Tag color="volcano">No account needed</Tag>
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
                      <Text strong style={{ color: 'white' }}>Quick preview</Text>
                      <div>
                        <Text type="secondary">See your top games and playtime in under a second.</Text>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <Row gutter={12}>
                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <BarChartOutlined style={{ color: '#ffd666', fontSize: 20 }} />
                          <div style={{ color: 'white', fontWeight: 600 }}>24 hrs</div>
                          <Text type="secondary">Avg</Text>
                        </div>
                      </Col>

                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <ClockCircleOutlined style={{ color: '#73d13d', fontSize: 20 }} />
                          <div style={{ color: 'white', fontWeight: 600 }}>3 games</div>
                          <Text type="secondary">Top</Text>
                        </div>
                      </Col>

                      <Col span={8}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ width: 28 }} />
                          <div style={{ color: 'white', fontWeight: 600 }}>7d</div>
                          <Text type="secondary">Period</Text>
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
              <Title level={4} style={{ color: 'white' }}>Beautiful by default</Title>
              <Text type="secondary">A clean layout and fast charts make it easy to understand your playtime at a glance.</Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} style={{ borderRadius: 12, background: '#081829' }}>
              <Title level={4} style={{ color: 'white' }}>Privacy-first</Title>
              <Text type="secondary">We only use public Steam data — no account, no tracking.</Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false} style={{ borderRadius: 12, background: '#081829' }}>
              <Title level={4} style={{ color: 'white' }}>Shareable</Title>
              <Text type="secondary">Create a snapshot you can share with friends and socials.</Text>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

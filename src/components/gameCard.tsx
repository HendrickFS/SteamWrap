import { Card, Row, Col, Avatar, Progress, Typography, Space, Tag } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function GameCard({ game }: { game: any }) {
  const percent = game.achievements ? Math.min(100, Math.round((game.achievements.unlocked / Math.max(1, game.achievements.total)) * 100)) : 0;

  return (
    <Card
      hoverable
      bodyStyle={{ padding: 12 }}
      style={{ borderRadius: 10, background: 'transparent', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <Row align="middle" gutter={12}>
        <Col>
          <Avatar src={game.icon} size={56} shape="square" />
        </Col>

        <Col flex="auto">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Title level={5} style={{ margin: 0 }}>{game.name}</Title>
                {game.appid && <Tag style={{ marginLeft: 4 }} color="default">#{game.appid}</Tag>}
              </div>

              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ display: 'block' }}>{game.hours > 0 ? `${game.hours} hrs` : 'Less than 1 hr'}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>in last 2 weeks</Text>
              </div>
            </div>

            {game.achievements && (
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrophyOutlined /> Achievements</Text>
                  <Text type="secondary">{game.achievements.unlocked}/{Math.max(1, game.achievements.total)}</Text>
                </div>
                <Progress percent={percent} strokeColor="#005cd4ff" />
              </div>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
}

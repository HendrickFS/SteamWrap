import { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  message,
  Skeleton,
  Row,
  Col,
  Statistic,
  List,
  Avatar,
  Progress,
  Divider,
  Tag,
} from 'antd';
import { UserOutlined, ClockCircleOutlined, FireOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
import { generateReport as fetchSteamReport } from "../services/steam";

import GameCard from "../components/gameCard";

type Period = "2weeks" | "weekly" | "monthly";

export default function SteamWrapPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  const onFinish = async (values: { steamId: string; period?: Period }) => {
    if (!values.steamId?.trim()) {
      message.error("Please enter a Steam ID");
      return;
    }
    const period: Period = (values.period ?? "2weeks") as Period;

    setLoading(true);
    setReport(null);

    try {
      const rpt = await fetchSteamReport(values.steamId.trim(), period);
      setReport(rpt);
      message.success("Report generated");
    } catch (err: any) {
      console.error("Steam API error", err);
      message.error(
        err?.message || "Failed to fetch Steam report — showing sample data"
      );
      const fake = generateFakeReport(values.steamId.trim(), period);
      setReport(fake);
    } finally {
      setLoading(false);
    }
  };

  const onExportImage = async () => {
    if (!report) return;
    setGeneratingImage(true);
    try {
      const { default: generateReportImage } = await import('../services/reportImage');
      const dataUrl = await generateReportImage(report);
      const a = document.createElement('a');
      a.href = dataUrl;
      const name = (report.steamName || report.steamId || 'steam-report').replace(/[^a-z0-9-_\.]/gi, '_');
      a.download = `${name}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      message.success('Image generated and downloaded');
    } catch (err) {
      console.error('Image generation failed', err);
      message.error('Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <Card
        style={{ width: "100%", maxWidth: 760, borderRadius: 12 }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
          <Title style={{ marginBottom: 8 }} level={3}>
            SteamWrap
          </Title>
          <Paragraph style={{ color: "rgba(255,255,255,0.75)" }}>
            Get a quick snapshot of your recent Steam activity.
          </Paragraph>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 520 }}>
              <Form
                name="steamwrap"
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ period: "2weeks" }}
              >
                <Form.Item
                  name="steamId"
                  label={<Text>Steam ID</Text>}
                  rules={[
                    { required: true, message: "Please input your Steam ID" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="e.g. 76561198000000000"
                  />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<FireOutlined />}
                    >
                      Generate
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => {
                        setReport(null);
                        message.info("Cleared");
                      }}
                    >
                      Clear
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            {loading && <Skeleton active />}

            {!loading && !report && (
              <div
                style={{ textAlign: "center", color: "rgba(255,255,255,0.65)" }}
              >
                <Title level={4}>No report yet</Title>
                <Paragraph>
                  Enter a Steam ID above and click Generate to see your playtime
                  summary.
                </Paragraph>
              </div>
            )}

            {!loading && report && (
              <div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 24,
                    alignContent: "center",
                    justifyContent: "center",
                    gap: 16,
                  }}
                >
                  <Avatar
                    size={80}
                    shape="square"
                    src={report.steamAvatar || undefined}
                    icon={<UserOutlined />}
                    style={{ marginBottom: 16 }}
                  />
                  <h1>{report.steamName}</h1>
                </div>
                <Button type="primary" icon={<DownloadOutlined />} loading={generatingImage} onClick={onExportImage}>
                  Export Report Image
                </Button>
                <div style={{ height: 30}}></div>
                <Title level={4}>Steam 14 Days Report</Title>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card
                      bordered={false}
                      style={{ background: "transparent" }}
                    >
                      <Statistic
                        title="Total Playtime"
                        value={report.totalHours}
                        suffix="Hours"
                      />
                    </Card>
                  </Col>

                  <Col span={8}>
                    <Card
                      bordered={false}
                      style={{ background: "transparent" }}
                    >
                      <Statistic
                        title="Most Played Game"
                        value={report.topGames[0]?.name}
                      />
                    </Card>
                  </Col>

                  <Col span={8}>
                    <Card
                      bordered={false}
                      style={{ background: "transparent" }}
                    >
                      <Statistic
                        title="Total Achievements Unlocked"
                        value={report.detailedGames.reduce(
                          (sum: number, game: any) =>
                            sum + (game.achievements?.unlocked ?? 0),
                          0
                        )}
                      />
                    </Card>
                  </Col>
                </Row>
                {report.detailedGames.length > 0 && (
                  <div>
                    {report.detailedGames.map((game: any, index: number) => (
                      <GameCard key={index} game={game} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function generateFakeReport(steamId: string, period: Period) {
  let periodLabel = "Last 30 days";
  let multiplier = 4;

  if (period === "weekly") {
    periodLabel = "Last 7 days";
    multiplier = 1;
  } else if (period === "2weeks") {
    periodLabel = "Last 2 weeks";
    multiplier = 2;
  }

  const topGames = [
    { name: "Cyber Quest", hours: Math.round(12 * multiplier) },
    { name: "Space Miner", hours: Math.round(8 * multiplier) },
    { name: "Puzzle Island", hours: Math.round(5 * multiplier) },
  ];

  const totalHours = topGames.reduce((s, g) => s + g.hours, 0);

  return {
    steamId,
    period,
    periodLabel,
    topGames,
    totalHours,
  };
}

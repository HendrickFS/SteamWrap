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
  Avatar,
} from 'antd';
import { UserOutlined, FireOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
import { generateReport as fetchSteamReport } from "../services/steam";
import generateReportImage from "../services/reportImage";
import GameCard from "../components/gameCard";

type TopGame = {
  name: string;
  hours?: number;
  icon?: string;
  completion?: number;
  appid?: number;
  img_icon_url?: string;
  img_logo_url?: string;
};

type Report = {
  steamName?: string | null;
  steamId?: string;
  steamAvatar?: string | null;
  totalHours?: number;
  totalAchievements?: number;
  mostPlayedGame?: string;
  topGames?: Array<TopGame>;
  detailedGames?: any[];
};

type Period = "2weeks" | "weekly" | "monthly";

export default function SteamWrapPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [gradientColors, setGradientColors] = useState<string[]>(['#1b0096ff', '#000e3aff', '#000000ff']);

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
      setReport(rpt as any);
      message.success("Report generated");
    } catch (err: any) {
      console.error("Steam API error", err);
      message.error(err?.message || "Failed to fetch Steam report");
    } finally {
      setLoading(false);
    }
  };

  const onExportImage = async () => {
    if (!report) return;
    setGeneratingImage(true);
    try {
      // Normalize data
      const totalAchievements = report.detailedGames?.reduce(
        (sum: number, game: any) => sum + (game.achievements?.unlocked ?? 0),
        0
      ) ?? 0;

      const normalizedTopGames = report.topGames?.map(game => {
        const detailedMatch = report.detailedGames?.find((d: any) => d.name === game.name) as any | undefined;
        const completion = detailedMatch?.achievements
          ? Math.min(100, Math.round((detailedMatch.achievements.unlocked / Math.max(1, detailedMatch.achievements.total)) * 100))
          : (game.completion ?? 0);

        let iconUrl = detailedMatch?.icon ?? game.icon ?? null;
        if (!iconUrl && detailedMatch?.appid && (detailedMatch?.img_icon_url || detailedMatch?.img_logo_url)) {
          const hash = detailedMatch.img_icon_url || detailedMatch.img_logo_url;
          iconUrl = `https://media.steampowered.com/steamcommunity/public/images/apps/${detailedMatch.appid}/${hash}.jpg`;
        }

        return {
          ...game,
          completion: Math.round(completion),
          icon: iconUrl,
        };
      }) ?? [];

      const normalizedReport: Report = {
        ...report,
        totalAchievements,
        mostPlayedGame: report.topGames?.[0]?.name,
        topGames: normalizedTopGames,
      };

      // Generate image client-side (no server proxy required)
  const dataUrl = await generateReportImage(normalizedReport, { preset: 'phone', gradientColors });
      if (!dataUrl) throw new Error('Image generation returned empty');
      const a = document.createElement('a');
      a.href = dataUrl;
      const name = (report.steamName || report.steamId || 'steam-report').replace(/[^a-z0-9-_\.]/gi, '_');
      a.download = `${name}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      message.success('Image generated and downloaded (client)');
    } catch (err) {
      console.error('Image generation failed', err);
      message.error('Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <Card style={{ width: "100%", maxWidth: 760, borderRadius: 12 }} bodyStyle={{ padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
          <Title style={{ marginBottom: 8 }} level={3}>SteamWrap</Title>
          <Paragraph style={{ color: "rgba(255,255,255,0.75)" }}>Get a quick snapshot of your recent Steam activity.</Paragraph>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 520 }}>
              <Form name="steamwrap" layout="vertical" onFinish={onFinish} initialValues={{ period: "2weeks" }}>
                <Form.Item name="steamId" label={<Text>Steam ID</Text>} rules={[{ required: true, message: "Please input your Steam ID" }]}>
                  <Input prefix={<UserOutlined />} placeholder="e.g. 76561198000000000" />
                </Form.Item>
                
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" icon={<FireOutlined />}>Generate</Button>
                    <Button icon={<ReloadOutlined />} onClick={() => { setReport(null); message.info("Cleared"); }}>Clear</Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            {loading && <Skeleton active />}

            {!loading && !report && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.65)" }}>
                <Title level={4}>No report yet</Title>
                <Paragraph>Enter a Steam ID above and click Generate to see your playtime summary.</Paragraph>
              </div>
            )}

            {!loading && report && (
              <div>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginBottom: 12, alignContent: "center", justifyContent: "center", gap: 16 }}>
                  <Avatar size={80} shape="square" src={report.steamAvatar || undefined} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
                  <h1>{report.steamName}</h1>
                </div>

                {/* Gradient selectors placed after data is fetched so users can preview before export */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                  <label style={{ color: 'rgba(255,255,255,0.8)', marginRight: 8, alignSelf: 'center' }}>Gradient:</label>
                  <input type="color" value={gradientColors[0]} onChange={e => setGradientColors(s => { const c = [...s]; c[0] = e.target.value; return c; })} />
                  <input type="color" value={gradientColors[1]} onChange={e => setGradientColors(s => { const c = [...s]; c[1] = e.target.value; return c; })} />
                  <input type="color" value={gradientColors[2]} onChange={e => setGradientColors(s => { const c = [...s]; c[2] = e.target.value; return c; })} />
                </div>

                <Button type="primary" icon={<DownloadOutlined />} loading={generatingImage} onClick={onExportImage}>Export Report Image</Button>
                <div style={{ height: 30 }} />
                <Title level={4}>Steam 14 Days Report</Title>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}><Card bordered={false} style={{ background: 'transparent' }}><Statistic title="Total Playtime" value={report.totalHours} suffix="Hours" /></Card></Col>
                  <Col span={8}><Card bordered={false} style={{ background: 'transparent' }}><Statistic title="Most Played Game" value={report.topGames?.[0]?.name} /></Card></Col>
                  <Col span={8}><Card bordered={false} style={{ background: 'transparent' }}><Statistic title="Total Achievements Unlocked" value={report.detailedGames?.reduce((sum: number, game: any) => sum + (game.achievements?.lastTwoWeeksCount ?? 0), 0)} /></Card></Col>
                </Row>
                {report.detailedGames && report.detailedGames.length > 0 && (
                  <div>{report.detailedGames.map((game: any, index: number) => (<GameCard key={index} game={game} />))}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
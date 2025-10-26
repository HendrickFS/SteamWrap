import Footer from '../components/Footer';

import { Card, Typography, Divider, Alert, List } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function TutorialPage() {
    return (
        <div style={{ padding: 24, minHeight: '100vh', maxWidth: 1000, margin: '0 auto' }}>
            <Card style={{ borderRadius: 12 }}>
                <Title level={2}>How to use SteamWrap</Title>

                <Paragraph>
                    This guide shows how to locate your Steam ID, ensure your profile is public, change the gradient colors in the app, and generate/export your SteamWrap image.
                </Paragraph>

                <Divider />

                <Title level={4}>1) Find your Steam ID</Title>
                <Paragraph>
                    SteamWrap accepts either a Steam Community numeric ID (SteamID64) or a custom profile name. To find it:
                </Paragraph>

                <List
                    size="small"
                    dataSource={[
                        'Open Steam and click your profile (top-right > View Profile).',
                        'If your profile URL shows /profiles/ followed by a long number (e.g. /profiles/76561197960287930) that number is your SteamID64 — you can paste it into SteamWrap.',
                        'You can also find your ID accessing your account details: Your Username (top right corner) > Account Details, your ID will be right below your username.',
                    ]}
                    renderItem={item => <List.Item>- <Text>{item}</Text></List.Item>}
                />

                <Divider />

                <Title level={4}>2) Make sure your profile is public</Title>
                <Paragraph>
                    SteamWrap uses public Steam profile data. If your profile or game details are private, the app won't be able to read your playtime or achievements.
                </Paragraph>
                <List
                    size="small"
                    dataSource={[
                        'On Steam, go to your profile → Edit Profile → My Privacy Settings.',
                        'Set Profile Status to Public.',
                        'Also set Game Details to Public if you want playtime and achievement info to be available.',
                    ]}
                    renderItem={item => <List.Item>- <Text>{item}</Text></List.Item>}
                />

                <Divider />

                <Title level={4}>3) Generate a report in SteamWrap</Title>
                <Paragraph>
                    Go to the <Text strong>Steam Wrap</Text> page, paste your Steam ID or custom profile name into the <Text code>Steam ID</Text> field and click <Text strong>Generate</Text>.
                    If the profile is public and data is available, the app will fetch your recent playtime summary and show a preview.
                </Paragraph>
                <Alert
                    style={{ marginTop: 12 }}
                    message="Common issue"
                    description="If you see an error saying the Steam data is invalid, double-check that the Steam ID is correct and the profile & game details are public."
                    type="warning"
                    showIcon
                />

                <Divider />

                <Title level={4}>4) Customize the gradient colors</Title>
                <Paragraph>
                    After a successful report fetch on the Steam Wrap page, three color pickers appear above the <Text code>Export Report Image</Text> button.
                    Use these to pick the three colors for the vertical gradient background that will be used in the generated image. Try combining a dark base, a mid tone and an accent color for best results.
                </Paragraph>

                <Divider />

                <Title level={4}>5) Export the image</Title>
                <Paragraph>
                    After selecting your colors, click the <Text strong>Export Report Image</Text> button. The PNG is generated client-side in your browser and downloaded automatically.
                </Paragraph>

                <Alert
                    style={{ marginTop: 12 }}
                    message="All done!"
                    description="You now have your cool SteamWrap image ready to share on socials or save for later. Enjoy it!"
                    type="success"
                    showIcon
                />
            </Card>
        </div>
    );
}
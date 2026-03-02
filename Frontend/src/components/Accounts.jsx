import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, Col, Row, Typography, Button, Avatar, Statistic, Modal, InputNumber, message } from "antd";
import { UserOutlined } from '@ant-design/icons';
import { getMyAccount } from "../api/accounts";
import { deposit, withdraw } from "../api/accounts";
const { Title, Text } = Typography;

export default function Accounts() {
    const { me } = useAuth();
    const [account, setAccount] = useState(null);
    const [amount, setAmount] = useState(0);
    const [openDeposit, setOpenDeposit] = useState(false);
    const [openWithdraw, setOpenWithdraw] = useState(false);

    useEffect(() => {
        async function load() {
            const a = await getMyAccount();
            setAccount(a);
        }
        load();
    }, []);

    const { gainPct, gainColor, gainPrefix, riskColor } = useMemo(() => {
        if (!account) {
            return { gainPct: 0, gainColor: undefined, gainPrefix: "", riskColor: undefined };
        }

        const start = Number(account.startBalance);
        const current = Number(account.balance); // NOTE: your field is "balance", not "currentBalance"
        const pct = start > 0 ? ((current - start) / start) * 100 : 0;

        const isGain = pct >= 0;
        const gainColorLocal = isGain ? "#52c41a" : "#ff4d4f"; // green / red
        const gainPrefixLocal = isGain ? "+" : "-";

        const risk = Number(account.riskLevel);
        const riskColorLocal =
            risk === 1 ? "#52c41a" : risk === 2 ? "#faad14" : "#ff4d4f"; // green/yellow/red

        return {
            gainPct: Math.abs(pct),
            gainColor: gainColorLocal,
            gainPrefix: gainPrefixLocal,
            riskColor: riskColorLocal,
        };
    }, [account]);

    async function handleDeposit() {
        try {
            const updated = await deposit(account.id, amount);
            setAccount(updated);            // updates UI instantly
            setOpenDeposit(false);
            setAmount(0);
        } catch (e) {
            message.error("Deposit failed");
        }
    }

    async function handleWithdrawal() {
        try {
            const updated = await withdraw(account.id, amount);
            setAccount(updated);
            setOpenWithdraw(false);
            setAmount(0);
        } catch (e) {
            // If backend returns ValidationError, you can show that message
            const msg = e?.response?.data?.amount?.[0] ?? "Withdraw failed";
            message.error(msg);
        }
    }

    return (
        <Row gutter={[16, 16]} justify="center">
            <Col lg={12} span={24}>
                <Card style={{ width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <Avatar shape="square" size={64} icon={<UserOutlined />} />
                        <div>
                            <Title level={4} style={{ margin: 0 }}>
                                {me?.username ?? "User"}
                            </Title>
                            <Text type="secondary">Account Details</Text>
                        </div>
                    </div>

                    {!account ? (
                        <Text type="secondary">Loading...</Text>
                    ) : (
                            <div>
                                <Row gutter={[16, 16]} justify="center">
                                    <Col lg={12}>
                                        <Card style={{ width: "100%" }}>
                                            <Statistic title="Start Balance" value={account.startBalance} precision={2} prefix="$"/>
                                        </Card>
                                    </Col>

                                    <Col lg={12}>
                                        <Card style={{ width: "100%" }}>
                                            <Statistic title="Current Balance" value={account.balance} precision={2} prefix="$"/>
                                        </Card>
                                    </Col>

                                    <Col lg={8} >
                                        <Card style={{ width: "100%" }}>
                                            <Statistic
                                                title="Gain/Loss"
                                                value={gainPct}
                                                precision={2}
                                                suffix="%"
                                                valueStyle={{ color: gainColor }}
                                                prefix={gainPrefix}
                                            />
                                        </Card>
                                    </Col>

                                    <Col lg={8}>
                                        <Card style={{ width: "100%" }}>
                                            <Statistic title="Withdrawal Threshold" value={account.thresholdPercentage} precision={2} suffix="%" />
                                        </Card>
                                    </Col>

                                    <Col lg={8} xs={24}>
                                        <Card style={{ width: "100%" }}>
                                            <Statistic
                                                title="Risk Level"
                                                value={Number(account.riskLevel)}
                                                valueStyle={{ color: riskColor }}
                                            />
                                        </Card>
                                    </Col>

                                    <Col lg={6} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        <Button
                                            onClick={() => setOpenWithdraw(true)}
                                        >
                                            Withdrawal
                                        </Button>
                                    </Col>

                                    <Col lg={6} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        <Button
                                            onClick={() => setOpenDeposit(true)}
                                        >
                                            Deposit
                                        </Button>
                                    </Col>
                                </Row>
                                <Modal
                                    title="Deposit"
                                    open={openDeposit}
                                    onOk={handleDeposit}
                                    onCancel={() => setOpenDeposit(false)}
                                    okText="Deposit"
                                >
                                    <InputNumber min={0} style={{ width: "100%" }} value={amount} onChange={setAmount} />
                                </Modal>

                                <Modal
                                    title="Withdraw"
                                    open={openWithdraw}
                                    onOk={handleWithdrawal}
                                    onCancel={() => setOpenWithdraw(false)}
                                    okText="Withdraw"
                                >
                                    <InputNumber min={0} style={{ width: "100%" }} value={amount} onChange={setAmount} />
                                </Modal>
                        </div>
                    )}
                </Card>
            </Col>
        </Row>

    );
}
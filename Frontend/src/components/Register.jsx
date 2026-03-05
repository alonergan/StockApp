// src/components/Register.jsx
import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Row,
  Segmented,
  Space,
  Typography,
  Tooltip,
} from "antd";
import AuthShell from "./AuthShell";
import { registerUser } from "../api/auth";

const { Title, Text } = Typography;

const riskOptions = [
  { label: "Low", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "High", value: 3 },
];

function riskDescription(level) {
  switch (level) {
    case 1:
      return "Low: cautious trading with limited exposure.";
    case 2:
      return "Moderate: balanced settings (recommended default).";
    case 3:
      return "High: more trades and higher exposure to volatility.";
    default:
      return "";
  }
}

function formatApiError(e) {
  if (e?.message === "Network Error") {
    return (
      "Network Error: The frontend could not reach the backend.\n\n" +
      "Most common causes:\n" +
      "• Django server is not running on http://127.0.0.1:8000\n" +
      "• API base URL is wrong in Frontend .env/.env.local\n" +
      "• CORS is not allowed for http://localhost:5173\n"
    );
  }

  const data = e?.response?.data;
  if (data) {
    if (typeof data === "string") return data;
    try {
      const parts = [];
      for (const [k, v] of Object.entries(data)) {
        const msg = Array.isArray(v) ? v.join(" ") : String(v);
        parts.push(`${k}: ${msg}`);
      }
      return parts.length ? parts.join(" | ") : JSON.stringify(data);
    } catch {
      return "Registration failed (could not parse server error).";
    }
  }

  return e?.message || "Registration failed. Check Network tab and Django logs.";
}

export default function Register() {
  const nav = useNavigate();

  const [error, setError] = useState("");
  const [riskLevel, setRiskLevel] = useState(3);
  const [thresholdPct, setThresholdPct] = useState(1.0);
  const [submitting, setSubmitting] = useState(false);

  const walkthrough = useMemo(() => {
    return (
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Text>
          <b>Risk level</b> controls how aggressively the system trades.
        </Text>
        <Text>
          <b>Threshold %</b> defines when to stop automatic trading and divest all holdings allowing you to withdrawal your funds.
        </Text>
      </Space>
    );
  }, [riskLevel]);

  async function onFinish(values) {
    setError("");
    setSubmitting(true);

    const payload = {
      username: values.username,
      password: values.password,
      startBalance: Number(values.startBalance),
      riskLevel: values.riskLevel,
      thresholdPercentage: Number(values.thresholdPercentage),
    };

    try {
      await registerUser(payload);
      nav("/login");
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title=""
      footer={
        <div style={{ textAlign: "center" }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      }
    >
      {/* Break out of any narrow AuthShell max-width */}
      <div
        style={{
          width: "100vw",
          marginLeft: "calc(50% - 50vw)",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            boxSizing: "border-box",
          }}
        >
          <Row gutter={[24, 24]} align="stretch" wrap>
            <Col xs={24} lg={14} style={{ minWidth: 0 }}>
              <Card style={{ height: "100%", borderRadius: 14, width: "100%" }}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <Title level={2} style={{ margin: 0 }}>
                    Create your account
                  </Title>

                  <Form
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                      username: "",
                      password: "",
                      startBalance: 1000,
                      riskLevel: 3,
                      thresholdPercentage: 1.0,
                    }}
                  >
                    <Form.Item
                      label="Username"
                      name="username"
                      rules={[
                        { required: true, message: "Enter a username." },
                        { min: 3, message: "Username must be at least 3 characters." },
                      ]}
                    >
                      <Input placeholder="Username" autoComplete="username" />
                    </Form.Item>

                    <Form.Item
                      label="Password"
                      name="password"
                      rules={[
                        { required: true, message: "Enter a password." },
                        { min: 8, message: "Password must be at least 8 characters." },
                      ]}
                    >
                      <Input.Password placeholder="Password" autoComplete="new-password" />
                    </Form.Item>

                    <Row gutter={12} style={{ width: "100%" }}>
                      <Col xs={24} sm={12} style={{ minWidth: 0 }}>
                        <Form.Item
                          label={
                            <Tooltip title="Starting cash balance for your simulated trading account.">
                              Start Balance
                            </Tooltip>
                          }
                          name="startBalance"
                          rules={[{ required: true, message: "Enter a starting balance." }]}
                        >
                          <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            step={100}
                            formatter={(v) => `$ ${v}`}
                            parser={(v) => Number(String(v).replace(/[^\d.]/g, ""))}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12} style={{ minWidth: 0 }}>
                        <Form.Item
                          label={
                            <Tooltip title="Minimum threshold (%) to trigger automatic divestment of all holdings">
                              Threshold %
                            </Tooltip>
                          }
                          name="thresholdPercentage"
                          rules={[{ required: true, message: "Set a threshold percentage." }]}
                        >
                          <InputNumber
                            style={{ width: "100%" }}
                            min={0.1}
                            max={25}
                            step={0.1}
                            formatter={(v) => `${v}%`}
                            parser={(v) => Number(String(v).replace("%", ""))}
                            onChange={(v) => setThresholdPct(v ?? 0)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      label={
                        <Tooltip title="Higher risk generally means more trades and more exposure to volatility.">
                          Risk Level
                        </Tooltip>
                      }
                      name="riskLevel"
                      rules={[{ required: true, message: "Select a risk level." }]}
                    >
                      <Segmented block options={riskOptions} onChange={(v) => setRiskLevel(v)} />
                    </Form.Item>

                    <Space size="middle" style={{ display:"flex", justifyContent: "center", textAlign: "center", marginBottom: "20px"}}>
                        <Text>{riskDescription(riskLevel)}</Text>
                    </Space>

                    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                      <Button type="primary" htmlType="submit" block loading={submitting}>
                        Create account
                      </Button>

                      {error && (
                        <Alert
                          type="error"
                          showIcon
                          message="Registration failed"
                          description={<pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{error}</pre>}
                        />
                      )}
                    </Space>
                  </Form>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={10} style={{ minWidth: 0 }}>
              <Card style={{ height: "100%", borderRadius: 14, width: "100%" }}>
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Title level={4} style={{ margin: 0 }}>
                    Quick walkthrough
                  </Title>

                  <Alert
                    type="info"
                    showIcon
                    message={`Current settings: Risk ${riskLevel}/3, Threshold ${thresholdPct}%`}
                    description="These settings can usually be changed later, but pick something reasonable to start."
                  />

                  <Collapse
                    defaultActiveKey={["1"]}
                    items={[
                      { key: "1", label: "What do Risk Level and Threshold mean?", children: walkthrough },
                      {
                        key: "2",
                        label: "Simple rule of thumb",
                        children: (
                          <Text>
                            Cautious Investor -> <b>Low Risk Level</b><br />
                            Balanced Investor -> <b>Moderate Risk Level</b><br />
                            Risky Investor -> <b>High Risk Level</b>
                          </Text>
                        ),
                      },
                    ]}
                  />
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </AuthShell>
  );
}
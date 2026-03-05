import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Alert, Space } from "antd";
import { useAuth } from "../context/AuthContext";
import AuthShell from "./AuthShell";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState("");

  async function onFinish(values) {
    setError("");
    try {
      await login(values.username, values.password);
      nav("/dashboard");
    } catch {
      setError("Invalid username or password.");
    }
  }

  return (
    <AuthShell
      title="Login"
      footer={
        <div>
          No account? <Link to="/register">Register</Link>
        </div>
      }
    >
      <Form layout="vertical" onFinish={onFinish} style={{ display: "grid", gap: 10 }}>
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: "Please enter your username." }]}
        >
          <Input placeholder="Username" autoComplete="username" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter your password." }]}
        >
          <Input.Password placeholder="Password" autoComplete="current-password" />
        </Form.Item>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button type="primary" htmlType="submit" block>
            Sign in
          </Button>

          {error && <Alert type="error" showIcon message={error} />}
        </Space>
      </Form>
    </AuthShell>
  );
}
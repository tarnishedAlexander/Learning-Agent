import { useState } from "react";
import { App, Button, Checkbox, Form, Input, Typography, Card } from "antd";
import { Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export type LoginValues = {
  email: string;
  password: string;
  remember?: boolean;
};

type Props = {
  onSubmit?: (values: LoginValues) => Promise<void> | void;
};

const { Title, Text } = Typography;

export default function LoginPage({ onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const handleFinish = async (values: LoginValues) => {
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        const response = await login(values);
      }
      navigate("/", { replace: true });
    } catch (e: any) {
      message.error(e?.message ?? "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#f6f9ff] overflow-hidden flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 w-full">
        {/* Columna izquierda: formulario */}
        <div className="flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <Title level={2} className="!m-0">
                Login
              </Title>
              <Text type="secondary">
                Welcome to log in to your learning agent system.
              </Text>
            </div>

            <Card className="shadow-none border-0 bg-transparent p-0">
              <Form
                name="login"
                layout="vertical"
                size="large"
                onFinish={handleFinish}
                disabled={loading}
                requiredMark={false}
                className="[&_.ant-form-item-label>label]:!text-slate-600"
              >
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Ingresa tu email" },
                    { type: "email", message: "Email inválido" },
                  ]}
                >
                  <Input
                    autoComplete="email"
                    placeholder="correo@empresa.com"
                    prefix={<Mail size={18} aria-hidden />}
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Ingresa tu contraseña" },
                    { min: 6, message: "Mínimo 6 caracteres" },
                  ]}
                >
                  <Input.Password
                    autoComplete="current-password"
                    placeholder="••••••••"
                    prefix={<Lock size={18} aria-hidden />}
                  />
                </Form.Item>

                <div className="flex items-center justify-between -mt-2 mb-4">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>Remember me</Checkbox>
                  </Form.Item>
                  <a
                    className="text-sm text-blue-600 hover:underline"
                    href="#/forgot"
                  >
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  className="!h-11"
                >
                  LOGIN
                </Button>
              </Form>
            </Card>
          </div>
        </div>

        {/* Columna derecha: ilustración y panel */}
        <div className="hidden md:flex relative items-center justify-center bg-gradient-to-tr from-blue-50 via-indigo-50 to-white">
          {/* Fondo ilustrado */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 via-indigo-50 to-white" />

          {/* Ilustración abstracta */}
          <div className="relative h-full w-full grid place-items-center p-10">
            <div className="w-full max-w-xl aspect-[16/10] rounded-2xl bg-white shadow-xl ring-1 ring-blue-100 p-6">
              <div className="grid grid-cols-3 gap-3 h-full">
                <div className="col-span-2 space-y-3">
                  <div className="h-6 w-24 rounded bg-blue-100" />
                  <div className="h-40 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-3 rounded bg-blue-100" />
                    <div className="h-3 rounded bg-blue-100" />
                    <div className="h-3 rounded bg-blue-100" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-28 rounded bg-indigo-100" />
                  <div className="h-10 rounded bg-blue-100" />
                  <div className="h-6 rounded bg-indigo-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

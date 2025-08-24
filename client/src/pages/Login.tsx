import { useState } from "react";
import { App, Button, Checkbox, Form, Input, Typography } from "antd";
import { Link, useNavigate } from "react-router-dom";
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
      if (onSubmit) await onSubmit(values);
      else await login(values);
      navigate("/", { replace: true });
    } catch (e: any) {
      message.error(e?.message ?? "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-12 bg-white/0">
        <section className="md:col-span-4 flex flex-col items-center justify-center px-5 sm:px-10 md:px-12 lg:px-20 py-10">
          <div className="mb-8 mx-8">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              Log in.
            </h1>
            <p className="text-slate-500 mt-2">
              Log in with your data that you entered during your registration
            </p>
          </div>

          <Form
            name="login"
            layout="vertical"
            size="large"
            onFinish={handleFinish}
            disabled={loading}
            requiredMark={false}
            className="w-80 px-5 [&_.ant-form-item-label>label]:!text-slate-700"
          >
            <Form.Item
              label="Enter your email address"
              name="email"
              rules={[
                { required: true, message: "Ingresa tu email" },
                { type: "email", message: "Email inválido" },
              ]}
            >
              <Input
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              label="Enter your password"
              name="password"
              rules={[
                { required: true, message: "Ingresa tu contraseña" },
                { min: 8, message: "Al menos 8 caracteres" },
              ]}
            >
              <Input.Password
                placeholder="atleast 8 characters"
                autoComplete="current-password"
              />
            </Form.Item>

            <div className="flex items-center justify-between mt-1 mb-4">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              <Link to="/forgot" className="text-violet-700 hover:underline">
                Forget password?
              </Link>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="mb-4 !h-12 !w-full !text-base !font-semibold !bg-violet-700 hover:!bg-violet-600"
            >
              Log in
            </Button>

            <p className="mt-4 text-slate-500">
              Don’t have an account?{" "}
              <Link to="/register" className="text-violet-700 font-medium">
                Register
              </Link>
            </p>
          </Form>
        </section>

        <div className="hidden md:block md:col-span-1">
          <div className="h-full w-px bg-slate-200 mx-auto" />
        </div>

        <section className="md:col-span-8 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-[#F3ECFF]" />
          <div className="relative w-full h-full flex flex-col items-center justify-center px-8 lg:px-16 py-10 text-center">
            <p className="text-slate-600 text-lg">Nice to see you again</p>
            <h2 className="mt-1 text-5xl font-extrabold text-violet-700 tracking-tight">
              Welcome back
            </h2>

            <img
              src="/src/assets/login4.svg"
              alt="Welcome illustration"
              className="mt-8 w-[80%] max-w-2xl h-auto"
            />

            <div className="pointer-events-none absolute inset-0">
              <span className="absolute right-10 top-20 h-6 w-6 rounded-full bg-white/50" />
              <span className="absolute right-24 top-48 h-3 w-3 rounded-full bg-white/50" />
              <span className="absolute right-40 top-28 h-4 w-4 rounded-full bg-white/50" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

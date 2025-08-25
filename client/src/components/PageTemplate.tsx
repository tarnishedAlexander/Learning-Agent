import { type ReactNode } from "react";
import { Avatar, Breadcrumb, Divider, Typography } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useThemeStore } from "../store/themeStore";

const { Title, Text } = Typography;

type UserInfo = {
  name: string;
  role?: string;
  avatarUrl?: string;
};

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  user?: UserInfo;
  breadcrumbs?: { label: ReactNode; href?: string }[];
  actions?: ReactNode;
  children: ReactNode;
};
export default function PageTemplate({
  user,
  actions,
  children,
}: Props) {
  const { theme, setTheme } = useThemeStore();

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    // Contenedor de página: sin scroll global
    <div className="h-screen overflow-hidden flex flex-col">
      {/* HEADER (no crece, no se colapsa) */}
      <header className="shrink-0 space-y-4 px-4 md:px-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb
                className="mb-1"
                items={breadcrumbs.map((b) => ({
                  title: b.href ? <a href={b.href as string}>{b.label}</a> : b.label,
                }))}
              />
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <Title level={2} className="!m-0">
                {title}
              </Title>
              {actions && <div className="ml-auto md:hidden">{actions}</div>}
            </div>
            {subtitle && (
              <Text type="secondary" className="block mt-1">
                {subtitle}
              </Text>
            )}
          </div>

          <div className="flex items-center gap-4">
            {actions && <div className="hidden md:block">{actions}</div>}
            {user && (
              <div className="flex items-center gap-3 bg-[var(--ant-colorBgContainer)] rounded-2xl px-3 py-2 shadow-sm ring-1 ring-[var(--ant-colorBorder)]">
                <button
                  onClick={toggleTheme}
                  className="p-1 rounded-full hover:bg-[var(--ant-colorBgTextHover)]"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <MoonOutlined /> : <SunOutlined />}
                </button>
                <Avatar size={40} src={user.avatarUrl} />
                <div className="leading-tight">
                  <div className="font-medium">{user.name}</div>
                  {user.role && <div className="text-xs text-slate-500">{user.role}</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        <Divider className="!my-2" />
      </header>
 
      <main className="flex-1 min-h-0 overflow-y-auto px-0 md:px-0">
        <div className="px-0 md:px-0">{children}</div>
      </main>
    </div>
  );
}

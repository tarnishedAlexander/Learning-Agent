import { Layout, Menu, ConfigProvider, Avatar } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  BookOutlined ,
  FileAddOutlined,
  CloudUploadOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { useThemeStore } from "../store/themeStore";

const { Sider, Content } = Layout;

const navItems = [
  { key: "/", icon: <HomeOutlined />, label: <Link to="/">Home</Link> },
  { 
    key: "/classes", 
    icon: <BookOutlined />, 
    label: <Link to="/classes">Clases</Link> 
  },
  { 
    key: "/courses", 
    icon: <SolutionOutlined />, 
    label: <Link to="/courses">Materias</Link> 
  },
  {
    key: "/upload-pdf",
    icon: <CloudUploadOutlined />,
    label: <Link to="/upload-pdf">Documentos</Link>,
  },
  {
    key: "/curso/1",
    icon: <TeamOutlined />,
    label: <Link to="/curso/1">Estudiantes</Link>,
  },
  {
    key: "/exams/create",
    icon: <FileAddOutlined />,
    label: <Link to="/exams/create">Crear Examen</Link>,
  },
  {
    key: "/clases",
    icon: <TeamOutlined />,
    label: <Link to="/clases">Clases</Link>,
  },
    {
    key: "/classes-student",
    icon: <TeamOutlined />,
    label: <Link to="/classes-student">Clases Estudiante</Link>,
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: <Link to="/settings">Settings</Link>,
  }
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const [systemTheme, setSystemTheme] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const currentTheme = useMemo(
    () => (theme === "system" ? systemTheme : theme),
    [theme, systemTheme]
  );

  const selectedKey = useMemo(() => {
    const match = navItems.find((i) =>
      i.key === "/" ? pathname === "/" : pathname.startsWith(i.key)
    );
    return match?.key ?? "/";
  }, [pathname]);

  return (
    <Layout className="h-screen">
      <Sider
        width={260}
        collapsedWidth={96}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme={currentTheme}
        trigger={null}
        className="bg-[var(--ant-colorBgLayout)]"
      >
        <div className="h-full ">
          <div className="h-full w-full pb-2 bg-[var(--ant-colorBgContainer)] shadow-sm ring-1 ring-[var(--ant-colorBorder)] flex flex-col overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <div className="text-xl font-semibold tracking-tight">
                LEARNING ISC
              </div>
            </div>

            <ConfigProvider
              theme={{
                components: {
                  Menu: {
                    itemBorderRadius: 12,
                    itemHeight: 44,
                    itemPaddingInline: 12,
                    itemSelectedBg: "#B2B0E8",
                    itemSelectedColor: "#0f172a",
                    itemHoverBg: "rgba(15, 23, 42, 0.04)",
                    activeBarWidth: 0,
                  },
                },
              }}
            >
              <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={navItems}
                className="px-3"
                style={{
                  borderInlineEnd: 0,
                  flex: 1,
                  overflowY: "auto",
                }}
              />
            </ConfigProvider>

            <div className="px-5 pt-6 pb-2 mt-auto mb-2">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    className="p-1 rounded-full hover:bg-[var(--ant-colorBgElevated)]"
                    aria-label="Toggle theme"
                  >
                    {theme === "light" ? <MoonOutlined /> : <SunOutlined />}
                  </button>
                  <Avatar
                    size={64}
                    src="https://i.pravatar.cc/128?img=5"
                    className="ring-2 ring-white shadow"
                  />
                </div>
                <div className="mt-3 font-semibold">Nora Watson</div>
                <div className="text-xs text-slate-500">Sales Manager</div>
              </div>
            </div>

            <button
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
              className="mx-auto mb-5 my-5 py-5 flex items-center justify-center gap-3 h-10 px-4 rounded-xl text-[var(--ant-colorText)] hover:bg-[var(--ant-colorBgElevated)]"
            >
              <LogoutOutlined />
              <span className="text-sm">Log Out</span>
            </button>
          </div>
        </div>
      </Sider>

      <Layout className="flex flex-col min-h-0">
        <Content className="flex-1 min-h-0 overflow-hidden pt-4 md:p-6 bg-[var(--ant-colorBgLayout)]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

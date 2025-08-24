import { Layout, Menu, ConfigProvider, theme as antdTheme, Avatar } from "antd";
import { HomeOutlined, TeamOutlined, LogoutOutlined } from "@ant-design/icons";
import { type PropsWithChildren, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { clearAuth } from "../utils/storage";

const { Sider, Header, Content, Footer } = Layout;

const navItems = [
  { key: "/", icon: <HomeOutlined />, label: <Link to="/">Clases</Link> },
  {
    key: "/curso/1",
    icon: <TeamOutlined />,
    label: <Link to="/curso/1">Estudiantes</Link>,
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
];

export default function AppLayout({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false);
  const { token } = antdTheme.useToken();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const selectedKey = useMemo(() => {
    const match = navItems.find((i) =>
      i.key === "/" ? pathname === "/" : pathname.startsWith(i.key)
    );
    return match?.key ?? "/";
  }, [pathname]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={260}
        collapsedWidth={96}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        trigger={null}
        className="bg-[var(--ant-colorBgLayout)]"
      >
        <div className="h-full ">
          <div className="h-full w-full pb-2 bg-white shadow-sm ring-1 ring-slate-100 flex flex-col overflow-hidden">
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
                <Avatar
                  size={64}
                  src="https://i.pravatar.cc/128?img=5"
                  className="ring-2 ring-white shadow"
                />
                <div className="mt-3 font-semibold">Nora Watson</div>
                <div className="text-xs text-slate-500">Sales Manager</div>
              </div>
            </div>

            <button
              onClick={() => {
                clearAuth();
                navigate("/login", { replace: true });
              }}
              className="mx-auto mb-5 my-5 py-5 flex items-center justify-center gap-3 h-10 px-4 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              <LogoutOutlined />
              <span className="text-sm">Log Out</span>
            </button>
          </div>
        </div>
      </Sider>

      <Layout className="flex flex-col">
        <Content className="flex-1 p-4 md:p-6 bg-[var(--ant-colorBgLayout)]">
          <Outlet />
        </Content>

        <Footer className="text-center text-slate-400">
          © {new Date().getFullYear()} ISC
        </Footer>
      </Layout>
    </Layout>
  );
}

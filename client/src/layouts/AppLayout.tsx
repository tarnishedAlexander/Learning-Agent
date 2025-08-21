import { Layout, Menu, theme as antdTheme } from "antd";
import { HomeOutlined, TeamOutlined, LogoutOutlined } from "@ant-design/icons";
import { type PropsWithChildren, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";

const { Sider, Header, Content, Footer } = Layout;

const items = [
  { key: "/", icon: <HomeOutlined />, label: <Link to="/">Clases</Link> },
  {
    key: "/curso/1",
    icon: <TeamOutlined />,
    label: <Link to="/curso/1">Estudiantes</Link>,
  },
];

export default function AppLayout({ children }: PropsWithChildren) {
  const [collapsed, setCollapsed] = useState(false);
  const { token } = antdTheme.useToken();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
      >
        <div className="h-16 flex items-center justify-center font-semibold text-[--ant-colorPrimary]">
          PEL INC
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={items}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Header className="flex items-center justify-between bg-white shadow-sm px-4">
          <div className="font-semibold">Panel</div>
          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white"
            style={{ background: token.colorPrimary }}
          >
            <LogoutOutlined /> Salir
          </button>
        </Header>

        <Content className="p-4 md:p-6 bg-[var(--ant-colorBgLayout)]">
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            {children}
          </div>
        </Content>

        <Footer className="text-center text-slate-400">
          © {new Date().getFullYear()} PEL INC
        </Footer>
      </Layout>
    </Layout>
  );
}

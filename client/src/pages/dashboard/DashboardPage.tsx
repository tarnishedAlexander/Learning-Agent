import { Button, Card, Row, Col } from "antd";
import PageTemplate from "../../components/PageTemplate";
import { formatTodayEs } from "../../utils/date";
import StudentHome from "./StudentHome";
import ProfessorHome from "./ProfessorHome";

export default function DashboardPage() {
  return (
    <PageTemplate
      title="Dashboard"
      subtitle={
        "Welcome back — focus on what moves the needle. " + formatTodayEs()
      }
      user={{
        name: "Nora Watson",
        role: "Sales Manager",
        avatarUrl: "https://i.pravatar.cc/128?img=5",
      }}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
    >
      <ProfessorHome />
    </PageTemplate>
  );
}

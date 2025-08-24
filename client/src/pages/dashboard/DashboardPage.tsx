import { Button, Card, Row, Col } from "antd";
import PageTemplate from "../../components/PageTemplate";
import { formatTodayEs } from "../../utils/date";

export default function DashboardPage() {
  return (
    <PageTemplate
      title="Dashboard"
      subtitle={formatTodayEs()}
      user={{
        name: "Nora Watson",
        role: "Sales Manager",
        avatarUrl: "https://i.pravatar.cc/128?img=5",
      }}
      actions={
        <div className="flex gap-2">
          <Button>Export</Button>
          <Button type="primary">Upgrade</Button>
        </div>
      }
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Total Earning">242.65K</Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Average Earning">17.347K</Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Conversion Rate">74.86%</Card>
        </Col>
        <Col span={24}>
          <Card title="Regular Sell">…tu gráfico…</Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Top Store">…tabla…</Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Team Member">…lista…</Card>
        </Col>
      </Row>
    </PageTemplate>
  );
}

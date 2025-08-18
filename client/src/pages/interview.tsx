
import { Card, Typography, Button } from "antd";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;

export default function interview() {
  return (
    <div style={{ padding: 24 }}>
      <Card style={{ borderRadius: 12, maxWidth: 800, margin: "0 auto" }}>
        <Title level={3}>Entrevista</Title>
        <Text>Próximamente: simulaciones y tips para entrevistas técnicas y académicas.</Text>

        <div style={{ marginTop: 24 }}>
          <Link to="/reinforcement">
            <Button>Volver</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

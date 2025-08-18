import { useMemo, useState } from "react";
import useClasses from "../hooks/useClasses";
import { Card, Row, Col, Input, Button, Space, Empty } from "antd";
import { CursosForm } from "../components/cursosForm";
import type { Clase } from "../interfaces/claseInterface";
import { useNavigate } from "react-router-dom";

function parseISO(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d);
}

export function ClassMenu() {
  const { clases, addClases } = useClasses(); 
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const goToReinforcement = () => {
    navigate('/reinforcement');
  };

  
  const clasesSafe = useMemo<Clase[]>(
    () => (Array.isArray(clases) ? clases : []),
    [clases]
  );

  
  const filteredClases = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clasesSafe;
    return clasesSafe.filter((cl) => (cl.Name ?? "").toLowerCase().includes(term));
  }, [clasesSafe, searchTerm]);

  
  const { cursosActuales, cursosPasados } = useMemo(() => {
    const now = new Date();
    const byEndDesc = (a: Clase, b: Clase) =>
      parseISO(b.end_date).getTime() - parseISO(a.end_date).getTime();

    const actuales = filteredClases
      .filter((cl) => parseISO(cl.end_date) >= now)
      .sort(byEndDesc);

    const pasados = filteredClases
      .filter((cl) => parseISO(cl.end_date) < now)
      .sort(byEndDesc);

    return { cursosActuales: actuales, cursosPasados: pasados };
  }, [filteredClases]);

  const handleAddClase = async (values: Omit<Clase, "id">) => {
    await addClases(values);
  };

  const goToStudents = (id: string) => navigate(`curso/${id}`);

  const renderGrid = (items: Clase[]) =>
    items.length ? (
      <Row gutter={[16, 16]}>
        {items.map((clase) => (
          <Col xs={24} sm={12} md={8} lg={6} key={clase.id}>
            <Card
              hoverable
              onClick={() => goToStudents(clase.id)}
              style={{ width: "100%", height: 200, textAlign: "center", borderRadius: 20 }}
            >
              <h2>{clase.Name}</h2>
              <p>Inicio: {String(clase.start_date)}</p>
              <p>Fin: {String(clase.end_date)}</p>
            </Card>
          </Col>
        ))}
      </Row>
    ) : (
      <Empty description="No hay cursos" />
    );

  return (
    <div>
      <CursosForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddClase}
      />

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <Space>
          <Input
            placeholder="Buscar curso"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
        </Space>
        <Button type="primary" onClick={() => setModalOpen(true)}>Añadir</Button>
        <Button type="primary" onClick={goToReinforcement}>page4</Button>
      </div>

      <h1>Cursos Actuales</h1>
      {renderGrid(cursosActuales)}

      <h1 style={{ marginTop: 24 }}>Cursos Pasados</h1>
      {renderGrid(cursosPasados)}
    </div>
  );
}
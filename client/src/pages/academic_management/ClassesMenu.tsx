import { useEffect, useState } from "react";
import useClasses from "../../hooks/useClasses";
import { Card, Row, Col, Input, Space, Empty } from "antd";
import type { Clase } from "../../interfaces/claseInterface";
import PageTemplate from "../../components/PageTemplate";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useUserStore } from "../../store/userStore";
import AccessDenied from "../../components/shared/AccessDenied";

export function ClassMenu() {
  const user = useUserStore((s) => s.user);
  const fetchUser = useUserStore((s) => s.fetchUser);
  const { classes, fetchClassesByStudent } = useClasses();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClasses, setFilteredClasses] = useState<Clase[]>(classes);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!user) return;
    fetchClassesByStudent(user.id);
  }, [user]);

  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (lower == "") {
      setFilteredClasses(classes);
      return;
    }

    const words = lower.split(" ");
    const specialChars = /[!@#$%^&*?:{}|<>]/;

    const filterWords = (c: Clase, words: string[]) => {
      let match = true;
      for (const word of words) {
        if (!match) return false;
        if (specialChars.test(word)) continue;
        match = match && c.name.toString().toLowerCase().includes(word);
      }
      return match;
    };

    const filtered = classes.filter((c) => filterWords(c, words));
    setFilteredClasses(filtered);
  }, [searchTerm, classes]);

  const goToReinforcement = (id: string) => {
    navigate(`/reinforcement/${id}`)
  }

  const renderGrid = (items: Clase[]) =>
    items.length ? (
      <Row gutter={[16, 16]}>
        {items.map((clase) => (
          <Col xs={24} sm={12} md={8} lg={6} key={clase.id}>
            <Card
              hoverable
              onClick={() => goToReinforcement(clase.id)}
              style={{
                width: "100%",
                height: 200,
                textAlign: "center",
                borderRadius: 20,
              }}
            >
              <h2>{clase.name}</h2>
              <p>Inicio: {dayjs(clase.dateBegin).format("DD/MM/YYYY")}</p>
              <p>Fin: {dayjs(clase.dateEnd).format("DD/MM/YYYY")}</p>
            </Card>
          </Col>
        ))}
      </Row>
    ) : (
      <Empty description="No hay cursos" />
    );

  return (
    <>
      {user?.roles.includes("estudiante") ? (
        <PageTemplate
          title="Clases"
          subtitle="Clases a las que te encuentras inscrito"
          user={{
            name: "Nora Watson",
            role: "Sales Manager",
            avatarUrl: "https://i.pravatar.cc/128?img=5",
          }}
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Clases" }]}
        >
          <div
            className="w-full lg:max-w-6xl lg:mx-auto space-y-4 sm:space-y-6"
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "24px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <Space>
                <Input
                  placeholder="Buscar curso"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  style={{ width: 240 }}
                />
              </Space>
            </div>

            <h1>Cursos Actuales</h1>
            {renderGrid(filteredClasses)}

            {/* <h1 style={{ marginTop: 24 }}>Cursos Pasados</h1>
            {renderGrid(cursosPasados)} */}
          </div>
        </PageTemplate>
      ) : (
        <AccessDenied />
      )}
    </>
  );
}

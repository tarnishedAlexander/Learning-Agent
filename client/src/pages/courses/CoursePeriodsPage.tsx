import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Empty, Spin, Card, Row, Col } from "antd";
import PageTemplate from "../../components/PageTemplate";
import useCourses from "../../hooks/useCourses";
import useClasses from "../../hooks/useClasses";
import type { Course } from "../../interfaces/courseInterface";
import type { Clase } from "../../interfaces/claseInterface";
import dayjs from "dayjs";

export default function CoursePeriodsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses } = useCourses();
  const { clases } = useClasses();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [coursePeriods, setCoursePeriods] = useState<Clase[]>([]);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    // Buscar el curso en la lista de cursos del hook
    const foundCourse = courses.find((c) => c.id === courseId);
    setCourse(foundCourse || null);
    setLoading(false);
  }, [courseId, courses]);

  useEffect(() => {
    const loadPeriods = async () => {
      if (!courseId) return;
      
      setPeriodsLoading(true);
      try {
        const safeClases = Array.isArray(clases) ? clases : [];
        const filteredPeriods = safeClases.filter((clase) => clase.courseId === courseId);
        setCoursePeriods(filteredPeriods);
      } catch (error) {
        console.error("Error loading periods:", error);
      } finally {
        setPeriodsLoading(false);
      }
    };

    loadPeriods();
  }, [courseId, clases]);

  const goToPeriod = (periodId: string) => {
    navigate(`/classes/${periodId}`);
  };

  const renderPeriodCards = (items: Clase[]) => {
    return items.length ? (
      <Row gutter={[16, 16]}>
        {items.map((period) => (
          <Col xs={24} sm={12} md={8} lg={6} key={period.id}>
            <Card
              hoverable
              onClick={() => goToPeriod(period.id)}
              style={{
                height: 160,
                textAlign: "center",
                cursor: "pointer",
                borderRadius: 8,
                border: "1px solid #e8e8e8",
                backgroundColor: "#ffffff",
              }}
              styles={{
                body: {
                  padding: "20px 16px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <h2 style={{ 
                  fontSize: "18px", 
                  fontWeight: "bold", 
                  margin: 0,
                  color: "#1A2A80",
                  lineHeight: "1.2"
                }}>
                  {period.semester}
                </h2>
              </div>
              
              <div style={{ 
                fontSize: "13px", 
                color: "#666",
                lineHeight: "1.4"
              }}>
                <div style={{ marginBottom: "2px" }}>
                  Inicio: {dayjs(period.dateBegin).format("DD/MM/YYYY")}
                </div>
                <div>
                  Fin: {dayjs(period.dateEnd).format("DD/MM/YYYY")}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    ) : (
      <Empty 
        description="No hay períodos creados para esta materia"
        style={{ 
          margin: "40px 0",
          padding: "20px",
        }}
      />
    );
  };

  if (loading) {
    return (
      <PageTemplate
        title="Períodos"
        subtitle="Cargando información del curso..."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Materias", href: "/courses" },
          { label: "Períodos" },
        ]}
      >
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </PageTemplate>
    );
  }

  if (!course) {
    return (
      <PageTemplate
        title="Curso no encontrado"
        subtitle="El curso solicitado no existe"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Materias", href: "/courses" },
        ]}
      >
        <Empty description="Curso no encontrado" />
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={`Períodos - ${course.name}`}
      subtitle="Gestiona los períodos académicos de este curso"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Materias", href: "/courses" },
        { label: course.name },
      ]}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px",
        }}
      >
        {periodsLoading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
            <div style={{ marginTop: "16px" }}>Cargando períodos...</div>
          </div>
        ) : (
          renderPeriodCards(coursePeriods)
        )}
      </div>
    </PageTemplate>
  );
}

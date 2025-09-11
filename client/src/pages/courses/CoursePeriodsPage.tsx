import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Button,  Empty, Input, message } from "antd";
import { PlusOutlined, ReadOutlined } from "@ant-design/icons";
import PageTemplate from "../../components/PageTemplate";
import { CreatePeriodForm } from "../../components/CreatePeriodForm";
import useClasses from "../../hooks/useClasses";
import type { Clase, CreateClassDTO } from "../../interfaces/claseInterface";
import { useUserStore } from "../../store/userStore";
import dayjs from "dayjs";
import AccessDenied from "../../components/shared/AccessDenied";
import CustomCard from "../../components/shared/CustomCard";
import useCourses from "../../hooks/useCourses";

export function CoursePeriodsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPeriods, setFilteredPeriods] = useState<Clase[]>([]);

  const { classes, createClass, fetchClassesByCourse } = useClasses();
  const { actualCourse, getCourseByID } = useCourses();

  const fetchCoursePeriods = useCallback(async () => {
    if (!courseId) return
    setLoading(true);
    
    const courseRes = await getCourseByID(courseId)
    if (courseRes.state == "error") {
      setLoading(false)
      message.error(courseRes.message)
      return
    }

    const periodsRes = await fetchClassesByCourse(courseId);
    if (periodsRes.state == "error") {
      setLoading(false)
      message.error(periodsRes.message)
      return
    }

    setLoading(false)
  }, [courseId])

  useEffect(() => {
    if (courseId) {
      fetchCoursePeriods();
    }
  }, [courseId, fetchCoursePeriods]);

  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (lower === "") {
      setFilteredPeriods(classes);
      return;
    }

    const filtered = classes.filter((period) =>
      period.semester.toLowerCase().includes(lower) ||
      period.name.toLowerCase().includes(lower)
    );
    setFilteredPeriods(filtered);
  }, [searchTerm, classes]);

  const handleCreatePeriod = async (periodData: CreateClassDTO) => {
    if (!courseId) return

    setCreatingPeriod(true);
    const res = await createClass(periodData)
    if (res.state == "error") {
      message.error(res.message)
      setCreatingPeriod(false);
      return
    }
    message.success(res.message)
    await fetchClassesByCourse(courseId)
    setCreatingPeriod(false);
  };

  const goToPeriod = (periodId: string) => {
    navigate(`/courses/${courseId}/periods/${periodId}`);
  };

  const handleModalCancel = () => {
    setModalOpen(false);
  };

  if (loading) {
    return (
      <PageTemplate
        title="Períodos"
        subtitle="Cargando información..."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Materias", href: "/courses" },
          { label: "Cargando..." }
        ]}
      >
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div>Cargando curso y períodos...</div>
        </div>
      </PageTemplate>
    );
  }

  if (!actualCourse) {
    return (
      <PageTemplate
        title="Curso no encontrado"
        subtitle="No se pudo cargar la información del curso"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Materias", href: "/courses" },
          { label: "Error" }
        ]}
      >
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Empty description="Curso no encontrado" />
          <Button type="primary" onClick={() => navigate("/courses")}>
            Volver a Materias
          </Button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <>
      {user?.roles.includes("docente") ? (
        <PageTemplate
          title={actualCourse.name}
          subtitle="Períodos en los que se dictó esta materia"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Materias", href: "/courses" },
            { label: actualCourse.name }
          ]}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "24px",
            }}
          >
            {/* Header con búsqueda y botón crear */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
                flexWrap: "wrap",
                gap: "12px"
              }}
            >
              <div>
                <Input
                  placeholder="Buscar período..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  style={{
                    width: 240,
                    borderRadius: 8
                  }}
                />
              </div>
              {user?.roles.includes("docente") && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalOpen(true)}
                  style={{
                    borderRadius: 8,
                    fontWeight: "500"
                  }}
                >
                  Crear Período
                </Button>
              )}
            </div>

            {filteredPeriods.length > 0 ? (
              <>{filteredPeriods.map((period) => (
                <CustomCard
                  status="default"
                  style={{ marginBottom: "16px" }}
                  onClick={() => goToPeriod(period.id)}
                  key={period.id}
                >
                  <CustomCard.Header
                    icon={<ReadOutlined />}
                    title={period.semester}
                  />
                  <CustomCard.Description>
                    {`Consulte la información de ${period.name}`}
                  </CustomCard.Description>
                  <CustomCard.Body>
                    <div style={{ marginBottom: "2px" }}>
                      Inicio: {dayjs(period.dateBegin).format("DD/MM/YYYY")}
                    </div>
                    <div>
                      Fin: {dayjs(period.dateEnd).format("DD/MM/YYYY")}
                    </div>
                  </CustomCard.Body>
                </CustomCard>
              ))}</>
            ) : (
              <Empty
                description="No hay períodos creados para esta materia"
                style={{
                  margin: "40px 0",
                  padding: "20px",
                }}
              />
            )}

            {/* Modal para crear período */}
            {actualCourse && (
              <CreatePeriodForm
                open={modalOpen}
                onClose={handleModalCancel}
                onSubmit={handleCreatePeriod}
                course={actualCourse}
                loading={creatingPeriod}
              />
            )}
          </div>
        </PageTemplate>
      ) : (
        <AccessDenied />
      )}
    </>
  );
}

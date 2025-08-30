import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Empty, Spin } from "antd";
import PageTemplate from "../../components/PageTemplate";
import useCourses from "../../hooks/useCourses";
import type { Course } from "../../interfaces/courseInterface";

export function CoursePeriodsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses } = useCourses();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

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
        {/* Contenido de períodos se agregará en las siguientes tasks */}
        <Empty 
          description="Vista de períodos - Funcionalidad en desarrollo" 
          style={{ margin: "50px 0" }}
        />
      </div>
    </PageTemplate>
  );
}

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
        {/* Contenido de períodos se agregará en las siguientes tasks */}
        <Empty 
          description="Vista de períodos - Funcionalidad en desarrollo" 
          style={{ margin: "50px 0" }}
        />
      </div>
    </PageTemplate>
  );
}

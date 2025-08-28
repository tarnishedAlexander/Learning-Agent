import { Button, Card, Col, Empty, Row } from "antd";
import PageTemplate from "../../components/PageTemplate";
import { useState } from "react";
import useCourses from "../../hooks/useCourses";
import type { Course } from "../../interfaces/courseInterface";
import { useNavigate } from "react-router-dom";

export function TeacherCoursePage() {
    const { courses } = useCourses();
    const [modalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();

    const goToCourse = (id: string) => {
        navigate(`/courses/${id}`)
    }

    const renderGrid = (items: Course[]) =>
        items.length ? (
            <Row gutter={[16,16]}>
                {items.map((course) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                        <Card
                            hoverable
                            onClick={() => goToCourse(course.id)}
                            style={{
                                width: "100%",
                                height: 150,
                                textAlign: "center",
                                borderRadius: 20,
                            }}
                        >
                            <h2>{course.name}</h2>
                        </Card>
                    </Col>
                ))}
            </Row>
        ) : (
            <Empty description="No hay materías todavía." />
        );


    return (
        <PageTemplate
            title="Materias"
            subtitle="Materias que haz dictado anteriormente"
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Materias", href: "/courses" }
            ]}
        >
            <div
                className="w-full lg:max-w-6xl lg:mx-auto space-y-4 sm:space-y-6"
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    padding: "24px 24px",
                }}
            >
                {/* <CursosForm
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleAddClase}
                /> */}

                {/* <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 24,
                    }}
                >
                    <Button type="primary" onClick={() => setModalOpen(true)}>
                        Añadir
                    </Button>
                </div> */}

                <h1>Cursos Actuales</h1>
                {renderGrid(courses)}
            </div>
        </PageTemplate>
    );
}
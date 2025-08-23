import { useParams, useNavigate } from "react-router-dom";
import useClasses from "../hooks/useClasses";
import { useEffect, useState } from "react";
import { Button, Card, Table, Space, message, Modal } from "antd";
import { StudentUpload } from "../components/studentUpload";
import { CursosForm } from "../components/cursosForm";
import { SingleStudentForm } from "../components/singleStudentForm";
import {
  DownloadOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { createEnrollmentInterface } from "../interfaces/enrollmentInterface";
import useEnrollment from "../hooks/useEnrollment";
import PageTemplate from "../components/PageTemplate";
import type { Clase } from "../interfaces/claseInterface";
import { SafetyModal } from "../components/SafetyModal";

export function StudentsCurso() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);

  const { id } = useParams<{ id: string }>();
  const { fetchClase, curso, students, createStudents, objClass } =
    //const { fetchClase, curso, students, createStudents, updateClass, deleteClass, objClass } =
    useClasses();
  const { enrollSingleStudent } = useEnrollment();
  const [formOpen, setFormOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>();

  useEffect(() => {
    if (id) {
      fetchClase(id);
    }

    console.log(students);
  }, [id]);

  const handleSubmit = (values: createEnrollmentInterface) => {
    enrollSingleStudent(values);
  };

  const handleEdit = () => {
    setModalOpen(true);
  };

  const handleUpdateClase = async (
    values: Omit<Clase, "id"> & { id?: string }
  ) => {
    if (!values.id) return;
    //await updateClase(values); Falta el endPoint para actualizar (LEITO)
    setModalOpen(false);
  };

  const handleDeleteClase = async () => {
    setSafetyOpen(true);
  };

  const confirmDeleteClase = async () => {
    try {
      if (!id) return;
      // await deleteClase(id);
      message.success("Curso eliminado correctamente");
      navigate(`/classes`);
    } catch (error) {
      message.error(
        "Ocurrió un error al eliminar el curso. Inténtalo más tarde."
      );
    } finally {
      setSafetyOpen(false);
    }
  };

  const columns = [
    {
      title: "Nombres",
      dataIndex: "name",
      key: "nombres",
    },
    {
      title: "Apellidos",
      dataIndex: "lastname",
      key: "apellidos",
    },
    {
      title: "Código",
      dataIndex: "code",
      key: "codigo",
    },
    {
      title: "Asistencia",
      dataIndex: "asistencia",
      key: "asistencia",
    },
    {
      title: "1er Parcial",
      dataIndex: "1er_parcial",
      key: "1er_parcial",
    },
    {
      title: "2do Parcial",
      dataIndex: "2do_parcial",
      key: "2do_parcial",
    },
    {
      title: "Final",
      dataIndex: "final",
      key: "final",
    },
    {
      title: "Acciones",
      key: "acciones",
      //      render: (_: unknown, record: StudentWithKey) => {
      render: (_: unknown, record: any) => {
        const isLoading = downloadingId === record.codigo;
        return (
          <Button
            type="default"
            icon={<DownloadOutlined />}
            loading={isLoading}
            onClick={async () => {
              try {
                setDownloadingId(record.codigo);
                const key =
                  record.documentKey ?? `documents/${record.codigo}.pdf`;
                //await downloadFileByKey(key);
                message.success("Descarga iniciada");
              } catch (e: unknown) {
                const err = e as Error;
                message.error(err?.message || "Error al descargar");
              } finally {
                setDownloadingId(null);
              }
            }}
          >
            Descargar
          </Button>
        );
      },
    },
  ];

  return (
    <PageTemplate
      title={`Curso: ${objClass?.name}`}
      subtitle={`Lista de datos del curso ${objClass?.name}`}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Clases", href: "/classes" },
        { label: `${objClass?.name}`, href: `/classes/${objClass?.id}` },
      ]}
    >
      <div style={{ padding: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Button
            type="primary"
            icon={<FolderOutlined />}
            onClick={() => navigate(`/curso/${id}/documents`)}
            style={{ margin: 4, width: 150 }}
          >
            Documentos
          </Button>

          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            style={{ margin: 4, width: 150 }}
          >
            Editar Curso
          </Button>

          <CursosForm
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleUpdateClase}
            clase={objClass}
          />

          <Button
            type="primary"
            icon={<DeleteOutlined />}
            onClick={handleDeleteClase}
            style={{ margin: 4, width: 150, backgroundColor: "#bb1717ff" }}
          >
            Eliminar Curso
          </Button>
        </div>

        {students ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Space>
                <Button
                  style={{ margin: 4, width: 120 }}
                  type="primary"
                  onClick={() => {}}
                >
                  1er Parcial
                </Button>
                <Button
                  style={{ margin: 4, width: 120 }}
                  type="primary"
                  onClick={() => {}}
                >
                  2do Parcial
                </Button>
                <Button
                  style={{ margin: 4, width: 120 }}
                  type="primary"
                  onClick={() => {}}
                >
                  Final
                </Button>
              </Space>
            </div>
            <Table
              columns={columns}
              dataSource={students || []}
              rowKey={(record) => record.code}
              pagination={{ pageSize: 20 }}
              bordered
            />
            <Button
              style={{ margin: 4, width: 120 }}
              type="primary"
              onClick={() => {
                setFormOpen(true);
              }}
            >
              Añadir Estudiante
            </Button>
          </>
        ) : (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 20,
            }}
          >
            <Card
              style={{
                width: "80%",
                height: "100%",
                textAlign: "center",
                borderRadius: 20,
              }}
            >
              <h2>No hay estudiantes asignados a este curso.</h2>
              <StudentUpload
                disabled={!!students}
                onStudentsParsed={(parsedStudents) => {
                  console.log("Estudiantes leídos:", parsedStudents);
                  /*if (id) {
                    createStudents({
                      classId: id,
                      students: parsedStudents,
                    });
                  }*/
                  //TODO manejar la subida de estudiantes
                }}
              />
            </Card>
          </div>
        )}
        <SingleStudentForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
          }}
          onSubmit={(values) => {
            const data: createEnrollmentInterface = {
              ...values,
              classId: id || "",
            };
            console.log("Datos del formulario:", data);
            handleSubmit(data);
            //createStudents(values);
          }}
        ></SingleStudentForm>
      </div>
      <SafetyModal
        open={safetyOpen}
        onCancel={() => setSafetyOpen(false)}
        onConfirm={confirmDeleteClase}
        title="¿Eliminar curso?"
        message={`¿Estás seguro de que quieres eliminar el curso "${objClass?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        danger
      />
    </PageTemplate>
  );
}

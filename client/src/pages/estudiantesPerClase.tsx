import { useParams } from "react-router-dom";
import useClasses from "../hooks/useClasses";
import { useEffect, useState } from "react";
import { Button, Card, Table, message } from "antd";
import { StudentUpload } from "../components/studentUpload";
import { DownloadOutlined } from "@ant-design/icons";
import { downloadFileByKey } from "../services/fileService";
import type { Student as IStudent } from "../interfaces/studentInterface";

// Extiende la interfaz del proyecto si necesitas la propiedad documentKey
type StudentWithKey = IStudent & { documentKey?: string };

export function StudentsCurso() {
  const { id } = useParams<{ id: string }>();
  const { fetchClase, curso, students, createStudents } = useClasses();
  // aceptar string o number ya que record.codigo en tu proyecto es number
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (id) {
      fetchClase(id);
    }
  }, [id, fetchClase]);

  const columns = [
    {
      title: "Nombres",
      dataIndex: "nombres",
      key: "nombres",
    },
    {
      title: "Apellidos",
      dataIndex: "apellidos",
      key: "apellidos",
    },
    {
      title: "Código",
      dataIndex: "codigo",
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
      render: (_: unknown, record: StudentWithKey) => {
        const isLoading = downloadingId === record.codigo;
        return (
          <Button
            type="default"
            icon={<DownloadOutlined />}
            loading={isLoading}
            onClick={async () => {
              try {
                setDownloadingId(record.codigo);
                const key = record.documentKey ?? `documents/${record.codigo}.pdf`;
                await downloadFileByKey(key);
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
    <div style={{ padding: '1rem' }}>
      <h1> {curso}</h1>

      {students ? (
        <>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        
        <Button style={{margin:4,width:120}} type="primary" onClick={() => {}}>1er Parcial</Button>
        <Button style={{margin:4,width:120}} type="primary" onClick={() => {}}>2do Parcial</Button>
        <Button style={{margin:4,width:120}} type="primary" onClick={() => {}}>Final</Button>
      </div>
        <Table
          columns={columns}
          dataSource={students?.students || []}
          rowKey={(record) => record.codigo}
          pagination={{ pageSize: 20 }}
          bordered
        />
        </>
        
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>

          <Card style={{ width: '80%', height: "100%", textAlign: 'center', borderRadius: 20 }}>
            <h2>No hay estudiantes asignados a este curso.</h2>
            <StudentUpload
              disabled={!!students}
              onStudentsParsed={(parsedStudents) => {
                console.log("Estudiantes leídos:", parsedStudents);
                if (id) {
                  createStudents({
                    claseId: id,
                    students: parsedStudents,
                  });
                }
              }}
            />
          </Card>
        </div>

      )}
    </div>
  );
}
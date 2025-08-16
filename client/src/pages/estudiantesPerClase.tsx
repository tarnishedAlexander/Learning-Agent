import { useParams } from "react-router-dom";
import useClasses from "../hooks/useClasses";
import { useEffect } from "react";
import { Button, Card, Table } from "antd";
import { StudentUpload } from "../components/studentUpload";

export function StudentsCurso() {
  const { id } = useParams<{ id: string }>();
  const { fetchClase, curso, students, createStudents } = useClasses()
  useEffect(() => {
    if (id) {
      fetchClase(id)
    }
    console.log(students)
  }, [id])

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
          dataSource={students || []}
          rowKey={(record) => record.code}
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
                //TODO manejar la subida de estudiantes
              }}
            />
          </Card>
        </div>

      )}
    </div>
  )
}
import { useParams, useNavigate } from "react-router-dom";
import useClasses from "../hooks/useClasses";
import { useEffect } from "react";
import { Button, Card, Table, Space } from "antd";
import { StudentUpload } from "../components/studentUpload";
import { FolderOutlined } from '@ant-design/icons';

export function StudentsCurso() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { fetchClase, curso, students, createStudents } = useClasses()
  
  useEffect(() => {
    if (id) {
      fetchClase(id)
    }
  }, [id])

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
  ];

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>{curso}</h1>
        <Button 
          type="primary" 
          icon={<FolderOutlined />}
          onClick={() => navigate(`/curso/${id}/documents`)}
          style={{ backgroundColor: '#1A2A80' }}
        >
          Documentos
        </Button>
      </div>

      {students ? (
        <>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Space>
            <Button style={{margin:4,width:120}} type="primary" onClick={() => {}}>1er Parcial</Button>
            <Button style={{margin:4,width:120}} type="primary" onClick={() => {}}>2do Parcial</Button>
            <Button style={{margin:4,width:120}} type="primary" onClick={() => {}}>Final</Button>
          </Space>
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
                  })
                }
              }}
            />
          </Card>
        </div>

      )}
    </div>
  )
}
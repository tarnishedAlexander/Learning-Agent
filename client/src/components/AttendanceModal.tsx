import { Modal, Table, Checkbox, Button } from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { StudentInfo } from "../interfaces/studentInterface";
import { useCallback, useEffect, useState } from "react";

interface AttendanceModalProps {
  open: boolean;
  onClose: () => void;
  students: StudentInfo[];
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  open,
  onClose,
  students = [],
}) => {
  const [studentMap, setStudentMap] = useState<Map<string, boolean>>(new Map())

  const prepareData = useCallback(() => {
    const dataMap: Map<string, boolean> = new Map();
    students.map((student: StudentInfo) => {
      dataMap.set(student.userId, false)
    })

    setStudentMap(dataMap)
  }, [students])

  useEffect(() => {
    prepareData();
  }, [students])

  const resetStudentMap = () => {
    const newMap = new Map<string, boolean>();
    students.forEach(student => {
      newMap.set(student.userId, false);
    });
    setStudentMap(newMap);
  };

  const columns: ColumnsType<StudentInfo> = [
    {
      title: "Código",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Nombres",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Apellidos",
      dataIndex: "lastname",
      key: "lastname",
    },
    {
      title: "Asistencia",
      key: "attendance",
      render: (_, record) => (
        <Checkbox
          checked={studentMap.get(record.userId) || false}
          onChange={(e) => {
            const newMap = new Map(studentMap);
            newMap.set(record.userId, e.target.checked);
            setStudentMap(newMap);
          }}
        />
      ),
    },
  ];

  const handleSubmit = () => {
    const attendanceRows = Array.from(studentMap.entries()).map(
      ([studentId, isPresent]) => ({
        studentId,
        isPresent,
      }));
    //TODO preparar la segunda pantalla del modal y luego el envío de datos al backend
    console.log("Datos a enviar:", attendanceRows)
  }

  const handleCancel = () => {
    resetStudentMap()
    onClose();
  }

  return (
    <Modal
      title={`Tomar asistencia - ${dayjs().format("DD/MM/YYYY")}`}
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" danger onClick={handleCancel}>
          Cancelar
        </Button>,
        <Button type="primary" onClick={handleSubmit}>
          Guardar
        </Button>
      ]}
      width={window.innerWidth < 600 ? '90%' : '70%'}
      style={{ maxWidth: '90vw' }}
    >
      <Table
        columns={columns}
        dataSource={students}
        rowKey={(record) => record.code}
        pagination={false}
      />
    </Modal>
  );
};

export default AttendanceModal;

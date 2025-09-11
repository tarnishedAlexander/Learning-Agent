import { Modal, Table, Checkbox, Button } from "antd";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { StudentInfo } from "../interfaces/studentInterface";

interface AttendanceModalProps {
  open: boolean;
  onClose: () => void;
  students?: StudentInfo[];
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  open,
  onClose,
  students = [],
}) => {
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
          onChange={(e) => {
            // TODO: conectar con la lógica de backend para guardar la asistencia
            console.log(`Asistencia de ${record.name}:`, e.target.checked);
          }}
        />
      ),
    },
  ];

  const handleCancel = () => {
    onClose();
  }

  return (
    <Modal
      title={`Tomar asistencia - ${dayjs().format("DD/MM/YYYY")}`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" danger onClick={handleCancel}>
          Cancelar
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

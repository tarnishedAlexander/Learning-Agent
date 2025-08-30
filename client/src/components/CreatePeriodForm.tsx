import { Modal, Form, Select, Space, Button, DatePicker } from "antd";
import { useFormik } from "formik";
import * as yup from "yup";
import dayjs, { Dayjs } from "dayjs";
import type { Course } from "../interfaces/courseInterface";
import type { Clase } from "../interfaces/claseInterface";

const { Option } = Select;

const periodValidationSchema = yup.object({
  semester: yup
    .string()
    .required("El período es obligatorio")
    .matches(
      /^(PRIMERO|SEGUNDO)\s\d{4}$/,
      "El formato debe ser: PRIMERO 2025 o SEGUNDO 2024"
    ),
  dateBegin: yup.string().required("La fecha de inicio es obligatoria"),
  dateEnd: yup.string().required("La fecha de fin es obligatoria"),
});

interface PeriodFormValues {
  semester: string;
  dateBegin: string;
  dateEnd: string;
}

interface CreatePeriodFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (periodData: Omit<Clase, "id">) => Promise<void>;
  course: Course;
  loading?: boolean;
}

export function CreatePeriodForm({ 
  open, 
  onClose, 
  onSubmit, 
  course,
  loading = false 
}: CreatePeriodFormProps) {
  const formik = useFormik<PeriodFormValues>({
    initialValues: {
      semester: "",
      dateBegin: "",
      dateEnd: "",
    },
    validationSchema: periodValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const periodData: Omit<Clase, "id"> = {
          name: course.name,
          semester: values.semester,
          teacherId: course.teacherId,
          courseId: course.id,
          dateBegin: values.dateBegin,
          dateEnd: values.dateEnd,
        };
        
        await onSubmit(periodData);
        resetForm();
        onClose();
      } catch (error) {
        console.error(error);
      }
    },
  });

  const handleCancel = () => {
    onClose();
    formik.resetForm();
  };

  const currentYear = new Date().getFullYear();

  return (
    <Modal
      title={`Crear Período - ${course.name}`}
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      width={500}
    >
      <Form
        layout="vertical"
        onFinish={formik.handleSubmit}
        style={{ marginTop: "20px" }}
      >
        <Form.Item
          label="Período"
          validateStatus={
            formik.errors.semester && formik.touched.semester ? "error" : ""
          }
          help={formik.touched.semester && formik.errors.semester}
          required
        >
          <Select
            placeholder="Seleccionar período"
            value={formik.values.semester}
            onChange={(value) => formik.setFieldValue("semester", value)}
            onBlur={() => formik.setFieldTouched("semester", true)}
            style={{ width: "100%" }}
          >
            <Option value={`PRIMERO ${currentYear}`}>
              PRIMERO {currentYear}
            </Option>
            <Option value={`SEGUNDO ${currentYear}`}>
              SEGUNDO {currentYear}
            </Option>
            <Option value={`PRIMERO ${currentYear + 1}`}>
              PRIMERO {currentYear + 1}
            </Option>
            <Option value={`SEGUNDO ${currentYear + 1}`}>
              SEGUNDO {currentYear + 1}
            </Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Inicio de Período"
          validateStatus={
            formik.errors.dateBegin && formik.touched.dateBegin ? "error" : ""
          }
          help={formik.touched.dateBegin && formik.errors.dateBegin}
          required
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD-MM-YYYY"
            placeholder="Seleccionar fecha de inicio"
            value={
              formik.values.dateBegin
                ? dayjs(formik.values.dateBegin)
                : undefined
            }
            disabledDate={(current: Dayjs) => {
              const threeWeeksAgo = new Date();
              threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
              return current && current.toDate() < threeWeeksAgo;
            }}
            onChange={(value) => {
              const date = value?.toDate();
              if (date) {
                const isoDate = date.toISOString().split("T")[0];
                formik.setFieldValue("dateBegin", isoDate);

                // Calcular automáticamente la fecha de fin (34 días después)
                const autoEnd = new Date(date);
                autoEnd.setDate(autoEnd.getDate() + 34);
                const autoEndISO = autoEnd.toISOString().split("T")[0];
                formik.setFieldValue("dateEnd", autoEndISO);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label="Fin de Período"
          validateStatus={
            formik.errors.dateEnd && formik.touched.dateEnd ? "error" : ""
          }
          help={formik.touched.dateEnd && formik.errors.dateEnd}
          required
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD-MM-YYYY"
            placeholder="Seleccionar fecha de fin"
            value={
              formik.values.dateEnd
                ? dayjs(formik.values.dateEnd)
                : undefined
            }
            disabledDate={(current: Dayjs) => {
              if (!formik.values.dateBegin) return false;
              return current && current.toDate() <= new Date(formik.values.dateBegin);
            }}
            onChange={(value) => {
              const date = value?.toDate();
              if (date) {
                const isoDate = date.toISOString().split("T")[0];
                formik.setFieldValue("dateEnd", isoDate);
              }
            }}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: "24px", marginBottom: 0 }}>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || formik.isSubmitting}
            >
              Crear Período
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

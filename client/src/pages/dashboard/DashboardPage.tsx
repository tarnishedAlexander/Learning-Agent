import PageTemplate from "../../components/PageTemplate";
import { formatTodayEs } from "../../utils/date";
import ProfessorHome from "./ProfessorHome";
import StudentHome from "./StudentHome";
import { useUserContext } from "../../context/UserContext";

export default function DashboardPage() {
  const { user } = useUserContext();
  const isTeacher = user?.roles?.includes("docente");
  const isStudent = user?.roles?.includes("estudiante");
  return (
    <PageTemplate
      title="Dashboard"
      subtitle={
        "Welcome back — focus on what moves the needle. " + formatTodayEs()
      }
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
    >
      {isTeacher ? <ProfessorHome /> : <StudentHome />}
    </PageTemplate>
  );
}

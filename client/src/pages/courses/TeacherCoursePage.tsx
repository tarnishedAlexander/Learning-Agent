import PageTemplate from "../../components/PageTemplate";

export function TeacherCoursePage() {


    return (
        <PageTemplate
            title="Materias"
            subtitle="Materias dictadas anteriormente"
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Materias", href: "/courses"}
            ]}
        >
            <p>oli</p>
        </PageTemplate>
    );
}
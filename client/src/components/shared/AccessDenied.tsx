import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
    const navigate = useNavigate();

    return (
        <Result
            status="403"
            title="403"
            subTitle="No deberías tener acceso a esta página"
            extra={
                <Button type="primary" onClick={() => navigate("/")}>
                    Volver al inicio
                </Button>
            }
        />
    );
};

export default AccessDenied;

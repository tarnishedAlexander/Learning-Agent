
import { ConfigProvider, App as AntApp } from "antd";

import { lightTheme } from "./theme";
import { AppRoutes } from "./routes/routes";
import "./App.css";

function App() {
  return (
    <ConfigProvider theme={lightTheme}>
      <AntApp>
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;

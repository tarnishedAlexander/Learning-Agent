import { ConfigProvider, App as AntApp } from "antd";
import { useEffect, useMemo, useState } from "react";

import { lightTheme, darkTheme } from "./theme";
import { AppRoutes } from "./routes/routes";
import { useThemeStore } from "./store/themeStore";
import "./App.css";
import { useUserStore } from "./store/userStore";
import { ThemedVars } from "./ThemedVars";

function App() {
  const theme = useThemeStore((s) => s.theme);
  const [systemTheme, setSystemTheme] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Fetch user once on app load (replacing context provider behavior)
  const fetchUser = useUserStore((s) => s.fetchUser);
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const currentTheme = useMemo(() => {
    const mode = theme === "system" ? systemTheme : theme;
    return mode === "dark" ? darkTheme : lightTheme;
  }, [theme, systemTheme]);

  return (
    <ConfigProvider theme={currentTheme} {...{ cssVar: { key: "app" } }}>
      <AntApp>
        <ThemedVars>
          <AppRoutes />
        </ThemedVars>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;

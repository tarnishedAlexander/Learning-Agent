import type { ThemeConfig } from "antd";
import { theme as antdTheme } from "antd";

export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: "#1A2A80",      
    colorInfo: "#2563eb",
    colorSuccess: "#16a34a",      
    colorWarning: "#f59e0b",      
    colorError: "#ef4444",        
    borderRadius: 12,
    wireframe: false,

    colorBgLayout: "#f6f9ff",
    colorBgContainer: "#ffffff",
    colorText: "#0f172a",        
  },
  components: {
    Button: { controlHeightLG: 44 },
    Card: { borderRadiusLG: 16 },
    Input: { controlHeight: 40 },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: [antdTheme.darkAlgorithm], 
  token: {
    colorPrimary: "#60a5fa",
    colorInfo: "#60a5fa",
    colorSuccess: "#22c55e",
    colorWarning: "#f59e0b",
    colorError: "#f87171",
    borderRadius: 12,
  },
};

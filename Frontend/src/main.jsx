import React from "react";
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
import App from './App.jsx'
import "antd/dist/reset.css";
import "./index.css";
import { ConfigProvider, theme as antdTheme } from "antd";

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ConfigProvider
                theme={{
                    algorithm: antdTheme.darkAlgorithm,
                    token: {
                        colorPrimary: "#4096ff",
                        borderRadius: 12,
                    },
                }}
            >
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ConfigProvider>
        </BrowserRouter>
    </React.StrictMode>
)

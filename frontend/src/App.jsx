import React from "react";
import { useState } from "react";
import { getPageFromLocation } from "./navigation.js";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

const SESSION_KEY = "payrollUser";

export default function App() {
  const initialPage =
    window.PAYROLL_INITIAL_PAGE ||
    getPageFromLocation(window.location.pathname);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(SESSION_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (loggedInUser) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  if (user) {
    return <DashboardPage user={user} onLogout={handleLogout} initialPage={initialPage} />;
  }

  return <LoginPage onLogin={handleLogin} />;
}

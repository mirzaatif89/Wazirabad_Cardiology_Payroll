import React from "react";
import { useEffect, useState } from "react";
import { getPageFromLocation } from "./navigation.js";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { getActiveFiscalYear } from "./services/api.js";

const SESSION_KEY = "payrollUser";
const WELCOME_DURATION_MS = 1900;

function WelcomeSplash({ user }) {
  const displayName = user?.name || user?.username || "User";

  return (
    <main className="welcome-splash" aria-label="Welcome">
      <div className="welcome-glow" aria-hidden="true" />
      <section className="welcome-panel">
        <div className="welcome-logo-wrap">
          <img src="/logo.png" alt="Wazirabad Cardiology Hospital logo" />
        </div>
        <p>Welcome</p>
        <h1>{displayName}</h1>
        <div className="welcome-loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const initialPage =
    window.PAYROLL_INITIAL_PAGE ||
    getPageFromLocation(window.location.pathname);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(SESSION_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeFiscalYear, setActiveFiscalYear] = useState(
    () => window.PAYROLL_ACTIVE_FISCAL_YEAR || null
  );
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveFiscalYear() {
      try {
        const result = await getActiveFiscalYear();
        if (cancelled) {
          return;
        }

        const fiscalYear = result.data || null;
        setActiveFiscalYear(fiscalYear);
        window.PAYROLL_ACTIVE_FISCAL_YEAR = fiscalYear;
      } catch {
        if (!cancelled) {
          setActiveFiscalYear(null);
          window.PAYROLL_ACTIVE_FISCAL_YEAR = null;
        }
      }
    }

    loadActiveFiscalYear();

    const handleFiscalYearUpdate = (event) => {
      const fiscalYear = event.detail || null;
      setActiveFiscalYear(fiscalYear);
      window.PAYROLL_ACTIVE_FISCAL_YEAR = fiscalYear;
    };

    window.addEventListener("payroll-fiscal-year-updated", handleFiscalYearUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("payroll-fiscal-year-updated", handleFiscalYearUpdate);
    };
  }, []);

  useEffect(() => {
    window.PAYROLL_ACTIVE_FISCAL_YEAR = activeFiscalYear;
  }, [activeFiscalYear]);

  const handleLogin = (loggedInUser) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setShowWelcome(true);

    window.setTimeout(() => {
      setShowWelcome(false);
    }, WELCOME_DURATION_MS);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setShowWelcome(false);
  };

  if (user && showWelcome) {
    return <WelcomeSplash user={user} />;
  }

  if (user) {
    return <DashboardPage user={user} onLogout={handleLogout} initialPage={initialPage} activeFiscalYear={activeFiscalYear} />;
  }

  return <LoginPage onLogin={handleLogin} />;
}

import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ANALYST", "ADMIN"] },
    { to: "/records", label: "Records", icon: FileText, roles: ["VIEWER", "ANALYST", "ADMIN"] },
    { to: "/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  return (
    <div className="app-layout">
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
                <rect x="15" y="12" width="34" height="40" rx="3" fill="rgba(255,255,255,0.2)"/>
                <rect x="15" y="12" width="5" height="40" rx="2" fill="rgba(255,255,255,0.3)"/>
                <rect x="24" y="19" width="18" height="2" rx="1" fill="rgba(255,255,255,0.6)"/>
                <rect x="24" y="26" width="14" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
                <path d="M24 42 C28 38, 33 33, 38 28 Q41 25, 44 22" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/>
                <path d="M39 20 L44 22 L42 27" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="24" cy="42" r="2.2" fill="#a5f3fc"/>
              </svg>
            </div>
            <h2>LedgerFlow</h2>
          </div>
          <span className="role-badge">{user?.role}</span>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="theme-toggle-row">
            <span className="theme-label">
              {theme === "dark" ? "Dark" : "Light"} mode
            </span>
            <button
              className={`theme-toggle ${theme === "dark" ? "active" : ""}`}
              onClick={toggleTheme}
              title="Toggle theme"
            >
              <span className="theme-toggle-knob">
                {theme === "dark" ? <Moon size={10} /> : <Sun size={10} />}
              </span>
            </button>
          </div>

          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

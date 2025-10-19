// src/components/layout/Sidebar.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current section based on URL path
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path.includes('/customers')) return 'customers';
    if (path.includes('/projects')) return 'projects';
    if (path.includes('/phases')) return 'phases';
    if (path.includes('/admins')) return 'admins';
    if (path.includes('/comments')) return 'comments';
    return 'dashboard';
  };

  const currentSection = getCurrentSection();

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'customers', icon: '👥', label: 'Kunden' },
    { id: 'projects', icon: '📁', label: 'Projekte' },
    { id: 'phases', icon: '⚙️', label: 'Projekt-Phasen' },
    { id: 'comments', icon: '💬', label: 'Kommentare' },
    { id: 'admins', icon: '🔐', label: 'Admin-Verwaltung' },
  ];

  const handleNavigation = (sectionId: string) => {
    navigate(`/admin/${sectionId}`);
  };

  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.id}>
            <a
              href="#"
              className={currentSection === item.id ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item.id);
              }}
            >
              {item.icon} {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
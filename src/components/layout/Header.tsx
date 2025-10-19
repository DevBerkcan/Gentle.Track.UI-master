// src/components/layout/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Determine current view based on URL
  const currentView = location.pathname.startsWith('/kundenansicht') ? 'customer' : 'admin';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewChange = (view: 'admin' | 'customer') => {
    if (view === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/kundenansicht');
    }
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/kundenansicht');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="header">
      <h1>Gentle Track</h1>
      <div className="view-toggle">
        {/* Show admin view button only if authenticated */}
        {isAuthenticated && (
          <button
            className={`btn ${currentView === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleViewChange('admin')}
          >
            Admin-Bereich
          </button>
        )}
        
        <button
          className={`btn ${currentView === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleViewChange('customer')}
        >
          Kundenansicht
        </button>

        {/* Show profile dropdown if authenticated, otherwise show login */}
        {isAuthenticated ? (
          <div className="profile-dropdown-container" ref={dropdownRef}>
            <button
              className="profile-button"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="profile-info">
                <span className="profile-icon">👤</span>
                <span className="profile-name">{admin?.name}</span>
                <svg 
                  className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M4 6L8 10L12 6" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>

            {showDropdown && (
              <div className="profile-dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <span className="dropdown-icon">👤</span>
                    <div>
                      <div className="dropdown-name">{admin?.name}</div>
                      <div className="dropdown-email">{admin?.email}</div>
                    </div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10.6667 11.3333L14 8L10.6667 4.66666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Abmelden
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="btn btn-login"
            onClick={handleLogin}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
              <path d="M10 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V3.33333C14 2.97971 13.8595 2.64057 13.6095 2.39052C13.3594 2.14048 13.0203 2 12.6667 2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.33334 11.3333L2 8L5.33334 4.66666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 8H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
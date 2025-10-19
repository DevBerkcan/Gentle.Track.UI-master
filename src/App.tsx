// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/admin/Dashboard';
import CustomerManagement from './components/admin/CustomerManagement';
import ProjectManagement from './components/admin/ProjectManagement';
import PhaseManagement from './components/admin/PhaseManagement';
import AdminManagement from './components/admin/AdminManagement';
import ProjectTracking from './components/customer/ProjectTracking';
import './App.css';
import CommentsManagement from './components/admin/CommentsManagement';

// Admin Layout Wrapper (Protected)
const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <div className="main-content">
      <Sidebar />
      <div className="content">
        {children}
      </div>
    </div>
  </ProtectedRoute>
);

// Customer Layout Wrapper (Public)
const CustomerLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="main-content">
    <div className="content" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {children}
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="container">
          <Routes>
            {/* Login Route (No Header) */}
            <Route path="/login" element={<Login />} />
            
            {/* Routes with Header */}
            <Route path="/*" element={
              <>
                <Header />
                <Routes>
                  {/* Admin Routes (Protected) */}
                  <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
                  <Route path="/admin/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
                  <Route path="/admin/customers" element={<AdminLayout><CustomerManagement /></AdminLayout>} />
                  <Route path="/admin/projects" element={<AdminLayout><ProjectManagement /></AdminLayout>} />
                  <Route path="/admin/phases" element={<AdminLayout><PhaseManagement /></AdminLayout>} />
                  <Route path="/admin/comments" element={<AdminLayout><CommentsManagement /></AdminLayout>} />
                  <Route path="/admin/admins" element={<AdminLayout><AdminManagement /></AdminLayout>} />
                  
                  {/* Customer Routes (Public) */}
                  <Route path="/kundenansicht" element={<CustomerLayout><ProjectTracking /></CustomerLayout>} />
                  
                  {/* Default Route - redirect to customer view (public) */}
                  <Route path="/" element={<Navigate to="/kundenansicht" replace />} />
                </Routes>
              </>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
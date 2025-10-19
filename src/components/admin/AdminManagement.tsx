// src/components/admin/AdminManagement.tsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { adminService } from '../../api/services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/dateFormatter';
import AdminModal from '../modals/AdminModal';
import EditAdminModal from '../modals/EditAdminModal';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import ResponsiveTable from '../common/ResponsiveTable';
import type { Admin } from '../../types';

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ConfirmState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const AdminManagement = () => {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    message: ''
  });

  const [confirm, setConfirm] = useState<ConfirmState>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  const isOwner = currentAdmin?.role === 'Owner';

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    if (showInactive) {
      setFilteredAdmins(admins);
    } else {
      setFilteredAdmins(admins.filter(a => a.status === 'Aktiv'));
    }
  }, [admins, showInactive]);

  const showNotification = (type: NotificationState['type'], message: string) => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: ConfirmState['type'] = 'warning') => {
    setConfirm({ show: true, title, message, onConfirm, type });
  };

  const hideConfirm = () => {
    setConfirm({ ...confirm, show: false });
  };

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAll();
      setAdmins(data);
    } catch (error: any) {
      console.error('Error loading admins:', error);
      if (error.response?.status === 403) {
        showNotification('error', 'Keine Berechtigung. Nur Owners können Administratoren verwalten.');
      } else {
        showNotification('error', 'Fehler beim Laden der Administratoren');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    showConfirm(
      'Administrator deaktivieren',
      `Möchten Sie den Administrator "${name}" wirklich deaktivieren?`,
      async () => {
        try {
          await adminService.delete(id);
          showNotification('success', 'Administrator erfolgreich deaktiviert!');
          loadAdmins();
        } catch (error) {
          showNotification('error', 'Fehler beim Deaktivieren des Administrators');
        }
        hideConfirm();
      },
      'danger'
    );
  };

  const handleReactivate = (admin: Admin) => {
    showConfirm(
      'Administrator reaktivieren',
      `Möchten Sie den Administrator "${admin.name}" wieder aktivieren?`,
      async () => {
        try {
          await adminService.update(admin.adminID, {
            name: admin.name,
            email: admin.email,
            role: admin.role,
            projectAccess: admin.projectAccess,
            status: 'Aktiv',
            assignedProjectIDs: admin.assignedProjectIDs || []
          });
          showNotification('success', 'Administrator erfolgreich reaktiviert!');
          loadAdmins();
        } catch (error) {
          showNotification('error', 'Fehler beim Reaktivieren des Administrators');
        }
        hideConfirm();
      },
      'info'
    );
  };

  const handleSaveSuccess = () => {
    loadAdmins();
    setIsModalOpen(false);
    showNotification('success', 'Administrator erfolgreich angelegt!');
  };

  const handleEditSuccess = () => {
    loadAdmins();
    setIsEditModalOpen(false);
    setSelectedAdmin(null);
    showNotification('success', 'Administrator erfolgreich aktualisiert!');
  };

  if (loading) {
    return <div className="loading">Lade Administratoren...</div>;
  }

  if (!isOwner) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Zugriff verweigert</h2>
          <p style={{ color: '#64748b', fontSize: '16px' }}>
            Nur Benutzer mit der Rolle "Owner" können Administratoren verwalten.
          </p>
        </div>
      </div>
    );
  }

  const handleDeleteSuccess = () => {
  loadAdmins();
  setIsEditModalOpen(false);
  setSelectedAdmin(null);
  showNotification('success', 'Administrator erfolgreich gelöscht!');
};

  const inactiveCount = admins.filter(a => a.status === 'Inaktiv').length;
  const activeCount = admins.filter(a => a.status === 'Aktiv').length;

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      width: '15%',
      render: (value: string) => <strong style={{ display: 'block', wordBreak: 'break-word' }}>{value}</strong>
    },
    {
      header: 'E-Mail',
      accessor: 'email',
      width: '20%',
      render: (value: string) => (
        <span style={{ 
          display: 'block', 
          wordBreak: 'break-word',
          fontSize: '13px'
        }}>
          {value}
        </span>
      )
    },
    {
      header: 'Rolle',
      accessor: 'role',
      width: '12%',
      render: (value: string) => (
        <span style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          background: value === 'Owner' ? '#fef3c7' : '#dbeafe',
          color: value === 'Owner' ? '#92400e' : '#1e40af',
          whiteSpace: 'nowrap'
        }}>
          {value === 'Owner' ? '🔑 Owner' : '👤 Admin'}
        </span>
      )
    },
    {
      header: 'Projektzugriff',
      accessor: 'projectAccess',
      width: '15%',
      render: (value: string, admin: Admin) => (
        <div>
          <Badge status={value} />
          {value === 'Zugewiesene Projekte' && admin.assignedProjectIDs && (
            <small style={{ display: 'block', color: '#64748b', marginTop: '4px', fontSize: '11px' }}>
              {admin.assignedProjectIDs.length} Projekt{admin.assignedProjectIDs.length !== 1 ? 'e' : ''}
            </small>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '10%',
      render: (value: string) => <Badge status={value} />
    },
    {
      header: 'Letzter Login',
      accessor: 'lastLogin',
      width: '12%',
      render: (value: string | undefined) => (
        <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
          {value ? formatDate(value) : 'Nie'}
        </span>
      )
    },
    {
      header: 'Aktionen',
      accessor: 'adminID',
      width: '16%',
      render: (_: any, admin: Admin) => (
        <div className="action-buttons" style={{ gap: '8px' }}>
          <button
            className="btn btn-primary btn-small"
            onClick={() => handleEdit(admin)}
            style={{ 
              minWidth: '110px',
              fontSize: '12px',
              padding: '6px 12px'
            }}
          >
            ✏️ Bearbeiten
          </button>
          {admin.status === 'Aktiv' ? (
            <button
              className="btn btn-danger btn-small"
              onClick={() => handleDelete(admin.adminID, admin.name)}
              style={{ 
                minWidth: '110px',
                fontSize: '12px',
                padding: '6px 12px'
              }}
            >
              🗑️ Deaktivieren
            </button>
          ) : (
            <button
              className="btn btn-success btn-small"
              onClick={() => handleReactivate(admin)}
              style={{ 
                minWidth: '110px',
                fontSize: '12px',
                padding: '6px 12px'
              }}
            >
              ✅ Reaktivieren
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Admin-Verwaltung</h2>
        <p style={{ color: '#64748b', marginBottom: '15px' }}>
        </p>
        
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #10b981',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#047857', marginBottom: '10px' }}>ℹ️ Rollen-Übersicht</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🔑</span>
              <div>
                <strong style={{ color: '#1e293b' }}>Owner:</strong>
                <span style={{ color: '#64748b', marginLeft: '8px' }}>
                  Vollzugriff auf alle Funktionen, Projekte und Kunden
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>👤</span>
              <div>
                <strong style={{ color: '#1e293b' }}>Admin:</strong>
                <span style={{ color: '#64748b', marginLeft: '8px' }}>
                  Zugriff auf alle oder zugewiesene Projekte
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '15px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            padding: '8px 16px',
            background: '#dbeafe',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#1e40af'
          }}>
            📊 Gesamt: {admins.length}
          </div>
          <div style={{
            padding: '8px 16px',
            background: '#d1fae5',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#065f46'
          }}>
            ✅ Aktiv: {activeCount}
          </div>
          <div style={{
            padding: '8px 16px',
            background: '#fee2e2',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#991b1b'
          }}>
            ❌ Inaktiv: {inactiveCount}
          </div>
          <div style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            👁️ Angezeigt: {filteredAdmins.length}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className="btn btn-success" onClick={() => setIsModalOpen(true)}>
          + Neuer Administrator
        </button>
        
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          cursor: 'pointer',
          padding: '8px 16px',
          background: showInactive ? '#fef3c7' : '#f8fafc',
          borderRadius: '8px',
          border: showInactive ? '2px solid #f59e0b' : '2px solid #e2e8f0',
          transition: 'all 0.2s'
        }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: showInactive ? '#92400e' : '#64748b' 
          }}>
            {showInactive ? '👁️ Nur aktive' : '🔍 Alle anzeigen'} 
          </span>
        </label>
      </div>

      <div className="card" style={{ marginTop: '20px', overflowX: 'auto' }}>
        {filteredAdmins.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            background: '#f8fafc',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {showInactive ? '📭' : '✅'}
            </div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              {showInactive 
                ? 'Keine Administratoren vorhanden' 
                : `Keine ${showInactive ? '' : 'aktiven '}Administratoren gefunden`
              }
            </p>
          </div>
        ) : (
          <ResponsiveTable
            columns={columns}
            data={filteredAdmins}
            keyField="adminID"
          />
        )}
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
      />

<EditAdminModal
  isOpen={isEditModalOpen}
  onClose={() => {
    setIsEditModalOpen(false);
    setSelectedAdmin(null);
  }}
  onSaveSuccess={handleEditSuccess}
  onDeleteSuccess={handleDeleteSuccess}
  admin={selectedAdmin}
/>

      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      <ConfirmDialog
        isOpen={confirm.show}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={hideConfirm}
        type={confirm.type}
        confirmText={confirm.type === 'danger' ? 'Deaktivieren' : 'Bestätigen'}
      />
    </div>
  );
};

export default AdminManagement;
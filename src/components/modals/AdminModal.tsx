// src/components/modals/AdminModal.tsx
import { useState, useEffect } from 'react';
import { adminService } from '../../api/services/adminService';
import { projectService } from '../../api/services/projectService';
import type { Project } from '../../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin' as 'Owner' | 'Admin', // Properly typed
    projectAccess: 'Alle Projekte',
    assignedProjectIDs: [] as number[]
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    // Validate project selection for Admin with specific access
    if (formData.role === 'Admin' && 
        formData.projectAccess === 'Zugewiesene Projekte' && 
        formData.assignedProjectIDs.length === 0) {
      setError('Bitte wählen Sie mindestens ein Projekt aus');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Prepare the data to send
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        projectAccess: formData.projectAccess,
        assignedProjectIDs: formData.role === 'Admin' && formData.projectAccess === 'Zugewiesene Projekte' 
          ? formData.assignedProjectIDs 
          : []
      };

      console.log('Sending admin data:', dataToSend);
      
      await adminService.create(dataToSend);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Admin' as 'Owner' | 'Admin',
        projectAccess: 'Alle Projekte',
        assignedProjectIDs: []
      });
      
      onSaveSuccess();
    } catch (err: any) {
      console.error('Error creating admin:', err);
      console.error('Error response:', err.response?.data);
      
      // Show detailed error message
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.title
        || err.message 
        || 'Fehler beim Erstellen des Administrators';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectToggle = (projectId: number) => {
    setFormData(prev => ({
      ...prev,
      assignedProjectIDs: prev.assignedProjectIDs.includes(projectId)
        ? prev.assignedProjectIDs.filter(id => id !== projectId)
        : [...prev.assignedProjectIDs, projectId]
    }));
  };

  const handleRoleChange = (role: 'Owner' | 'Admin') => {
    setFormData(prev => ({
      ...prev,
      role,
      // Owner always has access to all projects
      projectAccess: role === 'Owner' ? 'Alle Projekte' : prev.projectAccess,
      // Clear project assignments if switching to Owner or "Alle Projekte"
      assignedProjectIDs: role === 'Owner' ? [] : prev.assignedProjectIDs
    }));
  };

  const handleProjectAccessChange = (projectAccess: string) => {
    setFormData(prev => ({
      ...prev,
      projectAccess,
      // Clear project assignments if switching to "Alle Projekte"
      assignedProjectIDs: projectAccess === 'Alle Projekte' ? [] : prev.assignedProjectIDs
    }));
  };

  if (!isOpen) return null;

  const showProjectSelection = formData.role === 'Admin' && formData.projectAccess === 'Zugewiesene Projekte';

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Neuer Administrator</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Max Mustermann"
              required
            />
          </div>

          <div className="form-group">
            <label>E-Mail *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="z.B. max@beispiel.de"
              required
            />
          </div>

          <div className="form-group">
            <label>Passwort *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mindestens 8 Zeichen"
              required
            />
          </div>

          <div className="form-group">
            <label>Rolle *</label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value as 'Owner' | 'Admin')}
              required
            >
              <option value="Admin">Admin</option>
              <option value="Owner">Owner</option>
            </select>
            <small style={{ display: 'block', marginTop: '5px', color: '#64748b' }}>
              {formData.role === 'Owner' 
                ? '🔑 Vollzugriff auf alle Funktionen und Projekte' 
                : '👤 Eingeschränkter Zugriff basierend auf Projektzuweisung'}
            </small>
          </div>

          {formData.role === 'Admin' && (
            <div className="form-group">
              <label>Projektzugriff *</label>
              <select
                value={formData.projectAccess}
                onChange={(e) => handleProjectAccessChange(e.target.value)}
                required
              >
                <option value="Alle Projekte">Alle Projekte</option>
                <option value="Zugewiesene Projekte">Zugewiesene Projekte</option>
              </select>
              <small style={{ display: 'block', marginTop: '5px', color: '#64748b' }}>
                {formData.projectAccess === 'Alle Projekte' 
                  ? '📂 Zugriff auf alle Projekte und Kunden' 
                  : '📁 Nur Zugriff auf ausgewählte Projekte'}
              </small>
            </div>
          )}

          {showProjectSelection && (
            <div className="form-group">
              <label>Projekte zuweisen * ({formData.assignedProjectIDs.length} ausgewählt)</label>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px'
              }}>
                {projects.length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                    Keine Projekte verfügbar
                  </p>
                ) : (
                  projects.map(project => (
                    <label
                      key={project.projectID}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        marginBottom: '5px',
                        background: formData.assignedProjectIDs.includes(project.projectID) 
                          ? '#f0fdf4' 
                          : 'transparent',
                        border: formData.assignedProjectIDs.includes(project.projectID)
                          ? '2px solid #10b981'
                          : '2px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignedProjectIDs.includes(project.projectID)}
                        onChange={() => handleProjectToggle(project.projectID)}
                        style={{ marginRight: '10px', width: '18px', height: '18px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {project.projectName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {project.customerName} • {project.trackingNumber}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="btn btn-success" 
              disabled={loading}
            >
              {loading ? 'Speichern...' : '✓ Administrator erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;
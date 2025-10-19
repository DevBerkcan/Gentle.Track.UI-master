// src/components/modals/ProjectModal.tsx
import { useState, useEffect } from 'react';
import { projectService } from '../../api/services/projectService';
import { customerService } from '../../api/services/customerService';
import CustomSelect from '../common/CustomSelect';
import type { Project, CreateProjectDto, Customer } from '../../types';
import Modal from '../common/Modal';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSaveSuccess: () => void;
  onDeleteSuccess?: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveSuccess,
  onDeleteSuccess,
}) => {
  const [formData, setFormData] = useState<CreateProjectDto>({
    projectName: '',
    customerID: 0,
    status: 'Planung',
    progress: 0,
    description: '',
    startDate: '',
    endDate: '',
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      if (project) {
        setFormData({
          projectName: project.projectName,
          customerID: project.customerID,
          status: project.status,
          progress: project.progress,
          description: project.description || '',
          startDate: project.startDate.split('T')[0],
          endDate: project.endDate.split('T')[0],
        });
        setTrackingNumber(project.trackingNumber);
      } else {
        generateTrackingNumber();
        setFormData({
          projectName: '',
          customerID: 0,
          status: 'Planung',
          progress: 0,
          description: '',
          startDate: '',
          endDate: '',
        });
      }
      setShowDeleteConfirm(false);
    }
    setError('');
  }, [project, isOpen]);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const generateTrackingNumber = async () => {
    try {
      const data = await projectService.generateTrackingNumber();
      setTrackingNumber(data.trackingNumber);
    } catch (err) {
      console.error('Error generating tracking number:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      if (project) {
        await projectService.update(project.projectID, formData);
      } else {
        await projectService.create(formData);
      }
      onSaveSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    try {
      setLoading(true);
      setError('');
      await projectService.delete(project.projectID);
      setShowDeleteConfirm(false);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err: any) {
      console.error('Error deleting project:', err);
      setError(err.response?.data?.message || 'Fehler beim Löschen des Projekts');
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = [
    { value: '0', label: '-- Kunde wählen --' },
    ...customers.map(c => ({
      value: c.customerID.toString(),
      label: c.companyName
    }))
  ];

  const statusOptions = [
    { value: 'Planung', label: 'Planung' },
    { value: 'In Bearbeitung', label: 'In Bearbeitung' },
    { value: 'Warten auf Feedback', label: 'Warten auf Feedback' },
    { value: 'Abgeschlossen', label: 'Abgeschlossen' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Projekt bearbeiten' : 'Neues Projekt anlegen'}
    >
      {showDeleteConfirm ? (
        <>
          {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}
          
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{ marginBottom: '10px', color: '#dc2626' }}>
              Projekt unwiderruflich löschen?
            </h3>
            <p style={{ color: '#64748b', marginBottom: '0' }}>
              Das Projekt "{project?.projectName}" und alle zugehörigen Daten 
              werden permanent gelöscht. Diese Aktion kann nicht rückgängig gemacht werden!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-danger" 
              onClick={handleDelete}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Löschen...' : '🗑️ Ja, endgültig löschen'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
              style={{ flex: 1 }}
            >
              Abbrechen
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}
          
          <div className="form-group">
            <label>Tracking-Nummer</label>
            <input type="text" value={trackingNumber} readOnly style={{ background: '#f1f5f9' }} />
          </div>
          
          <div className="form-group">
            <label>Projektname *</label>
            <input
              type="text"
              required
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>Kunde *</label>
            <CustomSelect
              value={formData.customerID.toString()}
              onChange={(value) => setFormData({ ...formData, customerID: parseInt(value) })}
              options={customerOptions}
            />
          </div>
          
          <div className="form-group">
            <label>Status</label>
            <CustomSelect
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
              options={statusOptions}
            />
          </div>
          
          <div className="form-group">
            <label>Fortschritt (%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
            />
            <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#11998e', fontSize: '20px' }}>
              {formData.progress}%
            </div>
          </div>
          
          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>Startdatum *</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>Enddatum *</label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Speichern...' : (project ? '✓ Speichern' : '✓ Projekt anlegen')}
            </button>
            
            {project && (
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                🗑️ Löschen
              </button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
};
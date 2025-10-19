// src/components/admin/PhaseManagement.tsx
import { useState, useEffect } from 'react';
import { projectService } from '../../api/services/projectService';
import { phaseService } from '../../api/services/phaseService';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import CustomSelect from '../common/CustomSelect';
import SearchableDropdown from '../common/SearchableDropdown';
import { formatDate, getPhaseIcon, getPhaseClass } from '../../utils/dateFormatter';
import type { Project, ProjectPhase } from '../../types';

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

const PhaseManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPhaseInput, setShowPhaseInput] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseDescription, setNewPhaseDescription] = useState('');
  
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

  useEffect(() => {
    loadProjects();
  }, []);

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

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data.filter((p) => !p.isArchived));
    } catch (error) {
      console.error('Error loading projects:', error);
      showNotification('error', 'Fehler beim Laden der Projekte');
    }
  };

  const loadPhases = async () => {
    if (!selectedProjectId) {
      setPhases([]);
      return;
    }

    try {
      setLoading(true);
      const data = await phaseService.getByProjectId(parseInt(selectedProjectId));
      setPhases(data);
    } catch (error) {
      console.error('Error loading phases:', error);
      showNotification('error', 'Fehler beim Laden der Phasen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhases();
    setShowPhaseInput(false);
  }, [selectedProjectId]);

  const handleAddPhase = () => {
    setShowPhaseInput(true);
  };

  const handleSavePhase = async () => {
    if (!newPhaseName.trim()) {
      showNotification('warning', 'Bitte geben Sie einen Namen für die Phase ein');
      return;
    }

    try {
      await phaseService.create({
        projectID: parseInt(selectedProjectId),
        phaseName: newPhaseName,
        description: newPhaseDescription,
        status: 'Noch nicht gestartet',
        phaseOrder: 0, // Will be auto-assigned by backend
      });
      showNotification('success', 'Phase erfolgreich hinzugefügt!');
      setNewPhaseName('');
      setNewPhaseDescription('');
      setShowPhaseInput(false);
      loadPhases();
    } catch (error) {
      showNotification('error', 'Fehler beim Hinzufügen der Phase');
    }
  };

  const handleCancelPhase = () => {
    setNewPhaseName('');
    setNewPhaseDescription('');
    setShowPhaseInput(false);
  };

  const updateStatus = async (phaseId: number, status: string) => {
    try {
      await phaseService.updateStatus(phaseId, status);
      showNotification('success', 'Status erfolgreich aktualisiert!');
      loadPhases();
    } catch (error) {
      showNotification('error', 'Fehler beim Aktualisieren des Status');
    }
  };

  const deletePhase = (phaseId: number, phaseName: string) => {
    showConfirm(
      'Phase löschen',
      `Möchten Sie die Phase "${phaseName}" wirklich löschen?`,
      async () => {
        try {
          await phaseService.delete(phaseId);
          showNotification('success', 'Phase erfolgreich gelöscht!');
          loadPhases();
        } catch (error) {
          showNotification('error', 'Fehler beim Löschen der Phase');
        }
        hideConfirm();
      },
      'danger'
    );
  };

  const movePhaseUp = async (phaseId: number) => {
    try {
      await phaseService.moveUp(phaseId);
      showNotification('success', 'Phase nach oben verschoben!');
      loadPhases();
    } catch (error) {
      showNotification('error', 'Phase kann nicht nach oben verschoben werden');
    }
  };

  const movePhaseDown = async (phaseId: number) => {
    try {
      await phaseService.moveDown(phaseId);
      showNotification('success', 'Phase nach unten verschoben!');
      loadPhases();
    } catch (error) {
      showNotification('error', 'Phase kann nicht nach unten verschoben werden');
    }
  };

  // Convert projects to dropdown options
  const projectOptions = projects.map(project => ({
    id: project.projectID.toString(),
    label: project.projectName,
    sublabel: project.trackingNumber
  }));

  const statusOptions = [
    { value: 'Noch nicht gestartet', label: 'Noch nicht gestartet' },
    { value: 'In Bearbeitung', label: 'In Bearbeitung' },
    { value: 'Warten auf Feedback', label: 'Warten auf Feedback' },
    { value: 'Abgeschlossen', label: 'Abgeschlossen' }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Projekt-Phasen verwalten</h2>
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="" style={{ marginBottom: '20px'}}>
          <SearchableDropdown
            options={projectOptions}
            value={selectedProjectId}
            onChange={setSelectedProjectId}
            placeholder="Projekt auswählen..."
            searchPlaceholder="Projekt suchen..."
            noResultsText="Kein Projekt gefunden"
          />
        </div>

        {loading ? (
          <div className="loading">Lade Phasen...</div>
        ) : selectedProjectId ? (
          <>
            {!showPhaseInput && (
              <button 
                className="btn btn-success" 
                onClick={handleAddPhase} 
                style={{ marginBottom: '20px' }}
              >
                + Neue Phase hinzufügen
              </button>
            )}
            
            {showPhaseInput && (
              <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#f8fafc' }}>
                <h4 style={{ marginBottom: '16px' }}>Neue Phase hinzufügen</h4>
                <div className="form-group">
                  <label>Phasenname *</label>
                  <input
                    type="text"
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value)}
                    placeholder="z.B. Design, Entwicklung, Testing"
                  />
                </div>
                <div className="form-group">
                  <label>Beschreibung</label>
                  <textarea
                    value={newPhaseDescription}
                    onChange={(e) => setNewPhaseDescription(e.target.value)}
                    placeholder="Optionale Beschreibung..."
                    rows={3}
                  />
                </div>
                <div className="action-buttons">
                  <button className="btn btn-success" onClick={handleSavePhase}>
                    ✓ Speichern
                  </button>
                  <button className="btn btn-secondary" onClick={handleCancelPhase}>
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {phases.length === 0 && !showPhaseInput ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                Keine Phasen vorhanden. Erstellen Sie die erste Phase für dieses Projekt.
              </p>
            ) : (
              <div className="timeline">
                {phases.map((phase, index) => (
                  <div key={phase.phaseID} className={`timeline-item ${getPhaseClass(phase.status)}`}>
                    <div className="timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4>
                          {getPhaseIcon(phase.status)} {phase.phaseName}
                          <span style={{ 
                            marginLeft: '10px', 
                            fontSize: '12px', 
                            color: '#94a3b8',
                            fontWeight: 'normal'
                          }}>
                            #{phase.phaseOrder}
                          </span>
                        </h4>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => movePhaseUp(phase.phaseID)}
                            disabled={index === 0}
                            style={{ 
                              padding: '4px 8px',
                              opacity: index === 0 ? 0.5 : 1,
                              cursor: index === 0 ? 'not-allowed' : 'pointer'
                            }}
                            title="Nach oben verschieben"
                          >
                            ↑
                          </button>
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => movePhaseDown(phase.phaseID)}
                            disabled={index === phases.length - 1}
                            style={{ 
                              padding: '4px 8px',
                              opacity: index === phases.length - 1 ? 0.5 : 1,
                              cursor: index === phases.length - 1 ? 'not-allowed' : 'pointer'
                            }}
                            title="Nach unten verschieben"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                      <p>{phase.description || 'Keine Beschreibung'}</p>
                      {phase.completedAt && (
                        <small style={{ color: '#94a3b8' }}>Abgeschlossen am {formatDate(phase.completedAt)}</small>
                      )}
                      {phase.startedAt && !phase.completedAt && (
                        <small style={{ color: '#94a3b8' }}>Gestartet am {formatDate(phase.startedAt)}</small>
                      )}
                      <div className="action-buttons" style={{ marginTop: '10px' }}>
                        <CustomSelect
                          value={phase.status}
                          onChange={(status) => updateStatus(phase.phaseID, status)}
                          options={statusOptions}
                          style={{ minWidth: '200px' }}
                        />
                        <button 
                          className="btn btn-danger btn-small" 
                          onClick={() => deletePhase(phase.phaseID, phase.phaseName)}
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
            Bitte wählen Sie ein Projekt aus
          </p>
        )}
      </div>

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
        confirmText={confirm.type === 'danger' ? 'Löschen' : 'Bestätigen'}
      />
    </div>
  );
};

export default PhaseManagement;
// src/components/customer/ProjectTracking.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { projectService } from '../../api/services/projectService';
import { commentService } from '../../api/services/commentService';
import { notificationService } from '../../api/services/notificationService';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import Notification from '../common/Notification';
import { formatDate, getPhaseIcon, getPhaseClass } from '../../utils/dateFormatter';
import type { CreateCommentDto, Comment, Project } from '../../types';

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const ProjectTracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  
  // Comment state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentMessage, setCommentMessage] = useState('');
  const [authorName, setAuthorName] = useState('');
  
  // Notification state
  const [notificationEmail, setNotificationEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    message: ''
  });

  const loadProjectByTracking = async (tracking: string) => {
    if (!tracking.trim()) {
      showNotification('warning', 'Bitte geben Sie eine Tracking-Nummer ein');
      return;
    }

    try {
      setError('');
      const data = await projectService.getByTrackingNumber(tracking);
      setProject(data);
      setShowDetails(true);
      
      // Load comments for this project
      loadComments(data.projectID);
      
      // Check notification subscription if email is set
      const savedEmail = localStorage.getItem(`notification_email_${data.projectID}`);
      if (savedEmail) {
        setNotificationEmail(savedEmail);
        checkSubscription(data.projectID, savedEmail);
      }
    } catch (err) {
      setError('Projekt mit dieser Tracking-Nummer nicht gefunden');
      setShowDetails(false);
      showNotification('error', 'Projekt mit dieser Tracking-Nummer nicht gefunden');
    }
  };

  const loadComments = async (projectId: number) => {
    try {
      const commentsData = await commentService.getProjectComments(projectId);
      setComments(commentsData);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const checkSubscription = async (projectId: number, email: string) => {
    try {
      const subscribed = await notificationService.isSubscribed(projectId, email);
      setIsSubscribed(subscribed);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setIsSubscribed(false);
    }
  };

  const handleToggleNotification = async () => {
    if (!project) return;

    if (!notificationEmail.trim()) {
      showNotification('warning', 'Bitte geben Sie Ihre E-Mail-Adresse ein');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(notificationEmail)) {
      showNotification('warning', 'Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    try {
      const result = await notificationService.toggle(project.projectID, notificationEmail);
      setIsSubscribed(result.isActive);
      
      // Save email to localStorage
      if (result.isActive) {
        localStorage.setItem(`notification_email_${project.projectID}`, notificationEmail);
      } else {
        localStorage.removeItem(`notification_email_${project.projectID}`);
      }

      showNotification(
        'success',
        result.isActive 
          ? '✅ E-Mail-Benachrichtigungen aktiviert! Sie erhalten Updates zu diesem Projekt.' 
          : '🔕 E-Mail-Benachrichtigungen deaktiviert.'
      );
      
      setShowNotificationForm(false);
    } catch (err: any) {
      console.error('Error toggling notification:', err);
      showNotification('error', 'Fehler beim Ändern der Benachrichtigungseinstellungen');
    }
  };

  const handleSendComment = async () => {
    if (!commentMessage.trim()) {
      showNotification('warning', 'Bitte geben Sie eine Nachricht ein');
      return;
    }

    if (!authorName.trim()) {
      showNotification('warning', 'Bitte geben Sie Ihren Namen ein');
      return;
    }

    if (!project) return;

    try {
      const commentData: CreateCommentDto = {
        projectID: project.projectID,
        message: commentMessage,
        authorName: authorName.trim()
      };

      await commentService.createCustomerComment(commentData);
      showNotification('success', 'Kommentar erfolgreich gesendet!');
      setCommentMessage('');
      
      // Reload comments
      loadComments(project.projectID);
    } catch (err: any) {
      console.error('Comment error:', err.response?.data);
      showNotification('error', 'Fehler beim Senden des Kommentars');
    }
  };

  // Check URL parameter on component mount
  useEffect(() => {
    const trackingFromUrl = searchParams.get('tracking');
    if (trackingFromUrl) {
      setTrackingNumber(trackingFromUrl);
      loadProjectByTracking(trackingFromUrl);
    }
  }, []);

  const showNotification = (type: NotificationState['type'], message: string) => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      showNotification('warning', 'Bitte geben Sie eine Tracking-Nummer ein');
      return;
    }

    setSearchParams({ tracking: trackingNumber });
    await loadProjectByTracking(trackingNumber);
  };

  const resetTracking = () => {
    setShowDetails(false);
    setProject(null);
    setTrackingNumber('');
    setError('');
    setComments([]);
    setCommentMessage('');
    setAuthorName('');
    setNotificationEmail('');
    setIsSubscribed(false);
    setShowNotificationForm(false);
    setSearchParams({});
  };

  if (!showDetails) {
    return (
      <div className="tracking-input-section">
        <h2>Projekt-Status verfolgen</h2>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          Geben Sie Ihre Tracking-Nummer ein
        </p>
        <input
          type="text"
          placeholder="z.B. TR-2024-001"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
        />
        <button className="btn btn-success" onClick={handleTrack}>
          🔍 Projekt verfolgen
        </button>
        {error && (
          <div
            className="error-message"
            style={{ marginTop: '20px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}
          >
            {error}
          </div>
        )}

        {notification.show && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={hideNotification}
          />
        )}
      </div>
    );
  }

  if (!project) return null;

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2>{project.projectName}</h2>
            <p style={{ color: '#64748b' }}>Tracking-Nr: {project.trackingNumber}</p>
            <p style={{ color: '#64748b' }}>Kunde: {project.customerName}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Notification Status/Toggle */}
            {isSubscribed ? (
              <span
                style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                🔔 Benachrichtigungen aktiv
              </span>
            ) : null}
            
            <Badge status={project.status} style={{ fontSize: '14px', padding: '8px 16px' }} />
          </div>
        </div>

        <div style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '10px' }}>Gesamtfortschritt</h3>
          <ProgressBar progress={project.progress} height="12px" />
        </div>

        {project.description && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>Projektbeschreibung</h3>
            <p style={{ color: '#64748b' }}>{project.description}</p>
          </div>
        )}

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Startdatum</p>
              <p style={{ fontWeight: '600', color: '#1e293b' }}>{formatDate(project.startDate)}</p>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Enddatum</p>
              <p style={{ fontWeight: '600', color: '#1e293b' }}>{formatDate(project.endDate)}</p>
            </div>
            {project.daysUntilDeadline !== undefined && (
              <div>
                <p style={{ fontSize: '14px', color: '#64748b' }}>Verbleibende Tage</p>
                <p style={{ fontWeight: '600', color: project.daysUntilDeadline < 7 ? '#ef4444' : '#1e293b' }}>
                  {project.daysUntilDeadline} Tage
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Projekt-Phasen</h2>
        <div className="timeline">
          {project.phases && project.phases.length > 0 ? (
            project.phases.map((phase) => (
              <div key={phase.phaseID} className={`timeline-item ${getPhaseClass(phase.status)}`}>
                <div className="timeline-content">
                  <h4>
                    {getPhaseIcon(phase.status)} {phase.phaseName}
                  </h4>
                  <p>{phase.description || 'Keine Beschreibung verfügbar'}</p>
                  {phase.completedAt && (
                    <small style={{ color: '#94a3b8' }}>Abgeschlossen am {formatDate(phase.completedAt)}</small>
                  )}
                  {phase.startedAt && !phase.completedAt && (
                    <small style={{ color: '#94a3b8' }}>Gestartet am {formatDate(phase.startedAt)}</small>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#64748b' }}>Keine Phasen definiert</p>
          )}
        </div>
      </div>

      {/* Email Notifications Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>📧 E-Mail-Benachrichtigungen</h2>
          <button
            className="btn btn-primary btn-small"
            onClick={() => setShowNotificationForm(!showNotificationForm)}
          >
            {showNotificationForm ? 'Schließen' : isSubscribed ? 'Verwalten' : 'Aktivieren'}
          </button>
        </div>

        {showNotificationForm && (
          <div style={{ 
            padding: '20px',
            background: '#f0f9ff',
            borderRadius: '12px',
            border: '2px solid #3b82f6'
          }}>
            <p style={{ marginBottom: '15px', color: '#1e293b' }}>
              {isSubscribed 
                ? '✅ Sie erhalten bereits E-Mail-Benachrichtigungen für dieses Projekt.'
                : '📬 Erhalten Sie Updates über neue Kommentare und Fortschritte per E-Mail.'}
            </p>
            
            <div className="form-group">
              <label>Ihre E-Mail-Adresse *</label>
              <input
                type="email"
                placeholder="z.B. ihre.email@beispiel.de"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #3b82f6',
                  fontSize: '15px'
                }}
              />
            </div>

            <button 
              className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-success'}`}
              onClick={handleToggleNotification}
            >
              {isSubscribed ? '🔕 Benachrichtigungen deaktivieren' : '🔔 Benachrichtigungen aktivieren'}
            </button>
          </div>
        )}

        {!showNotificationForm && isSubscribed && (
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            ✅ Aktiv für: <strong>{notificationEmail}</strong>
          </p>
        )}
      </div>

      {/* Comments Section */}
      <div className="card">
        <h2>💬 Kommentare & Diskussion</h2>

                {/* New Comment Form */}
        <div
          style={{
            padding: '25px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '12px',
            border: '2px solid #e2e8f0'
          }}
        >
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>
            ✍️ Neuer Kommentar
          </h3>
          
          <div className="form-group">
            <label>Ihr Name *</label>
            <input
              type="text"
              placeholder="z.B. Max Mustermann"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '15px'
              }}
            />
          </div>

          <div className="form-group">
            <label>Ihre Nachricht *</label>
            <textarea
              placeholder="Teilen Sie uns Ihre Gedanken, Fragen oder Feedback mit..."
              value={commentMessage}
              onChange={(e) => setCommentMessage(e.target.value)}
              rows={5}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
          
          <button className="btn btn-success" onClick={handleSendComment}>
            📨 Kommentar senden
          </button>
        </div>
        
        {/* Existing Comments */}
        <div style={{ marginBottom: '30px' }}>
          {comments && comments.length > 0 ? (
            <div className="comments-list">
              {comments.map((comment) => (
                <div
                  key={comment.commentID}
                  style={{
                    padding: '20px',
                    background: comment.authorType === 'Admin' ? '#f0fdf4' : '#f0f9ff',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${comment.authorType === 'Admin' ? '#10b981' : '#3b82f6'}`,
                    marginBottom: '15px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span
                      style={{
                        background: comment.authorType === 'Admin' ? '#10b981' : '#3b82f6',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {comment.authorType === 'Admin' ? '🔐 ' : '👤 '}{comment.authorName}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: '16px', color: '#1e293b', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {comment.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '2px dashed #cbd5e1',
              marginBottom: '30px'
            }}>
              <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '10px' }}>
                💬 Noch keine Kommentare vorhanden
              </p>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Seien Sie der Erste, der kommentiert!
              </p>
            </div>
          )}
        </div>
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            background: '#f0fdf4',
            borderLeft: '4px solid #10b981',
            borderRadius: '8px',
          }}
        >
          <p style={{ color: '#047857', fontSize: '14px', margin: 0 }}>
            💡 <strong>Hinweis:</strong> Alle Kommentare sind öffentlich sichtbar. 
            {isSubscribed && ' Sie erhalten E-Mail-Benachrichtigungen bei neuen Antworten.'}
          </p>
        </div>
      </div>

      <button className="btn btn-secondary" onClick={resetTracking} style={{ marginTop: '20px' }}>
        ← Zurück zur Suche
      </button>

      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
    </div>
  );
};

export default ProjectTracking;
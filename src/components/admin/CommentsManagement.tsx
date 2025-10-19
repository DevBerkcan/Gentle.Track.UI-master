// src/components/admin/CommentsManagement.tsx
import { useState, useEffect } from 'react';
import { commentService } from '../../api/services/commentService';
import { projectService } from '../../api/services/projectService';
import { notificationService } from '../../api/services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import Notification from '../common/Notification';
import { formatDate } from '../../utils/dateFormatter';
import type { Comment, Project } from '../../types';

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface GroupedComments {
  [projectId: number]: {
    project: Project;
    comments: Comment[];
  };
}

const CommentsManagement = () => {
  const { admin } = useAuth();
  const [, setProjects] = useState<Project[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [groupedComments, setGroupedComments] = useState<GroupedComments>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track which project has comment form open
  const [replyingToProject, setReplyingToProject] = useState<number | null>(null);
  const [commentMessages, setCommentMessages] = useState<{ [key: number]: string }>({});
  
  // Track which projects are collapsed (hidden)
  const [collapsedProjects, setCollapsedProjects] = useState<{ [key: number]: boolean }>({});
  
  // Notification subscriptions
  const [subscriptions, setSubscriptions] = useState<{ [key: number]: boolean }>({});
  
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    message: ''
  });

  useEffect(() => {
    if (admin?.email) {
      console.log('Admin loaded:', admin);
      loadData();
    }
  }, [admin]);

  const loadData = async () => {
    if (!admin?.email) {
      console.warn('Admin email not available');
      return;
    }

    try {
      setLoading(true);
      // Load all projects
      const projectsData = await projectService.getAll();
      setProjects(projectsData);

      // Load comments for all projects
      const commentsPromises = projectsData.map(p => 
        commentService.getProjectComments(p.projectID)
          .catch(() => [])
      );
      
      const allCommentsArrays = await Promise.all(commentsPromises);
      const flatComments = allCommentsArrays.flat();
      
      setAllComments(flatComments);
      
      // Group comments by project
      const grouped: GroupedComments = {};
      projectsData.forEach((project, index) => {
        const projectComments = allCommentsArrays[index];
        if (projectComments.length > 0) {
          grouped[project.projectID] = {
            project,
            comments: projectComments
          };
        }
      });
      
      setGroupedComments(grouped);

      // Load notification subscriptions for admin
      console.log('Loading subscriptions for email:', admin.email);
      await loadSubscriptions(projectsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async (projectsData: Project[]) => {
    if (!admin?.email) {
      console.warn('No admin email available for loading subscriptions');
      return;
    }

    const subscriptionStatuses: { [key: number]: boolean } = {};
    
    for (const project of projectsData) {
      try {
        const isSubscribed = await notificationService.isSubscribed(project.projectID, admin.email);
        subscriptionStatuses[project.projectID] = isSubscribed;
      } catch (error) {
        console.error(`Error checking subscription for project ${project.projectID}:`, error);
        subscriptionStatuses[project.projectID] = false;
      }
    }
    
    console.log('Subscription statuses:', subscriptionStatuses);
    setSubscriptions(subscriptionStatuses);
  };

  const handleToggleNotification = async (projectId: number) => {
    if (!admin?.email) {
      showNotification('error', 'Admin-E-Mail nicht verfügbar. Bitte melden Sie sich erneut an.');
      console.error('Admin email is not available:', admin);
      return;
    }

    console.log('Toggling notification for project:', projectId, 'email:', admin.email);

    try {
      const result = await notificationService.toggleAdmin(projectId, admin.email);
      
      console.log('Toggle result:', result);
      
      setSubscriptions(prev => ({
        ...prev,
        [projectId]: result.isActive
      }));

      showNotification(
        'success',
        result.isActive 
          ? '✅ E-Mail-Benachrichtigungen aktiviert' 
          : '🔕 E-Mail-Benachrichtigungen deaktiviert'
      );
    } catch (err: any) {
      console.error('Error toggling notification:', err);
      console.error('Error response:', err.response?.data);
      showNotification('error', 'Fehler beim Ändern der Benachrichtigungseinstellungen');
    }
  };

  const handleSendComment = async (projectId: number) => {
    const message = commentMessages[projectId];
    
    if (!message?.trim()) {
      showNotification('warning', 'Bitte geben Sie eine Nachricht ein');
      return;
    }

    try {
      await commentService.createAdminComment(projectId, message, '');
      showNotification('success', 'Kommentar erfolgreich gesendet!');
      
      // Clear message for this project
      setCommentMessages(prev => ({ ...prev, [projectId]: '' }));
      setReplyingToProject(null);
      
      // Reload all data
      loadData();
    } catch (err: any) {
      showNotification('error', `Fehler beim Senden des Kommentars: ${err.response?.data?.message || err.message}`);
    }
  };

  const toggleProjectCollapse = (projectId: number) => {
    setCollapsedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const showNotification = (type: NotificationState['type'], message: string) => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  // Filter comments based on search term
  const getFilteredComments = () => {
    if (!searchTerm) return groupedComments;
    
    const filtered: GroupedComments = {};
    Object.entries(groupedComments).forEach(([projectId, data]) => {
      const matchingComments = data.comments.filter((c: Comment) => 
        c.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingComments.length > 0) {
        filtered[parseInt(projectId)] = {
          project: data.project,
          comments: matchingComments
        };
      }
    });
    
    return filtered;
  };

  const filteredComments = getFilteredComments();
  const totalComments = allComments.length;
  const customerComments = allComments.filter(c => c.authorType === 'Customer').length;

  if (loading) {
    return <div className="loading">Lade Kommentare...</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ marginBottom: '10px' }}>Kommentar-Verwaltung</h2>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ 
              background: '#3b82f6', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {totalComments} Gesamt
            </span>
            <span style={{ 
              background: '#eab308', 
              color: 'white', 
              padding: '4px 12px', 
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {customerComments} von Kunden
            </span>
            {admin?.email && (
              <span style={{ 
                color: '#64748b', 
                fontSize: '12px'
              }}>
                📧 {admin.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="filter-input"
          placeholder="Suchen nach Projekt, Autor oder Nachricht..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {/* Comments List Grouped by Project */}
      {Object.keys(filteredComments).length === 0 ? (
        <div className="card">
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '2px dashed #cbd5e1'
          }}>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              {searchTerm ? 'Keine Kommentare gefunden' : 'Noch keine Kommentare vorhanden'}
            </p>
          </div>
        </div>
      ) : (
        Object.entries(filteredComments).map(([projectId, data]) => {
          const projectIdNum = parseInt(projectId);
          const isReplying = replyingToProject === projectIdNum;
          const isSubscribed = subscriptions[projectIdNum] || false;
          const isCollapsed = collapsedProjects[projectIdNum] || false;
          
          return (
            <div key={projectId} className="card" style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: isCollapsed ? '0' : '20px',
                paddingBottom: isCollapsed ? '0' : '15px',
                borderBottom: isCollapsed ? 'none' : '2px solid #e2e8f0',
                cursor: 'pointer'
              }}
              onClick={() => toggleProjectCollapse(projectIdNum)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Collapse/Expand Arrow */}
                  <span style={{ 
                    fontSize: '18px',
                    transition: 'transform 0.2s',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    display: 'inline-block'
                  }}>
                    ▼
                  </span>
                  
                  <div>
                    <h3 style={{ marginBottom: '5px' }}>
                      📁 {data.project.projectName}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                      Tracking-Nr: {data.project.trackingNumber} • {data.comments.length} Kommentar{data.comments.length !== 1 ? 'e' : ''}
                    </p>
                  </div>
                </div>
                
                <div 
                  style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                  onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking buttons
                >
                  {/* Email Notification Toggle */}
                  <button
                    className={`btn btn-small ${isSubscribed ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleToggleNotification(projectIdNum)}
                    title={isSubscribed ? 'E-Mail-Benachrichtigungen deaktivieren' : 'E-Mail-Benachrichtigungen aktivieren'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {isSubscribed ? '🔔' : '🔕'} E-Mail
                  </button>

                  {/* Add Comment Button */}
                  {!isCollapsed && (
                    <button
                      className="btn btn-success btn-small"
                      onClick={() => setReplyingToProject(projectIdNum)}
                    >
                      ➕ Kommentar hinzufügen
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Content */}
              {!isCollapsed && (
                <>
                  {/* Inline Comment Form */}
                  {isReplying && (
                    <div
                      style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        borderRadius: '12px',
                        border: '2px solid #10b981',
                        marginBottom: '20px'
                      }}
                    >
                      <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>
                        ✍️ Neuer Kommentar als Admin
                      </h4>
                      
                      <div className="form-group">
                        <label>Ihre Nachricht *</label>
                        <textarea
                          placeholder="Kommentar eingeben..."
                          value={commentMessages[projectIdNum] || ''}
                          onChange={(e) => setCommentMessages(prev => ({ 
                            ...prev, 
                            [projectIdNum]: e.target.value 
                          }))}
                          rows={5}
                          style={{ 
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '2px solid #10b981',
                            fontSize: '15px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          className="btn btn-success" 
                          onClick={() => handleSendComment(projectIdNum)}
                        >
                          📨 Kommentar senden
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => {
                            setReplyingToProject(null);
                            setCommentMessages(prev => ({ ...prev, [projectIdNum]: '' }));
                          }}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="comments-list">
                    {data.comments.map((comment: Comment) => (
                      <div
                        key={comment.commentID}
                        style={{
                          padding: '20px',
                          background: comment.authorType === 'Admin' ? '#f0fdf4' : '#fefce8',
                          borderRadius: '12px',
                          borderLeft: `4px solid ${comment.authorType === 'Admin' ? '#10b981' : '#eab308'}`,
                          marginBottom: '15px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <span
                            style={{
                              background: comment.authorType === 'Admin' ? '#10b981' : '#eab308',
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
                </>
              )}
            </div>
          );
        })
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
};

export default CommentsManagement;
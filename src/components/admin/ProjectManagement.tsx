// src/components/admin/ProjectManagement.tsx
import { useState, useEffect } from "react";
import { projectService } from "../../api/services/projectService";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import Notification from "../common/Notification";
import ConfirmDialog from "../common/ConfirmDialog";
import ResponsiveTable from "../common/ResponsiveTable";
import CustomSelect from "../common/CustomSelect";
import { formatDate } from "../../utils/dateFormatter";
import type { Project } from "../../types";
import { ProjectModal } from "../modals/ProjectModal";


interface NotificationState {
  show: boolean;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface ConfirmState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type?: "danger" | "warning" | "info";
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<string>("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: "info",
    message: "",
  });

  const handleDeleteSuccess = () => {
    loadProjects();
    handleModalClose();
    showNotification("success", "Projekt erfolgreich gelöscht!");
  };

  const [confirm, setConfirm] = useState<ConfirmState>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, archiveFilter, projects]);

  const showNotification = (
    type: NotificationState["type"],
    message: string
  ) => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: ConfirmState["type"] = "warning"
  ) => {
    setConfirm({ show: true, title, message, onConfirm, type });
  };

  const hideConfirm = () => {
    setConfirm({ ...confirm, show: false });
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll(true);
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
      showNotification("error", "Fehler beim Laden der Projekte");
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (archiveFilter === "active") {
      filtered = filtered.filter((p) => !p.isArchived);
    } else {
      filtered = filtered.filter((p) => p.isArchived);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  const handleEdit = async (id: number) => {
    try {
      const project = await projectService.getById(id);
      setSelectedProject(project);
      setIsModalOpen(true);
    } catch (error) {
      showNotification("error", "Fehler beim Laden des Projekts");
    }
  };

  const handleArchive = (id: number, name: string) => {
    showConfirm(
      "Projekt archivieren",
      `Möchten Sie das Projekt "${name}" wirklich archivieren?`,
      async () => {
        try {
          await projectService.archive(id);
          showNotification("success", "Projekt erfolgreich archiviert!");
          loadProjects();
        } catch (error) {
          showNotification("error", "Fehler beim Archivieren des Projekts");
        }
        hideConfirm();
      },
      "warning"
    );
  };

  const handleRestore = (id: number, name: string) => {
    showConfirm(
      "Projekt wiederherstellen",
      `Möchten Sie das Projekt "${name}" wiederherstellen?`,
      async () => {
        try {
          await projectService.restore(id);
          showNotification("success", "Projekt erfolgreich wiederhergestellt!");
          loadProjects();
        } catch (error) {
          showNotification(
            "error",
            "Fehler beim Wiederherstellen des Projekts"
          );
        }
        hideConfirm();
      },
      "info"
    );
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleSaveSuccess = () => {
    loadProjects();
    handleModalClose();
    showNotification(
      "success",
      selectedProject
        ? "Projekt erfolgreich aktualisiert!"
        : "Projekt erfolgreich angelegt!"
    );
  };

  if (loading) {
    return <div className="loading">Lade Projekte...</div>;
  }

  const archiveOptions = [
    { value: "active", label: "Aktive Projekte" },
    { value: "archived", label: "Archivierte Projekte" },
  ];

  const columns = [
    {
      header: "Projektname",
      accessor: "projectName",
      render: (value: string) => <strong>{value}</strong>,
    },
    {
      header: "Kunde",
      accessor: "customerName",
    },
    {
      header: "Tracking-Nr.",
      accessor: "trackingNumber",
    },
    {
      header: "Status",
      accessor: "status",
      render: (value: string) => <Badge status={value} />,
    },
    {
      header: "Fortschritt",
      accessor: "progress",
      render: (value: number) => <ProgressBar progress={value} />,
    },
    {
      header: "Startdatum",
      accessor: "startDate",
      render: (value: string) => formatDate(value),
    },
    {
      header: "Enddatum",
      accessor: "endDate",
      render: (value: string) => formatDate(value),
    },
    {
      header: "Aktionen",
      accessor: "projectID",
      render: (_: any, project: Project) => (
        <div className="action-buttons">
          <button
            className="btn btn-primary btn-small"
            onClick={() => handleEdit(project.projectID)}
          >
            ✏️ Bearbeiten
          </button>
          {!project.isArchived ? (
            <button
              className="btn btn-secondary btn-small"
              onClick={() =>
                handleArchive(project.projectID, project.projectName)
              }
            >
              🗂️ Archivieren
            </button>
          ) : (
            <button
              className="btn btn-success btn-small"
              onClick={() =>
                handleRestore(project.projectID, project.projectName)
              }
            >
              ↩️ Wiederherstellen
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 style={{ marginBottom: "10px" }}>Projekte verwalten</h2>
        <button
          className="btn btn-success"
          onClick={() => setIsModalOpen(true)}
        >
          + Neues Projekt
        </button>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="filters">
          <input
            type="text"
            className="filter-input"
            placeholder="Projekt suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <CustomSelect
            value={archiveFilter}
            onChange={setArchiveFilter}
            options={archiveOptions}
          />
        </div>

        {filteredProjects.length === 0 ? (
          <p style={{ textAlign: "center", color: "#64748b", padding: "20px" }}>
            Keine Projekte gefunden
          </p>
        ) : (
          <ResponsiveTable
            columns={columns}
            data={filteredProjects}
            keyField="projectID"
          />
        )}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        project={selectedProject}
        onSaveSuccess={handleSaveSuccess}
        onDeleteSuccess={handleDeleteSuccess}
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
        confirmText={confirm.type === "danger" ? "Löschen" : "Bestätigen"}
      />
    </div>
  );
};

export default ProjectManagement;

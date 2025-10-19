// src/components/admin/Dashboard.tsx
import { useState, useEffect } from "react";
import { projectService } from "../../api/services/projectService";
import StatCard from "../common/StatCard";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import Notification from "../common/Notification";
import ResponsiveTable from "../common/ResponsiveTable";
import CustomSelect from "../common/CustomSelect";
import { ProjectModal } from "../modals/ProjectModal";
import { formatDate } from "../../utils/dateFormatter";
import type { Project, DashboardStats } from "../../types";

interface NotificationState {
  show: boolean;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: "info",
    message: "",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, statusFilter, projects]);

  const showNotification = (
    type: NotificationState["type"],
    message: string
  ) => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsData, projectsData] = await Promise.all([
        projectService.getDashboardStats(),
        projectService.getAll(),
      ]);
      setStats(statsData);
      setProjects(projectsData);
      setFilteredProjects(projectsData.slice(0, 10));
    } catch (error) {
      console.error("Error loading dashboard:", error);
      showNotification("error", "Fehler beim Laden der Dashboard-Daten");
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProjects(filtered.slice(0, 10));
  };

  const handleProjectClick = async (id: number) => {
    try {
      const project = await projectService.getById(id);
      setSelectedProject(project);
      setIsModalOpen(true);
    } catch (error) {
      showNotification("error", "Fehler beim Laden des Projekts");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleSaveSuccess = () => {
    loadDashboard();
    handleModalClose();
    showNotification("success", "Projekt erfolgreich aktualisiert!");
  };

  if (loading) {
    return <div className="loading">Lade Dashboard-Daten...</div>;
  }

  const statusOptions = [
    { value: "", label: "Alle Status" },
    { value: "Planung", label: "Planung" },
    { value: "In Bearbeitung", label: "In Bearbeitung" },
    { value: "Warten auf Feedback", label: "Warten auf Feedback" },
    { value: "Abgeschlossen", label: "Abgeschlossen" },
  ];

  const columns = [
    {
      header: "Projekt",
      accessor: "projectName",
      render: (value: string, project: Project) => (
        <strong
          style={{ cursor: "pointer", color: "#11998e" }}
          onClick={() => handleProjectClick(project.projectID)}
        >
          {value}
        </strong>
      ),
    },
    {
      header: "Kunde",
      accessor: "customerName",
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
      header: "Tracking-Nr.",
      accessor: "trackingNumber",
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
  ];

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>Dashboard</h2>

      <div className="dashboard-stats">
        <StatCard title="Aktive Projekte" value={stats?.activeProjects || 0} />
        <StatCard
          title="Kunden"
          value={stats?.totalCustomers || 0}
          gradient="linear-gradient(135deg, #fc6076 0%, #ff9a44 100%)"
        />
        <StatCard
          title="Abgeschlossen"
          value={stats?.completedProjects || 0}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        />
        <StatCard
          title="Kommentare"
          value={stats?.totalComments || 0}
          gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
        />
      </div>

      <div className="card">
        <h2>Aktuelle Projekte</h2>
        <div className="filters">
          <input
            type="text"
            className="filter-input"
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
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
      />

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

export default Dashboard;
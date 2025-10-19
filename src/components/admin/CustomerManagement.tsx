// src/components/admin/CustomerManagement.tsx
import { useState, useEffect } from 'react';
import { customerService } from '../../api/services/customerService';
import CustomerModal from '../modals/CustomerModal';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import ResponsiveTable from '../common/ResponsiveTable';
import type { Customer } from '../../types';

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

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

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

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      showNotification('error', 'Fehler beim Laden der Kunden');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(
      (c) =>
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    showConfirm(
      'Kunde löschen',
      `Möchten Sie den Kunden "${name}" wirklich löschen?`,
      async () => {
        try {
          await customerService.delete(id);
          showNotification('success', 'Kunde erfolgreich gelöscht!');
          loadCustomers();
        } catch (error) {
          showNotification('error', 'Fehler beim Löschen des Kunden');
        }
        hideConfirm();
      },
      'danger'
    );
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleSaveSuccess = () => {
    loadCustomers();
    handleModalClose();
    showNotification('success', selectedCustomer ? 'Kunde erfolgreich aktualisiert!' : 'Kunde erfolgreich angelegt!');
  };

  if (loading) {
    return <div className="loading">Lade Kunden...</div>;
  }

  const columns = [
    {
      header: 'Firmenname',
      accessor: 'companyName',
      render: (value: string) => <strong>{value}</strong>
    },
    {
      header: 'Ansprechpartner',
      accessor: 'contactPerson'
    },
    {
      header: 'E-Mail',
      accessor: 'email'
    },
    {
      header: 'Projekte',
      accessor: 'projectCount',
      render: (value: number) => value || 0
    },
    {
      header: 'Aktionen',
      accessor: 'customerID',
      render: (_: any, customer: Customer) => (
        <div className="action-buttons">
          <button
            className="btn btn-primary btn-small"
            onClick={() => handleEdit(customer)}
          >
            ✏️ Bearbeiten
          </button>
          <button
            className="btn btn-danger btn-small"
            onClick={() => handleDelete(customer.customerID, customer.companyName)}
          >
            🗑️ Löschen
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: "10px" }}>Kundenverwaltung</h2>
      <button className="btn btn-success" onClick={() => setIsModalOpen(true)}>
        + Neuer Kunde
      </button>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="filters">
          <input
            type="text"
            className="filter-input"
            placeholder="Kunde suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
            Keine Kunden gefunden
          </p>
        ) : (
          <ResponsiveTable
            columns={columns}
            data={filteredCustomers}
            keyField="customerID"
          />
        )}
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        customer={selectedCustomer}
        onSaveSuccess={handleSaveSuccess}
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
        confirmText={confirm.type === 'danger' ? 'Löschen' : 'Bestätigen'}
      />
    </div>
  );
};

export default CustomerManagement;
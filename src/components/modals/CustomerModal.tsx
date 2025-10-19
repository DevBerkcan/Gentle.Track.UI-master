// src/components/modals/CustomerModal.tsx
import { useState, useEffect } from 'react';
import { customerService } from '../../api/services/customerService';
import Modal from '../common/Modal';
import type { Customer, CreateCustomerDto } from '../../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSaveSuccess: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSaveSuccess,
}) => {
  const [formData, setFormData] = useState<CreateCustomerDto>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
      });
    } else {
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
      });
    }
    setError('');
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (customer) {
        await customerService.update(customer.customerID, formData);
      } else {
        await customerService.create(formData);
      }
      onSaveSuccess(); // This will trigger the notification in parent
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Speichern');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Kunde bearbeiten' : 'Neuen Kunden hinzufügen'}
    >
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Firmenname *</label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Ansprechpartner *</label>
          <input
            type="text"
            required
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>E-Mail *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Telefon</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Adresse</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
          />
        </div>
        <button type="submit" className="btn btn-success">
          {customer ? '✓ Aktualisieren' : '✓ Kunde anlegen'}
        </button>
      </form>
    </Modal>
  );
};

export default CustomerModal;
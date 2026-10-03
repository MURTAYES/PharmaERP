import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface POSHoldBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { customerName?: string; customerPhone?: string; notes?: string }) => void;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  loading?: boolean;
}

export const POSHoldBillModal: React.FC<POSHoldBillModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialCustomerName = '',
  initialCustomerPhone = '',
  loading = false,
}) => {
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ customerName, customerPhone, notes });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hold Active Cart (F8)" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <p className="text-xs text-on-surface-variant">
          Holding this bill saves the active cart state to the server so you can serve the next
          customer and resume this transaction from any terminal anytime.
        </p>

        <Input
          label="Customer Name (Optional)"
          placeholder="e.g. Rahim Mia"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          autoFocus
        />

        <Input
          label="Customer Phone (Optional)"
          placeholder="e.g. 01711223344"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Hold Note / Reason
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Customer stepped away to ATM"
            className="w-full p-3 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Hold Bill
          </Button>
        </div>
      </form>
    </Modal>
  );
};

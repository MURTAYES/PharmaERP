import React from 'react';
import { format } from 'date-fns';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { HeldBill } from '../../types';

interface POSHeldBillsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  heldBills: HeldBill[];
  onResumeBill: (bill: HeldBill) => void;
  onDiscardBill: (billId: string) => void;
  loading?: boolean;
}

export const POSHeldBillsDrawer: React.FC<POSHeldBillsDrawerProps> = ({
  isOpen,
  onClose,
  heldBills,
  onResumeBill,
  onDiscardBill,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Open Held Bills (F9)" maxWidth="lg">
      <div className="space-y-4 text-left">
        {heldBills.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-outline-variant">
              pause_circle
            </span>
            <p className="text-sm font-semibold">No held bills at the moment</p>
            <p className="text-xs text-on-surface-variant/80">
              You can hold any active bill by pressing <kbd className="font-mono font-bold bg-surface-container px-1.5 py-0.5 rounded text-primary">F8</kbd>.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-container rounded-2xl border border-surface-container overflow-hidden bg-surface-container-low max-h-[60vh] overflow-y-auto">
            {heldBills.map((bill) => {
              const formattedTime = format(new Date(bill.createdAt), 'hh:mm a, dd MMM');
              const totalItems = bill.lines.reduce((acc, l) => acc + l.quantity, 0);

              return (
                <div
                  key={bill._id}
                  className="p-4 flex items-center justify-between hover:bg-surface-container-lowest transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                        {bill.billReference}
                      </span>
                      {bill.customerName && (
                        <span className="font-bold text-sm text-on-surface">
                          {bill.customerName}
                        </span>
                      )}
                      {bill.customerPhone && (
                        <span className="text-xs text-on-surface-variant font-mono">
                          ({bill.customerPhone})
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-on-surface-variant flex items-center gap-2">
                      <span>Held by {bill.heldByName}</span>
                      <span>•</span>
                      <span>{formattedTime}</span>
                      <span>•</span>
                      <span className="font-semibold text-on-surface">
                        {bill.lines.length} medicine(s) / {totalItems} units
                      </span>
                    </div>

                    {bill.notes && (
                      <p className="text-xs italic text-on-surface-variant/80 bg-surface-container px-2 py-0.5 rounded inline-block">
                        Note: {bill.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDiscardBill(bill._id)}
                      disabled={loading}
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        onResumeBill(bill);
                        onClose();
                      }}
                      disabled={loading}
                    >
                      Resume Bill
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-surface-container">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

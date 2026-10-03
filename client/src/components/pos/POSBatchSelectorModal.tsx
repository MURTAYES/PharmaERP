import React from 'react';
import { format } from 'date-fns';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Batch } from '../../types';

interface POSBatchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeName: string;
  batches: (Batch & { isFefo?: boolean })[];
  currentBatchId: string;
  onSelectBatch: (batch: Batch & { isFefo?: boolean }) => void;
}

export const POSBatchSelectorModal: React.FC<POSBatchSelectorModalProps> = ({
  isOpen,
  onClose,
  tradeName,
  batches,
  currentBatchId,
  onSelectBatch,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Select Batch for ${tradeName}`} maxWidth="md">
      <div className="space-y-3 text-left">
        <p className="text-xs text-on-surface-variant">
          System automatically suggests the earliest-expiring batch (**FEFO**). You may select an
          alternative batch if physically required at the counter.
        </p>

        <div className="divide-y divide-surface-container rounded-2xl border border-surface-container overflow-hidden bg-surface-container-low">
          {batches.map((batch) => {
            const isSelected = batch._id === currentBatchId;
            const expiryDateObj = new Date(batch.expiryDate);
            const formattedExpiry = format(expiryDateObj, 'MM/yyyy');
            const isFefo = batch.isFefo;

            return (
              <div
                key={batch._id}
                onClick={() => {
                  onSelectBatch(batch);
                  onClose();
                }}
                className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary-container/20 font-bold'
                    : 'hover:bg-surface-container-lowest'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary bg-primary' : 'border-outline-variant'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-on-surface">
                        {batch.batchNumber}
                      </span>
                      {isFefo && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          FEFO Recommended
                        </span>
                      )}
                      {!isFefo && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                          Non-FEFO
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      Expires: <strong className="text-on-surface font-mono">{formattedExpiry}</strong>
                      {batch.supplierName ? ` • ${batch.supplierName}` : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-emerald-700">
                    {batch.qtySellable} pcs
                  </span>
                  <span className="block text-[11px] text-on-surface-variant">Available Stock</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

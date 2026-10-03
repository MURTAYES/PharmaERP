import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi, AuditQuery } from '../services/auditApi.ts';
import { Card } from '../components/common/Card.tsx';
import { Button } from '../components/common/Button.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { AuditLogItem } from '../types/index.ts';

export function AuditLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const queryParams: AuditQuery = {
    page,
    limit: 15,
    ...(actionFilter ? { action: actionFilter } : {}),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['auditLogs', queryParams],
    queryFn: () => auditApi.getLogs(queryParams),
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('SUCCESS') || action.includes('CREATE')) return 'success';
    if (action.includes('FAILED') || action.includes('DEACTIVATE')) return 'error';
    if (action.includes('UPDATE') || action.includes('RESET')) return 'warning';
    return 'neutral';
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">System Audit Log</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Immutable system activity ledger recording authentication, permission, and configuration events.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 bg-surface-container-lowest rounded-xl text-xs text-on-surface border border-outline-variant shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Action Types</option>
            <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
            <option value="AUTH_LOGIN_FAILED">AUTH_LOGIN_FAILED</option>
            <option value="AUTH_LOGOUT">AUTH_LOGOUT</option>
            <option value="USER_CREATE">USER_CREATE</option>
            <option value="USER_UPDATE">USER_UPDATE</option>
            <option value="PASSWORD_RESET">PASSWORD_RESET</option>
            <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
          </select>
        </div>
      </div>

      {/* Log Table Card */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error text-xs font-semibold">
            Failed to load audit logs. Please check backend connection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">User / Actor</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">IP Address</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-xs text-on-surface">
                {data?.logs?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant text-xs">
                      No audit events matching current filter.
                    </td>
                  </tr>
                ) : (
                  data?.logs?.map((log: AuditLogItem) => (
                    <tr key={log._id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-on-surface">@{log.username}</div>
                        {log.role && (
                          <span className="text-[10px] text-on-surface-variant uppercase font-mono">{log.role}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={getActionBadgeVariant(log.action)} className="font-mono text-[10px]">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-on-surface-variant">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="visibility"
                          onClick={() => setSelectedLog(log)}
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>
              Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total events)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Inspect Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Payload"
        subtitle={`Action: ${selectedLog?.action} by @${selectedLog?.username}`}
        maxWidth="lg"
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-4 rounded-xl font-mono text-[11px]">
            <div>
              <span className="text-on-surface-variant">Event ID: </span>
              <span className="text-on-surface font-bold">{selectedLog?._id}</span>
            </div>
            <div>
              <span className="text-on-surface-variant">Timestamp: </span>
              <span className="text-on-surface font-bold">
                {selectedLog && new Date(selectedLog.timestamp).toISOString()}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant">Actor: </span>
              <span className="text-on-surface font-bold">@{selectedLog?.username}</span>
            </div>
            <div>
              <span className="text-on-surface-variant">IP: </span>
              <span className="text-on-surface font-bold">{selectedLog?.ipAddress || '127.0.0.1'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <span className="font-bold text-on-surface">Details Object:</span>
            <pre className="p-4 bg-on-surface text-surface rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed">
              {JSON.stringify(selectedLog?.details, null, 2)}
            </pre>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, CreateUserData } from '../services/userApi.ts';
import { Card } from '../components/common/Card.tsx';
import { Button } from '../components/common/Button.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { Input } from '../components/common/Input.tsx';
import { User, UserRole } from '../types/index.ts';

export function Users() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserData>({
    username: '',
    password: '',
    fullName: '',
    role: 'pharmacist',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (formData: CreateUserData) => userApi.create(formData),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateOpen(false);
      setCreateForm({ username: '', password: '', fullName: '', role: 'pharmacist' });
      showToast(res.message);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to create user');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User status updated');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to update status');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pass }: { id: string; pass: string }) =>
      userApi.resetPassword(id, pass),
    onSuccess: (res) => {
      setResetUser(null);
      setNewPassword('');
      showToast(res.message);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to reset password');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(createForm);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetUser && newPassword) {
      resetPasswordMutation.mutate({ id: resetUser.id, pass: newPassword });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-on-surface text-surface shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[20px] text-secondary-container">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Staff & User Management</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Administer pharmacy personnel, configure credentials, and manage roles.
          </p>
        </div>
        <Button variant="primary" icon="person_add" onClick={() => setIsCreateOpen(true)}>
          Add Staff Account
        </Button>
      </div>

      {/* Users Table Card */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error text-xs font-semibold">
            Failed to load users. Please check backend connection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Last Login</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-xs text-on-surface">
                {data?.users?.map((u: User) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center font-bold text-sm">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface">{u.fullName}</div>
                          <div className="text-on-surface-variant font-mono text-[11px]">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={u.role === 'owner' ? 'primary' : 'secondary'}>
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={u.isActive ? 'success' : 'error'} dot>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant font-mono">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon="key"
                          onClick={() => setResetUser(u)}
                          title="Reset Password"
                        >
                          Password
                        </Button>
                        <Button
                          variant={u.isActive ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Staff Account"
        subtitle="Add a new pharmacy team member"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Jane Smith"
            value={createForm.fullName}
            onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
            required
          />
          <Input
            label="Username"
            placeholder="e.g. jsmith"
            value={createForm.username}
            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 6 characters"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            required
          />
          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Role</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
              className="w-full h-11 px-4 bg-surface-container-low rounded-xl text-sm text-on-surface border border-transparent focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
            >
              <option value="pharmacist">Pharmacist (Counter Sales & Receiving)</option>
              <option value="owner">Owner (Full System Administrator)</option>
            </select>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetUser}
        onClose={() => setResetUser(null)}
        title="Reset Password"
        subtitle={`Set a new password for @${resetUser?.username}`}
      >
        <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
          <Input
            label="New Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setResetUser(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={resetPasswordMutation.isPending}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

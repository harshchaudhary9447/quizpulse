'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import {
  Shield,
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
  UserCheck,
} from 'lucide-react';

export default function AdminPlatformPage() {
  const [platformStats, setPlatformStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [roleFilter]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics/platform');
      setPlatformStats(res.data);
    } catch (err) {
      console.error('Failed to load platform stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      params.append('limit', '50');

      const res = await api.get(`/users?${params.toString()}`);
      setUsers(res?.data?.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          Superuser Control Center
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
          Platform Administration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor system load, manage user access permissions, and audit platform activity.
        </p>
      </div>

      {/* KPI Stats */}
      {platformStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Accounts</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">
              {platformStats.users.total}
            </span>
            <span className="text-[11px] text-slate-400">
              {platformStats.users.students} Students • {platformStats.users.teachers} Teachers
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Platform Quizzes</span>
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 block mt-1">
              {platformStats.quizzes.total}
            </span>
            <span className="text-[11px] text-slate-400">
              {platformStats.quizzes.published} Published ({platformStats.quizzes.drafts} Drafts)
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Attempts</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
              {platformStats.attempts.total}
            </span>
            <span className="text-[11px] text-slate-400">Graded exam attempts</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">System Status</span>
            <span className="text-3xl font-black text-emerald-500 block mt-1">
              100%
            </span>
            <span className="text-[11px] text-slate-400">Healthy & operational</span>
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              User Directory & Role Control
            </h2>
            <p className="text-xs text-slate-400">Manage account permissions and role promotions</p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                placeholder="Search by name or email..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="TEACHER">Teachers</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Activity</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {u.name}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">
                      {u.email}
                    </td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : u.role === 'TEACHER'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="TEACHER">Teacher</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-500">
                      {u._count.quizzes > 0 && `${u._count.quizzes} Quizzes • `}
                      {u._count.attempts > 0 && `${u._count.attempts} Attempts`}
                      {u._count.quizzes === 0 && u._count.attempts === 0 && 'None'}
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

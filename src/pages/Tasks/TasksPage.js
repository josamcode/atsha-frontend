import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
  FaTasks,
  FaTimes,
  FaUserCheck,
  FaUserClock
} from 'react-icons/fa';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Modal from '../../components/Common/Modal';
import PageTitle from '../../components/Common/PageTilte';
import UserPicker from '../../components/Common/UserPicker';
import FilterBar from '../../components/Common/FilterBar';
import Loading from '../../components/Common/Loading';
import api from '../../utils/api';
import { showError, showSuccess } from '../../utils/toast';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { roleMatches } from '../../utils/organization';
import { useAuth } from '../../context/AuthContext';
import { usePolling } from '../../hooks/usePolling';

const isTaskOverdue = (task) => (
  Boolean(
    task?.isOverdue ||
    (
      task?.dueDate &&
      ['pending', 'accepted'].includes(task?.status) &&
      new Date(task.dueDate).getTime() < Date.now()
    )
  )
);

const TasksPage = () => {
  const { t, i18n } = useTranslation();
  const { user, organization } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedTaskId = searchParams.get('taskId') || '';
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const isInitialLoad = useRef(true);

  const tt = useCallback((key, defaultValue, options = {}) => (
    t(key, { defaultValue, ...options })
  ), [t]);

  const isAdmin = roleMatches(user, ['platform_admin', 'organization_admin']);
  const isEmployee = roleMatches(user, ['employee']);

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [createForm, setCreateForm] = useState({
    title: '',
    details: '',
    assignedTo: '',
    dueDate: ''
  });

  const statusOptions = useMemo(() => ([
    { value: 'pending', label: tt('tasks.pending', 'Pending') },
    { value: 'accepted', label: tt('tasks.accepted', 'Accepted') },
    { value: 'rejected', label: tt('tasks.rejected', 'Rejected') },
    { value: 'completed', label: tt('tasks.completed', 'Completed') },
    { value: 'overdue', label: tt('tasks.overdue', 'Overdue') }
  ]), [tt]);

  const getStatusMeta = useCallback((task) => {
    if (isTaskOverdue(task)) {
      return {
        label: tt('tasks.overdue', 'Overdue'),
        className: 'bg-red-100 text-red-700 border border-red-200'
      };
    }

    switch (task?.status) {
      case 'accepted':
        return {
          label: tt('tasks.accepted', 'Accepted'),
          className: 'bg-blue-100 text-blue-700 border border-blue-200'
        };
      case 'rejected':
        return {
          label: tt('tasks.rejected', 'Rejected'),
          className: 'bg-rose-100 text-rose-700 border border-rose-200'
        };
      case 'completed':
        return {
          label: tt('tasks.completed', 'Completed'),
          className: 'bg-green-100 text-green-700 border border-green-200'
        };
      default:
        return {
          label: tt('tasks.pending', 'Pending'),
          className: 'bg-amber-100 text-amber-700 border border-amber-200'
        };
    }
  }, [tt]);

  const fetchTasks = useCallback(async (showLoading = false) => {
    const shouldShowLoading = showLoading || isInitialLoad.current;

    try {
      if (shouldShowLoading) {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (filters.status) {
        params.set('status', filters.status);
      }

      const response = await api.get(`/tasks${params.toString() ? `?${params.toString()}` : ''}`);
      setTasks(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      if (isInitialLoad.current) {
        showError(error.response?.data?.message || tt('tasks.errorFetching', 'Unable to load tasks right now.'));
      }
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }

      isInitialLoad.current = false;
    }
  }, [filters.status, tt]);

  const fetchEmployees = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    try {
      setEmployeesLoading(true);
      const response = await api.get('/users', {
        params: {
          role: 'employee',
          isActive: true,
          limit: 500,
          sort: 'name'
        }
      });

      setEmployees(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      showError(error.response?.data?.message || tt('tasks.errorFetchingEmployees', 'Unable to load employees.'));
    } finally {
      setEmployeesLoading(false);
    }
  }, [isAdmin, tt]);

  useEffect(() => {
    isInitialLoad.current = true;
    fetchTasks(true);
  }, [fetchTasks]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  usePolling(
    async () => {
      await fetchTasks(false);
    },
    30000,
    {
      enabled: true,
      immediate: false,
      onError: () => {}
    }
  );

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((task) => task.status === 'pending' && !isTaskOverdue(task)).length,
    accepted: tasks.filter((task) => task.status === 'accepted' && !isTaskOverdue(task)).length,
    completed: tasks.filter((task) => task.status === 'completed').length,
    overdue: tasks.filter((task) => isTaskOverdue(task)).length
  }), [tasks]);

  const visibleTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const sortedTasks = [...tasks];

    if (highlightedTaskId) {
      sortedTasks.sort((left, right) => {
        if (left._id === highlightedTaskId) return -1;
        if (right._id === highlightedTaskId) return 1;
        return 0;
      });
    }

    if (!normalizedSearch) {
      return sortedTasks;
    }

    return sortedTasks.filter((task) => (
      [
        task.title,
        task.details,
        task.assignedTo?.name,
        task.assignedBy?.name,
        task.responseNotes,
        task.completionNotes
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    ));
  }, [highlightedTaskId, searchTerm, tasks]);

  const handleFilterChange = (event) => {
    const nextFilters = {
      ...filters,
      [event.target.name]: event.target.value
    };

    setFilters(nextFilters);

    const nextParams = new URLSearchParams(searchParams);
    if (nextFilters.status) {
      nextParams.set('status', nextFilters.status);
    } else {
      nextParams.delete('status');
    }

    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setFilters({ status: '' });
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('status');
    setSearchParams(nextParams);
  };

  const handleCreateChange = (event) => {
    setCreateForm((currentValue) => ({
      ...currentValue,
      [event.target.name]: event.target.value
    }));
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      details: '',
      assignedTo: '',
      dueDate: ''
    });
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();

    if (!createForm.title.trim() || !createForm.details.trim() || !createForm.assignedTo) {
      showError(tt('tasks.requiredFields', 'Please fill in the required task fields.'));
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/tasks', {
        title: createForm.title.trim(),
        details: createForm.details.trim(),
        assignedTo: createForm.assignedTo,
        dueDate: createForm.dueDate || undefined
      });

      showSuccess(tt('tasks.createdSuccessfully', 'Task assigned successfully.'));
      setShowCreateModal(false);
      resetCreateForm();
      await fetchTasks(true);
    } catch (error) {
      showError(error.response?.data?.message || tt('tasks.errorCreating', 'Unable to create the task.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptTask = async (taskId) => {
    try {
      setSubmitting(true);
      await api.put(`/tasks/${taskId}/respond`, { action: 'accept' });
      showSuccess(tt('tasks.acceptedSuccessfully', 'Task accepted.'));
      await fetchTasks(true);
    } catch (error) {
      showError(error.response?.data?.message || tt('tasks.errorAccepting', 'Unable to accept the task.'));
    } finally {
      setSubmitting(false);
    }
  };

  const openRejectModal = (task) => {
    setSelectedTask(task);
    setRejectNotes('');
    setShowRejectModal(true);
  };

  const handleRejectTask = async (event) => {
    event.preventDefault();

    if (!selectedTask?._id) {
      return;
    }

    if (!rejectNotes.trim()) {
      showError(tt('tasks.rejectNotesRequired', 'Please add notes when rejecting a task.'));
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/tasks/${selectedTask._id}/respond`, {
        action: 'reject',
        notes: rejectNotes.trim()
      });

      showSuccess(tt('tasks.rejectedSuccessfully', 'Task rejected.'));
      setShowRejectModal(false);
      setSelectedTask(null);
      setRejectNotes('');
      await fetchTasks(true);
    } catch (error) {
      showError(error.response?.data?.message || tt('tasks.errorRejecting', 'Unable to reject the task.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setSubmitting(true);
      await api.put(`/tasks/${taskId}/complete`);
      showSuccess(tt('tasks.completedSuccessfully', 'Task marked as finished.'));
      await fetchTasks(true);
    } catch (error) {
      showError(error.response?.data?.message || tt('tasks.errorCompleting', 'Unable to complete the task.'));
    } finally {
      setSubmitting(false);
    }
  };

  const summaryCards = [
    {
      key: 'total',
      title: tt('tasks.summary.total', 'Total Tasks'),
      value: stats.total,
      icon: FaTasks,
      className: 'from-slate-50 to-slate-100/60 border-slate-200 text-slate-700'
    },
    {
      key: 'pending',
      title: tt('tasks.summary.pending', 'Waiting Response'),
      value: stats.pending,
      icon: FaUserClock,
      className: 'from-amber-50 to-amber-100/60 border-amber-200 text-amber-700'
    },
    {
      key: 'accepted',
      title: tt('tasks.summary.accepted', 'Accepted'),
      value: stats.accepted,
      icon: FaUserCheck,
      className: 'from-blue-50 to-blue-100/60 border-blue-200 text-blue-700'
    },
    {
      key: 'completed',
      title: tt('tasks.summary.completed', 'Completed'),
      value: stats.completed,
      icon: FaCheckCircle,
      className: 'from-green-50 to-green-100/60 border-green-200 text-green-700'
    },
    {
      key: 'overdue',
      title: tt('tasks.summary.overdue', 'Overdue'),
      value: stats.overdue,
      icon: FaExclamationTriangle,
      className: 'from-red-50 to-red-100/60 border-red-200 text-red-700'
    }
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageTitle
            title={tt('tasks.title', 'Tasks')}
            icon={FaTasks}
            description={isAdmin
              ? tt('tasks.adminDescription', 'Assign work to employees, track responses, and follow completion status.')
              : tt('tasks.employeeDescription', 'Review your assigned tasks and keep your admin updated on progress.')}
          />
          {isAdmin && (
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={FaPlus}
              className="w-full sm:w-auto"
            >
              {tt('tasks.newTask', 'New Task')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card
                key={card.key}
                className={`border bg-gradient-to-br ${card.className}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{card.title}</p>
                    <p className="mt-1 text-3xl font-bold">{card.value}</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-3">
                    <Icon className="text-xl" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          filterConfig={[
            {
              name: 'status',
              label: tt('tasks.status', 'Status'),
              allLabel: tt('common.all', 'All'),
              options: statusOptions
            }
          ]}
          showSearch
          searchValue={searchTerm}
          onSearchChange={(event) => setSearchTerm(event.target.value)}
          onSearchSubmit={(event) => event.preventDefault()}
          searchPlaceholder={tt('tasks.searchPlaceholder', 'Search by title, details, or user')}
        />

        <Card>
          {visibleTasks.length === 0 ? (
            <div className="py-12 text-center">
              <FaTasks className="mx-auto mb-4 text-5xl text-slate-300" />
              <p className="text-lg font-semibold text-slate-700">
                {tt('tasks.emptyTitle', 'No tasks found')}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {isAdmin
                  ? tt('tasks.emptyAdminDescription', 'Create a task to start assigning work to your team.')
                  : tt('tasks.emptyEmployeeDescription', 'New tasks assigned to you will appear here.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleTasks.map((task) => {
                const statusMeta = getStatusMeta(task);
                const overdue = isTaskOverdue(task);
                const isHighlighted = task._id === highlightedTaskId;

                return (
                  <div
                    key={task._id}
                    className={`rounded-2xl border p-5 transition-all ${
                      isHighlighted
                        ? 'border-primary bg-primary/5 shadow-md'
                        : overdue
                          ? 'border-red-200 bg-red-50/40'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <h2 className="truncate text-xl font-bold text-slate-900">
                              {task.title}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                              {tt('tasks.assignedOn', 'Assigned on')} {formatDateTime(task.createdAt, i18n.language)}
                            </p>
                          </div>
                          <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {tt('tasks.assignedTo', 'Assigned To')}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">
                              {task.assignedTo?.name || '--'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {tt('tasks.assignedBy', 'Assigned By')}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">
                              {task.assignedBy?.name || '--'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {tt('tasks.dueDate', 'Due Date')}
                            </p>
                            <p className={`mt-1 text-sm font-semibold ${overdue ? 'text-red-700' : 'text-slate-800'}`}>
                              {task.dueDate
                                ? formatDate(task.dueDate, i18n.language)
                                : tt('tasks.noDueDate', 'No due date')}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {tt('tasks.lastUpdate', 'Last Update')}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">
                              {formatDateTime(task.updatedAt, i18n.language)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                          <p className="mb-2 text-sm font-semibold text-slate-700">
                            {tt('tasks.details', 'Details')}
                          </p>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {task.details}
                          </p>
                        </div>

                        {(task.responseNotes || task.completionNotes || task.completedAt) && (
                          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {task.responseNotes && (
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-semibold text-slate-700">
                                  {tt('tasks.responseNotes', 'Response Notes')}
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                                  {task.responseNotes}
                                </p>
                              </div>
                            )}
                            {(task.completionNotes || task.completedAt) && (
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-semibold text-slate-700">
                                  {tt('tasks.completionDetails', 'Completion Details')}
                                </p>
                                {task.completedAt && (
                                  <p className="mt-2 text-sm text-slate-600">
                                    {tt('tasks.completedAt', 'Completed at')}: {formatDateTime(task.completedAt, i18n.language)}
                                  </p>
                                )}
                                {task.completionNotes && (
                                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                                    {task.completionNotes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {isEmployee && (
                        <div className="flex shrink-0 flex-col gap-2 lg:w-48">
                          {task.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => handleAcceptTask(task._id)}
                                icon={FaCheck}
                                variant="success"
                                disabled={submitting}
                                className="w-full"
                              >
                                {tt('tasks.acceptTask', 'Accept')}
                              </Button>
                              <Button
                                onClick={() => openRejectModal(task)}
                                icon={FaTimes}
                                variant="danger"
                                disabled={submitting}
                                className="w-full"
                              >
                                {tt('tasks.rejectTask', 'Reject')}
                              </Button>
                            </>
                          )}

                          {task.status === 'accepted' && (
                            <Button
                              onClick={() => handleCompleteTask(task._id)}
                              icon={FaCheckCircle}
                              variant="success"
                              disabled={submitting}
                              className="w-full"
                            >
                              {tt('tasks.finishTask', 'Mark Finished')}
                            </Button>
                          )}

                          {task.status === 'completed' && (
                            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
                              {tt('tasks.alreadyFinished', 'Finished')}
                            </div>
                          )}

                          {task.status === 'rejected' && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-700">
                              {tt('tasks.alreadyRejected', 'Rejected')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {isAdmin && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetCreateForm();
          }}
          title={tt('tasks.createModalTitle', 'Create Task')}
          size="lg"
        >
          <form onSubmit={handleCreateTask} className="space-y-4">
            <Input
              label={tt('tasks.taskTitle', 'Task Title')}
              name="title"
              value={createForm.title}
              onChange={handleCreateChange}
              required
              placeholder={tt('tasks.taskTitlePlaceholder', 'Enter a short task title')}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {tt('tasks.assignToEmployee', 'Assign To')}
              </label>
              <UserPicker
                name="assignedTo"
                value={createForm.assignedTo}
                onChange={handleCreateChange}
                users={employees}
                organization={organization}
                loading={employeesLoading}
                placeholder={tt('tasks.selectEmployee', 'Select an employee')}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {tt('tasks.details', 'Details')}
              </label>
              <textarea
                name="details"
                value={createForm.details}
                onChange={handleCreateChange}
                rows={6}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={tt('tasks.detailsPlaceholder', 'Describe the task clearly for the employee')}
              />
            </div>

            <Input
              label={`${tt('tasks.dueDate', 'Due Date')} (${tt('common.optional', 'Optional')})`}
              type="date"
              name="dueDate"
              value={createForm.dueDate}
              onChange={handleCreateChange}
            />

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
              >
                {tt('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {tt('tasks.assignTask', 'Assign Task')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedTask(null);
          setRejectNotes('');
        }}
        title={tt('tasks.rejectTask', 'Reject Task')}
        size="md"
      >
        <form onSubmit={handleRejectTask} className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">{selectedTask?.title}</p>
            <p className="mt-2">{tt('tasks.rejectTaskHelp', 'Add a short reason so your admin understands why you are rejecting this task.')}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {tt('tasks.rejectNotes', 'Rejection Notes')}
            </label>
            <textarea
              value={rejectNotes}
              onChange={(event) => setRejectNotes(event.target.value)}
              rows={5}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={tt('tasks.rejectNotesPlaceholder', 'Explain why you are rejecting this task')}
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedTask(null);
                setRejectNotes('');
              }}
            >
              {tt('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="danger" disabled={submitting}>
              {tt('tasks.rejectTask', 'Reject Task')}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default TasksPage;

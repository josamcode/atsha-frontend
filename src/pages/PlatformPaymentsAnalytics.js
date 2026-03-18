import React, { startTransition, useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { FaChartLine, FaCheckCircle, FaCreditCard, FaExclamationTriangle, FaMoneyBillWave, FaReceipt, FaSyncAlt } from 'react-icons/fa';
import Layout from '../components/Layout/Layout';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Loading from '../components/Common/Loading';
import PageTitle from '../components/Common/PageTilte';
import billingService from '../services/billingService';
import { useAuth } from '../context/AuthContext';
import { isPlatformAdmin } from '../utils/organization';
import { showError } from '../utils/toast';

const PAGE_SIZES = [10, 25, 50];
const WINDOW_OPTIONS = [7, 14, 30];
const STATUS_COLORS = {
  paid: '#047857',
  pending: '#d4b900',
  processing: '#2563eb',
  failed: '#dc2626',
  cancelled: '#64748b'
};

const MetricCard = ({ title, value, helper, icon: Icon, accentClass }) => (
  <Card className="border border-gray-200 p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        <p className="mt-2 text-xs text-gray-500">{helper}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm ${accentClass}`}>
        <Icon className="text-lg" />
      </div>
    </div>
  </Card>
);

const PlatformPaymentsAnalytics = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const hasLoadedRef = useRef(false);
  const [analytics, setAnalytics] = useState(null);
  const [payments, setPayments] = useState([]);
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const deferredSearch = useDeferredValue(searchInput.trim());
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatMoney = useCallback((amount, currency = 'SAR') => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount) || 0);
    } catch (error) {
      return `${Number(amount) || 0} ${currency}`;
    }
  }, [locale]);

  const getPaymentStatusLabel = useCallback((status) => t(`organizationSettings.subscription.paymentStatuses.${status}`, {
    defaultValue: String(status || '--').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  }), [t]);

  const getStatusClasses = useCallback((status) => {
    if (status === 'paid') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    if (status === 'processing') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    if (status === 'failed') return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }, []);

  const formatTrendDate = useCallback((value) => {
    if (!value) return '--';
    return new Date(`${value}T00:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  }, [locale]);

  const loadData = useCallback(async ({ background = false } = {}) => {
    const keepExistingContent = background || hasLoadedRef.current;

    if (keepExistingContent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [analyticsResponse, paymentsResponse] = await Promise.all([
        billingService.getAdminAnalytics({ days, recentLimit: 8 }),
        billingService.getAdminPayments({
          page,
          limit,
          status: statusFilter,
          provider: providerFilter,
          search: deferredSearch
        })
      ]);

      setAnalytics(analyticsResponse.data?.data || null);
      setPayments(paymentsResponse.data?.data || []);
      setPagination({
        page: paymentsResponse.data?.page || page,
        pages: paymentsResponse.data?.pages || 1,
        total: paymentsResponse.data?.total || 0
      });
      hasLoadedRef.current = true;
    } catch (error) {
      showError(error.response?.data?.message || t('paymentsAnalytics.feedback.loadError', {
        defaultValue: 'Unable to load payment analytics right now.'
      }));
    } finally {
      if (keepExistingContent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [days, deferredSearch, limit, page, providerFilter, statusFilter, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return <Loading />;
  if (!isPlatformAdmin(user)) return <Navigate to="/dashboard" replace />;
  if (loading && !analytics) return <Loading />;

  const totals = analytics?.totals || {};
  const revenue = analytics?.revenue || {};
  const dailyTrend = analytics?.trends?.daily || [];
  const statusBreakdown = (analytics?.breakdown?.byStatus || []).filter((item) => item.count > 0);
  const billingCycleBreakdown = (analytics?.breakdown?.byBillingCycle || []).filter((item) => item.count > 0);
  const topPlans = analytics?.breakdown?.topPlans || [];
  const topOrganizations = analytics?.breakdown?.topOrganizations || [];
  const totalPages = pagination.pages || 1;

  const overviewCards = [
    {
      key: 'total',
      title: t('paymentsAnalytics.cards.totalPayments', { defaultValue: 'Total Payments' }),
      value: (totals.totalPayments || 0).toLocaleString(locale),
      helper: t('paymentsAnalytics.cards.totalPaymentsHelper', { defaultValue: 'All recorded payment attempts' }),
      icon: FaReceipt,
      accentClass: 'bg-slate-900'
    },
    {
      key: 'paid',
      title: t('paymentsAnalytics.cards.paidPayments', { defaultValue: 'Paid Payments' }),
      value: (totals.paidPayments || 0).toLocaleString(locale),
      helper: t('paymentsAnalytics.cards.paidPaymentsHelper', { defaultValue: 'Completed successfully' }),
      icon: FaCheckCircle,
      accentClass: 'bg-emerald-600'
    },
    {
      key: 'failed',
      title: t('paymentsAnalytics.cards.failedPayments', { defaultValue: 'Failed or Cancelled' }),
      value: ((totals.failedPayments || 0) + (totals.cancelledPayments || 0)).toLocaleString(locale),
      helper: t('paymentsAnalytics.cards.failedPaymentsHelper', { defaultValue: 'Payments that did not complete' }),
      icon: FaExclamationTriangle,
      accentClass: 'bg-rose-600'
    },
    {
      key: 'successRate',
      title: t('paymentsAnalytics.cards.successRate', { defaultValue: 'Success Rate' }),
      value: `${Number(totals.successRate || 0).toLocaleString(locale, { maximumFractionDigits: 1 })}%`,
      helper: t('paymentsAnalytics.cards.successRateHelper', { defaultValue: 'Paid payments versus all attempts' }),
      icon: FaChartLine,
      accentClass: 'bg-blue-600'
    },
    {
      key: 'revenue',
      title: t('paymentsAnalytics.cards.totalRevenue', { defaultValue: 'Total Revenue' }),
      value: formatMoney(revenue.totalAmount || 0, revenue.currency || 'SAR'),
      helper: t('paymentsAnalytics.cards.totalRevenueHelper', { defaultValue: 'Collected from successful payments' }),
      icon: FaMoneyBillWave,
      accentClass: 'bg-amber-500'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <PageTitle
                  title={t('paymentsAnalytics.title', { defaultValue: 'Payments Analytics' })}
                  icon={FaCreditCard}
                  description={t('paymentsAnalytics.description', { defaultValue: 'Track payment volume, revenue, plan performance, and the latest MyFatoorah activity across all organizations.' })}
                  titleClass="text-white"
                  descriptionClass="text-white/80"
                />
                <p className="mt-3 text-sm text-white/70">
                  {t('paymentsAnalytics.generatedAt', { defaultValue: 'Last generated' })}: {analytics?.generatedAt ? new Date(analytics.generatedAt).toLocaleString(locale) : '--'}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white backdrop-blur">
                  <span className="font-medium">{t('paymentsAnalytics.rangeLabel', { defaultValue: 'Window' })}</span>
                  <select
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                    className="rounded-xl border border-white/20 bg-slate-900/40 px-3 py-2 text-sm text-white outline-none"
                  >
                    {WINDOW_OPTIONS.map((option) => (
                      <option key={option} value={option} className="text-slate-900">
                        {t(`paymentsAnalytics.windows.${option}`, { defaultValue: `${option} days` })}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  variant="outline"
                  onClick={() => loadData({ background: true })}
                  className="border-white/30 bg-white/10 text-white hover:border-white hover:bg-white hover:text-slate-900"
                >
                  <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
                  {t('paymentsAnalytics.actions.refresh', { defaultValue: 'Refresh' })}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {overviewCards.map(({ key, ...card }) => (
            <MetricCard key={key} {...card} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card className="border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">{t('paymentsAnalytics.sections.volumeTitle', { defaultValue: 'Payment Volume' })}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('paymentsAnalytics.sections.volumeDescription', { defaultValue: 'Daily payment attempts versus successful payments in the selected window.' })}</p>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={formatTrendDate} stroke="#64748b" />
                  <YAxis allowDecimals={false} stroke="#64748b" />
                  <Tooltip
                    formatter={(value, name) => [Number(value).toLocaleString(locale), name === 'paidPayments' ? t('paymentsAnalytics.series.paidPayments', { defaultValue: 'Paid' }) : t('paymentsAnalytics.series.payments', { defaultValue: 'Payments' })]}
                    labelFormatter={formatTrendDate}
                  />
                  <Area type="monotone" dataKey="payments" stroke="#0f172a" fill="#cbd5e1" fillOpacity={0.45} strokeWidth={2} />
                  <Area type="monotone" dataKey="paidPayments" stroke="#047857" fill="#a7f3d0" fillOpacity={0.45} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">{t('paymentsAnalytics.sections.revenueTitle', { defaultValue: 'Revenue Trend' })}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('paymentsAnalytics.sections.revenueDescription', { defaultValue: 'Revenue captured from paid invoices in the selected window.' })}</p>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={formatTrendDate} stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip formatter={(value) => formatMoney(value, revenue.currency || 'SAR')} labelFormatter={formatTrendDate} />
                  <Bar dataKey="revenue" fill="#d4b900" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <p className="text-sm text-gray-500">{t('paymentsAnalytics.cards.averagePaidAmount', { defaultValue: 'Average Paid Amount' })}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{formatMoney(revenue.averagePaidAmount || 0, revenue.currency || 'SAR')}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <p className="text-sm text-gray-500">{t('paymentsAnalytics.cards.paidTransactions', { defaultValue: 'Paid Transactions' })}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{(revenue.paidCount || 0).toLocaleString(locale)}</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">{t('paymentsAnalytics.sections.statusTitle', { defaultValue: 'Status Breakdown' })}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('paymentsAnalytics.sections.statusDescription', { defaultValue: 'How payment attempts are distributed by result.' })}</p>
            {statusBreakdown.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">{t('paymentsAnalytics.emptyChart', { defaultValue: 'No payment data is available yet.' })}</div>
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-center">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusBreakdown} dataKey="count" nameKey="key" innerRadius={72} outerRadius={102} paddingAngle={3}>
                        {statusBreakdown.map((entry) => <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#94a3b8'} />)}
                      </Pie>
                      <Tooltip formatter={(value, key) => [Number(value).toLocaleString(locale), getPaymentStatusLabel(key)]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {statusBreakdown.map((entry) => (
                    <div key={entry.key} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.key] || '#94a3b8' }} />
                          <span className="text-sm font-medium text-gray-700">{getPaymentStatusLabel(entry.key)}</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">{entry.count.toLocaleString(locale)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">{t('paymentsAnalytics.sections.topPlansTitle', { defaultValue: 'Top Plans' })}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('paymentsAnalytics.sections.topPlansDescription', { defaultValue: 'Plans and organizations ranked by paid revenue.' })}</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">{t('paymentsAnalytics.sections.topPlansTitle', { defaultValue: 'Top Plans' })}</h3>
                {topPlans.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">{t('paymentsAnalytics.emptyTable', { defaultValue: 'No payment analytics are available yet.' })}</div>
                ) : topPlans.map((plan) => (
                  <div key={plan.planCode} className="rounded-2xl border border-gray-200 px-4 py-4">
                    <p className="truncate text-sm font-semibold text-gray-900">{plan.planName?.[i18n.language] || plan.planName?.en || plan.planCode}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('paymentsAnalytics.labels.paymentsCount', { defaultValue: '{{count}} payments', count: plan.totalPayments || 0 })}</p>
                    <p className="mt-3 text-sm font-semibold text-gray-900">{formatMoney(plan.revenue || 0, plan.currency || 'SAR')}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">{t('paymentsAnalytics.sections.topOrganizationsTitle', { defaultValue: 'Top Organizations' })}</h3>
                {topOrganizations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">{t('paymentsAnalytics.emptyTable', { defaultValue: 'No payment analytics are available yet.' })}</div>
                ) : topOrganizations.map((organization) => (
                  <Link key={organization.organizationId} to={`/platform/organizations/${organization.organizationId}`} className="block rounded-2xl border border-gray-200 px-4 py-4 transition hover:border-primary/40 hover:bg-primary/5">
                    <p className="truncate text-sm font-semibold text-gray-900">{organization.organizationName}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('paymentsAnalytics.labels.paymentsCount', { defaultValue: '{{count}} payments', count: organization.totalPayments || 0 })}</p>
                    <p className="mt-3 text-sm font-semibold text-gray-900">{formatMoney(organization.revenue || 0, organization.currency || 'SAR')}</p>
                  </Link>
                ))}
              </div>
            </div>

            {billingCycleBreakdown.length > 0 ? (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">{t('paymentsAnalytics.sections.billingCycleTitle', { defaultValue: 'Billing Cycle Mix' })}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {billingCycleBreakdown.map((entry) => (
                    <div key={entry.key} className="rounded-2xl bg-white px-4 py-4">
                      <p className="text-sm text-gray-500">{t(`organizationSettings.subscription.billingCycles.${entry.key}`, { defaultValue: entry.key === 'annual' ? 'Annual' : 'Monthly' })}</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">{entry.count.toLocaleString(locale)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </section>

        <Card className="border border-gray-200 p-0 shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('paymentsAnalytics.sections.paymentsTableTitle', { defaultValue: 'Recent Payments' })}</h2>
                <p className="mt-1 text-sm text-gray-500">{t('paymentsAnalytics.sections.paymentsTableDescription', { defaultValue: 'Search and review the latest platform-wide payment activity.' })}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    startTransition(() => setPage(1));
                  }}
                  placeholder={t('paymentsAnalytics.filters.searchPlaceholder', { defaultValue: 'Search by invoice, organization, plan, or user' })}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    startTransition(() => setPage(1));
                  }}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{t('paymentsAnalytics.filters.allStatuses', { defaultValue: 'All statuses' })}</option>
                  {['paid', 'pending', 'processing', 'failed', 'cancelled'].map((status) => <option key={status} value={status}>{getPaymentStatusLabel(status)}</option>)}
                </select>
                <select
                  value={providerFilter}
                  onChange={(event) => {
                    setProviderFilter(event.target.value);
                    startTransition(() => setPage(1));
                  }}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{t('paymentsAnalytics.filters.allProviders', { defaultValue: 'All providers' })}</option>
                  <option value="myfatoorah">MyFatoorah</option>
                </select>
                <select
                  value={limit}
                  onChange={(event) => {
                    setLimit(Number(event.target.value));
                    startTransition(() => setPage(1));
                  }}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {PAGE_SIZES.map((size) => <option key={size} value={size}>{t('paymentsAnalytics.filters.pageSize', { defaultValue: '{{count}} per page', count: size })}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  {['invoice', 'organization', 'initiatedBy', 'plan', 'amount', 'status', 'createdAt', 'paidAt'].map((column) => (
                    <th key={column} className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      {t(`paymentsAnalytics.table.${column}`, { defaultValue: column })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center text-sm text-gray-500">{t('paymentsAnalytics.emptyPayments', { defaultValue: 'No payments matched the current filters.' })}</td>
                  </tr>
                ) : payments.map((payment) => (
                  <tr key={payment.id || payment.invoiceId} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4 align-top">
                      <div className="text-sm font-semibold text-gray-900">{payment.invoiceId}</div>
                      <div className="mt-1 text-xs text-gray-500">{payment.paymentId || '--'}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {payment.organization?.id ? (
                        <Link to={`/platform/organizations/${payment.organization.id}`} className="text-sm font-medium text-primary hover:underline">
                          {payment.organization.name || payment.organization.legalName || '--'}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-700">{payment.organization?.name || payment.organization?.legalName || '--'}</span>
                      )}
                      <div className="mt-1 text-xs text-gray-500">{payment.organization?.slug || '--'}</div>
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-gray-700">
                      <div>{payment.initiatedBy?.name || '--'}</div>
                      <div className="mt-1 text-xs text-gray-500">{payment.initiatedBy?.email || '--'}</div>
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-gray-700">{payment.planSnapshot?.name?.[i18n.language] || payment.planSnapshot?.name?.en || payment.planCode}</td>
                    <td className="px-6 py-4 align-top text-sm font-semibold text-gray-900">{formatMoney(payment.amount, payment.currency)}</td>
                    <td className="px-6 py-4 align-top"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(payment.status)}`}>{getPaymentStatusLabel(payment.status)}</span></td>
                    <td className="px-6 py-4 align-top text-sm text-gray-700">{payment.createdAt ? new Date(payment.createdAt).toLocaleString(locale) : '--'}</td>
                    <td className="px-6 py-4 align-top text-sm text-gray-700">{payment.paidAt ? new Date(payment.paidAt).toLocaleString(locale) : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">{t('paymentsAnalytics.pagination.results', { defaultValue: '{{count}} results', count: pagination.total || 0 })}</div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" disabled={page <= 1 || refreshing} onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}>
                {t('paymentsAnalytics.pagination.previous', { defaultValue: 'Previous' })}
              </Button>
              <span className="text-sm font-medium text-gray-700">{t('paymentsAnalytics.pagination.pageOf', { defaultValue: 'Page {{page}} of {{pages}}', page, pages: totalPages })}</span>
              <Button variant="secondary" disabled={page >= totalPages || refreshing} onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}>
                {t('paymentsAnalytics.pagination.next', { defaultValue: 'Next' })}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default PlatformPaymentsAnalytics;

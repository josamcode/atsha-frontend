import api from '../utils/api';

const billingService = {
  getPlans: async () => api.get('/billing/plans'),

  getStatus: async () => api.get('/billing/status'),

  getHistory: async (page = 1, limit = 10) => api.get('/billing/history', {
    params: { page, limit }
  }),

  getAdminAnalytics: async ({ days = 30, recentLimit = 8 } = {}) => api.get('/billing/admin/analytics', {
    params: { days, recentLimit }
  }),

  getAdminPayments: async ({
    page = 1,
    limit = 10,
    status = '',
    provider = '',
    search = ''
  } = {}) => api.get('/billing/admin/payments', {
    params: {
      page,
      limit,
      status,
      provider,
      search
    }
  }),

  checkout: async (planCode, billingCycle = 'monthly') => api.post('/billing/checkout', {
    planCode,
    billingCycle
  })
};

export default billingService;

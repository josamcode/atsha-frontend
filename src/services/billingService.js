import api from '../utils/api';

const billingService = {
  getPlans: async () => api.get('/billing/plans'),

  getStatus: async () => api.get('/billing/status'),

  getHistory: async (page = 1, limit = 10) => api.get('/billing/history', {
    params: { page, limit }
  }),

  checkout: async (planCode, billingCycle = 'monthly') => api.post('/billing/checkout', {
    planCode,
    billingCycle
  })
};

export default billingService;

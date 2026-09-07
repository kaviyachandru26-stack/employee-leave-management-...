import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrflow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = refreshRes.data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem('hrflow_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('hrflow_token');
        localStorage.removeItem('hrflow_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials).then(r => r.data),
  logout: () =>
    api.post('/auth/logout').then(r => r.data),
  me: () =>
    api.get('/auth/me').then(r => r.data),
};

export const employeesApi = {
  list: (params?: any) =>
    api.get('/employees', { params }).then(r => r.data),
  getById: (id: string) =>
    api.get(`/employees/${id}`).then(r => r.data),
  getBalances: (id: string, year?: number) =>
    api.get(`/employees/${id}/balances`, { params: { year } }).then(r => r.data),
  create: (data: any) =>
    api.post('/employees', data).then(r => r.data),
  update: (id: string, data: any) =>
    api.put(`/employees/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/employees/${id}`).then(r => r.data),
};

export const departmentsApi = {
  list: () =>
    api.get('/departments').then(r => r.data),
  getById: (id: string) =>
    api.get(`/departments/${id}`).then(r => r.data),
  create: (data: any) =>
    api.post('/departments', data).then(r => r.data),
  update: (id: string, data: any) =>
    api.put(`/departments/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/departments/${id}`).then(r => r.data),
};

export const leaveApi = {
  getTypes: () =>
    api.get('/leave/types').then(r => r.data),
  getMyBalances: (year?: number) =>
    api.get('/leave/balances/my', { params: { year } }).then(r => r.data),
  calculateDays: (dates: { startDate: string; endDate: string }) =>
    api.post('/leave/calculate-days', dates).then(r => r.data),
  listRequests: (params?: any) =>
    api.get('/leave/requests', { params }).then(r => r.data),
  getRequestById: (id: string) =>
    api.get(`/leave/requests/${id}`).then(r => r.data),
  apply: (data: { leaveTypeId: string; startDate: string; endDate: string; reason: string }) =>
    api.post('/leave/requests', data).then(r => r.data),
  approve: (id: string, comment?: string) =>
    api.post(`/leave/requests/${id}/approve`, { comment }).then(r => r.data),
  reject: (id: string, comment: string) =>
    api.post(`/leave/requests/${id}/reject`, { comment }).then(r => r.data),
  cancel: (id: string) =>
    api.post(`/leave/requests/${id}/cancel`).then(r => r.data),
};

export const attendanceApi = {
  getTodayStatus: () =>
    api.get('/attendance/today-status').then(r => r.data),
  checkIn: (notes?: string) =>
    api.post('/attendance/check-in', { notes }).then(r => r.data),
  checkOut: (notes?: string) =>
    api.post('/attendance/check-out', { notes }).then(r => r.data),
  list: (params?: any) =>
    api.get('/attendance', { params }).then(r => r.data),
  getTeamAttendance: (params?: any) =>
    api.get('/attendance/team', { params }).then(r => r.data),
};

export const holidaysApi = {
  list: (year?: number) =>
    api.get('/holidays', { params: { year } }).then(r => r.data),
  create: (data: any) =>
    api.post('/holidays', data).then(r => r.data),
  update: (id: string, data: any) =>
    api.put(`/holidays/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/holidays/${id}`).then(r => r.data),
};

export const notificationsApi = {
  list: () =>
    api.get('/notifications').then(r => r.data),
  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () =>
    api.patch('/notifications/read-all').then(r => r.data),
};

export const analyticsApi = {
  getDashboardSummary: () =>
    api.get('/analytics/dashboard').then(r => r.data),
  getAttendanceAnalytics: (departmentId?: string) =>
    api.get('/analytics/attendance', { params: { departmentId } }).then(r => r.data),
  getLeaveAnalytics: (departmentId?: string) =>
    api.get('/analytics/leaves', { params: { departmentId } }).then(r => r.data),
};

export const auditLogsApi = {
  list: (params?: any) =>
    api.get('/audit-logs', { params }).then(r => r.data),
};

export default api;

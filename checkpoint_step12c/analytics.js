import { getToken } from './auth';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== ''
    ? import.meta.env.VITE_API_BASE_URL
    : (import.meta.env.DEV ? 'http://localhost:8000' : '');
const API_V1 = import.meta.env.VITE_API_V1_PATH || '/api/v1';
const ANALYTICS_URL = `${BASE_URL}${API_V1}/admin/analytics`;

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

/**
 * Builds URLSearchParams from analytics filter object.
 */
export const buildAnalyticsParams = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.start_date) {
    params.append('start_date', filters.start_date);
  }
  if (filters.end_date) {
    params.append('end_date', filters.end_date);
  }
  if (filters.department_id && filters.department_id !== 'All') {
    params.append('department_id', filters.department_id);
  }
  if (filters.category && filters.category !== 'All') {
    params.append('category', filters.category);
  }
  if (filters.priority && filters.priority !== 'All') {
    params.append('priority', filters.priority);
  }
  if (filters.status && filters.status !== 'All') {
    params.append('status', filters.status);
  }
  if (filters.location_id && filters.location_id !== 'All') {
    params.append('location_id', filters.location_id);
  }
  if (filters.interval) {
    params.append('interval', filters.interval);
  }

  return params;
};

/**
 * Fetches the combined analytics summary for the Admin dashboard.
 */
export const fetchAnalyticsOverview = async (filters = {}) => {
  const params = buildAnalyticsParams(filters);
  const url = params.toString()
    ? `${ANALYTICS_URL}/overview?${params.toString()}`
    : `${ANALYTICS_URL}/overview`;

  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.detail || 'Failed to fetch analytics overview');
    error.status = res.status;
    throw error;
  }
  return data;
};

/**
 * Fetches trend time-series data specifically.
 */
export const fetchAnalyticsTrends = async (interval = 'daily', filters = {}) => {
  const params = buildAnalyticsParams({ ...filters, interval });
  const url = `${ANALYTICS_URL}/trends?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.detail || 'Failed to fetch complaint trends');
    error.status = res.status;
    throw error;
  }
  return data;
};

/**
 * Extracts filename from Content-Disposition header with fallback.
 */
const extractFilename = (res, fallbackFilename) => {
  const disposition = res.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename=["']?([^"';]+)["']?/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return fallbackFilename;
};

/**
 * Triggers a client-side file download for a Blob.
 */
const triggerBlobDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Fetches standalone Smart Campus Insights list.
 */
export const fetchSmartInsights = async (filters = {}) => {
  const params = buildAnalyticsParams(filters);
  const url = `${ANALYTICS_URL}/insights?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.detail || 'Failed to fetch smart campus insights');
    error.status = res.status;
    throw error;
  }
  return data;
};

/**
 * Exports analytics data as a structured CSV report.
 */
export const exportAnalyticsCsv = async (filters = {}) => {
  const params = buildAnalyticsParams(filters);
  const url = `${ANALYTICS_URL}/export/csv?${params.toString()}`;
  const token = getToken();

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.detail || 'Failed to export CSV report');
    error.status = res.status;
    throw error;
  }

  const blob = await res.blob();
  const todayStr = new Date().toISOString().slice(0, 10);
  const filename = extractFilename(res, `campus-analytics-${todayStr}.csv`);
  triggerBlobDownload(blob, filename);
  return { success: true, filename };
};

/**
 * Exports analytics data as a professional administrative PDF report.
 */
export const exportAnalyticsPdf = async (filters = {}) => {
  const params = buildAnalyticsParams(filters);
  const url = `${ANALYTICS_URL}/export/pdf?${params.toString()}`;
  const token = getToken();

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.detail || 'Failed to export PDF report');
    error.status = res.status;
    throw error;
  }

  const blob = await res.blob();
  const todayStr = new Date().toISOString().slice(0, 10);
  const filename = extractFilename(res, `campus-analytics-${todayStr}.pdf`);
  triggerBlobDownload(blob, filename);
  return { success: true, filename };
};

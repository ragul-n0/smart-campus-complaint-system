import { getToken } from './auth';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== ''
    ? import.meta.env.VITE_API_BASE_URL
    : (import.meta.env.DEV ? 'http://localhost:8000' : '');
const API_V1 = import.meta.env.VITE_API_V1_PATH || '/api/v1';
const STAFF_URL = `${BASE_URL}${API_V1}/staff`;

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const fetchStaffMetrics = async () => {
  const res = await fetch(`${STAFF_URL}/metrics`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load department metrics');
  }
  return data;
};

export const fetchStaffComplaints = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'All') {
    params.append('status', filters.status);
  }
  if (filters.category && filters.category !== 'All') {
    params.append('category', filters.category);
  }
  if (filters.priority && filters.priority !== 'All') {
    params.append('priority', filters.priority);
  }
  if (filters.search && filters.search.trim()) {
    params.append('search', filters.search.trim());
  }

  const url = params.toString() ? `${STAFF_URL}/complaints?${params.toString()}` : `${STAFF_URL}/complaints`;
  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load complaints');
  }
  return data;
};

export const fetchStaffComplaintDetails = async (id) => {
  const res = await fetch(`${STAFF_URL}/complaints/${id}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load complaint details');
  }
  return data;
};

export const assignStaffComplaint = async (id) => {
  const res = await fetch(`${STAFF_URL}/complaints/${id}/assign`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to self-assign complaint');
  }
  return data;
};

export const updateStaffComplaintStatus = async (id, newStatus, comment = null) => {
  const res = await fetch(`${STAFF_URL}/complaints/${id}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      new_status: newStatus,
      comment: comment,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update complaint status');
  }
  return data;
};

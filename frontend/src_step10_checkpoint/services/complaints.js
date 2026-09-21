import { getToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1 = import.meta.env.VITE_API_V1_PATH || '/api/v1';
const COMPLAINTS_URL = `${BASE_URL}${API_V1}/complaints`;
const LOCATIONS_URL = `${BASE_URL}${API_V1}/locations`;

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const fetchLocations = async () => {
  const res = await fetch(LOCATIONS_URL, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch campus locations');
  }
  return res.json();
};

export const createComplaint = async (complaintData) => {
  const res = await fetch(COMPLAINTS_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(complaintData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to submit complaint');
  }
  return data;
};

export const predictComplaintCategory = async (payload) => {
  const res = await fetch(`${COMPLAINTS_URL}/predict`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to predict complaint category');
  }
  return data;
};

export const fetchMyComplaints = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'All') {
    params.append('status', filters.status);
  }
  if (filters.category && filters.category !== 'All') {
    params.append('category', filters.category);
  }

  const url = params.toString() ? `${COMPLAINTS_URL}?${params.toString()}` : COMPLAINTS_URL;
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

export const fetchComplaintDetails = async (id) => {
  const res = await fetch(`${COMPLAINTS_URL}/${id}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load complaint details');
  }
  return data;
};

export const updateComplaint = async (id, updateData) => {
  const res = await fetch(`${COMPLAINTS_URL}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update complaint');
  }
  return data;
};

export const deleteComplaint = async (id) => {
  const res = await fetch(`${COMPLAINTS_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to delete complaint');
  }
  return data;
};

export const fetchComplaintHistory = async (id) => {
  const res = await fetch(`${COMPLAINTS_URL}/${id}/history`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load complaint history');
  }
  return data;
};

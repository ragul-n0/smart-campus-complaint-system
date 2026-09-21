import { getToken } from './auth';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== ''
    ? import.meta.env.VITE_API_BASE_URL
    : (import.meta.env.DEV ? 'http://localhost:8000' : '');
const API_V1 = import.meta.env.VITE_API_V1_PATH || '/api/v1';
const ADMIN_URL = `${BASE_URL}${API_V1}/admin`;

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// =====================================================================
// Metrics & Analytics
// =====================================================================

export const fetchAdminMetrics = async () => {
  const res = await fetch(`${ADMIN_URL}/metrics`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load system metrics');
  }
  return data;
};

export const fetchDepartmentStats = async () => {
  const res = await fetch(`${ADMIN_URL}/department-stats`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load department statistics');
  }
  return data;
};

export const fetchResolutionStats = async () => {
  const res = await fetch(`${ADMIN_URL}/resolution-stats`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load resolution analytics');
  }
  return data;
};

// =====================================================================
// User Management
// =====================================================================

export const fetchAdminUsers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.role && filters.role !== 'All') {
    params.append('role', filters.role);
  }
  if (filters.department_id && filters.department_id !== 'All') {
    params.append('department_id', filters.department_id);
  }
  if (filters.search && filters.search.trim()) {
    params.append('search', filters.search.trim());
  }

  const url = params.toString() ? `${ADMIN_URL}/users?${params.toString()}` : `${ADMIN_URL}/users`;
  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load users');
  }
  return data;
};

export const updateStaffDepartment = async (userId, departmentId) => {
  const res = await fetch(`${ADMIN_URL}/users/${userId}/department`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ department_id: Number(departmentId) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update staff department');
  }
  return data;
};

export const updateUserRole = async (userId, role) => {
  const res = await fetch(`${ADMIN_URL}/users/${userId}/role`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update user role');
  }
  return data;
};

// =====================================================================
// Department Management
// =====================================================================

export const fetchAdminDepartments = async () => {
  const res = await fetch(`${ADMIN_URL}/departments`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load departments');
  }
  return data;
};

export const createDepartment = async (payload) => {
  const res = await fetch(`${ADMIN_URL}/departments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to create department');
  }
  return data;
};

export const updateDepartment = async (departmentId, payload) => {
  const res = await fetch(`${ADMIN_URL}/departments/${departmentId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update department');
  }
  return data;
};

export const deleteDepartment = async (departmentId) => {
  const res = await fetch(`${ADMIN_URL}/departments/${departmentId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to delete department');
  }
  return data;
};

// =====================================================================
// Location Management
// =====================================================================

export const fetchAdminLocations = async () => {
  const res = await fetch(`${ADMIN_URL}/locations`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load locations');
  }
  return data;
};

export const createLocation = async (payload) => {
  const res = await fetch(`${ADMIN_URL}/locations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to create location');
  }
  return data;
};

export const updateLocation = async (locationId, payload) => {
  const res = await fetch(`${ADMIN_URL}/locations/${locationId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update location');
  }
  return data;
};

export const deleteLocation = async (locationId) => {
  const res = await fetch(`${ADMIN_URL}/locations/${locationId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to delete location');
  }
  return data;
};

// =====================================================================
// Complaint Oversight & Actions
// =====================================================================

export const fetchAdminComplaints = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'All') {
    params.append('status', filters.status);
  }
  if (filters.priority && filters.priority !== 'All') {
    params.append('priority', filters.priority);
  }
  if (filters.category && filters.category !== 'All') {
    params.append('category', filters.category);
  }
  if (filters.department_id && filters.department_id !== 'All') {
    params.append('department_id', filters.department_id);
  }
  if (filters.location_id && filters.location_id !== 'All') {
    params.append('location_id', filters.location_id);
  }
  if (filters.search && filters.search.trim()) {
    params.append('search', filters.search.trim());
  }

  const url = params.toString() ? `${ADMIN_URL}/complaints?${params.toString()}` : `${ADMIN_URL}/complaints`;
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

export const fetchAdminComplaintDetails = async (complaintId) => {
  const res = await fetch(`${ADMIN_URL}/complaints/${complaintId}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to load complaint details');
  }
  return data;
};

export const adminAssignComplaint = async (complaintId, staffId) => {
  const res = await fetch(`${ADMIN_URL}/complaints/${complaintId}/assign`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ staff_id: Number(staffId) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to assign complaint');
  }
  return data;
};

export const adminUpdatePriority = async (complaintId, priority) => {
  const res = await fetch(`${ADMIN_URL}/complaints/${complaintId}/priority`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ priority }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update priority');
  }
  return data;
};

export const adminUpdateDepartment = async (complaintId, departmentId) => {
  const res = await fetch(`${ADMIN_URL}/complaints/${complaintId}/department`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ department_id: Number(departmentId) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update department');
  }
  return data;
};

export const adminUpdateStatus = async (complaintId, newStatus, comment = null) => {
  const res = await fetch(`${ADMIN_URL}/complaints/${complaintId}/status`, {
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

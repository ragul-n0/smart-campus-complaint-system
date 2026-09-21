/**
 * Central API Client for Smart Campus Complaint System.
 * Configured to communicate with the FastAPI backend.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1 = import.meta.env.VITE_API_V1_PATH || '/api/v1';

export const API_URL = `${BASE_URL}${API_V1}`;

/**
 * Checks connectivity to the backend health check endpoint.
 * @returns {Promise<Object>} The health status object from the backend
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to connect to backend:', error);
    return {
      status: 'offline',
      error: error.message,
    };
  }
}

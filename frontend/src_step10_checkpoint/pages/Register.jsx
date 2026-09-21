import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, fetchDepartments } from '../services/auth';

export default function Register() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'student',
    department_id: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadDepts() {
      try {
        const list = await fetchDepartments();
        setDepartments(list);
      } catch (err) {
        console.error('Could not load departments:', err);
      }
    }
    loadDepts();
  }, []);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    if (!formData.username.trim()) {
      errs.username = 'Username is required.';
    } else if (formData.username.trim().length < 3) {
      errs.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      errs.username = 'Username can only contain letters, numbers, and underscores.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (formData.role === 'staff' && !formData.department_id) {
      errs.department_id = 'Staff members must be assigned to a department.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
      };

      await registerUser(payload);
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 font-bold text-xl mb-3 shadow-sm">
            SC
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create an Account</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Register as a Student, Staff Member, or Administrator
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs sm:text-sm flex items-start space-x-2">
            <span className="font-semibold text-red-400 shrink-0">&#9888;</span>
            <span>{serverError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs sm:text-sm flex items-start space-x-2">
            <span className="font-semibold text-emerald-400 shrink-0">&#10003;</span>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              id="register-name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border ${
                errors.name ? 'border-red-500' : 'border-slate-700'
              } text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition`}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                name="username"
                id="register-username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. johndoe"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border ${
                  errors.username ? 'border-red-500' : 'border-slate-700'
                } text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition`}
                autoComplete="username"
              />
              {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="register-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border ${
                  errors.password ? 'border-red-500' : 'border-slate-700'
                } text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition`}
                autoComplete="new-password"
              />
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Account Role
              </label>
              <select
                name="role"
                id="register-role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition"
              >
                <option value="student">Student</option>
                <option value="staff">Department Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Department {formData.role === 'staff' ? <span className="text-red-400">*</span> : <span className="text-slate-500">(Optional)</span>}
              </label>
              <select
                name="department_id"
                id="register-department"
                value={formData.department_id}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border ${
                  errors.department_id ? 'border-red-500' : 'border-slate-700'
                } text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition`}
              >
                <option value="">-- No Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.department_id && <p className="text-xs text-red-400 mt-1">{errors.department_id}</p>}
            </div>
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            disabled={isSubmitting}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-teal-700/20 active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-semibold underline-offset-4 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

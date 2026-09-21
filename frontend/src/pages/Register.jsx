import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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
      setSuccessMessage('Account created successfully! Redirecting to sign in...');
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
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-2xl p-7 sm:p-9 shadow-card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-3 shadow-xs border border-blue-100">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register as a Student, Staff Member, or Administrator
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start space-x-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{serverError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start space-x-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              id="register-name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                errors.name ? 'border-rose-300 focus:border-rose-500' : 'border-slate-300 focus:border-blue-500'
              } text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition`}
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                name="username"
                id="register-username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. johndoe"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                  errors.username ? 'border-rose-300 focus:border-rose-500' : 'border-slate-300 focus:border-blue-500'
                } text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition`}
                autoComplete="username"
              />
              {errors.username && <p className="text-xs text-rose-600 mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                name="password"
                id="register-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                  errors.password ? 'border-rose-300 focus:border-rose-500' : 'border-slate-300 focus:border-blue-500'
                } text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition`}
                autoComplete="new-password"
              />
              {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Account Role
              </label>
              <select
                name="role"
                id="register-role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              >
                <option value="student">Student</option>
                <option value="staff">Department Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Department {formData.role === 'staff' ? <span className="text-rose-600">*</span> : <span className="text-slate-400 text-xs">(Optional)</span>}
              </label>
              <select
                name="department_id"
                id="register-department"
                value={formData.department_id}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border ${
                  errors.department_id ? 'border-rose-300 focus:border-rose-500' : 'border-slate-300 focus:border-blue-500'
                } text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition`}
              >
                <option value="">-- No Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.department_id && <p className="text-xs text-rose-600 mt-1">{errors.department_id}</p>}
            </div>
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            disabled={isSubmitting}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 shadow-sm active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold underline-offset-4 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

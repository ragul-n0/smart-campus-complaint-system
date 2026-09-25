import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  AlertCircle,
  Inbox,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import EmptyState from '../../components/ui/EmptyState';
import AnalyticsFilterBar from '../../components/analytics/AnalyticsFilterBar';
import AnalyticsKpiGrid from '../../components/analytics/AnalyticsKpiGrid';
import SmartCampusInsights from '../../components/analytics/SmartCampusInsights';
import ComplaintTrendChart from '../../components/analytics/ComplaintTrendChart';
import StatusDistributionChart from '../../components/analytics/StatusDistributionChart';
import CategoryDistributionChart from '../../components/analytics/CategoryDistributionChart';
import PriorityDistributionChart from '../../components/analytics/PriorityDistributionChart';
import LocationDistribution from '../../components/analytics/LocationDistribution';
import ResolutionPerformanceCard from '../../components/analytics/ResolutionPerformanceCard';
import DepartmentPerformanceTable from '../../components/analytics/DepartmentPerformanceTable';
import CategoryPerformanceTable from '../../components/analytics/CategoryPerformanceTable';

import {
  fetchAnalyticsOverview,
  exportAnalyticsCsv,
  exportAnalyticsPdf,
} from '../../services/analytics';
import { fetchAdminDepartments, fetchAdminLocations } from '../../services/admin';

const DEFAULT_FILTERS = {
  start_date: '',
  end_date: '',
  department_id: 'All',
  category: 'All',
  priority: 'All',
  status: 'All',
  location_id: 'All',
  interval: 'daily',
};

export default function AdminAnalytics() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');
  const [exportError, setExportError] = useState('');

  // 1. Fetch metadata (departments & locations) once on mount
  useEffect(() => {
    let mounted = true;
    const loadMeta = async () => {
      try {
        const [depts, locs] = await Promise.all([
          fetchAdminDepartments(),
          fetchAdminLocations(),
        ]);
        if (mounted) {
          setDepartments(depts || []);
          setLocations(locs || []);
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    loadMeta();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load analytics data from API
  const loadData = useCallback(async (activeFilters, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');

    try {
      const summary = await fetchAnalyticsOverview(activeFilters);
      setData(summary);
    } catch (err) {
      if (err.status === 403) {
        setErrorMsg('Access forbidden: Administrator privileges required to view analytics.');
      } else {
        setErrorMsg(err.message || 'Unable to load campus analytics. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData(filters);
  }, [loadData, filters]);

  // Handle filter changes
  const handleFilterChange = (partial) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Trend interval change
  const handleIntervalChange = (newInterval) => {
    setFilters((prev) => ({
      ...prev,
      interval: newInterval,
    }));
  };

  // Manual refresh
  const handleRefresh = () => {
    loadData(filters, true);
  };

  // Export handlers
  const handleExportCsv = async () => {
    if (exportingCsv || exportingPdf) return;
    setExportingCsv(true);
    setExportError('');
    setExportSuccess('');
    try {
      const res = await exportAnalyticsCsv(filters);
      setExportSuccess(`CSV report generated successfully (${res.filename}).`);
      setTimeout(() => setExportSuccess(''), 5000);
    } catch (err) {
      setExportError(err.message || 'Failed to generate CSV export. Please try again.');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    if (exportingCsv || exportingPdf) return;
    setExportingPdf(true);
    setExportError('');
    setExportSuccess('');
    try {
      const res = await exportAnalyticsPdf(filters);
      setExportSuccess(`PDF report generated successfully (${res.filename}).`);
      setTimeout(() => setExportSuccess(''), 5000);
    } catch (err) {
      setExportError(err.message || 'Failed to generate PDF report. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  const isDataEmpty =
    !loading &&
    data &&
    (!data.overview || data.overview.total_complaints === 0);

  return (
    <AdminLayout
      title="Campus Analytics"
      subtitle="Monitor complaint trends, workload, resolution performance, and campus issues."
      action={
        <div className="flex items-center flex-wrap gap-2">
          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loading || exportingCsv || exportingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-subtle transition disabled:opacity-50"
            title="Download currently filtered analytics data as CSV"
            aria-label="Export CSV"
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 text-emerald-600 ${exportingCsv ? 'animate-spin' : ''}`} />
            <span>{exportingCsv ? 'Generating CSV...' : 'Export CSV'}</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={loading || exportingCsv || exportingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-subtle transition disabled:opacity-50"
            title="Generate professional PDF analytics report"
            aria-label="Export PDF"
          >
            <FileText className={`w-3.5 h-3.5 text-rose-600 ${exportingPdf ? 'animate-spin' : ''}`} />
            <span>{exportingPdf ? 'Generating PDF...' : 'Export PDF'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing || exportingCsv || exportingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-subtle transition disabled:opacity-50"
            title="Refresh analytics data"
            aria-label="Refresh Analytics"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Export Success Notification */}
      {exportSuccess && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{exportSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportSuccess('')}
            className="text-emerald-700 hover:text-emerald-950 p-1 rounded"
            aria-label="Dismiss success message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Export Error Notification */}
      {exportError && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{exportError}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportError('')}
            className="text-rose-700 hover:text-rose-950 p-1 rounded"
            aria-label="Dismiss error message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error State Banner */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(filters)}
            className="underline font-semibold hover:text-rose-950 ml-4 flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Analytics Filter Bar */}
      <AnalyticsFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        departments={departments}
        locations={locations}
        loading={loading || refreshing}
      />

      {/* Main Content Loading State */}
      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200/90 shadow-card">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-sm font-medium text-slate-600">
            Calculating campus analytics from database...
          </span>
          <span className="text-xs text-slate-400 mt-1">
            Aggregating complaint records, resolution metrics, and workload data
          </span>
        </div>
      ) : isDataEmpty ? (
        /* Empty Filtered Result State */
        <div className="bg-white border border-slate-200/90 rounded-xl p-8 sm:p-12 shadow-card my-4">
          <EmptyState
            icon={Inbox}
            title="No complaint records found"
            description="There are no complaints matching the selected filters or date range in the database."
            actionLabel="Reset Filters"
            onAction={handleResetFilters}
          />
        </div>
      ) : (
        /* Analytics Sections */
        <div className="space-y-6">
          {/* 1. High-Level KPI Cards */}
          <AnalyticsKpiGrid
            overview={data?.overview || {}}
            loading={refreshing}
          />

          {/* 2. Smart Campus Insights (Factual & Respects Filters) */}
          <SmartCampusInsights
            insights={data?.insights || []}
            overview={data?.overview || {}}
            loading={refreshing}
          />

          {/* 3. Resolution Time Performance Card */}
          <ResolutionPerformanceCard
            resolution={data?.resolution || {}}
            loading={refreshing}
          />

          {/* 3. Trend Chart + Status Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ComplaintTrendChart
                trend={data?.trend || []}
                interval={filters.interval}
                onIntervalChange={handleIntervalChange}
                loading={refreshing}
              />
            </div>
            <div>
              <StatusDistributionChart
                statusDistribution={data?.status_distribution || []}
                loading={refreshing}
              />
            </div>
          </div>

          {/* 4. Category, Priority, and Location Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <CategoryDistributionChart
                categoryDistribution={data?.category_distribution || []}
                loading={refreshing}
              />
            </div>
            <div>
              <PriorityDistributionChart
                priorityDistribution={data?.priority_distribution || []}
                loading={refreshing}
              />
            </div>
            <div>
              <LocationDistribution
                locationDistribution={data?.location_distribution || []}
                loading={refreshing}
              />
            </div>
          </div>

          {/* 5. Department Performance Table */}
          <DepartmentPerformanceTable
            departmentPerformance={data?.department_performance || []}
            loading={refreshing}
          />

          {/* 6. Category Performance Table */}
          <CategoryPerformanceTable
            categoryPerformance={data?.category_performance || []}
            loading={refreshing}
          />
        </div>
      )}
    </AdminLayout>
  );
}

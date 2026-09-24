import React from 'react';
import {
  FileText,
  Clock,
  UserCheck,
  Activity,
  CheckCircle2,
  Archive,
  TrendingUp,
  Percent,
  AlertTriangle,
} from 'lucide-react';
import StatCard from '../ui/StatCard';

export default function AnalyticsKpiGrid({ overview = {}, loading = false }) {
  const {
    total_complaints = 0,
    pending_complaints = 0,
    assigned_complaints = 0,
    in_progress_complaints = 0,
    resolved_complaints = 0,
    closed_complaints = 0,
    high_priority_complaints = 0,
    resolution_rate = 0,
    closure_rate = 0,
  } = overview;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={FileText}
        label="Total Complaints"
        value={total_complaints}
        loading={loading}
        variant="blue"
        subtitle="All campus issues reported"
      />
      <StatCard
        icon={Clock}
        label="Pending Complaints"
        value={pending_complaints}
        loading={loading}
        variant="amber"
        subtitle="Awaiting triage & assignment"
      />
      <StatCard
        icon={UserCheck}
        label="Assigned Complaints"
        value={assigned_complaints}
        loading={loading}
        variant="indigo"
        subtitle="Delegated to staff"
      />
      <StatCard
        icon={Activity}
        label="In Progress"
        value={in_progress_complaints}
        loading={loading}
        variant="blue"
        subtitle="Actively being addressed"
      />
      <StatCard
        icon={CheckCircle2}
        label="Resolved"
        value={resolved_complaints}
        loading={loading}
        variant="emerald"
        subtitle="Solved by technicians"
      />
      <StatCard
        icon={Archive}
        label="Closed"
        value={closed_complaints}
        loading={loading}
        variant="slate"
        subtitle="Verified & finalized"
      />
      <StatCard
        icon={TrendingUp}
        label="Resolution Rate"
        value={`${resolution_rate}%`}
        loading={loading}
        variant="emerald"
        subtitle="(Resolved + Closed) / Total"
      />
      <StatCard
        icon={Percent}
        label="Closure Rate"
        value={`${closure_rate}%`}
        loading={loading}
        variant="slate"
        subtitle="Finalized / Total"
      />
      <StatCard
        icon={AlertTriangle}
        label="High Priority Issues"
        value={high_priority_complaints}
        loading={loading}
        variant="rose"
        subtitle="Urgent attention required"
      />
    </div>
  );
}

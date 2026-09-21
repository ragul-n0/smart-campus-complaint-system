import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white">
            <GraduationCap className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-700">CampusFlow</span>
          <span>&bull; Smart Campus Issue & Complaint Management System</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            System Operational
          </span>
          <span>&copy; {new Date().getFullYear()} University Campus Facilities</span>
        </div>
      </div>
    </footer>
  );
}

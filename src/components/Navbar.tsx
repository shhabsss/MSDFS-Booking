import {
  Calendar,
  CalendarDays,
  FileSpreadsheet,
  Plus,
  Search,
  Settings,
  Sheet,
  Users,
} from 'lucide-react';
import React from 'react';
import { CompanyInfo } from '../types';

export type NavViewType =
  | 'board'
  | 'all-bookings'
  | 'calendar'
  | 'staff-schedule'
  | 'google-sheets'
  | 'settings'
  | 'staff'
  | 'all'
  | 'sync';

interface NavbarProps {
  currentTab?: NavViewType;
  activeView?: NavViewType;
  setCurrentTab?: (view: any) => void;
  setActiveView?: (view: any) => void;
  onNewBooking: () => void;
  companyInfo: CompanyInfo;
  searchQuery?: string;
  globalSearch?: string;
  setSearchQuery?: (val: string) => void;
  setGlobalSearch?: (val: string) => void;
  totalBookingsCount?: number;
  bookingCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  activeView,
  setCurrentTab,
  setActiveView,
  onNewBooking,
  companyInfo,
  searchQuery,
  globalSearch,
  setSearchQuery,
  setGlobalSearch,
  totalBookingsCount,
  bookingCount,
}) => {
  const activeTab = currentTab || activeView || 'board';
  const effectiveSearch = searchQuery ?? globalSearch ?? '';
  const effectiveCount = totalBookingsCount ?? bookingCount ?? 0;

  const handleSelectTab = (tabKey: NavViewType) => {
    if (setCurrentTab) setCurrentTab(tabKey);
    if (setActiveView) setActiveView(tabKey);
  };

  const handleSearch = (val: string) => {
    if (setSearchQuery) setSearchQuery(val);
    if (setGlobalSearch) setGlobalSearch(val);
  };

  const isTabActive = (key: string) => {
    if (key === 'board') return activeTab === 'board';
    if (key === 'staff') return activeTab === 'staff-schedule' || activeTab === 'staff';
    if (key === 'calendar') return activeTab === 'calendar';
    if (key === 'all') return activeTab === 'all-bookings' || activeTab === 'all';
    if (key === 'sync') return activeTab === 'google-sheets' || activeTab === 'sync';
    if (key === 'settings') return activeTab === 'settings';
    return false;
  };
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Company Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-sm border border-blue-400 shrink-0">
              MSD
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white truncate tracking-tight">
                  {companyInfo.name}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/60 text-blue-200 border border-blue-700/50">
                  Puducherry
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Booking Management &amp; Staff Dispatch &bull; {companyInfo.mobile}
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs relative">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              value={effectiveSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Quick search ref, customer, mobile, staff..."
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {effectiveSearch && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-2.5 text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNewBooking}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
              id="btn-new-booking-header"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Booking</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-1 border-t border-slate-800/80 py-1.5 text-xs sm:text-sm">
          <button
            onClick={() => handleSelectTab('board')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isTabActive('board')
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            id="tab-daily-board"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Daily Booking Board</span>
          </button>

          <button
            onClick={() => handleSelectTab('staff-schedule')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isTabActive('staff')
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            id="tab-staff-schedule"
          >
            <Users className="w-4 h-4" />
            <span>Staff Schedule &amp; Workload</span>
          </button>

          <button
            onClick={() => handleSelectTab('calendar')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isTabActive('calendar')
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            id="tab-calendar"
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar View</span>
          </button>

          <button
            onClick={() => handleSelectTab('all-bookings')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isTabActive('all')
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            id="tab-all-bookings"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>All Bookings ({effectiveCount})</span>
          </button>

          <button
            onClick={() => handleSelectTab('google-sheets')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isTabActive('sync')
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            id="tab-google-sheet-sync"
          >
            <Sheet className="w-4 h-4 text-emerald-400" />
            <span>Google Sheet Sync</span>
          </button>

          <button
            onClick={() => handleSelectTab('settings')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              isTabActive('settings')
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            id="tab-settings"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

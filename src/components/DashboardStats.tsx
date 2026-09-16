import {
  AlertTriangle,
  BarChart3,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  IndianRupee,
  TrendingUp,
  UserCheck,
  UserX,
  Wallet,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { formatBookingAmount } from '../services/storageService';
import { Booking, SlotDefinition } from '../types';

interface DashboardStatsProps {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  bookingsForDate?: Booking[];
  allBookings?: Booking[];
  allSlots?: SlotDefinition[];
  onSelectSlotToBook?: (slotNumber: number) => void;
  onSlotClick?: (slotNumber: number, existingBooking?: Booking) => void;
  onNewBooking?: () => void;
  onNavigateToReports?: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  selectedDate,
  setSelectedDate,
  bookingsForDate = [],
  allBookings = [],
  allSlots = [],
  onSelectSlotToBook,
  onSlotClick,
  onNewBooking,
  onNavigateToReports,
}) => {
  const handleSlotAction = (slotNumber: number, booking?: Booking) => {
    if (onSelectSlotToBook) {
      onSelectSlotToBook(slotNumber);
    } else if (onSlotClick) {
      onSlotClick(slotNumber, booking);
    } else if (onNewBooking) {
      onNewBooking();
    }
  };

  // Current calendar month key (YYYY-MM)
  const currentCalendarMonth = useMemo(() => {
    return new Date().toISOString().slice(0, 7);
  }, []);

  // State for active financial month view, defaulting to selected date's month or current month
  const selectedDateMonth = selectedDate.slice(0, 7);
  const [activeMonthKey, setActiveMonthKey] = useState<string>(selectedDateMonth || currentCalendarMonth);

  useEffect(() => {
    if (selectedDateMonth && selectedDateMonth !== activeMonthKey) {
      setActiveMonthKey(selectedDateMonth);
    }
  }, [selectedDateMonth]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = activeMonthKey.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    const prevKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonthKey(prevKey);
  };

  const handleNextMonth = () => {
    const [y, m] = activeMonthKey.split('-').map(Number);
    const d = new Date(y, m, 1);
    const nextKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonthKey(nextKey);
  };

  // Formatted active month name (e.g. "September 2026")
  const monthName = useMemo(() => {
    const [yearStr, monthStr] = activeMonthKey.split('-');
    const monthDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
    return monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, [activeMonthKey]);

  // Filter all bookings for the active month (excluding Cancelled)
  const monthBookings = useMemo(() => {
    return allBookings.filter((b) => {
      const bMonth = (b.scheduleDate || b.bookingDate || '').slice(0, 7);
      return bMonth === activeMonthKey && b.bookingStatus !== 'Cancelled';
    });
  }, [allBookings, activeMonthKey]);

  // Financial calculations for current month
  const monthFinancials = useMemo(() => {
    let totalRevenue = 0;
    let totalAdvance = 0;
    let totalBalance = 0;
    let afterVisitCount = 0;
    let fixedAmountCount = 0;
    let fullyPaidCount = 0;
    let pendingBalanceCount = 0;

    for (const b of monthBookings) {
      const { isAfterVisit } = formatBookingAmount(b.amount);
      const cleanAmt = typeof b.amount === 'number'
        ? b.amount
        : parseFloat(String(b.amount).replace(/[^\d.]/g, '')) || 0;

      const adv = Number(b.advanceAmount) || 0;
      const bal = b.balanceAmount !== undefined && b.balanceAmount !== null && !isNaN(Number(b.balanceAmount))
        ? Number(b.balanceAmount)
        : Math.max(0, cleanAmt - adv);

      if (isAfterVisit) {
        afterVisitCount++;
        // Count any advance paid for After Visit
        totalAdvance += adv;
      } else {
        fixedAmountCount++;
        totalRevenue += cleanAmt;
        totalAdvance += adv;
        totalBalance += bal;
      }

      if (!isAfterVisit && bal === 0 && cleanAmt > 0) {
        fullyPaidCount++;
      } else if (bal > 0) {
        pendingBalanceCount++;
      }
    }

    const collectionRate = totalRevenue > 0 ? Math.round((totalAdvance / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      totalAdvance,
      totalBalance,
      afterVisitCount,
      fixedAmountCount,
      fullyPaidCount,
      pendingBalanceCount,
      collectionRate,
      totalBookingsCount: monthBookings.length,
    };
  }, [monthBookings]);

  // Date manipulation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  const handleSetTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Metrics for selected day
  const total = bookingsForDate.length;
  const confirmed = bookingsForDate.filter((b) => b.bookingStatus === 'Confirmed').length;
  const pending = bookingsForDate.filter(
    (b) => b.bookingStatus === 'New' || b.paymentStatus === 'Pending'
  ).length;
  const completed = bookingsForDate.filter((b) => b.bookingStatus === 'Completed').length;
  const cancelled = bookingsForDate.filter((b) => b.bookingStatus === 'Cancelled').length;

  const staffAssigned = bookingsForDate.filter(
    (b) => b.assignedStaffIds && b.assignedStaffIds.length > 0
  ).length;
  const unassigned = total - staffAssigned;

  // Occupied slots (1 to 10)
  const occupiedSlotNumbers = new Set(
    bookingsForDate
      .filter((b) => b.bookingStatus !== 'Cancelled')
      .map((b) => b.slotNumber)
  );

  const busySlotsCount = occupiedSlotNumbers.size;
  const availableSlotsCount = Math.max(0, 10 - busySlotsCount);

  // Formatted date display (e.g. "Tuesday, 15 Sep 2026")
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-4 mb-6">
      {/* Monthly Financial Stats Widget (Total Revenue, Total Advance Received, Total Balance Due) */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Monthly Revenue & Financial Overview</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                  {monthName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated across {monthFinancials.totalBookingsCount} active bookings in {monthName}
              </p>
            </div>
          </div>

          {/* Month selector & quick navigation */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-lg border border-slate-700">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1 rounded hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-slate-200">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1 rounded hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {activeMonthKey !== currentCalendarMonth && (
              <button
                onClick={() => setActiveMonthKey(currentCalendarMonth)}
                className="ml-1 px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                Current Month
              </button>
            )}

            {onNavigateToReports && (
              <button
                onClick={onNavigateToReports}
                className="ml-1.5 px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-600/90 hover:bg-blue-600 text-white transition-colors flex items-center gap-1 cursor-pointer"
                title="View full reports, charts and export records"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reports &amp; Analytics</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Core Financial Metric Cards requested by user */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5">
          {/* 1. Total Revenue */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Total Revenue</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                ₹{monthFinancials.totalRevenue.toLocaleString('en-IN')}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                <span>{monthFinancials.fixedAmountCount} Fixed Bookings</span>
                {monthFinancials.afterVisitCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-medium border border-amber-500/30">
                    +{monthFinancials.afterVisitCount} After Visit
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Total Advance Received */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Total Advance Received</span>
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black text-blue-400 tracking-tight">
                ₹{monthFinancials.totalAdvance.toLocaleString('en-IN')}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Advance Collected</span>
                <span className="text-blue-300 font-bold">{monthFinancials.collectionRate}%</span>
              </div>
              <div className="w-full bg-slate-700/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, monthFinancials.collectionRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. Total Balance Due */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Total Balance Due</span>
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                ₹{monthFinancials.totalBalance.toLocaleString('en-IN')}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {monthFinancials.pendingBalanceCount > 0
                    ? `${monthFinancials.pendingBalanceCount} Pending Collection`
                    : 'All Cleared'}
                </span>
                {monthFinancials.fullyPaidCount > 0 && (
                  <span className="text-emerald-400 font-medium text-[10px]">
                    {monthFinancials.fullyPaidCount} Fully Paid
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-700/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      monthFinancials.totalRevenue > 0
                        ? Math.min(100, Math.round((monthFinancials.totalBalance / monthFinancials.totalRevenue) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation & Daily Slot Operations */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-4">
        {/* Date Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={handlePrevDay}
                title="Previous Day"
                className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span>{formattedDate}</span>
              </div>
              <button
                onClick={handleNextDay}
                title="Next Day"
                className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Date Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSetToday}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleSetTomorrow}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Tomorrow
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-300 rounded-md text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              {availableSlotsCount} of 10 Slots Available
            </span>
            {unassigned > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-medium border border-amber-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {unassigned} Unassigned Staff
              </span>
            )}
          </div>
        </div>

        {/* Metrics Row for Selected Day */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-500">Day's Bookings</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">On {selectedDate}</div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3">
            <div className="text-xs font-medium text-blue-700 flex items-center justify-between">
              <span>Confirmed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-blue-900 mt-1">{confirmed}</div>
            <div className="text-[11px] text-blue-600/80 mt-0.5">Ready for service</div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3">
            <div className="text-xs font-medium text-amber-700 flex items-center justify-between">
              <span>Pending / New</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-900 mt-1">{pending}</div>
            <div className="text-[11px] text-amber-700/80 mt-0.5">Awaiting advance/review</div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3">
            <div className="text-xs font-medium text-emerald-700 flex items-center justify-between">
              <span>Staff Assigned</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-900 mt-1">{staffAssigned}</div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5">
              {unassigned > 0 ? `${unassigned} unassigned` : 'All allocated'}
            </div>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-lg p-3">
            <div className="text-xs font-medium text-indigo-700 flex items-center justify-between">
              <span>Busy Slots</span>
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-900 mt-1">{busySlotsCount}</div>
            <div className="text-[11px] text-indigo-700/80 mt-0.5">{availableSlotsCount} free slots</div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-600 flex items-center justify-between">
              <span>Completed / Done</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-700 mt-1">{completed}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {cancelled > 0 ? `${cancelled} cancelled` : '0 cancelled'}
            </div>
          </div>
        </div>

        {/* Visual Daily Schedule Ribbon (Slots 1-10) */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Daily Slot Ribbon (10 Slots)
            </span>
            <span className="text-[11px] text-slate-500">
              Click any empty slot to book instantly
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
            {allSlots.map((slot) => {
              const bookingsInSlot = bookingsForDate.filter(
                (b) => b.slotNumber === slot.slotNumber && b.bookingStatus !== 'Cancelled'
              );
              const isBooked = bookingsInSlot.length > 0;
              const primaryBooking = bookingsInSlot[0];

              return (
                <button
                  key={slot.id}
                  onClick={() => handleSlotAction(slot.slotNumber, primaryBooking)}
                  className={`p-2 rounded-lg text-left transition-all border text-xs relative ${
                    isBooked
                      ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100/70 cursor-pointer'
                      : 'bg-emerald-50/50 hover:bg-emerald-100/70 border-emerald-200/70 text-emerald-800 hover:border-emerald-300 cursor-pointer'
                  }`}
                  title={
                    isBooked
                      ? `Slot ${slot.slotNumber}: ${primaryBooking?.customerName || 'Customer'} (${primaryBooking?.serviceType || 'Service'}) - Click to view`
                      : `Slot ${slot.slotNumber}: Available (Click to book)`
                  }
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Slot {slot.slotNumber}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isBooked ? 'bg-blue-600' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5 font-normal">
                    {slot.period}
                  </div>
                  <div className="mt-1 truncate font-medium">
                    {isBooked ? (
                      <span className="text-blue-950 font-semibold truncate block">
                        {primaryBooking?.customerName ? primaryBooking.customerName.split(' ')[0] : 'Booked'}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">+ Book</span>
                    )}
                  </div>
                  {isBooked && (
                    <div className="text-[9px] text-blue-700 truncate">
                      {primaryBooking?.assignedStaffNames?.[0]
                        ? primaryBooking.assignedStaffNames[0].replace(/^Mr\.\s*/, '')
                        : 'Unassigned'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};


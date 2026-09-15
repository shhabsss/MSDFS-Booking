import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react';
import React from 'react';
import { Booking, SlotDefinition } from '../types';

interface DashboardStatsProps {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  bookingsForDate?: Booking[];
  allSlots?: SlotDefinition[];
  onSelectSlotToBook?: (slotNumber: number) => void;
  onSlotClick?: (slotNumber: number, existingBooking?: Booking) => void;
  onNewBooking?: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  selectedDate,
  setSelectedDate,
  bookingsForDate = [],
  allSlots = [],
  onSelectSlotToBook,
  onSlotClick,
  onNewBooking,
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
    // Current environment date is around 2026-09-15
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  const handleSetTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Metrics
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
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 mb-6">
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
          <div className="text-xs font-medium text-slate-500">Total Bookings</div>
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
  );
};

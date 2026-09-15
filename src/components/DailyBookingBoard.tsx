import {
  AlertCircle,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Eye,
  FileSpreadsheet,
  Filter,
  MapPin,
  MessageCircle,
  MoreVertical,
  Phone,
  PlayCircle,
  Plus,
  RotateCcw,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
  SlotDefinition,
  StaffMember,
} from '../types';

export interface StatusVisualConfig {
  label: string;
  badgeClass: string;
  dotColor: string;
  borderLeftClass: string;
  rowBgClass: string;
  icon: React.ElementType;
  description: string;
}

export const STATUS_VISUALS: Record<BookingStatus, StatusVisualConfig> = {
  Confirmed: {
    label: 'Confirmed',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-600',
    borderLeftClass: 'border-l-[5px] border-l-blue-600',
    rowBgClass: 'bg-blue-50/20 hover:bg-blue-50/40',
    icon: CheckCircle2,
    description: 'Booking confirmed & scheduled',
  },
  Pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500',
    borderLeftClass: 'border-l-[5px] border-l-amber-500',
    rowBgClass: 'bg-amber-50/25 hover:bg-amber-50/45',
    icon: Clock,
    description: 'Awaiting confirmation or client response',
  },
  New: {
    label: 'New',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
    dotColor: 'bg-sky-500',
    borderLeftClass: 'border-l-[5px] border-l-sky-500',
    rowBgClass: 'bg-sky-50/20 hover:bg-sky-50/40',
    icon: AlertCircle,
    description: 'Newly received inquiry',
  },
  'Staff Assigned': {
    label: 'Staff Assigned',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dotColor: 'bg-indigo-600',
    borderLeftClass: 'border-l-[5px] border-l-indigo-600',
    rowBgClass: 'bg-indigo-50/20 hover:bg-indigo-50/40',
    icon: UserCheck,
    description: 'Staff assigned and notified',
  },
  'In Progress': {
    label: 'In Progress',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    dotColor: 'bg-purple-600 animate-pulse',
    borderLeftClass: 'border-l-[5px] border-l-purple-600',
    rowBgClass: 'bg-purple-50/25 hover:bg-purple-50/45',
    icon: PlayCircle,
    description: 'Service currently in progress on site',
  },
  Completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-600',
    borderLeftClass: 'border-l-[5px] border-l-emerald-600',
    rowBgClass: 'bg-emerald-50/20 hover:bg-emerald-50/40',
    icon: CheckCheck,
    description: 'Service completed successfully',
  },
  Rescheduled: {
    label: 'Rescheduled',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    dotColor: 'bg-orange-500',
    borderLeftClass: 'border-l-[5px] border-l-orange-500',
    rowBgClass: 'bg-orange-50/20 hover:bg-orange-50/40',
    icon: RotateCcw,
    description: 'Rescheduled to a different slot or day',
  },
  Cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 line-through',
    dotColor: 'bg-rose-500',
    borderLeftClass: 'border-l-[5px] border-l-rose-400',
    rowBgClass: 'bg-rose-50/15 opacity-70 hover:opacity-90',
    icon: XCircle,
    description: 'Cancelled booking',
  },
};

export const getStatusVisual = (status: string): StatusVisualConfig => {
  if (status in STATUS_VISUALS) {
    return STATUS_VISUALS[status as BookingStatus];
  }
  return {
    label: status || 'Unknown',
    badgeClass: 'bg-slate-50 text-slate-800 border-slate-300',
    dotColor: 'bg-slate-400',
    borderLeftClass: 'border-l-[5px] border-l-slate-400',
    rowBgClass: 'bg-slate-50/30 hover:bg-slate-50/50',
    icon: AlertCircle,
    description: status,
  };
};

const ORDERED_STATUS_LIST: BookingStatus[] = [
  'Confirmed',
  'Pending',
  'In Progress',
  'Completed',
  'Staff Assigned',
  'New',
  'Rescheduled',
  'Cancelled',
];

interface DailyBookingBoardProps {
  selectedDate: string;
  allSlots?: SlotDefinition[];
  bookingsForDate?: Booking[];
  bookings?: Booking[];
  allStaff?: StaffMember[];
  onViewBooking: (booking: Booking) => void;
  onEditBooking: (booking: Booking) => void;
  onDuplicateBooking: (booking: Booking) => void;
  onDeleteBooking: (bookingId: string, bookingRef: string) => void;
  onQuickBookSlot?: (slotNumber: number) => void;
  onSlotClick?: (slotNumber: number, existingBooking?: Booking) => void;
  onNewBooking?: () => void;
  onQuickStatusChange: (bookingId: string, newStatus: BookingStatus) => void;
  onOpenWhatsApp?: (booking: Booking, type: 'customer' | 'staff') => void;
  onOpenMessageModal?: (booking: Booking) => void;
}

export const DailyBookingBoard: React.FC<DailyBookingBoardProps> = ({
  selectedDate,
  allSlots = [],
  bookingsForDate,
  bookings,
  allStaff = [],
  onViewBooking,
  onEditBooking,
  onDuplicateBooking,
  onDeleteBooking,
  onQuickBookSlot,
  onSlotClick,
  onNewBooking,
  onQuickStatusChange,
  onOpenWhatsApp,
  onOpenMessageModal,
}) => {
  const currentBookings = bookingsForDate || bookings || [];
  const [filterPeriod, setFilterPeriod] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening'>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [activeMenuBookingId, setActiveMenuBookingId] = useState<string | null>(null);

  // Calculate live counts per status for the selected date
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Confirmed: 0,
      Pending: 0,
      'In Progress': 0,
      Completed: 0,
      'Staff Assigned': 0,
      New: 0,
      Rescheduled: 0,
      Cancelled: 0,
    };
    currentBookings.forEach((b) => {
      const s = b.bookingStatus;
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts[s] = (counts[s] || 0) + 1;
      }
    });
    return counts;
  }, [currentBookings]);

  const handleQuickBook = (slotNumber: number) => {
    if (onQuickBookSlot) {
      onQuickBookSlot(slotNumber);
    } else if (onSlotClick) {
      onSlotClick(slotNumber);
    } else if (onNewBooking) {
      onNewBooking();
    }
  };

  const handleWhatsApp = (booking: Booking, type: 'customer' | 'staff') => {
    if (onOpenMessageModal) {
      onOpenMessageModal(booking);
    } else if (onOpenWhatsApp) {
      onOpenWhatsApp(booking, type);
    } else {
      const phone = booking.customerWhatsApp || booking.customerMobile;
      const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
      if (cleanPhone) {
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
      }
    }
  };

  // Group slots by period
  const periods = ['Morning', 'Afternoon', 'Evening'] as const;

  const filteredSlots = allSlots.filter((slot) => {
    if (filterPeriod === 'All') return true;
    return slot.period === filterPeriod;
  });

  // When a status filter is active, only show slots containing that status or all if 'All'
  const displayedSlots = filteredSlots.filter((slot) => {
    if (filterStatus === 'All') return true;
    return currentBookings.some(
      (b) => b.slotNumber === slot.slotNumber && b.bookingStatus === filterStatus
    );
  });

  const getStatusBadgeClass = (status: BookingStatus) => {
    return getStatusVisual(status).badgeClass;
  };

  const getPaymentBadgeClass = (status: PaymentStatus) => {
    switch (status) {
      case 'Fully Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Advance Paid':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Not Paid':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-300';
    }
  };

  return (
    <div className="space-y-3">
      {/* Table Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Daily Booking Board</span>
          </div>
          <span className="text-xs text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-mono">
            {currentBookings.length} Bookings Scheduled
          </span>
        </div>

        {/* Period Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          {(['All', 'Morning', 'Afternoon', 'Evening'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                filterPeriod === p
                  ? 'bg-white text-blue-600 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Status Indicator Strip & Quick Filter */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Status Visual Indicators:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {/* "All" button */}
            <button
              onClick={() => setFilterStatus('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'All'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>All Statuses</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterStatus === 'All' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {currentBookings.length}
              </span>
            </button>

            {/* Individual Status Badges with Visual Color Dots */}
            {ORDERED_STATUS_LIST.map((st) => {
              const visual = STATUS_VISUALS[st];
              const count = statusCounts[st] || 0;
              const isSelected = filterStatus === st;
              const IconComp = visual.icon;

              return (
                <button
                  key={st}
                  onClick={() => setFilterStatus(isSelected ? 'All' : st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? `${visual.badgeClass} ring-2 ring-blue-500 shadow-2xs font-bold`
                      : count > 0
                      ? `${visual.badgeClass} hover:brightness-95`
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={`${visual.label} (${visual.description}) - click to filter`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${visual.dotColor}`} />
                  <IconComp className="w-3 h-3 shrink-0" />
                  <span>{visual.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      count > 0 ? 'bg-white/90 border border-slate-200 text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Notice */}
        {filterStatus !== 'All' && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-slate-500">Filtered view:</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold border ${
                  getStatusVisual(filterStatus).badgeClass
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${getStatusVisual(filterStatus).dotColor}`} />
                {filterStatus} ({statusCounts[filterStatus] || 0} bookings)
              </span>
            </div>
            <button
              onClick={() => setFilterStatus('All')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
            >
              Reset to view all slots
            </button>
          </div>
        )}
      </div>

      {/* Desktop Spreadsheet Table View */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200 tracking-wider">
                <th className="py-3 px-3 w-20 text-center border-r border-slate-200">Slot</th>
                <th className="py-3 px-3 w-28 border-r border-slate-200">Booking Ref</th>
                <th className="py-3 px-3 min-w-[160px] border-r border-slate-200">Customer</th>
                <th className="py-3 px-3 min-w-[140px] border-r border-slate-200">Service</th>
                <th className="py-3 px-3 min-w-[130px] border-r border-slate-200">Location</th>
                <th className="py-3 px-3 min-w-[170px] border-r border-slate-200">Assigned Staff</th>
                <th className="py-3 px-2 w-16 text-center border-r border-slate-200">Staff #</th>
                <th className="py-3 px-3 w-28 text-right border-r border-slate-200">Amount</th>
                <th className="py-3 px-3 w-28 text-center border-r border-slate-200">Payment</th>
                <th className="py-3 px-3 w-32 border-r border-slate-200">Status</th>
                <th className="py-3 px-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedSlots.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-400 mb-2">
                      <Filter className="w-4 h-4" />
                    </div>
                    <p className="font-semibold text-xs text-slate-700">No {filterStatus} bookings found</p>
                    <button
                      onClick={() => setFilterStatus('All')}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                    >
                      Clear status filter
                    </button>
                  </td>
                </tr>
              ) : (
                displayedSlots.map((slot) => {
                  const slotBookings = currentBookings.filter(
                    (b) =>
                      b.slotNumber === slot.slotNumber &&
                      (filterStatus === 'All' || b.bookingStatus === filterStatus)
                  );

                  if (slotBookings.length === 0) {
                    // Empty / Available Slot Row
                    return (
                      <tr
                        key={slot.id}
                        className="hover:bg-slate-50/80 transition-colors group bg-slate-50/20 border-l-[5px] border-l-slate-200"
                      >
                        <td className="py-2.5 px-3 text-center border-r border-slate-200/80">
                          <span className="inline-flex items-center justify-center font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            Slot {slot.slotNumber}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                            {slot.period}
                          </div>
                        </td>
                        <td colSpan={9} className="py-2.5 px-4 border-r border-slate-200/80">
                          <div className="flex items-center justify-between text-slate-400 italic">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-normal">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                              Slot available
                            </span>
                            <button
                              onClick={() => handleQuickBook(slot.slotNumber)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Book Slot {slot.slotNumber}</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-400">—</td>
                      </tr>
                    );
                  }

                  // If bookings exist for this slot (could be 1 or multiple)
                  return slotBookings.map((booking, bIdx) => {
                    const visual = getStatusVisual(booking.bookingStatus);
                    const locationDisplay =
                      booking.serviceLocation === 'Other' && booking.customLocation
                        ? booking.customLocation
                        : booking.serviceLocation;

                    const formattedAmount =
                      typeof booking.amount === 'number'
                        ? `₹${booking.amount.toLocaleString('en-IN')}`
                        : `${booking.amount}`;

                    return (
                      <tr
                        key={booking.id}
                        className={`transition-colors border-l-[5px] ${visual.borderLeftClass} ${visual.rowBgClass} ${
                          booking.bookingStatus === 'Cancelled' ? 'opacity-65' : ''
                        }`}
                      >
                        {/* Slot Column */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-200/80 font-bold text-slate-800">
                          <div className="flex flex-col items-center">
                            <div className="relative">
                              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                                {slot.slotNumber}
                              </span>
                              {/* Visual Status Dot on Slot Badge */}
                              <span
                                className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${visual.dotColor} ring-2 ring-white`}
                                title={`Status: ${booking.bookingStatus}`}
                              />
                            </div>
                            <span
                              className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded mt-1 ${
                                slot.period === 'Morning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : slot.period === 'Afternoon'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {slot.period}
                            </span>
                            {slotBookings.length > 1 && (
                              <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1 rounded mt-0.5">
                                #{bIdx + 1}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Booking Ref */}
                        <td className="py-2.5 px-3 border-r border-slate-200/80 font-mono font-medium text-blue-700">
                          <button
                            onClick={() => onViewBooking(booking)}
                            className="hover:underline text-left cursor-pointer font-bold"
                            title="Click to view full booking details"
                          >
                            {booking.bookingRef}
                          </button>
                          <div className="text-[10px] text-slate-400 font-sans">
                            {booking.bookingDate}
                          </div>
                        </td>

                        {/* Customer Name & Mobile */}
                        <td className="py-2.5 px-3 border-r border-slate-200/80">
                          <div className="font-bold text-slate-900 truncate max-w-[170px]">
                            {booking.customerName}
                          </div>
                          <div className="flex items-center gap-1 text-slate-600 text-[11px] mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <a
                              href={`tel:${booking.customerMobile}`}
                              className="hover:text-blue-600 truncate"
                            >
                              {booking.customerMobile}
                            </a>
                          </div>
                        </td>

                        {/* Service */}
                        <td className="py-2.5 px-3 border-r border-slate-200/80">
                          <div className="font-semibold text-slate-800 text-xs">
                            {booking.serviceType}
                          </div>
                          {booking.serviceDescription && (
                            <div
                              className="text-[11px] text-amber-900 bg-amber-50/90 rounded px-1.5 py-0.5 mt-1 border border-amber-200/80 font-medium max-w-[210px] truncate"
                              title={booking.serviceDescription}
                            >
                              <span className="font-semibold text-amber-800">Work: </span>
                              {booking.serviceDescription}
                            </div>
                          )}
                          {booking.notes && !booking.serviceDescription && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[160px] italic mt-0.5">
                              {booking.notes}
                            </div>
                          )}
                        </td>

                        {/* Location & Address */}
                        <td className="py-2.5 px-3 border-r border-slate-200/80">
                          <div className="flex items-center gap-1 font-medium text-slate-800 text-xs">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            <span className="truncate max-w-[120px]">{locationDisplay}</span>
                          </div>
                          {booking.fullAddress && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              {booking.fullAddress}
                            </div>
                          )}
                        </td>

                        {/* Assigned Staff */}
                        <td className="py-2.5 px-3 border-r border-slate-200/80">
                          {booking.assignedStaffNames && booking.assignedStaffNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {booking.assignedStaffNames.map((name, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200"
                                >
                                  {name.replace(/^Mr\.\s*/, '')}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => onEditBooking(booking)}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors cursor-pointer"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Assign Staff</span>
                            </button>
                          )}
                        </td>

                        {/* Staff Count */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200/80">
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {booking.assignedStaffNames?.length || booking.staffRequired || 1}
                          </span>
                        </td>

                        {/* Amount & Balance */}
                        <td className="py-2.5 px-3 text-right border-r border-slate-200/80 font-mono">
                          <div className="font-bold text-slate-900">{formattedAmount}</div>
                          {booking.balanceAmount > 0 && (
                            <div className="text-[10px] text-amber-700">
                              Bal: ₹{booking.balanceAmount.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>

                        {/* Payment Status */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-200/80">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPaymentBadgeClass(
                              booking.paymentStatus
                            )}`}
                          >
                            {booking.paymentStatus}
                          </span>
                        </td>

                        {/* Booking Status Dropdown with Visual Color Indicator */}
                        <td className="py-2.5 px-3 border-r border-slate-200/80">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${visual.dotColor}`}
                              title={booking.bookingStatus}
                            />
                            <select
                              value={booking.bookingStatus}
                              onChange={(e) =>
                                onQuickStatusChange(booking.id, e.target.value as BookingStatus)
                              }
                              className={`w-full text-xs font-semibold rounded-md px-2 py-1 border shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${visual.badgeClass}`}
                            >
                              <option value="New">New</option>
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Staff Assigned">Staff Assigned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Rescheduled">Rescheduled</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onViewBooking(booking)}
                              title="View Details & Receipt"
                              className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditBooking(booking)}
                              title="Edit Booking"
                              className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleWhatsApp(booking, 'customer')}
                              title="Send WhatsApp to Customer"
                              className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                            <button
                              onClick={() => onDuplicateBooking(booking)}
                              title="Duplicate Booking"
                              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteBooking(booking.id, booking.bookingRef)}
                              title="Delete Booking"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {displayedSlots.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl border border-slate-200">
            <Filter className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No {filterStatus} bookings found</p>
            <button
              onClick={() => setFilterStatus('All')}
              className="mt-2 text-xs text-blue-600 font-bold underline"
            >
              Show all slots
            </button>
          </div>
        ) : (
          displayedSlots.map((slot) => {
            const slotBookings = currentBookings.filter(
              (b) =>
                b.slotNumber === slot.slotNumber &&
                (filterStatus === 'All' || b.bookingStatus === filterStatus)
            );

            if (slotBookings.length === 0) {
              return (
                <div
                  key={slot.id}
                  className="bg-white rounded-xl border border-dashed border-slate-300 p-3.5 flex items-center justify-between border-l-[5px] border-l-slate-200"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 text-sm">
                        Slot {slot.slotNumber}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {slot.period}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Available
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickBook(slot.slotNumber)}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book</span>
                  </button>
                </div>
              );
            }

            return slotBookings.map((booking) => {
              const visual = getStatusVisual(booking.bookingStatus);
              const StatusIcon = visual.icon;
              const formattedAmount =
                typeof booking.amount === 'number'
                  ? `₹${booking.amount.toLocaleString('en-IN')}`
                  : `${booking.amount}`;

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3 border-l-[5px] ${visual.borderLeftClass} ${visual.rowBgClass}`}
                >
                  {/* Card Top: Slot, Ref, Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-xs">
                          Slot {slot.slotNumber} ({slot.period})
                        </span>
                        <span className="font-mono text-xs font-bold text-blue-700">
                          {booking.bookingRef}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">
                        {booking.serviceType}
                      </div>
                      {booking.serviceDescription && (
                        <div className="text-[11px] text-amber-900 bg-amber-50/90 rounded px-1.5 py-0.5 mt-1 border border-amber-200/80 font-medium">
                          <span className="font-semibold text-amber-800">Work: </span>
                          {booking.serviceDescription}
                        </div>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold border shadow-2xs ${visual.badgeClass}`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${visual.dotColor}`} />
                      <StatusIcon className="w-3 h-3 shrink-0" />
                      <span>{booking.bookingStatus}</span>
                    </span>
                  </div>

                  {/* Customer Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400 text-[11px]">Customer</div>
                      <div className="font-bold text-slate-900">{booking.customerName}</div>
                      <a
                        href={`tel:${booking.customerMobile}`}
                        className="text-blue-600 flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        {booking.customerMobile}
                      </a>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">Location &amp; Amount</div>
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {booking.serviceLocation}
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {formattedAmount}{' '}
                        <span className="text-[10px] font-normal text-slate-500">
                          ({booking.paymentStatus})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Staff */}
                  <div className="bg-white/80 p-2 rounded-lg text-xs border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium mb-1">
                      Assigned Staff ({booking.assignedStaffNames?.length || 0}):
                    </div>
                    {booking.assignedStaffNames && booking.assignedStaffNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {booking.assignedStaffNames.map((name, i) => (
                          <span
                            key={i}
                            className="bg-white border border-slate-200 px-2 py-0.5 rounded text-blue-800 font-medium"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-amber-700 italic">No staff assigned yet</span>
                    )}
                  </div>

                  {/* Quick Status Select on Mobile */}
                  <div className="flex items-center justify-between gap-2 bg-white/80 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                    <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${visual.dotColor}`} />
                      Change Status:
                    </span>
                    <select
                      value={booking.bookingStatus}
                      onChange={(e) =>
                        onQuickStatusChange(booking.id, e.target.value as BookingStatus)
                      }
                      className={`text-xs font-semibold rounded-md px-2 py-1 border shadow-2xs cursor-pointer ${visual.badgeClass}`}
                    >
                      <option value="New">New</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Staff Assigned">Staff Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleWhatsApp(booking, 'customer')}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => onViewBooking(booking)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                      >
                        Details
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditBooking(booking)}
                        className="p-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs hover:bg-amber-100"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateBooking(booking)}
                        className="p-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBooking(booking.id, booking.bookingRef)}
                        className="p-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs hover:bg-rose-100"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            });
          })
        )}
      </div>
    </div>
  );
};

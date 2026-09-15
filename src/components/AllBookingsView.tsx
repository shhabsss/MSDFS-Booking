import {
  ArrowUpDown,
  Copy,
  Download,
  Edit2,
  Eye,
  Filter,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { exportGoogleSheetCSV } from '../services/storageService';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
  StaffMember,
} from '../types';

interface AllBookingsViewProps {
  bookings: Booking[];
  allStaff: StaffMember[];
  onViewBooking: (booking: Booking) => void;
  onEditBooking: (booking: Booking) => void;
  onDuplicateBooking: (booking: Booking) => void;
  onDeleteBooking: (bookingId: string, bookingRef: string) => void;
  onQuickStatusChange: (bookingId: string, newStatus: BookingStatus) => void;
  onNewBooking: () => void;
  onOpenMessageModal?: (booking: Booking) => void;
  onClearAllBookings?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const getStatusBadgeClass = (status: BookingStatus) => {
  switch (status) {
    case 'New':
      return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'Pending':
      return 'bg-amber-50 text-amber-900 border-amber-300';
    case 'Confirmed':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'Staff Assigned':
      return 'bg-indigo-50 text-indigo-700 border-indigo-300';
    case 'In Progress':
      return 'bg-cyan-50 text-cyan-800 border-cyan-300';
    case 'Completed':
      return 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold';
    case 'Rescheduled':
      return 'bg-purple-50 text-purple-700 border-purple-300';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-300';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-300';
  }
};

const getStatusDotColor = (status: BookingStatus) => {
  switch (status) {
    case 'New':
      return 'bg-blue-500';
    case 'Pending':
      return 'bg-amber-500';
    case 'Confirmed':
      return 'bg-emerald-500';
    case 'Staff Assigned':
      return 'bg-indigo-500';
    case 'In Progress':
      return 'bg-cyan-500';
    case 'Completed':
      return 'bg-emerald-600';
    case 'Rescheduled':
      return 'bg-purple-500';
    case 'Cancelled':
      return 'bg-rose-500';
    default:
      return 'bg-slate-400';
  }
};

export const AllBookingsView: React.FC<AllBookingsViewProps> = ({
  bookings,
  allStaff,
  onViewBooking,
  onEditBooking,
  onDuplicateBooking,
  onDeleteBooking,
  onQuickStatusChange,
  onNewBooking,
  onOpenMessageModal,
  onClearAllBookings,
  searchQuery,
  setSearchQuery,
}) => {
  // Multi-filters (Section 20)
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [filterSlot, setFilterSlot] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterBookingStatus, setFilterBookingStatus] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<'scheduleDate' | 'bookingRef' | 'customerName' | 'amount'>('scheduleDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extract unique locations & services for dropdowns
  const uniqueServices = useMemo(() => {
    return Array.from(new Set(bookings.map((b) => b.serviceType).filter(Boolean))).sort();
  }, [bookings]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(bookings.map((b) => b.serviceLocation).filter(Boolean))).sort();
  }, [bookings]);

  // Filter and Search logic (Sections 19 & 20)
  const filteredBookings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return bookings.filter((b) => {
      // Global Search
      if (q) {
        const staffString = (b.assignedStaffNames || []).join(' ').toLowerCase();
        const matchRef = b.bookingRef?.toLowerCase().includes(q);
        const matchCustomer = b.customerName?.toLowerCase().includes(q);
        const matchMobile = b.customerMobile?.toLowerCase().includes(q);
        const matchService = b.serviceType?.toLowerCase().includes(q);
        const matchLocation = b.serviceLocation?.toLowerCase().includes(q) || b.customLocation?.toLowerCase().includes(q);
        const matchDate = b.scheduleDate?.includes(q) || b.bookingDate?.includes(q);
        const matchStaff = staffString.includes(q);

        if (!(matchRef || matchCustomer || matchMobile || matchService || matchLocation || matchDate || matchStaff)) {
          return false;
        }
      }

      // Date filter
      if (dateFilter && b.scheduleDate !== dateFilter) {
        return false;
      }

      // Staff filter
      if (filterStaff !== 'all') {
        if (!b.assignedStaffIds?.includes(filterStaff)) {
          return false;
        }
      }

      // Slot filter
      if (filterSlot !== 'all') {
        if (String(b.slotNumber) !== filterSlot) {
          return false;
        }
      }

      // Service filter
      if (filterService !== 'all') {
        if (b.serviceType !== filterService) {
          return false;
        }
      }

      // Booking Status filter
      if (filterBookingStatus !== 'all') {
        if (b.bookingStatus !== filterBookingStatus) {
          return false;
        }
      }

      // Payment Status filter
      if (filterPaymentStatus !== 'all') {
        if (b.paymentStatus !== filterPaymentStatus) {
          return false;
        }
      }

      // Location filter
      if (filterLocation !== 'all') {
        if (b.serviceLocation !== filterLocation) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'scheduleDate') {
        comparison = (a.scheduleDate || '').localeCompare(b.scheduleDate || '');
      } else if (sortField === 'bookingRef') {
        comparison = (a.bookingRef || '').localeCompare(b.bookingRef || '');
      } else if (sortField === 'customerName') {
        comparison = (a.customerName || '').localeCompare(b.customerName || '');
      } else if (sortField === 'amount') {
        const numA = typeof a.amount === 'number' ? a.amount : parseFloat(String(a.amount)) || 0;
        const numB = typeof b.amount === 'number' ? b.amount : parseFloat(String(b.amount)) || 0;
        comparison = numA - numB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [
    bookings,
    searchQuery,
    dateFilter,
    filterStaff,
    filterSlot,
    filterService,
    filterBookingStatus,
    filterPaymentStatus,
    filterLocation,
    sortField,
    sortOrder,
  ]);

  const toggleSort = (field: 'scheduleDate' | 'bookingRef' | 'customerName' | 'amount') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStaff('all');
    setFilterSlot('all');
    setFilterService('all');
    setFilterBookingStatus('all');
    setFilterPaymentStatus('all');
    setFilterLocation('all');
    setDateFilter('');
  };

  const handleExportCSV = () => {
    const csvContent = exportGoogleSheetCSV(filteredBookings, allStaff);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MSD_Bookings_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="flex-1 min-w-[260px] max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ref, customer, mobile, staff, location..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {onClearAllBookings && bookings.length > 0 && (
              <button
                onClick={onClearAllBookings}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-colors cursor-pointer"
                title="Delete all bookings from schedule to start fresh"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Clear All ({bookings.length})</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors cursor-pointer"
              title="Download filtered rows as Google Sheets compatible CSV"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onNewBooking}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Booking</span>
            </button>
          </div>
        </div>

        {/* Multi-Filters Grid (Section 20) */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none"
            title="Filter by Schedule Date"
          />

          {/* Staff Filter */}
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">Staff: All</option>
            {allStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Slot Filter */}
          <select
            value={filterSlot}
            onChange={(e) => setFilterSlot(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">Slot: All</option>
            {Array.from({ length: 10 }).map((_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                Slot {i + 1}
              </option>
            ))}
          </select>

          {/* Service Filter */}
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none max-w-[160px] truncate"
          >
            <option value="all">Service: All</option>
            {uniqueServices.map((srv, idx) => (
              <option key={idx} value={srv}>
                {srv}
              </option>
            ))}
          </select>

          {/* Booking Status Filter */}
          <select
            value={filterBookingStatus}
            onChange={(e) => setFilterBookingStatus(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Staff Assigned">Staff Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="New">New</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">Payment: All</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Advance Paid">Advance Paid</option>
            <option value="Pending">Pending</option>
            <option value="Not Paid">Not Paid</option>
          </select>

          {/* Location Filter */}
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none max-w-[140px] truncate"
          >
            <option value="all">Location: All</option>
            {uniqueLocations.map((loc, idx) => (
              <option key={idx} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchQuery ||
            dateFilter ||
            filterStaff !== 'all' ||
            filterSlot !== 'all' ||
            filterService !== 'all' ||
            filterBookingStatus !== 'all' ||
            filterPaymentStatus !== 'all' ||
            filterLocation !== 'all') && (
            <button
              onClick={clearAllFilters}
              className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-900">{filteredBookings.length}</span> of{' '}
            {bookings.length}
          </div>
        </div>
      </div>

      {/* Spreadsheet Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th
                  onClick={() => toggleSort('bookingRef')}
                  className="py-3 px-3 w-32 border-r border-slate-200 cursor-pointer hover:bg-slate-200/70"
                >
                  <div className="flex items-center gap-1">
                    <span>Booking Ref</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('scheduleDate')}
                  className="py-3 px-3 w-28 border-r border-slate-200 cursor-pointer hover:bg-slate-200/70"
                >
                  <div className="flex items-center gap-1">
                    <span>Service Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 w-24 border-r border-slate-200">Slot</th>
                <th
                  onClick={() => toggleSort('customerName')}
                  className="py-3 px-3 min-w-[160px] border-r border-slate-200 cursor-pointer hover:bg-slate-200/70"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer &amp; Mobile</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[150px] border-r border-slate-200">Service</th>
                <th className="py-3 px-3 min-w-[130px] border-r border-slate-200">Location</th>
                <th className="py-3 px-3 min-w-[170px] border-r border-slate-200">Assigned Staff</th>
                <th
                  onClick={() => toggleSort('amount')}
                  className="py-3 px-3 w-28 text-right border-r border-slate-200 cursor-pointer hover:bg-slate-200/70"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 w-28 text-center border-r border-slate-200">Payment</th>
                <th className="py-3 px-3 w-32 border-r border-slate-200">Status</th>
                <th className="py-3 px-3 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => {
                  const formattedAmount =
                    typeof b.amount === 'number'
                      ? `₹${b.amount.toLocaleString('en-IN')}`
                      : `${b.amount}`;

                  const locationDisplay =
                    b.serviceLocation === 'Other' && b.customLocation
                      ? b.customLocation
                      : b.serviceLocation;

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        b.bookingStatus === 'Cancelled' ? 'opacity-60 bg-slate-50' : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-blue-700">
                        <button
                          onClick={() => onViewBooking(b)}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {b.bookingRef}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap font-medium text-slate-800">
                        {b.scheduleDate}
                      </td>

                      <td className="py-2.5 px-3 border-r border-slate-200 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          Slot {b.slotNumber}
                        </span>
                        <div className="text-[10px] text-slate-500">{b.slotPeriod}</div>
                      </td>

                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{b.customerName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a href={`tel:${b.customerMobile}`} className="hover:text-blue-600">
                            {b.customerMobile}
                          </a>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-800">
                        <div className="font-semibold text-slate-900">{b.serviceType}</div>
                        {b.serviceDescription && (
                          <div
                            className="text-[11px] text-amber-900 bg-amber-50/90 rounded px-1.5 py-0.5 mt-1 border border-amber-200/80 font-medium max-w-[200px] truncate"
                            title={b.serviceDescription}
                          >
                            <span className="font-semibold text-amber-800">Work: </span>
                            {b.serviceDescription}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span>{locationDisplay}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 border-r border-slate-200">
                        {b.assignedStaffNames && b.assignedStaffNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {b.assignedStaffNames.map((n, i) => (
                              <span
                                key={i}
                                className="bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded text-[11px] font-medium"
                              >
                                {n.replace(/^Mr\.\s*/, '')}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-amber-700 italic text-[11px]">None</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right border-r border-slate-200 font-mono font-bold text-slate-900">
                        {formattedAmount}
                      </td>

                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            b.paymentStatus === 'Fully Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.paymentStatus === 'Advance Paid'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusDotColor(
                              b.bookingStatus
                            )}`}
                            title={b.bookingStatus}
                          />
                          <select
                            value={b.bookingStatus}
                            onChange={(e) =>
                              onQuickStatusChange(b.id, e.target.value as BookingStatus)
                            }
                            className={`w-full text-xs font-semibold rounded px-2 py-1 border shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${getStatusBadgeClass(
                              b.bookingStatus
                            )}`}
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

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewBooking(b)}
                            title="View Details"
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onOpenMessageModal && (
                            <button
                              onClick={() => onOpenMessageModal(b)}
                              title="Send / Resend WhatsApp Messages"
                              className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditBooking(b)}
                            title="Edit"
                            className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDuplicateBooking(b)}
                            title="Duplicate"
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteBooking(b.id, b.bookingRef)}
                            title="Delete"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No bookings found matching your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Plus,
  Send,
  ShieldAlert,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { detectStaffConflicts } from '../services/storageService';
import { WEBSITE_MSDFS_SERVICES } from '../data/initialData';
import {
  AppSettings,
  Booking,
  BookingStatus,
  ConflictWarning,
  PaymentStatus,
  SlotDefinition,
  SlotPeriod,
  StaffMember,
} from '../types';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Booking, isDetailsChanged?: boolean) => void;
  bookingToEdit: Booking | null;
  defaultDate: string;
  defaultSlotNumber?: number;
  allBookings?: Booking[];
  allStaff?: StaffMember[];
  allSlots?: SlotDefinition[];
  settings?: AppSettings;
  suggestedRef?: string;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bookingToEdit,
  defaultDate,
  defaultSlotNumber = 1,
  allBookings = [],
  allStaff = [],
  allSlots = [],
  settings,
  suggestedRef = 'MSD-BK-001',
}) => {
  const serviceList = settings?.services && settings.services.length > 0 ? settings.services : [
    '1 Bathroom Cleaning',
    '2 Bathroom Cleaning',
    '3 Bathroom Cleaning',
    'Deep Kitchen Cleaning',
    'Full House Deep Cleaning',
    'Sofa Shampooing',
    'Water Tank Cleaning',
  ];
  const locationList = settings?.locations && settings.locations.length > 0 ? settings.locations : [
    'Puducherry',
    'Lawspet',
    'Moolakulam',
    'Villianur',
    'Ariyankuppam',
    'Gorimedu',
    'Kalapet',
    'White Town',
  ];
  // Form state
  const [bookingRef, setBookingRef] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);

  const [serviceType, setServiceType] = useState('');
  const [customService, setCustomService] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');

  const [serviceLocation, setServiceLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  const [slotNumber, setSlotNumber] = useState<number>(1);
  const [preferredTime, setPreferredTime] = useState('');

  const [staffRequired, setStaffRequired] = useState<number>(1);
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([]);

  const [amount, setAmount] = useState<string | number>('');
  const [isAfterVisitAmount, setIsAfterVisitAmount] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [balanceAmount, setBalanceAmount] = useState<number>(0);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('Confirmed');
  const [notes, setNotes] = useState('');

  // Conflict state
  const [conflicts, setConflicts] = useState<ConflictWarning[]>([]);
  const [slotOccupiedWarning, setSlotOccupiedWarning] = useState<Booking | null>(null);
  const [overrideConflict, setOverrideConflict] = useState(false);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (bookingToEdit) {
      setBookingRef(bookingToEdit.bookingRef);
      setBookingDate(bookingToEdit.bookingDate || new Date().toISOString().split('T')[0]);
      setScheduleDate(bookingToEdit.scheduleDate || defaultDate);
      setCustomerName(bookingToEdit.customerName || '');
      setCustomerMobile(bookingToEdit.customerMobile || '');
      setCustomerWhatsApp(bookingToEdit.customerWhatsApp || bookingToEdit.customerMobile || '');
      setSameAsMobile(bookingToEdit.customerWhatsApp === bookingToEdit.customerMobile);

      // Service
      if (serviceList.includes(bookingToEdit.serviceType)) {
        setServiceType(bookingToEdit.serviceType);
        setCustomService('');
      } else {
        setServiceType('Other');
        setCustomService(bookingToEdit.serviceType);
      }
      setServiceDescription(bookingToEdit.serviceDescription || '');

      // Location
      if (locationList.includes(bookingToEdit.serviceLocation)) {
        setServiceLocation(bookingToEdit.serviceLocation);
        setCustomLocation(bookingToEdit.customLocation || '');
      } else {
        setServiceLocation('Other');
        setCustomLocation(bookingToEdit.serviceLocation);
      }

      setFullAddress(bookingToEdit.fullAddress || '');
      setSlotNumber(bookingToEdit.slotNumber || 1);
      setPreferredTime(bookingToEdit.preferredTime || '');

      setStaffRequired(bookingToEdit.staffRequired || 1);
      setAssignedStaffIds(bookingToEdit.assignedStaffIds || []);

      if (typeof bookingToEdit.amount === 'string' && isNaN(Number(bookingToEdit.amount))) {
        setIsAfterVisitAmount(true);
        setAmount('After Visit');
      } else {
        setIsAfterVisitAmount(false);
        setAmount(bookingToEdit.amount);
      }

      setAdvanceAmount(bookingToEdit.advanceAmount || 0);
      setBalanceAmount(bookingToEdit.balanceAmount || 0);
      setPaymentStatus(bookingToEdit.paymentStatus || 'Pending');
      setBookingStatus(bookingToEdit.bookingStatus || 'Confirmed');
      setNotes(bookingToEdit.notes || '');
    } else {
      // New booking initialization
      const today = new Date().toISOString().split('T')[0];
      setBookingRef(suggestedRef);
      setBookingDate(today);
      setScheduleDate(defaultDate || today);
      setCustomerName('');
      setCustomerMobile('');
      setCustomerWhatsApp('');
      setSameAsMobile(true);
      setServiceType(serviceList[0] || 'Bathroom Cleaning');
      setCustomService('');
      setServiceDescription('');
      setServiceLocation('Puducherry');
      setCustomLocation('');
      setFullAddress('');
      setSlotNumber(defaultSlotNumber || 1);
      setPreferredTime(bookingToEdit ? (bookingToEdit.preferredTime || '') : '');

      setStaffRequired(1);
      setAssignedStaffIds([]);
      setAmount('');
      setIsAfterVisitAmount(false);
      setAdvanceAmount(0);
      setBalanceAmount(0);
      setPaymentStatus('Pending');
      setBookingStatus('Confirmed');
      setNotes('');
    }

    setOverrideConflict(false);
  }, [isOpen, bookingToEdit, defaultDate, defaultSlotNumber, suggestedRef, settings, allSlots]);

  // Handle slotNumber changes
  const handleSlotChange = (newSlotNum: number) => {
    setSlotNumber(newSlotNum);
  };

  // Sync WhatsApp number when sameAsMobile is checked
  useEffect(() => {
    if (sameAsMobile) {
      setCustomerWhatsApp(customerMobile);
    }
  }, [customerMobile, sameAsMobile]);

  // Auto calculate balance amount
  useEffect(() => {
    if (isAfterVisitAmount) {
      setBalanceAmount(0);
      return;
    }
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
    const numAdvance = advanceAmount || 0;
    const bal = Math.max(0, numAmount - numAdvance);
    setBalanceAmount(bal);

    // Auto-update payment status suggestion if appropriate
    if (numAmount > 0) {
      if (numAdvance >= numAmount) {
        setPaymentStatus('Fully Paid');
      } else if (numAdvance > 0) {
        setPaymentStatus('Advance Paid');
      }
    }
  }, [amount, advanceAmount, isAfterVisitAmount]);

  // Real-time Conflict Detection Check
  useEffect(() => {
    if (!scheduleDate || !slotNumber) return;

    // Check staff conflicts
    const foundConflicts = detectStaffConflicts(
      {
        scheduleDate,
        slotNumber,
        assignedStaffIds,
      },
      allBookings,
      allStaff,
      bookingToEdit?.id
    );
    setConflicts(foundConflicts);

    // Check if slot already has another active booking
    const slotExisting = allBookings.find(
      (b) =>
        b.id !== bookingToEdit?.id &&
        b.scheduleDate === scheduleDate &&
        b.slotNumber === slotNumber &&
        b.bookingStatus !== 'Cancelled'
    );
    setSlotOccupiedWarning(slotExisting || null);
  }, [scheduleDate, slotNumber, assignedStaffIds, allBookings, allStaff, bookingToEdit]);

  // Multi-staff toggle handlers
  const toggleStaff = (staffId: string) => {
    setAssignedStaffIds((prev) => {
      const exists = prev.includes(staffId);
      const next = exists ? prev.filter((id) => id !== staffId) : [...prev, staffId];
      setStaffRequired(Math.max(1, next.length));
      return next;
    });
  };

  const removeStaffChip = (staffId: string) => {
    setAssignedStaffIds((prev) => {
      const next = prev.filter((id) => id !== staffId);
      setStaffRequired(Math.max(1, next.length));
      return next;
    });
  };

  const selectAllStaff = () => {
    const activeStaffIds = allStaff.filter((s) => s.status === 'active').map((s) => s.id);
    setAssignedStaffIds(activeStaffIds);
    setStaffRequired(activeStaffIds.length);
  };

  const clearStaff = () => {
    setAssignedStaffIds([]);
    setStaffRequired(1);
  };

  if (!isOpen) return null;

  const currentSlotDef = allSlots.find((s) => s.slotNumber === slotNumber);
  const slotPeriod: SlotPeriod = currentSlotDef ? currentSlotDef.period : 'Morning';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verification of required fields
    if (!customerName.trim()) {
      alert('Please enter Customer Name');
      return;
    }
    if (!customerMobile.trim()) {
      alert('Please enter Customer Mobile Number');
      return;
    }

    // If conflict detected and not overridden, alert user
    if ((conflicts.length > 0 || slotOccupiedWarning) && !overrideConflict) {
      const confirmOverride = window.confirm(
        'Staff or Slot conflict detected! Are you sure you want to proceed and save this booking?'
      );
      if (!confirmOverride) return;
    }

    const assignedNames = assignedStaffIds
      .map((id) => allStaff.find((s) => s.id === id)?.name || '')
      .filter(Boolean);

    const finalService = serviceType === 'Other' && customService ? customService : serviceType;

    const finalAmount = isAfterVisitAmount
      ? 'After Visit'
      : typeof amount === 'number'
      ? amount
      : parseFloat(String(amount)) || 0;

    const isDetailsChanged = Boolean(
      bookingToEdit && (
        bookingToEdit.scheduleDate !== scheduleDate ||
        bookingToEdit.slotNumber !== slotNumber ||
        bookingToEdit.slotPeriod !== slotPeriod ||
        bookingToEdit.serviceType !== finalService ||
        (bookingToEdit.serviceDescription || '') !== serviceDescription.trim() ||
        bookingToEdit.serviceLocation !== serviceLocation ||
        (bookingToEdit.fullAddress || '') !== fullAddress.trim() ||
        String(bookingToEdit.amount) !== String(finalAmount) ||
        JSON.stringify(bookingToEdit.assignedStaffIds || []) !== JSON.stringify(assignedStaffIds || [])
      )
    );

    const savedBooking: Booking = {
      id: bookingToEdit ? bookingToEdit.id : `b-${Date.now()}`,
      bookingRef: bookingRef.trim() || suggestedRef,
      bookingDate: bookingDate || new Date().toISOString().split('T')[0],
      scheduleDate,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      customerWhatsApp: customerWhatsApp.trim() || customerMobile.trim(),
      serviceType: finalService,
      serviceDescription: serviceDescription.trim() || undefined,
      serviceLocation,
      customLocation: serviceLocation === 'Other' ? customLocation.trim() : undefined,
      fullAddress: fullAddress.trim(),
      slotNumber,
      slotPeriod,
      preferredTime: preferredTime.trim() || undefined,
      staffRequired: Math.max(1, assignedStaffIds.length || staffRequired),
      assignedStaffIds,
      assignedStaffNames: assignedNames,
      amount: finalAmount,
      advanceAmount: isAfterVisitAmount ? 0 : Number(advanceAmount) || 0,
      balanceAmount: isAfterVisitAmount ? 0 : Number(balanceAmount) || 0,
      paymentStatus,
      bookingStatus,
      notes: notes.trim(),
      createdAt: bookingToEdit ? bookingToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Preserve prior delivery statuses
      customerMessageStatus: isDetailsChanged ? 'Ready' : bookingToEdit?.customerMessageStatus,
      customerMessageOpenedAt: bookingToEdit?.customerMessageOpenedAt,
      customerMessageSentAt: bookingToEdit?.customerMessageSentAt,
      staffMessageStatuses: isDetailsChanged ? undefined : bookingToEdit?.staffMessageStatuses,
      staffMessageSentAt: bookingToEdit?.staffMessageSentAt,
      rawSheetExtra: bookingToEdit?.rawSheetExtra,
    };

    onSave(savedBooking, isDetailsChanged);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-xs">
              MSD
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {bookingToEdit ? 'Edit Booking' : 'New Booking Entry'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Central MSD Database &bull; Reference: {bookingRef}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Conflict Alert Banner */}
          {conflicts.length > 0 && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 space-y-2">
              <div className="flex items-start gap-2 text-rose-800 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span>⚠️ Staff Conflict Detected!</span>
                  <div className="text-[11px] font-normal text-rose-700 mt-0.5">
                    The following staff member is already assigned to another booking during{' '}
                    <span className="font-semibold">
                      Slot {slotNumber} on {scheduleDate}
                    </span>
                    :
                  </div>
                </div>
              </div>
              <ul className="list-disc list-inside text-rose-800 text-[11px] font-medium space-y-0.5 pl-2">
                {conflicts.map((c, i) => (
                  <li key={i}>
                    <span className="font-bold">{c.staffName}</span> is already on booking{' '}
                    <span className="underline font-mono">{c.conflictingBookingRef}</span> (
                    {c.customerName})
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-1 border-t border-rose-200">
                <label className="flex items-center gap-1.5 cursor-pointer text-rose-900 font-semibold text-[11px]">
                  <input
                    type="checkbox"
                    checked={overrideConflict}
                    onChange={(e) => setOverrideConflict(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Allow assignment anyway (Manager Override)</span>
                </label>
              </div>
            </div>
          )}

          {/* Slot Occupied Notification */}
          {slotOccupiedWarning && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Slot {slotNumber} is already booked by{' '}
                  <span className="font-bold">{slotOccupiedWarning.customerName}</span> (
                  {slotOccupiedWarning.bookingRef}). You can still proceed if this is a team job.
                </span>
              </div>
            </div>
          )}

          {/* Row 1: Booking Ref & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Booking Reference No.
              </label>
              <input
                type="text"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Booking Entry Date
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Schedule Service Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                required
                className="w-full bg-blue-50/50 border border-blue-300 font-semibold rounded-lg px-2.5 py-1.5 text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Customer Details */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Shahab Uddin"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9042233122"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-600">WhatsApp Number</label>
                  <label className="flex items-center gap-1 text-[10px] text-blue-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsMobile}
                      onChange={(e) => setSameAsMobile(e.target.checked)}
                      className="rounded"
                    />
                    <span>Same as Mobile</span>
                  </label>
                </div>
                <input
                  type="tel"
                  disabled={sameAsMobile}
                  placeholder="WhatsApp Number"
                  value={customerWhatsApp}
                  onChange={(e) => setCustomerWhatsApp(e.target.value)}
                  className="w-full bg-white disabled:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Field: Service Type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Service Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <optgroup label="Website Services (msdfs.in)">
                {serviceList
                  .filter((srv) => WEBSITE_MSDFS_SERVICES.includes(srv))
                  .map((srv, idx) => (
                    <option key={`web-${idx}`} value={srv}>
                      {srv}
                    </option>
                  ))}
              </optgroup>
              {serviceList.filter((srv) => !WEBSITE_MSDFS_SERVICES.includes(srv)).length > 0 && (
                <optgroup label="Other Available Services">
                  {serviceList
                    .filter((srv) => !WEBSITE_MSDFS_SERVICES.includes(srv))
                    .map((srv, idx) => (
                      <option key={`other-${idx}`} value={srv}>
                        {srv}
                      </option>
                    ))}
                </optgroup>
              )}
              <option value="Other">Other (Type custom service)</option>
            </select>
            {serviceType === 'Other' && (
              <input
                type="text"
                placeholder="Type custom service name..."
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Field: Work Description (Immediately after Service Type) */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Work Description (Scope of Work / Task Details)</span>
              </label>
              <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-full">
                Included in WhatsApp & Staff Alert
              </span>
            </div>
            <textarea
              rows={2}
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              placeholder="Specify detailed tasks (e.g. Deep clean 2 bathrooms with acid wash, clean 4 ceiling fans, scrub balcony tiles, kitchen chimney & sink...)"
              className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-amber-800/90 pt-0.5">
              <span>Detailed work descriptions provide clear instructions to the cleaning crew and customer.</span>
              {serviceDescription.length > 0 && (
                <span className="font-mono text-[10px] text-amber-700 bg-white/80 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                  {serviceDescription.length} chars
                </span>
              )}
            </div>
          </div>

          {/* Field: Service Location */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Service Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={serviceLocation}
              onChange={(e) => setServiceLocation(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {locationList.map((loc, idx) => (
                <option key={idx} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            {serviceLocation === 'Other' && (
              <input
                type="text"
                placeholder="Enter location / town name..."
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Field: Full Address / Landmarks */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Full Address / Landmarks
            </label>
            <input
              type="text"
              placeholder="Door No, Street Name, Landmark, Pin code"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Row 4: Slot Selection (1 to 10) */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Daily Slot (1 to 10)</span>
              </span>
              <span className="text-[11px] font-semibold text-blue-700">
                Selected: Slot {slotNumber} ({slotPeriod})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {allSlots.map((slot) => {
                const isSelected = slotNumber === slot.slotNumber;
                return (
                  <button
                    type="button"
                    key={slot.id}
                    onClick={() => handleSlotChange(slot.slotNumber)}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-2xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                    }`}
                  >
                    <div className="text-xs font-semibold">Slot {slot.slotNumber}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {slot.period}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                Preferred Time / Timing Notes (Optional)
              </label>
              <input
                type="text"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="e.g. Morning / Afternoon or specific timing if needed"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
              />
            </div>
          </div>

          {/* Row 5: Staff Assignment UI (Section 7 & 8) */}
          <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Users className="w-4 h-4 text-blue-600" />
                <span>
                  Staff Assignment ({assignedStaffIds.length} of {allStaff.length} Selected)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAllStaff}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 hover:bg-blue-200 text-blue-800 transition-colors cursor-pointer"
                >
                  Select Entire Team (All 6)
                </button>
                <button
                  type="button"
                  onClick={clearStaff}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Selected Staff Removable Chips [ Saidul x ] [ Farhad x ] */}
            {assignedStaffIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-blue-200 min-h-[36px] items-center">
                {assignedStaffIds.map((id) => {
                  const staff = allStaff.find((s) => s.id === id);
                  const isConflicted = conflicts.some((c) => c.staffId === id);
                  return (
                    <span
                      key={id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold shadow-2xs border ${
                        isConflicted
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-blue-600 text-white border-blue-700'
                      }`}
                    >
                      <span>{staff ? staff.name.replace(/^Mr\.\s*/, '') : id}</span>
                      <button
                        type="button"
                        onClick={() => removeStaffChip(id)}
                        className="hover:bg-black/20 rounded-full p-0.5 ml-0.5 transition-colors cursor-pointer"
                        title="Remove staff"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="p-2 bg-white rounded-lg border border-dashed border-slate-300 text-center text-slate-400 text-xs italic">
                No staff selected yet. Choose from the staff checklist below:
              </div>
            )}

            {/* Staff Checkbox Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allStaff.map((staff) => {
                const isSelected = assignedStaffIds.includes(staff.id);
                const hasConflict = conflicts.some((c) => c.staffId === staff.id);

                return (
                  <label
                    key={staff.id}
                    className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? hasConflict
                          ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                          : 'bg-blue-50 border-blue-300 text-blue-950 font-semibold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStaff(staff.id)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{staff.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {staff.mobile || 'No mobile'}
                      </div>
                      {hasConflict && (
                        <div className="text-[9px] text-rose-600 font-bold">⚠️ Overlap</div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Row 6: Pricing, Advance & Balance (Section 12) */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Payment &amp; Billing Calculation</span>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 font-normal cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAfterVisitAmount}
                  onChange={(e) => {
                    setIsAfterVisitAmount(e.target.checked);
                    if (e.target.checked) setAmount('After Visit');
                    else setAmount('');
                  }}
                  className="rounded text-blue-600"
                />
                <span>"After Visit" / Estimate on inspection</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Total Amount (₹)
                </label>
                <input
                  type={isAfterVisitAmount ? 'text' : 'number'}
                  disabled={isAfterVisitAmount}
                  placeholder="e.g. 2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white disabled:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Advance Paid (₹)
                </label>
                <input
                  type="number"
                  disabled={isAfterVisitAmount}
                  placeholder="0"
                  value={advanceAmount || ''}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full bg-white disabled:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Balance Due (₹)
                </label>
                <input
                  type="number"
                  disabled
                  value={balanceAmount}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-amber-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
                >
                  <option value="Pending">Pending</option>
                  <option value="Advance Paid">Advance Paid</option>
                  <option value="Fully Paid">Fully Paid</option>
                  <option value="Not Paid">Not Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 7: Booking Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Booking Status
              </label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value as BookingStatus)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-blue-900"
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

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Special Instructions / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Bring extra water tank equipment, key with security"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
            id="btn-save-booking"
          >
            <Send className="w-4 h-4" />
            <span>{bookingToEdit ? 'Save Booking & Check Messages' : 'Save Booking & Send Messages'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import {
  INITIAL_BOOKINGS,
  INITIAL_SETTINGS,
  INITIAL_SLOTS,
  INITIAL_STAFF,
  WEBSITE_MSDFS_SERVICES,
} from '../data/initialData';
import {
  AppSettings,
  Booking,
  ConflictWarning,
  SlotDefinition,
  StaffMember,
} from '../types';

const STORAGE_KEYS = {
  BOOKINGS: 'msd_bookings_v3',
  STAFF: 'msd_staff_v2',
  SLOTS: 'msd_slots_v3',
  SETTINGS: 'msd_settings_v3',
};

// Clear all bookings for fresh start
export function clearAllBookings(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
    localStorage.removeItem('msd_bookings_v2');
    localStorage.removeItem('msd_bookings');
  } catch (e) {
    console.error('Failed to clear bookings', e);
  }
}

// Storage retrieval and persistence
export function getStoredBookings(): Booking[] {
  try {
    // If old v2 exists, purge it to respect the user's fresh start request
    if (localStorage.getItem('msd_bookings_v2')) {
      localStorage.removeItem('msd_bookings_v2');
    }
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load bookings from storage', e);
    return [];
  }
}

export function saveStoredBookings(bookings: Booking[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    console.error('Failed to save bookings', e);
  }
}

export function getStoredStaff(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load staff from storage', e);
    return INITIAL_STAFF;
  }
}

export function saveStoredStaff(staff: StaffMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  } catch (e) {
    console.error('Failed to save staff', e);
  }
}

export function getStoredSlots(): SlotDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLOTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(INITIAL_SLOTS));
      return INITIAL_SLOTS;
    }
    const parsed: SlotDefinition[] = JSON.parse(raw);
    return parsed.map((s) => ({ ...s, startTime: '', endTime: '' }));
  } catch (e) {
    console.error('Failed to load slots from storage', e);
    return INITIAL_SLOTS;
  }
}

export function saveStoredSlots(slots: SlotDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  } catch (e) {
    console.error('Failed to save slots', e);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    let raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    // If v3 does not exist yet, check if v2 exists
    if (!raw) {
      const oldV2 = localStorage.getItem('msd_settings_v2');
      if (oldV2) {
        raw = oldV2;
      }
    }

    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }

    const parsed: AppSettings = JSON.parse(raw);
    let updated = false;

    // Filter out all multi/numbered bathroom cleaning variations like "1 Bathroom Cleaning", "2 Bathrooms cleaning", etc.
    const isUnwantedBathroomVariant = (s: string) => {
      const lower = s.trim().toLowerCase();
      return lower.includes('bathroom') && lower !== 'bathroom cleaning';
    };

    let currentServices = Array.isArray(parsed.services)
      ? parsed.services.filter((srv) => {
          if (isUnwantedBathroomVariant(srv)) {
            updated = true;
            return false;
          }
          return true;
        })
      : [];

    // Ensure 'Bathroom Cleaning' is always present
    if (!currentServices.includes('Bathroom Cleaning')) {
      currentServices.push('Bathroom Cleaning');
      updated = true;
    }

    // Ensure all services from WEBSITE_MSDFS_SERVICES are available in catalog
    for (const srv of WEBSITE_MSDFS_SERVICES) {
      if (!currentServices.includes(srv)) {
        currentServices.push(srv);
        updated = true;
      }
    }

    // Ensure WhatsApp templates are refreshed to the clean location format without redundant full address in customer message
    if (
      !parsed.whatsappTemplates ||
      !parsed.whatsappTemplates.customerTemplate ||
      parsed.whatsappTemplates.customerTemplate.includes('Full Address / Landmarks:') ||
      parsed.whatsappTemplates.customerTemplate.includes('🏠 Full Address')
    ) {
      parsed.whatsappTemplates = INITIAL_SETTINGS.whatsappTemplates;
      updated = true;
    }

    if (updated) {
      parsed.services = currentServices;
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
    }

    return parsed;
  } catch (e) {
    console.error('Failed to load settings from storage', e);
    return INITIAL_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

// Convenient alias exports
export const loadBookings = getStoredBookings;
export const saveBookings = saveStoredBookings;
export const loadStaff = getStoredStaff;
export const saveStaff = saveStoredStaff;
export const loadSlots = getStoredSlots;
export const saveSlots = saveStoredSlots;
export const loadSettings = getStoredSettings;
export const saveSettings = saveStoredSettings;

export function loadCompanyInfo() {
  return getStoredSettings().company;
}

export function saveCompanyInfo(company: AppSettings['company']) {
  const s = getStoredSettings();
  saveStoredSettings({ ...s, company });
}

// Generate unique booking reference in requested format: MSD/PDY/YYYY/XXXX or MSD/PDY/1032
export function generateNextBookingRef(existingBookings: Booking[], settings?: AppSettings): string {
  const currentSettings = settings || getStoredSettings();
  // Find highest numeric ref in existing bookings
  let maxNum = currentSettings.nextRefNumber || 1032;
  existingBookings.forEach((b) => {
    const match = b.bookingRef?.match(/\d+$/);
    if (match) {
      const n = parseInt(match[0], 10);
      if (n >= maxNum) {
        maxNum = n + 1;
      }
    }
  });

  const year = new Date().getFullYear();
  // Standard compact format widely used in MSD sheet: MSD/PDY/1032 or MSD/PDY/2026/0032
  return `MSD/PDY/${year}/${String(maxNum).padStart(4, '0')}`;
}


// Conflict detection: checks whether any selected staff member is already assigned on same date & slot
export function detectStaffConflicts(
  booking: Partial<Booking>,
  allBookings: Booking[],
  staffList: StaffMember[],
  excludeBookingId?: string
): ConflictWarning[] {
  if (!booking.scheduleDate || !booking.slotNumber || !booking.assignedStaffIds?.length) {
    return [];
  }

  const conflicts: ConflictWarning[] = [];

  const otherBookings = allBookings.filter(
    (b) =>
      b.id !== excludeBookingId &&
      b.scheduleDate === booking.scheduleDate &&
      b.slotNumber === booking.slotNumber &&
      b.bookingStatus !== 'Cancelled'
  );

  for (const staffId of booking.assignedStaffIds) {
    const conflictingBooking = otherBookings.find((b) =>
      b.assignedStaffIds?.includes(staffId)
    );

    if (conflictingBooking) {
      const staffMember = staffList.find((s) => s.id === staffId);
      const staffName = staffMember ? staffMember.name : staffId;
      conflicts.push({
        staffId,
        staffName,
        conflictingBookingRef: conflictingBooking.bookingRef,
        customerName: conflictingBooking.customerName,
        timeSlot: `Slot ${booking.slotNumber} (${conflictingBooking.slotPeriod})`,
      });
    }
  }

  return conflicts;
}

// Format helper for monetary amount
export function formatBookingAmount(amount: number | string | undefined): { isAfterVisit: boolean; display: string } {
  if (
    amount === undefined ||
    amount === null ||
    amount === '' ||
    String(amount).trim() === '' ||
    String(amount).toLowerCase().includes('after visit') ||
    amount === 0 ||
    amount === '0'
  ) {
    return { isAfterVisit: true, display: 'After Visit' };
  }

  const cleanNum = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^\d.]/g, ''));
  if (isNaN(cleanNum) || cleanNum === 0) {
    return { isAfterVisit: true, display: 'After Visit' };
  }

  return { isAfterVisit: false, display: `₹${cleanNum.toLocaleString('en-IN')}` };
}

// Clean phone number for WhatsApp deep link
export function cleanWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 10) {
    digits = '91' + digits;
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = '91' + digits.slice(1);
  }
  return digits;
}

// WhatsApp Message Formatters with UTF-8 Emojis Preservation
export function buildCustomerWhatsAppMessage(
  booking: Booking,
  allStaff: StaffMember[],
  companyInfo?: { name: string; mobile: string; email: string; website: string }
): string {
  const company = companyInfo || {
    name: 'MSD Facility Services',
    mobile: '9042233122',
    email: 'msdfacilityservices@gmail.com',
    website: 'https://msdfs.in/',
  };

  const customerName = booking.customerName?.trim() || 'Valued Customer';
  const service = booking.serviceType?.trim() || 'General Cleaning';

  // 1. Service Location (Full Address / Landmarks hidden from customer message line)
  const location =
    booking.serviceLocation === 'Other' && booking.customLocation
      ? booking.customLocation.trim()
      : booking.serviceLocation?.trim() || 'Puducherry';

  // Slot display: "2026-09-15 | Morning Slot"
  const timeSlot = booking.slotPeriod
    ? `${booking.slotPeriod} Slot`
    : booking.preferredTime || `Slot ${booking.slotNumber}`;

  // 2. Staff section logic:
  // If 1 staff: show first staff name and mobile.
  // If > 1 staff: show first staff name & phone, plus team list (only names).
  const assignedStaffNames = booking.assignedStaffNames || [];
  const assignedStaffIds = booking.assignedStaffIds || [];

  const firstStaffName = assignedStaffNames[0] || '';
  const firstStaffId = assignedStaffIds[0];

  let primaryStaffPhone = '';
  if (firstStaffId) {
    const found = allStaff.find((s) => s.id === firstStaffId);
    if (found?.mobile && found.mobile.trim()) {
      primaryStaffPhone = found.mobile.trim();
    }
  }
  if (!primaryStaffPhone && firstStaffName) {
    const found = allStaff.find((s) => s.name.toLowerCase() === firstStaffName.toLowerCase());
    if (found?.mobile && found.mobile.trim()) {
      primaryStaffPhone = found.mobile.trim();
    }
  }
  const staffPhoneDisplay = primaryStaffPhone || `${company.mobile} (Office)`;

  let staffLines: string[] = [];
  if (assignedStaffNames.length === 0) {
    staffLines = [
      `👷 Assigned Staff: Team Assigned`,
      `📞 Staff Phone: ${company.mobile} (Office)`,
    ];
  } else if (assignedStaffNames.length === 1) {
    staffLines = [
      `👷 Assigned Staff: ${firstStaffName}`,
      `📞 Staff Phone: ${staffPhoneDisplay}`,
    ];
  } else {
    // More than 1 staff selected: First staff name & phone, and only staff names for the team
    const teamMembersList = assignedStaffNames.join(', ');
    staffLines = [
      `👷 Assigned Staff: ${firstStaffName}`,
      `📞 Staff Phone: ${staffPhoneDisplay}`,
      `👥 Team: ${teamMembersList}`,
    ];
  }

  // 3. Payment & Billing Calculation:
  // When amount is not fixed ("After Visit"), show simply "Amount: After Visit"
  const { isAfterVisit } = formatBookingAmount(booking.amount);
  let paymentLines: string[] = [];

  if (isAfterVisit) {
    paymentLines = [
      `💰 Amount: After Visit`,
    ];
  } else {
    const totalNum = typeof booking.amount === 'number' ? booking.amount : parseFloat(String(booking.amount)) || 0;
    const advNum = Number(booking.advanceAmount) || 0;
    const balNum = booking.balanceAmount !== undefined && booking.balanceAmount !== null
      ? Number(booking.balanceAmount)
      : Math.max(0, totalNum - advNum);

    const balanceText = balNum === 0 && advNum >= totalNum && totalNum > 0
      ? '₹0 (Fully Paid)'
      : `₹${balNum.toLocaleString('en-IN')}`;

    paymentLines = [
      `💰 Total Amount (₹): ₹${totalNum.toLocaleString('en-IN')}`,
      `💵 Advance Paid (₹): ₹${advNum.toLocaleString('en-IN')}`,
      `💳 Balance Due (₹): ${balanceText}`,
    ];
  }

  return [
    `Hello ${customerName},`,
    '',
    `Your booking with MSD Facility Services has been confirmed successfully.`,
    '',
    `📋 Ref No: ${booking.bookingRef}`,
    `🧹 Service: ${service}`,
    ...(booking.serviceDescription ? [`📝 Work Details: ${booking.serviceDescription}`] : []),
    `📅 Date & Time: ${booking.scheduleDate} | ${timeSlot}`,
    `📍 Service Location: ${location}`,
    ...staffLines,
    ...paymentLines,
    '',
    `Thank you for choosing MSD Facility Services!`,
    '',
    `---`,
    '',
    `${company.name}`,
    `📞 ${company.mobile}`,
    `📧 ${company.email}`,
    `🌐 ${company.website.startsWith('http') ? company.website : 'https://' + company.website}`,
  ].join('\n');
}

export function buildStaffWhatsAppMessage(
  booking: Booking,
  staffMember: StaffMember,
  companyInfo?: { name: string; mobile: string; email: string; website: string }
): string {
  const company = companyInfo || {
    name: 'MSD Facility Services',
    mobile: '9042233122',
    email: 'msdfacilityservices@gmail.com',
    website: 'https://msdfs.in/',
  };

  const customerName = booking.customerName?.trim() || 'Customer';
  const customerMobile = booking.customerMobile?.trim() || 'N/A';
  const service = booking.serviceType?.trim() || 'Cleaning Service';

  const location =
    booking.serviceLocation === 'Other' && booking.customLocation
      ? booking.customLocation.trim()
      : booking.serviceLocation?.trim() || 'Puducherry';
  const fullAddress = booking.fullAddress?.trim();

  // Slot display: "2026-09-13 | Evening Slot"
  const timeSlot = booking.slotPeriod
    ? `${booking.slotPeriod} Slot`
    : booking.preferredTime || `Slot ${booking.slotNumber}`;

  // Payment & Billing for staff
  const { isAfterVisit } = formatBookingAmount(booking.amount);
  let paymentLines: string[] = [];

  if (isAfterVisit) {
    paymentLines = [
      `💰 Amount: After Visit`,
    ];
  } else {
    const totalNum = typeof booking.amount === 'number' ? booking.amount : parseFloat(String(booking.amount)) || 0;
    const advNum = Number(booking.advanceAmount) || 0;
    const balNum = booking.balanceAmount !== undefined && booking.balanceAmount !== null
      ? Number(booking.balanceAmount)
      : Math.max(0, totalNum - advNum);

    paymentLines = [
      `💰 Total Amount (₹): ₹${totalNum.toLocaleString('en-IN')}`,
      `💵 Advance Paid (₹): ₹${advNum.toLocaleString('en-IN')}`,
      `💳 Balance to Collect (₹): ${balNum === 0 ? '₹0 (Already Paid)' : `₹${balNum.toLocaleString('en-IN')}`}`,
    ];
  }

  // If multiple staff members are assigned, show team names
  const assignedStaffNames = booking.assignedStaffNames || [];
  const teamSection = assignedStaffNames.length > 1
    ? [`👥 Team: ${assignedStaffNames.join(', ')}`]
    : [];

  return [
    `New Job Assignment (MSD Facility Services):`,
    '',
    `📋 Ref No: ${booking.bookingRef}`,
    `👤 Customer: ${customerName}`,
    `📞 Phone: ${customerMobile}`,
    `📍 Service Location: ${location}`,
    ...(fullAddress ? [`🏠 Full Address: ${fullAddress}`] : []),
    `🧹 Service: ${service}`,
    ...(booking.serviceDescription ? [`📝 Work Details: ${booking.serviceDescription}`] : []),
    `📅 Date & Time: ${booking.scheduleDate} | ${timeSlot}`,
    ...teamSection,
    ...paymentLines,
    '',
    `Please reach on time!`,
    '',
    `---`,
    '',
    `${company.name}`,
    `📞 ${company.mobile}`,
    `📧 ${company.email}`,
    `🌐 ${company.website.startsWith('http') ? company.website : 'https://' + company.website}`,
  ].join('\n');
}

export function formatCustomerWhatsAppMessage(
  booking: Booking,
  template?: string,
  allStaff?: StaffMember[],
  companyInfo?: { name: string; mobile: string; email: string; website: string }
): string {
  if (!template || (allStaff && allStaff.length > 0)) {
    return buildCustomerWhatsAppMessage(booking, allStaff || [], companyInfo);
  }

  const assignedStaffNames = booking.assignedStaffNames || [];
  const firstStaffName = assignedStaffNames[0] || 'Team Assigned';
  const teamNames = assignedStaffNames.join(', ') || firstStaffName;

  const { isAfterVisit } = formatBookingAmount(booking.amount);
  const totalNum = typeof booking.amount === 'number' ? booking.amount : parseFloat(String(booking.amount)) || 0;
  const advNum = Number(booking.advanceAmount) || 0;
  const balNum = booking.balanceAmount !== undefined && booking.balanceAmount !== null
    ? Number(booking.balanceAmount)
    : Math.max(0, totalNum - advNum);

  const totalDisplay = isAfterVisit ? 'After Visit' : `₹${totalNum.toLocaleString('en-IN')}`;
  const advanceDisplay = advNum > 0 ? `₹${advNum.toLocaleString('en-IN')}` : '₹0';
  const balanceDisplay = isAfterVisit
    ? 'After Visit'
    : balNum === 0 && advNum >= totalNum && totalNum > 0
    ? '₹0 (Fully Paid)'
    : `₹${balNum.toLocaleString('en-IN')}`;

  const service = booking.serviceType || '';
  const workDetails = booking.serviceDescription || '';
  const location =
    booking.serviceLocation === 'Other' && booking.customLocation
      ? booking.customLocation.trim()
      : booking.serviceLocation?.trim() || 'Puducherry';
  const address = booking.fullAddress?.trim() || location;
  const timeSlot = booking.slotPeriod ? `${booking.slotPeriod} Slot` : booking.preferredTime || `Slot ${booking.slotNumber}`;

  return template
    .replace(/,\s*Full Address \/ Landmarks:\s*\[Full Address\]/gi, '')
    .replace(/,\s*Full Address:\s*\[Full Address\]/gi, '')
    .replace(/\[Customer Name\]/gi, booking.customerName || 'Customer')
    .replace(/\{CUSTOMER_NAME\}/g, booking.customerName || 'Customer')
    .replace(/\[Booking Reference\]/gi, booking.bookingRef)
    .replace(/\{REF\}/g, booking.bookingRef)
    .replace(/\[Booking Date\]/gi, booking.bookingDate || '')
    .replace(/\[Schedule Date\]/gi, booking.scheduleDate || '')
    .replace(/\{DATE\}/g, booking.scheduleDate || '')
    .replace(/\[Time Slot\]/gi, timeSlot)
    .replace(/\[Time\]/gi, timeSlot)
    .replace(/\{TIME\}/g, timeSlot)
    .replace(/\[Service Name\]/gi, service)
    .replace(/\[Service\]/gi, service)
    .replace(/\{SERVICE\}/g, service)
    .replace(/\[Work Description\]/gi, workDetails)
    .replace(/\[Work Details\]/gi, workDetails)
    .replace(/\{WORK_DETAILS\}/g, workDetails)
    .replace(/\[Service Location\]/gi, location)
    .replace(/\[Location\]/gi, location)
    .replace(/\{LOCATION\}/g, location)
    .replace(/\[Full Address \/ Landmarks\]/gi, address)
    .replace(/\[Full Address\]/gi, address)
    .replace(/\[Address\]/gi, address)
    .replace(/\{ADDRESS\}/g, address)
    .replace(/\[Staff Name\]/gi, firstStaffName)
    .replace(/\[Staff Names\]/gi, teamNames)
    .replace(/\[Staff Phone\]/gi, companyInfo?.mobile || '9042233122')
    .replace(/\[Primary Staff Mobile Number\]/gi, companyInfo?.mobile || '9042233122')
    .replace(/\{STAFF_NAME\}/g, firstStaffName)
    .replace(/\{STAFF_PHONE\}/g, companyInfo?.mobile || '9042233122')
    .replace(/\[Team Members\]/gi, teamNames)
    .replace(/\[Team\]/gi, teamNames)
    .replace(/\{TEAM\}/g, teamNames)
    .replace(/\[Total Amount\]/gi, totalDisplay)
    .replace(/\{TOTAL_AMOUNT\}/g, totalDisplay)
    .replace(/\[Advance Paid\]/gi, advanceDisplay)
    .replace(/\{ADVANCE_PAID\}/g, advanceDisplay)
    .replace(/\[Balance Due\]/gi, balanceDisplay)
    .replace(/\{BALANCE_DUE\}/g, balanceDisplay)
    .replace(/₹?\[Amount\]/gi, totalDisplay)
    .replace(/\{AMOUNT\}/g, totalDisplay);
}

export function formatStaffWhatsAppMessage(
  booking: Booking,
  staffMember: StaffMember,
  template?: string,
  companyInfo?: { name: string; mobile: string; email: string; website: string }
): string {
  if (!template) {
    return buildStaffWhatsAppMessage(booking, staffMember, companyInfo);
  }

  const location =
    booking.serviceLocation === 'Other' && booking.customLocation
      ? booking.customLocation.trim()
      : booking.serviceLocation?.trim() || 'Puducherry';
  const address = booking.fullAddress?.trim() || location;

  const { isAfterVisit } = formatBookingAmount(booking.amount);
  const totalNum = typeof booking.amount === 'number' ? booking.amount : parseFloat(String(booking.amount)) || 0;
  const advNum = Number(booking.advanceAmount) || 0;
  const balNum = booking.balanceAmount !== undefined && booking.balanceAmount !== null
    ? Number(booking.balanceAmount)
    : Math.max(0, totalNum - advNum);

  const totalDisplay = isAfterVisit ? 'After Visit' : `₹${totalNum.toLocaleString('en-IN')}`;
  const advanceDisplay = advNum > 0 ? `₹${advNum.toLocaleString('en-IN')}` : '₹0';
  const balanceDisplay = isAfterVisit
    ? 'After Visit'
    : balNum === 0 && advNum >= totalNum && totalNum > 0
    ? '₹0 (Fully Paid)'
    : `₹${balNum.toLocaleString('en-IN')}`;

  const service = booking.serviceType || '';
  const workDetails = booking.serviceDescription || '';
  const timeSlot = booking.slotPeriod ? `${booking.slotPeriod} Slot` : booking.preferredTime || `Slot ${booking.slotNumber}`;
  const teamNames = booking.assignedStaffNames?.join(', ') || staffMember.name;

  return template
    .replace(/\[Staff Name\]/gi, staffMember.name.replace(/^Mr\.\s*/, ''))
    .replace(/\{STAFF_NAME\}/g, staffMember.name.replace(/^Mr\.\s*/, ''))
    .replace(/\[Booking Reference\]/gi, booking.bookingRef)
    .replace(/\{REF\}/g, booking.bookingRef)
    .replace(/\[Customer Name\]/gi, booking.customerName || '')
    .replace(/\{CUSTOMER_NAME\}/g, booking.customerName || '')
    .replace(/\[Customer Mobile\]/gi, booking.customerMobile || '')
    .replace(/\{CUSTOMER_MOBILE\}/g, booking.customerMobile || '')
    .replace(/\[Service\]/gi, service)
    .replace(/\[Service Name\]/gi, service)
    .replace(/\{SERVICE\}/g, service)
    .replace(/\[Work Details\]/gi, workDetails)
    .replace(/\[Work Description\]/gi, workDetails)
    .replace(/\{WORK_DETAILS\}/g, workDetails)
    .replace(/\[Schedule Date\]/gi, booking.scheduleDate || '')
    .replace(/\{DATE\}/g, booking.scheduleDate || '')
    .replace(/\[Time Slot\]/gi, timeSlot)
    .replace(/\[Time\]/gi, timeSlot)
    .replace(/\{TIME\}/g, timeSlot)
    .replace(/\[Service Location\]/gi, location)
    .replace(/\[Location\]/gi, location)
    .replace(/\{LOCATION\}/g, location)
    .replace(/\[Full Address \/ Landmarks\]/gi, address)
    .replace(/\[Full Address\]/gi, address)
    .replace(/\[Address\]/gi, address)
    .replace(/\{ADDRESS\}/g, address)
    .replace(/\[Team Members\]/gi, teamNames)
    .replace(/\[Team\]/gi, teamNames)
    .replace(/\{TEAM\}/g, teamNames)
    .replace(/\[Total Amount\]/gi, totalDisplay)
    .replace(/\{TOTAL_AMOUNT\}/g, totalDisplay)
    .replace(/\[Advance Paid\]/gi, advanceDisplay)
    .replace(/\{ADVANCE_PAID\}/g, advanceDisplay)
    .replace(/\[Balance Due\]/gi, balanceDisplay)
    .replace(/\{BALANCE_DUE\}/g, balanceDisplay)
    .replace(/₹?\[Amount\]/gi, totalDisplay)
    .replace(/\{AMOUNT\}/g, totalDisplay);
}

export function createWhatsAppWebUrl(phone: string, text: string): string {
  const cleaned = cleanWhatsAppNumber(phone);
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

// Sync Booking directly to Google Sheet via Google Apps Script Web App
export async function syncBookingToGoogleSheet(
  booking: Booking,
  webAppUrl?: string
): Promise<{ success: boolean; message: string; remoteSaved?: boolean }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
    return {
      success: true,
      remoteSaved: false,
      message: 'Booking saved safely to local database. (Configure Google Sheet Web App URL in Settings for instant cloud synchronization)',
    };
  }

  try {
    // We send payload to Google Apps Script
    await fetch(webAppUrl.trim(), {
      method: 'POST',
      mode: 'no-cors', // standard for Apps Script Web App execution
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync_booking',
        booking,
      }),
    });

    return {
      success: true,
      remoteSaved: true,
      message: 'Booking synced successfully to Google Sheets database!',
    };
  } catch (err: any) {
    console.warn('Google Sheet network sync notice:', err);
    // Still succeeded locally
    return {
      success: true,
      remoteSaved: false,
      message: 'Booking saved locally; Google Sheet sync pending network confirmation.',
    };
  }
}

// Google Sheets CSV Exporter with WhatsApp Status Columns
export function exportGoogleSheetCSV(bookings: Booking[], staffList: StaffMember[]): string {
  const headers = [
    'Booking Ref',
    'Booking Date',
    'Schedule Date',
    'Customer Name',
    'Customer Mobile',
    'WhatsApp',
    'Customer WhatsApp Status',
    'Customer Msg Sent At',
    'Service',
    'Work Description',
    'Location',
    'Address',
    'Slot',
    'Period',
    'Time Details',
    'Staff 1',
    'Staff 2',
    'Staff 3',
    'Staff 4',
    'Staff 5',
    'Staff 6',
    'Staff Count',
    'Staff WhatsApp Status',
    'Staff Msg Sent At',
    'Amount',
    'Advance',
    'Balance',
    'Payment Status',
    'Booking Status',
    'Notes',
    'Created At',
    'Updated At',
  ];

  const rows = bookings.map((b) => {
    const staffNames = b.assignedStaffNames || [];
    const staff1 = staffNames[0] || '';
    const staff2 = staffNames[1] || '';
    const staff3 = staffNames[2] || '';
    const staff4 = staffNames[3] || '';
    const staff5 = staffNames[4] || '';
    const staff6 = staffNames[5] || '';

    const locationDisplay =
      b.serviceLocation === 'Other' && b.customLocation
        ? b.customLocation
        : b.serviceLocation;

    // Staff summary status
    const staffStatuses = b.staffMessageStatuses
      ? Object.values(b.staffMessageStatuses)
          .map((s) => `${s.staffName}: ${s.status}`)
          .join('; ')
      : 'Not Sent';

    return [
      b.bookingRef,
      b.bookingDate,
      b.scheduleDate,
      b.customerName,
      b.customerMobile,
      b.customerWhatsApp || b.customerMobile,
      b.customerMessageStatus || 'Not Sent',
      b.customerMessageSentAt || b.customerMessageOpenedAt || '',
      b.serviceType,
      b.serviceDescription || '',
      locationDisplay,
      b.fullAddress,
      `Slot ${b.slotNumber}`,
      b.slotPeriod,
      b.preferredTime,
      staff1,
      staff2,
      staff3,
      staff4,
      staff5,
      staff6,
      staffNames.length,
      staffStatuses,
      b.staffMessageSentAt || '',
      b.amount,
      b.advanceAmount || 0,
      b.balanceAmount || 0,
      b.paymentStatus,
      b.bookingStatus,
      b.notes,
      b.createdAt,
      b.updatedAt,
    ].map((field) => {
      const str = String(field ?? '').replace(/"/g, '""');
      return `"${str}"`;
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Google Apps Script generator code
export function getGoogleAppsScriptTemplate(): string {
  return `/**
 * MSD Facility Services - Google Sheets Sync Web App
 * Copy and paste this script into Extensions > Apps Script in your Google Sheet.
 * Click Deploy > New deployment > Select type: Web app.
 * Execute as: "Me", Who has access: "Anyone".
 * Then copy the Web App URL into the MSD Booking Management App Settings.
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var action = body.action;
    var booking = body.booking;
    
    if (action === "sync_booking") {
      var data = sheet.getDataRange().getValues();
      var rowIndex = -1;
      
      // Find row by Booking Ref (Column B / Index 1 or Booking Ref header)
      for (var i = 1; i < data.length; i++) {
        if (data[i][1] == booking.bookingRef || data[i][0] == booking.bookingRef) {
          rowIndex = i + 1;
          break;
        }
      }
      
      var rowData = [
        new Date().toLocaleString(),
        booking.bookingRef,
        booking.customerName,
        booking.customerMobile,
        booking.serviceLocation + (booking.fullAddress ? " - " + booking.fullAddress : ""),
        booking.scheduleDate,
        booking.slotPeriod + " (Slot " + booking.slotNumber + ")",
        booking.serviceType + (booking.serviceDescription ? " [" + booking.serviceDescription + "]" : ""),
        booking.assignedStaffNames ? booking.assignedStaffNames.join(" & ") : "",
        booking.customerMobile,
        booking.amount,
        booking.bookingStatus,
        "Customer MSG",
        "Staff MSG"
      ];
      
      if (rowIndex > 0) {
        // Update existing row (Preserve sheet structure)
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        // Append new row
        sheet.appendRow(rowData);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Row saved safely" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
}

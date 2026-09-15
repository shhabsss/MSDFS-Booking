export interface StaffMember {
  id: string;
  name: string;
  mobile: string;
  status: 'active' | 'inactive';
  notes?: string;
}

export type SlotPeriod = 'Morning' | 'Afternoon' | 'Evening';

export interface SlotDefinition {
  id: string;
  slotNumber: number;
  period: SlotPeriod;
  label: string;
  startTime: string;
  endTime: string;
}

export type PaymentStatus = 'Not Paid' | 'Advance Paid' | 'Fully Paid' | 'Pending';

export type BookingStatus =
  | 'New'
  | 'Pending'
  | 'Confirmed'
  | 'Staff Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled';

export type MessageDeliveryStatus =
  | 'Not Sent'
  | 'Ready'
  | 'Opened'
  | 'Sent'
  | 'Failed'
  | 'Number Missing';

export interface StaffMessageStatus {
  staffId: string;
  staffName: string;
  phone: string;
  status: MessageDeliveryStatus;
  sentAt?: string;
  openedAt?: string;
  failureReason?: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  bookingDate: string; // YYYY-MM-DD
  scheduleDate: string; // YYYY-MM-DD
  customerName: string;
  customerMobile: string;
  customerWhatsApp?: string;
  serviceType: string;
  quantity?: number; // QTY (e.g. 1, 2, 3...)
  serviceDescription?: string; // Detailed description of work / scope of work
  serviceLocation: string;
  customLocation?: string;
  fullAddress: string;
  slotNumber: number; // 1 to 10
  slotPeriod: SlotPeriod;
  preferredTime: string;
  staffRequired: number;
  assignedStaffIds: string[];
  assignedStaffNames: string[];
  amount: number | string;
  advanceAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  // WhatsApp Message Status Tracking
  customerMessageStatus?: MessageDeliveryStatus;
  customerMessageSentAt?: string;
  customerMessageOpenedAt?: string;
  staffMessageStatuses?: Record<string, StaffMessageStatus>;
  staffMessageSentAt?: string;
  // Raw columns preservation from original Google Sheet
  rawSheetExtra?: Record<string, string>;
}

export interface CompanyInfo {
  name: string;
  address: string;
  mobile: string;
  email: string;
  website: string;
}

export interface WhatsAppTemplate {
  customerTemplate: string;
  staffTemplate: string;
}

export interface AppSettings {
  company: CompanyInfo;
  bookingRefPrefix: string;
  nextRefNumber: number;
  services: string[];
  locations: string[];
  googleSheetWebAppUrl?: string;
  lastSyncedAt?: string;
  whatsappTemplates: WhatsAppTemplate;
}

export interface ConflictWarning {
  staffId: string;
  staffName: string;
  conflictingBookingRef: string;
  customerName: string;
  timeSlot: string;
}

import React, { useEffect, useMemo, useState } from 'react';
import { AllBookingsView } from './components/AllBookingsView';
import { BookingDetailModal } from './components/BookingDetailModal';
import { BookingFormModal } from './components/BookingFormModal';
import { BookingMessageModal } from './components/BookingMessageModal';
import { CalendarView } from './components/CalendarView';
import { DailyBookingBoard } from './components/DailyBookingBoard';
import { DashboardStats } from './components/DashboardStats';
import { GoogleSheetSyncView } from './components/GoogleSheetSyncView';
import { Navbar } from './components/Navbar';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { StaffScheduleView } from './components/StaffScheduleView';
import { INITIAL_HISTORICAL_BOOKINGS } from './data/initialData';
import {
  clearAllBookings,
  generateNextBookingRef,
  loadBookings,
  loadCompanyInfo,
  loadSettings,
  loadSlots,
  loadStaff,
  saveBookings,
  saveCompanyInfo,
  saveSettings,
  saveSlots,
  saveStaff,
  syncBookingToGoogleSheet,
} from './services/storageService';
import {
  AppSettings,
  Booking,
  BookingStatus,
  CompanyInfo,
  SlotDefinition,
  StaffMember,
} from './types';

export default function App() {
  // Core application state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [slots, setSlots] = useState<SlotDefinition[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(loadCompanyInfo());
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<
    'board' | 'all-bookings' | 'calendar' | 'staff-schedule' | 'reports' | 'google-sheets' | 'settings'
  >('board');

  // Selected date for daily board & staff view (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [defaultSlotForNew, setDefaultSlotForNew] = useState<number>(1);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);

  // Automatic Booking Message Workflow state
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedBookingForMessages, setSelectedBookingForMessages] = useState<Booking | null>(null);
  const [isDetailsChangedNotice, setIsDetailsChangedNotice] = useState(false);
  const [googleSheetSyncNotice, setGoogleSheetSyncNotice] = useState<{
    success: boolean;
    message: string;
    remoteSaved?: boolean;
  } | null>(null);

  // Initialize data on mount
  useEffect(() => {
    // Purge legacy storage keys to guarantee a clean fresh start as requested
    try {
      localStorage.removeItem('msd_bookings_v2');
      localStorage.removeItem('msd_bookings');
    } catch (_) {}

    const loadedBookings = loadBookings();
    setBookings(loadedBookings);

    const loadedStaff = loadStaff();
    setStaffList(loadedStaff);

    const loadedSlots = loadSlots();
    setSlots(loadedSlots);

    const loadedCompany = loadCompanyInfo();
    setCompanyInfo(loadedCompany);

    const loadedSettings = loadSettings();
    setSettings(loadedSettings);
  }, []);

  // Filter bookings for the selected date
  const bookingsForSelectedDate = useMemo(() => {
    return bookings.filter((b) => b.scheduleDate === selectedDate);
  }, [bookings, selectedDate]);

  // Suggested next booking reference
  const suggestedNextRef = useMemo(() => {
    return generateNextBookingRef(bookings);
  }, [bookings]);

  // Handler: Create or Update Booking with Automated Messaging & Google Sheet Sync
  const handleSaveBooking = async (booking: Booking, isDetailsChanged?: boolean) => {
    const exists = bookings.some((b) => b.id === booking.id);
    let updated: Booking[];

    if (exists) {
      updated = bookings.map((b) => (b.id === booking.id ? booking : b));
    } else {
      updated = [booking, ...bookings];
    }

    setBookings(updated);
    saveBookings(updated);
    setIsFormModalOpen(false);
    setBookingToEdit(null);

    // If detail modal is open for this booking, update it too
    if (selectedBookingForDetail && selectedBookingForDetail.id === booking.id) {
      setSelectedBookingForDetail(booking);
    }

    // Step 7: Wait for Google Sheet save / sync
    const syncResult = await syncBookingToGoogleSheet(booking, settings.googleSheetWebAppUrl);
    setGoogleSheetSyncNotice(syncResult);

    // Step 8, 9, 10: Show the message status screen immediately after save
    setSelectedBookingForMessages(booking);
    setIsDetailsChangedNotice(Boolean(isDetailsChanged));
    setIsMessageModalOpen(true);
  };

  // Handler: Open Message Modal for any existing booking
  const handleOpenMessageModal = (booking: Booking) => {
    setSelectedBookingForMessages(booking);
    setIsDetailsChangedNotice(false);
    setGoogleSheetSyncNotice(null);
    setIsMessageModalOpen(true);
  };

  // Handler: Update Booking statuses from Message Modal
  const handleUpdateBookingFromModal = (updatedBooking: Booking) => {
    const updated = bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
    setBookings(updated);
    saveBookings(updated);
    setSelectedBookingForMessages(updatedBooking);
    if (selectedBookingForDetail && selectedBookingForDetail.id === updatedBooking.id) {
      setSelectedBookingForDetail(updatedBooking);
    }
  };

  // Handler: Delete Booking
  const handleDeleteBooking = (id: string, ref: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete booking ${ref}?\nThis cannot be undone.`
    );
    if (!confirmDelete) return;

    const updated = bookings.filter((b) => b.id !== id);
    setBookings(updated);
    saveBookings(updated);

    if (selectedBookingForDetail && selectedBookingForDetail.id === id) {
      setIsDetailModalOpen(false);
      setSelectedBookingForDetail(null);
    }
  };

  // Handler: Duplicate Booking
  const handleDuplicateBooking = (booking: Booking) => {
    const duplicated: Booking = {
      ...booking,
      id: `b-${Date.now()}`,
      bookingRef: generateNextBookingRef(bookings),
      bookingDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bookingStatus: 'New',
    };
    setBookingToEdit(duplicated);
    setIsFormModalOpen(true);
  };

  // Handler: Quick Status Change from Board/Table
  const handleQuickStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, bookingStatus: newStatus, updatedAt: new Date().toISOString() } : b
    );
    setBookings(updated);
    saveBookings(updated);

    if (selectedBookingForDetail && selectedBookingForDetail.id === bookingId) {
      setSelectedBookingForDetail((prev) =>
        prev ? { ...prev, bookingStatus: newStatus, updatedAt: new Date().toISOString() } : null
      );
    }
  };

  // Handler: Slot Click (from Board ribbon or Slot column)
  const handleSlotClick = (slotNumber: number, existingBooking?: Booking) => {
    if (existingBooking) {
      setSelectedBookingForDetail(existingBooking);
      setIsDetailModalOpen(true);
    } else {
      setBookingToEdit(null);
      setDefaultSlotForNew(slotNumber);
      setIsFormModalOpen(true);
    }
  };

  // Handler: New Booking from top navbar or buttons
  const handleOpenNewBooking = () => {
    setBookingToEdit(null);
    setDefaultSlotForNew(1);
    setIsFormModalOpen(true);
  };

  // Handler: Open Detail View
  const handleViewBooking = (booking: Booking) => {
    setSelectedBookingForDetail(booking);
    setIsDetailModalOpen(true);
  };

  // Handler: Open Edit Modal
  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setIsFormModalOpen(true);
  };

  // Handler: New booking for a specific date (from Calendar)
  const handleNewBookingForDate = (date: string) => {
    setSelectedDate(date);
    setBookingToEdit(null);
    setDefaultSlotForNew(1);
    setIsFormModalOpen(true);
  };

  // Reset database back to seed records if desired
  const handleResetToSeedData = () => {
    if (
      window.confirm(
        'Reset database to the initial 22 historical bookings from MSD Facility Services?'
      )
    ) {
      setBookings(INITIAL_HISTORICAL_BOOKINGS);
      saveBookings(INITIAL_HISTORICAL_BOOKINGS);
    }
  };

  // Handler: Delete all bookings to start completely fresh
  const handleClearAllBookings = () => {
    if (
      window.confirm(
        'Are you sure you want to delete ALL bookings?\n\nThis will permanently delete all booking records from the schedule so you can start completely fresh. This cannot be undone.'
      )
    ) {
      setBookings([]);
      saveBookings([]);
      clearAllBookings();
      setSelectedBookingForDetail(null);
      setSelectedBookingForMessages(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Main Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onNewBooking={handleOpenNewBooking}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        companyInfo={companyInfo}
        totalBookingsCount={bookings.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-4">
        {/* View 1: Daily Booking Board (The primary Google Sheet style board) */}
        {currentTab === 'board' && (
          <div className="space-y-4">
            {/* Dashboard metrics and visual slot ribbon */}
            <DashboardStats
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              bookingsForDate={bookingsForSelectedDate}
              allBookings={bookings}
              allSlots={slots}
              onSlotClick={handleSlotClick}
              onNewBooking={handleOpenNewBooking}
              onNavigateToReports={() => setCurrentTab('reports')}
            />

            {/* Daily Spreadsheet / Card Board */}
            <DailyBookingBoard
              selectedDate={selectedDate}
              bookings={bookingsForSelectedDate}
              allSlots={slots}
              allStaff={staffList}
              onViewBooking={handleViewBooking}
              onEditBooking={handleEditBooking}
              onDuplicateBooking={handleDuplicateBooking}
              onDeleteBooking={handleDeleteBooking}
              onQuickStatusChange={handleQuickStatusChange}
              onSlotClick={handleSlotClick}
              onNewBooking={handleOpenNewBooking}
              onOpenMessageModal={handleOpenMessageModal}
            />
          </div>
        )}

        {/* View 2: All Bookings (Search & Multi-Filters) */}
        {currentTab === 'all-bookings' && (
          <AllBookingsView
            bookings={bookings}
            allStaff={staffList}
            onViewBooking={handleViewBooking}
            onEditBooking={handleEditBooking}
            onDuplicateBooking={handleDuplicateBooking}
            onDeleteBooking={handleDeleteBooking}
            onQuickStatusChange={handleQuickStatusChange}
            onNewBooking={handleOpenNewBooking}
            onOpenMessageModal={handleOpenMessageModal}
            onClearAllBookings={handleClearAllBookings}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {/* View 3: Calendar View */}
        {currentTab === 'calendar' && (
          <CalendarView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            allBookings={bookings}
            allStaff={staffList}
            onViewBooking={handleViewBooking}
            onEditBooking={handleEditBooking}
            onNewBookingForDate={handleNewBookingForDate}
          />
        )}

        {/* View 4: Staff Schedule & Workload */}
        {currentTab === 'staff-schedule' && (
          <StaffScheduleView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            allStaff={staffList}
            allSlots={slots}
            allBookings={bookings}
            onViewBooking={handleViewBooking}
            onEditBooking={handleEditBooking}
            settings={settings}
          />
        )}

        {/* View 5: Reports & Analytics */}
        {currentTab === 'reports' && (
          <ReportsView
            bookings={bookings}
            allStaff={staffList}
            companyInfo={companyInfo}
            onViewBooking={handleViewBooking}
            onEditBooking={handleEditBooking}
          />
        )}

        {/* View 6: Google Sheet Central Database & Sync */}
        {currentTab === 'google-sheets' && (
          <GoogleSheetSyncView
            bookings={bookings}
            setBookings={(newBookings) => {
              setBookings(newBookings);
              saveBookings(newBookings);
            }}
            allStaff={staffList}
            settings={settings}
            onSaveSettings={(newSettings) => {
              setSettings(newSettings);
              saveSettings(newSettings);
            }}
          />
        )}

        {/* View 6: Settings */}
        {currentTab === 'settings' && (
          <SettingsView
            companyInfo={companyInfo}
            onSaveCompanyInfo={(newInfo) => {
              setCompanyInfo(newInfo);
              saveCompanyInfo(newInfo);
            }}
            staffList={staffList}
            onSaveStaffList={(newList) => {
              setStaffList(newList);
              saveStaff(newList);
            }}
            slots={slots}
            onSaveSlots={(newSlots) => {
              setSlots(newSlots);
              saveSlots(newSlots);
            }}
            settings={settings}
            onSaveSettings={(newSettings) => {
              setSettings(newSettings);
              saveSettings(newSettings);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 px-4 sm:px-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-200">{companyInfo.name}</span> &bull;{' '}
            <span>{companyInfo.address}</span> &bull;{' '}
            <span>Mobile: {companyInfo.mobile}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            {bookings.length > 0 && (
              <>
                <button
                  onClick={handleClearAllBookings}
                  className="hover:text-rose-400 text-rose-300 font-semibold transition-colors cursor-pointer hover:underline"
                >
                  Delete All Bookings ({bookings.length})
                </button>
                <span>&bull;</span>
              </>
            )}
            <button
              onClick={handleResetToSeedData}
              className="hover:text-slate-200 transition-colors cursor-pointer text-slate-500 hover:underline"
            >
              Restore Sample Bookings
            </button>
            <span>&bull;</span>
            <span className="text-emerald-400 font-medium">Google Sheet Synchronized</span>
          </div>
        </div>
      </footer>

      {/* Booking Create / Edit Modal */}
      <BookingFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setBookingToEdit(null);
        }}
        onSave={handleSaveBooking}
        bookingToEdit={bookingToEdit}
        defaultDate={selectedDate}
        defaultSlotNumber={defaultSlotForNew}
        allBookings={bookings}
        allStaff={staffList}
        allSlots={slots}
        settings={settings}
        suggestedRef={suggestedNextRef}
      />

      {/* Booking Details & WhatsApp Modal */}
      <BookingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedBookingForDetail(null);
        }}
        booking={selectedBookingForDetail}
        onEdit={(b) => {
          setIsDetailModalOpen(false);
          setBookingToEdit(b);
          setIsFormModalOpen(true);
        }}
        onStatusChange={handleQuickStatusChange}
        onOpenMessageModal={handleOpenMessageModal}
        companyInfo={companyInfo}
        allStaff={staffList}
        settings={settings}
      />

      {/* Automatic WhatsApp Booking Message System Modal */}
      <BookingMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => {
          setIsMessageModalOpen(false);
          setSelectedBookingForMessages(null);
          setGoogleSheetSyncNotice(null);
        }}
        booking={selectedBookingForMessages}
        allStaff={staffList}
        companyInfo={companyInfo}
        settings={settings}
        onUpdateBooking={handleUpdateBookingFromModal}
        isDetailsChangedNotice={isDetailsChangedNotice}
        googleSheetSyncResult={googleSheetSyncNotice}
      />
    </div>
  );
}

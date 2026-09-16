import {
  Building2,
  Check,
  Clock,
  Edit2,
  MapPin,
  MessageCircle,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  DEFAULT_SERVICES,
  DEFAULT_SLOTS,
  DEFAULT_STAFF,
  PUDUCHERRY_LOCATIONS,
  WEBSITE_MSDFS_SERVICES,
} from '../data/initialData';
import {
  AppSettings,
  CompanyInfo,
  SlotDefinition,
  SlotPeriod,
  StaffMember,
} from '../types';

interface SettingsViewProps {
  companyInfo?: CompanyInfo;
  onSaveCompanyInfo?: (info: CompanyInfo) => void;
  staffList?: StaffMember[];
  allStaff?: StaffMember[];
  onSaveStaffList?: (staff: StaffMember[]) => void;
  slots?: SlotDefinition[];
  allSlots?: SlotDefinition[];
  onSaveSlots?: (slots: SlotDefinition[]) => void;
  settings?: AppSettings;
  onSaveSettings?: (settings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyInfo = {
    name: 'MSD Facility Services',
    address: 'No 72, 6th Cross, JJ Nagar, Moolakulam, Puducherry - 605010',
    mobile: '9042233122',
    email: 'msdfacilityservices@gmail.com',
    website: 'www.msdfs.in',
  },
  onSaveCompanyInfo,
  staffList,
  allStaff,
  onSaveStaffList,
  slots,
  allSlots,
  onSaveSlots,
  settings,
  onSaveSettings,
}) => {
  const currentStaffList = staffList && staffList.length > 0 ? staffList : (allStaff || DEFAULT_STAFF);
  const currentSlots = slots && slots.length > 0 ? slots : (allSlots || DEFAULT_SLOTS);
  const currentServices = settings?.services || DEFAULT_SERVICES;
  const currentLocations = settings?.locations || PUDUCHERRY_LOCATIONS;

  const [activeTab, setActiveTab] = useState<'company' | 'staff' | 'slots' | 'services' | 'whatsapp'>('company');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Company info state
  const [compName, setCompName] = useState(companyInfo?.name || 'MSD Facility Services');
  const [compAddress, setCompAddress] = useState(companyInfo?.address || '');
  const [compMobile, setCompMobile] = useState(companyInfo?.mobile || '');
  const [compEmail, setCompEmail] = useState(companyInfo?.email || '');
  const [compWebsite, setCompWebsite] = useState(companyInfo?.website || '');

  // New Staff state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffMobile, setNewStaffMobile] = useState('');

  // New Service state
  const [newService, setNewService] = useState('');
  // New Location state
  const [newLocation, setNewLocation] = useState('');

  // WhatsApp templates state
  const [customerTemplate, setCustomerTemplate] = useState(
    settings?.whatsappTemplates?.customerTemplate || ''
  );
  const [staffTemplate, setStaffTemplate] = useState(
    settings?.whatsappTemplates?.staffTemplate || ''
  );

  const showNotice = (msg: string) => {
    setSaveSuccessNotice(msg);
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  // 1. Save Company Info
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompanyInfo({
      name: compName.trim(),
      address: compAddress.trim(),
      mobile: compMobile.trim(),
      email: compEmail.trim(),
      website: compWebsite.trim(),
    });
    showNotice('Company information updated successfully!');
  };

  // 2. Staff Management
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName.trim(),
      mobile: newStaffMobile.trim(),
      status: 'active',
      notes: 'Cleaning Specialist',
    };
    onSaveStaffList([...staffList, newMember]);
    setNewStaffName('');
    setNewStaffMobile('');
    showNotice(`Added staff member: ${newMember.name}`);
  };

  const handleToggleStaffStatus = (id: string) => {
    const updated = staffList.map((s) =>
      s.id === id ? { ...s, status: s.status === 'active' ? ('inactive' as const) : ('active' as const) } : s
    );
    onSaveStaffList(updated);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove staff member: ${name}?`)) {
      onSaveStaffList(staffList.filter((s) => s.id !== id));
      showNotice(`Removed ${name}`);
    }
  };

  const handleResetDefaultStaff = () => {
    if (confirm('Reset staff list to default 6 MSD staff members?')) {
      onSaveStaffList(DEFAULT_STAFF);
      showNotice('Staff reset to default 6 members');
    }
  };

  // 3. Time Slots
  const handleUpdateSlot = (slotId: string, field: keyof SlotDefinition, value: any) => {
    const updated = currentSlots.map((s) => (s.id === slotId ? { ...s, [field]: value } : s));
    if (onSaveSlots) onSaveSlots(updated);
  };

  const handleResetSlots = () => {
    if (confirm('Reset slots to standard 10 time slots?')) {
      if (onSaveSlots) onSaveSlots(DEFAULT_SLOTS);
      showNotice('Slots reset to default schedule');
    }
  };

  // Helper to persist updated settings
  const persistSettings = (partial: Partial<AppSettings>) => {
    if (!onSaveSettings) return;
    const base: AppSettings = settings || {
      autoGenerateRef: true,
      lastReferenceNumber: 10,
      services: currentServices,
      locations: currentLocations,
      googleSheetWebAppUrl: '',
      whatsappTemplates: {
        customerTemplate: customerTemplate,
        staffTemplate: staffTemplate,
      },
    };
    onSaveSettings({ ...base, ...partial });
  };

  // 4. Services
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.trim()) return;
    if (currentServices.includes(newService.trim())) {
      alert('This service is already in the list.');
      return;
    }
    const updated = [...currentServices, newService.trim()];
    persistSettings({ services: updated });
    setNewService('');
    showNotice('Service added');
  };

  const handleDeleteService = (srv: string) => {
    const updated = currentServices.filter((s) => s !== srv);
    persistSettings({ services: updated });
    showNotice(`Removed service: ${srv}`);
  };

  const handleSyncWebsiteServices = () => {
    const isUnwantedBathroomVariant = (s: string) => {
      const lower = s.trim().toLowerCase();
      return lower.includes('bathroom') && lower !== 'bathroom cleaning';
    };
    let updated = currentServices.filter((s) => !isUnwantedBathroomVariant(s));
    if (!updated.includes('Bathroom Cleaning')) {
      updated.push('Bathroom Cleaning');
    }
    let addedCount = 0;
    for (const srv of WEBSITE_MSDFS_SERVICES) {
      if (!updated.includes(srv)) {
        updated.push(srv);
        addedCount++;
      }
    }
    persistSettings({ services: updated });
    showNotice('Services synced with msdfs.in catalog (Bathroom Cleaning cleaned)');
  };

  // 5. Locations
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    if (currentLocations.includes(newLocation.trim())) {
      alert('This location is already in the list.');
      return;
    }
    const updated = [...currentLocations, newLocation.trim()];
    persistSettings({ locations: updated });
    setNewLocation('');
    showNotice('Location added');
  };

  const handleDeleteLocation = (loc: string) => {
    const updated = currentLocations.filter((l) => l !== loc);
    persistSettings({ locations: updated });
    showNotice(`Removed location: ${loc}`);
  };

  // 6. WhatsApp Templates
  const handleSaveWhatsAppTemplates = (e: React.FormEvent) => {
    e.preventDefault();
    persistSettings({
      whatsappTemplates: {
        customerTemplate,
        staffTemplate,
      },
    });
    showNotice('WhatsApp message templates saved!');
  };

  return (
    <div className="space-y-4">
      {/* Settings Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Admin Settings &bull; MSD Facility Services</h2>
          <p className="text-xs text-slate-500">Configure company info, staff roster, daily slots, services, and dispatch templates</p>
        </div>

        {saveSuccessNotice && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-3 py-1.5 rounded-lg font-semibold animate-in fade-in flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 shadow-2xs overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('company')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'company'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'staff'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Roster ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('slots')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'slots'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Daily Slots ({slots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'services'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Services &amp; Locations</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'whatsapp'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp Templates</span>
        </button>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 max-w-2xl text-xs">
          <div className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
            Company Contact Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile / WhatsApp</label>
              <input
                type="text"
                value={compMobile}
                onChange={(e) => setCompMobile(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={compAddress}
              onChange={(e) => setCompAddress(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={compEmail}
                onChange={(e) => setCompEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                value={compWebsite}
                onChange={(e) => setCompWebsite(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Company Details</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Staff Roster */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Add Staff Bar */}
          <form onSubmit={handleAddStaff} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-end gap-3 text-xs">
            <div className="flex-1 min-w-[180px]">
              <label className="block font-semibold text-slate-700 mb-1">Staff Name</label>
              <input
                type="text"
                placeholder="e.g. Mr. Sankar"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium"
              />
            </div>

            <div className="w-48">
              <label className="block font-semibold text-slate-700 mb-1">Mobile (for WhatsApp)</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={newStaffMobile}
                onChange={(e) => setNewStaffMobile(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaultStaff}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset 6 Default Staff</span>
            </button>
          </form>

          {/* Staff Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Mobile Number</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{staff.name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{staff.mobile || '—'}</td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => handleToggleStaffStatus(staff.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          staff.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {staff.status.toUpperCase()}
                      </button>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteStaff(staff.id, staff.name)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="Delete staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Daily Slots */}
      {activeTab === 'slots' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="font-bold text-slate-900 text-sm">Configured Daily Slots (1 to 10)</div>
              <p className="text-slate-500">
                Each day supports up to 10 standard slots across Morning, Afternoon, and Evening.
              </p>
            </div>
            <button
              onClick={handleResetSlots}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {slots.map((slot) => (
              <div key={slot.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {slot.slotNumber}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 text-xs">Slot {slot.slotNumber}</span>
                    <div className="text-[11px] text-slate-500 font-sans">{slot.period} Period</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">Period:</span>
                  <select
                    value={slot.period}
                    onChange={(e) => handleUpdateSlot(slot.id, 'period', e.target.value as SlotPeriod)}
                    className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Services & Locations */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Services */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="font-bold text-slate-900 text-sm">Service Catalog</div>
                <p className="text-[11px] text-slate-500">
                  Services list aligned with{' '}
                  <a
                    href="https://msdfs.in/services/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    msdfs.in/services/
                  </a>
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncWebsiteServices}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Sync all official services from https://msdfs.in/services/"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Sync msdfs.in Services</span>
              </button>
            </div>

            <form onSubmit={handleAddService} className="flex gap-2">
              <input
                type="text"
                placeholder="New service name..."
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
              >
                Add
              </button>
            </form>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {currentServices.map((srv, idx) => {
                const isFromWebsite = WEBSITE_MSDFS_SERVICES.includes(srv);
                return (
                  <div key={idx} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-slate-800">{srv}</span>
                      {isFromWebsite && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-1.5 py-0.2 rounded">
                          msdfs.in
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteService(srv)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Delete service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="font-bold text-slate-900 text-sm">Service Locations</div>

            <form onSubmit={handleAddLocation} className="flex gap-2">
              <input
                type="text"
                placeholder="New location area..."
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
              >
                Add
              </button>
            </form>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {currentLocations.map((loc, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-slate-800">{loc}</span>
                  {loc !== 'Other' && (
                    <button
                      onClick={() => handleDeleteLocation(loc)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: WhatsApp Templates */}
      {activeTab === 'whatsapp' && (
        <form onSubmit={handleSaveWhatsAppTemplates} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm">Custom WhatsApp Message Templates</div>
              <p className="text-slate-500">
                Variables supported: [Customer Name], [Booking Reference], [Schedule Date], [Time Slot], [Service Name], [Work Description], [Service Location], [Full Address], [Staff Name], [Staff Phone], [Team Members], [Total Amount], [Advance Paid], [Balance Due]
              </p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Templates</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Customer Confirmation Template
              </label>
              <textarea
                rows={12}
                value={customerTemplate}
                onChange={(e) => setCustomerTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Staff Assignment Dispatch Template
              </label>
              <textarea
                rows={12}
                value={staffTemplate}
                onChange={(e) => setStaffTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-xs leading-relaxed"
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFullName, logout } from '../api/auth';
import {
  searchPatients, createPatient, updatePatient, deletePatient,
  searchMedicines, createPrescription, addItemToPrescription,
  updatePrescriptionItem, deletePrescriptionItem,
  issuePrescription, getPrescriptionHistory,
  checkMedicineAvailability,
} from '../api/doctor';

export default function DoctorHome() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('new');
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState(null);

  // Patient state
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name: '', date_of_birth: '', gender: 'M', phone: '', notes: '' });

  // Prescription state
  const [prescription, setPrescription] = useState(null);
  const [prescriptionItems, setPrescriptionItems] = useState([]);

  // Medicine search state
  const [medQuery, setMedQuery] = useState('');
  const [medResults, setMedResults] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [medAvailability, setMedAvailability] = useState(null);
  const [itemForm, setItemForm] = useState({ dosage_instructions: '', duration_days: '', quantity_prescribed: '' });
  const [showMedDropdown, setShowMedDropdown] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const filteredHistory = history.filter(p =>
    p.patient.full_name.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Edit state
  const [editingPatient, setEditingPatient] = useState(null);
  const [editPatientForm, setEditPatientForm] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editItemForm, setEditItemForm] = useState({});

  const medSearchRef = useRef(null);
  const patientSearchRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  useEffect(() => {
    if (tab !== 'history') return;
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [tab]);

  useEffect(() => {
    const handler = (e) => {
      if (medSearchRef.current && !medSearchRef.current.contains(e.target)) setShowMedDropdown(false);
      if (patientSearchRef.current && !patientSearchRef.current.contains(e.target)) setPatientResults([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHistory = async () => {
    try {
      const res = await getPrescriptionHistory();
      setHistory(res.data);
    } catch {}
  };

  const handlePatientSearch = async (e) => {
    const val = e.target.value;
    setPatientQuery(val);
    setSelectedPatient(null);
    setPrescription(null);
    setPrescriptionItems([]);
    if (val.length >= 2) {
      const res = await searchPatients(val);
      setPatientResults(res.data);
    } else {
      setPatientResults([]);
    }
  };

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setPatientQuery(patient.full_name);
    setPatientResults([]);
    setShowCreatePatient(false);
    const res = await createPrescription(patient.id);
    setPrescription(res.data);
    setPrescriptionItems([]);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const res = await createPatient(newPatient);
      setNewPatient({ full_name: '', date_of_birth: '', gender: 'M', phone: '', notes: '' });
      setShowCreatePatient(false);
      showToast('Patient created');
      handleSelectPatient(res.data);
    } catch {
      showToast('Failed to create patient', 'error');
    }
  };

  const handleMedSearch = async (e) => {
    const val = e.target.value;
    setMedQuery(val);
    setSelectedMed(null);
    setMedAvailability(null);
    if (val.length >= 2) {
      const res = await searchMedicines(val);
      setMedResults(res.data);
      setShowMedDropdown(true);
    } else {
      setMedResults([]);
      setShowMedDropdown(false);
    }
  };

  const handleSelectMed = async (med) => {
    setSelectedMed(med);
    setMedQuery(`${med.name} ${med.dosage_strength}`);
    setShowMedDropdown(false);
    const res = await checkMedicineAvailability(med.id);
    setMedAvailability(res.data);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedMed || !prescription) return;
    setAddingItem(true);
    try {
      const res = await addItemToPrescription(prescription.id, {
        medicine_id: selectedMed.id,
        dosage_instructions: itemForm.dosage_instructions,
        duration_days: parseInt(itemForm.duration_days),
        quantity_prescribed: parseInt(itemForm.quantity_prescribed),
      });
      setPrescriptionItems(prev => [...prev, { ...res.data.item, alert: res.data.alert }]);
      setSelectedMed(null);
      setMedQuery('');
      setMedAvailability(null);
      setItemForm({ dosage_instructions: '', duration_days: '', quantity_prescribed: '' });
      if (res.data.alert) showToast('Medicine added — not currently in stock', 'warn');
      else showToast('Medicine added to prescription');
    } catch {
      showToast('Failed to add medicine', 'error');
    } finally {
      setAddingItem(false);
    }
  };

  const handleIssue = async () => {
    if (!prescription || prescriptionItems.length === 0) return;
    try {
      await issuePrescription(prescription.id);
      showToast('Prescription issued successfully');
      setPrescription(null);
      setPrescriptionItems([]);
      setSelectedPatient(null);
      setPatientQuery('');
    } catch {
      showToast('Failed to issue prescription', 'error');
    }
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setEditPatientForm({
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone || '',
      notes: patient.notes || '',
    });
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    try {
      await updatePatient(editingPatient.id, editPatientForm);
      setSelectedPatient(prev => ({ ...prev, ...editPatientForm }));
      setEditingPatient(null);
      showToast('Patient updated');
    } catch {
      showToast('Failed to update patient', 'error');
    }
  };

  const handleDeletePatient = async (patient) => {
    if (!window.confirm(`Delete ${patient.full_name}? This cannot be undone.`)) return;
    try {
      await deletePatient(patient.id);
      setSelectedPatient(null);
      setPatientQuery('');
      setPrescription(null);
      setPrescriptionItems([]);
      showToast('Patient deleted');
    } catch {
      showToast('Failed to delete patient', 'error');
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditItemForm({
      dosage_instructions: item.dosage_instructions,
      duration_days: item.duration_days,
      quantity_prescribed: item.quantity_prescribed,
    });
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      await updatePrescriptionItem(prescription.id, editingItem.id, editItemForm);
      setPrescriptionItems(prev =>
        prev.map(i => i.id === editingItem.id ? { ...i, ...editItemForm } : i)
      );
      setEditingItem(null);
      showToast('Medicine updated');
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Remove this medicine from the prescription?')) return;
    try {
      await deletePrescriptionItem(prescription.id, itemId);
      setPrescriptionItems(prev => prev.filter(i => i.id !== itemId));
      showToast('Medicine removed');
    } catch {
      showToast('Failed to remove', 'error');
    }
  };

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .d-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #ddeaf2;
          border-radius: 9px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1a2e3b;
          background: #f7fbfe;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          margin-bottom: 0;
        }
        .d-input:focus { border-color: #2a9d8f; background: #fff; box-shadow: 0 0 0 3px rgba(42,157,143,0.1); }
        .d-input::placeholder { color: #9bb5c5; }

        .d-btn-primary {
          padding: 9px 18px;
          background: linear-gradient(135deg, #1a6b8a, #2a9d8f);
          color: #fff; border: none; border-radius: 9px;
          font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s; white-space: nowrap;
        }
        .d-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .d-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .d-btn-ghost {
          padding: 8px 16px;
          background: transparent; color: #3a6b7a;
          border: 1.5px solid #c8dfe9; border-radius: 9px;
          font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background 0.2s, border-color 0.2s;
        }
        .d-btn-ghost:hover { background: #f0f8fc; border-color: #2a9d8f; }

        .d-btn-issue {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #1a6b8a, #2a9d8f);
          color: #fff; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; letter-spacing: 0.2px;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 1rem;
        }
        .d-btn-issue:hover { opacity: 0.9; transform: translateY(-1px); }

        .tab-btn {
          padding: 10px 22px; border: none; background: none;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          font-weight: 500; color: #7a9aaa; cursor: pointer;
          border-bottom: 2.5px solid transparent;
          transition: color 0.2s, border-color 0.2s; white-space: nowrap;
        }
        .tab-btn.active { color: #1a6b8a; border-bottom-color: #2a9d8f; font-weight: 600; }
        .tab-btn:hover:not(.active) { color: #3a6b7a; }

        .dd-item {
          padding: 10px 14px; cursor: pointer;
          border-bottom: 1px solid #eef4f8;
          display: flex; justify-content: space-between; align-items: center;
          transition: background 0.15s;
        }
        .dd-item:hover { background: #f0f8fc; }
        .dd-item:last-child { border-bottom: none; }

        .icon-btn {
          width: 28px; height: 28px; border-radius: 7px;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; transition: background 0.15s, transform 0.15s;
          flex-shrink: 0;
        }
        .icon-btn:hover { transform: scale(1.1); }
        .icon-btn-edit { background: #eef4f8; color: #3a6b7a; }
        .icon-btn-edit:hover { background: #d0eaf5; }
        .icon-btn-delete { background: #fdf0ef; color: #c0392b; }
        .icon-btn-delete:hover { background: #f9d5d3; }

        .logout-btn {
          padding: 7px 16px; background: transparent; color: #7a9aaa;
          border: 1.5px solid #ddeaf2; border-radius: 8px;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .logout-btn:hover { background: #fdf0ef; color: #c0392b; border-color: #f5c6c4; }

        .change-pwd-btn {
          padding: 7px 14px; background: transparent; color: #3a6b7a;
          border: 1.5px solid #ddeaf2; border-radius: 8px;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: background 0.2s, border-color 0.2s;
        }
        .change-pwd-btn:hover { background: #f0f8fc; border-color: #2a9d8f; }

        .page-enter { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .page-enter.visible { opacity: 1; transform: translateY(0); }

        .toast {
          position: fixed; bottom: 28px; right: 28px;
          padding: 12px 20px; border-radius: 10px;
          font-size: 14px; font-family: 'DM Sans', sans-serif; font-weight: 500;
          color: #fff; z-index: 1000;
          animation: slideUp 0.3s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,30,40,0.45);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 200; animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-card {
          background: #fff; border-radius: 18px;
          padding: 2rem; width: 100%; max-width: 460px;
          box-shadow: 0 24px 64px rgba(26,58,74,0.2);
          animation: modalIn 0.25s ease;
        }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }

        .spinner-sm {
          display: inline-block; width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
          border-radius: 50%; animation: spin 0.7s linear infinite;
          vertical-align: middle; margin-right: 6px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .rx-item-row {
          background: #fff; border: 1px solid #ddeaf2; border-radius: 11px;
          margin-bottom: 10px; overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .rx-item-row:hover { box-shadow: 0 3px 14px rgba(26,107,138,0.09); }

        .hist-card {
          background: #fff; border: 1px solid #ddeaf2; border-radius: 14px;
          margin-bottom: 14px; overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .hist-card:hover { box-shadow: 0 4px 20px rgba(26,107,138,0.08); transform: translateY(-1px); }

        .stat-card {
          background: #fff; border-radius: 14px; padding: 16px 20px;
          border: 1px solid #ddeaf2;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(26,107,138,0.1); }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{
          background: toast.type === 'error' ? '#c0392b' : toast.type === 'warn' ? '#e67e22' : '#2a9d8f'
        }}>
          {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingPatient(null)}>
          <div className="modal-card">
            <div style={s.modalHeader}>
              <div style={s.modalIconWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#2a9d8f" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#2a9d8f" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 style={s.modalTitle}>Edit Patient</h3>
                <p style={s.modalSub}>Update patient information</p>
              </div>
            </div>
            <div style={s.modalDivider} />
            <form onSubmit={handleUpdatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={s.formLabel}>Full name *</label>
                <input className="d-input" required placeholder="Full name"
                  value={editPatientForm.full_name}
                  onChange={e => setEditPatientForm({ ...editPatientForm, full_name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={s.formLabel}>Date of birth *</label>
                  <input className="d-input" type="date" required
                    value={editPatientForm.date_of_birth}
                    onChange={e => setEditPatientForm({ ...editPatientForm, date_of_birth: e.target.value })} />
                </div>
                <div>
                  <label style={s.formLabel}>Gender</label>
                  <select className="d-input"
                    value={editPatientForm.gender}
                    onChange={e => setEditPatientForm({ ...editPatientForm, gender: e.target.value })}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={s.formLabel}>Phone</label>
                <input className="d-input" placeholder="Optional"
                  value={editPatientForm.phone}
                  onChange={e => setEditPatientForm({ ...editPatientForm, phone: e.target.value })} />
              </div>
              <div>
                <label style={s.formLabel}>Clinical notes</label>
                <textarea className="d-input" placeholder="Allergies, chronic conditions..."
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={editPatientForm.notes}
                  onChange={e => setEditPatientForm({ ...editPatientForm, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="submit" className="d-btn-primary">Save Changes</button>
                <button type="button" className="d-btn-ghost" onClick={() => setEditingPatient(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerLogo}>
            <div style={s.headerLogoIcon}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <rect x="12" y="4" width="8" height="24" rx="2" fill="white" opacity="0.95"/>
                <rect x="4" y="12" width="24" height="8" rx="2" fill="white" opacity="0.95"/>
              </svg>
            </div>
            <span style={s.headerLogoText}>PharmaSync</span>
          </div>
          <div style={s.headerDivider} />
          <div style={s.headerRole}>
            <div style={s.headerRoleDot} />
            Doctor Portal
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.headerUser}>
            <div style={s.userAvatar}>{getFullName()?.charAt(0)?.toUpperCase() || 'D'}</div>
            <div>
              <div style={s.userName}>Dr. {getFullName()}</div>
              <div style={s.userRole}>Physician</div>
            </div>
          </div>
          <button className="change-pwd-btn" onClick={() => navigate('/change-password')}>🔑 Password</button>
          <button className="logout-btn" onClick={logout}>Sign out</button>
        </div>
      </header>

      {/* Main */}
      <main className={`page-enter ${mounted ? 'visible' : ''}`} style={s.main}>

        {/* Page title + stats */}
        <div style={s.pageTop}>
          <div>
            <h1 style={s.pageTitleText}>Doctor Dashboard</h1>
            <p style={s.pageTitleSub}>Write prescriptions and review patient history</p>
          </div>
          <div style={s.stats}>
            <div className="stat-card">
              <div style={s.statLabel}>Total Issued</div>
              <div style={s.statValue}>{history.length}</div>
            </div>
            <div className="stat-card">
              <div style={s.statLabel}>Dispensed</div>
              <div style={{ ...s.statValue, color: '#2a9d8f' }}>
                {history.filter(p => p.status === 'dispensed').length}
              </div>
            </div>
            <div className="stat-card">
              <div style={s.statLabel}>Pending</div>
              <div style={{ ...s.statValue, color: '#e67e22' }}>
                {history.filter(p => p.status === 'issued').length}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabBar}>
          <button className={`tab-btn ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}>
            New Prescription
          </button>
          <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            History
          </button>
        </div>

        {/* ── NEW PRESCRIPTION TAB ── */}
        {tab === 'new' && (
          <div style={s.twoCol}>

            {/* LEFT */}
            <div style={s.leftCol}>

              {/* Step 1 — Patient */}
              <div style={s.stepCard}>
                <div style={s.stepHeader}>
                  <div style={s.stepNum}>1</div>
                  <div>
                    <div style={s.stepTitle}>Find Patient</div>
                    <div style={s.stepSub}>Search by name or create new</div>
                  </div>
                </div>

                <div style={{ position: 'relative' }} ref={patientSearchRef}>
                  <input
                    className="d-input"
                    placeholder="Type patient name..."
                    value={patientQuery}
                    onChange={handlePatientSearch}
                  />

                  {/* Results dropdown */}
                  {patientResults.length > 0 && (
                    <div style={s.dropdown}>
                      {patientResults.map(p => (
                        <div className="dd-item" key={p.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}
                            onClick={() => handleSelectPatient(p)}>
                            <div style={s.patientAvatar}>{p.full_name.charAt(0).toUpperCase()}</div>
                            <div>
                              <div style={s.ddPatientName}>{p.full_name}</div>
                              <div style={s.ddPatientSub}>{p.date_of_birth} · {p.gender === 'M' ? 'Male' : 'Female'}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button className="icon-btn icon-btn-edit"
                              onClick={e => { e.stopPropagation(); handleEditPatient(p); }}>✏</button>
                            <button className="icon-btn icon-btn-delete"
                              onClick={e => { e.stopPropagation(); handleDeletePatient(p); }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {patientQuery.length >= 2 && patientResults.length === 0 && !selectedPatient && (
                    <div style={s.noResults}>
                      <span style={s.noResultsText}>No patient found</span>
                      <button className="d-btn-primary" style={{ padding: '7px 14px', fontSize: '13px' }}
                        onClick={() => setShowCreatePatient(true)}>
                        + New Patient
                      </button>
                    </div>
                  )}
                </div>

                {/* Create patient form */}
                {showCreatePatient && (
                  <div style={s.inlineForm}>
                    <div style={s.inlineFormHeader}>
                      <span style={s.inlineFormTitle}>New Patient</span>
                      <button className="icon-btn icon-btn-delete" onClick={() => setShowCreatePatient(false)}>✕</button>
                    </div>
                    <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input className="d-input" placeholder="Full name *" required
                        value={newPatient.full_name}
                        onChange={e => setNewPatient({ ...newPatient, full_name: e.target.value })} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input className="d-input" type="date" required
                          value={newPatient.date_of_birth}
                          onChange={e => setNewPatient({ ...newPatient, date_of_birth: e.target.value })} />
                        <select className="d-input"
                          value={newPatient.gender}
                          onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                        </select>
                      </div>
                      <input className="d-input" placeholder="Phone (optional)"
                        value={newPatient.phone}
                        onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
                      <textarea className="d-input" placeholder="Clinical notes — allergies, conditions..."
                        style={{ minHeight: '72px', resize: 'vertical' }}
                        value={newPatient.notes}
                        onChange={e => setNewPatient({ ...newPatient, notes: e.target.value })} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="d-btn-primary">Create & Select</button>
                        <button type="button" className="d-btn-ghost" onClick={() => setShowCreatePatient(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Selected patient badge */}
                {selectedPatient && (
                  <div style={s.selectedPatient}>
                    <div style={s.selectedPatientAvatar}>{selectedPatient.full_name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.selectedPatientName}>{selectedPatient.full_name}</div>
                      <div style={s.selectedPatientMeta}>{selectedPatient.date_of_birth} · {selectedPatient.gender === 'M' ? 'Male' : 'Female'}</div>
                    </div>
                    <span style={s.selectedTick}>✓</span>
                  </div>
                )}
              </div>

              {/* Step 2 — Medicine */}
              {prescription && (
                <div style={s.stepCard}>
                  <div style={s.stepHeader}>
                    <div style={s.stepNum}>2</div>
                    <div>
                      <div style={s.stepTitle}>Add Medicine</div>
                      <div style={s.stepSub}>Search and select from catalog</div>
                    </div>
                  </div>

                  <div style={{ position: 'relative' }} ref={medSearchRef}>
                    <input
                      className="d-input"
                      placeholder="Search medicine name..."
                      value={medQuery}
                      onChange={handleMedSearch}
                    />
                    {showMedDropdown && medResults.length > 0 && (
                      <div style={s.dropdown}>
                        {medResults.map(m => (
                          <div className="dd-item" key={m.id} onClick={() => handleSelectMed(m)}>
                            <div>
                              <div style={s.ddMedName}>{m.name} <span style={s.ddMedStrength}>{m.dosage_strength}</span></div>
                              <div style={s.ddMedSub}>{m.form} · {m.generic_name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Availability indicator */}
                  {medAvailability !== null && (
                    <div style={{
                      ...s.availBanner,
                      background: medAvailability.available ? '#e8f7f4' : '#fdf0ef',
                      borderColor: medAvailability.available ? '#b8e8df' : '#f5c6c4',
                      color: medAvailability.available ? '#1a6b5a' : '#c0392b',
                    }}>
                      <span style={{ fontSize: '16px' }}>{medAvailability.available ? '✓' : '⚠'}</span>
                      {medAvailability.available
                        ? `In stock — ${medAvailability.quantity} ${medAvailability.unit} available`
                        : 'This medicine is currently out of stock'}
                    </div>
                  )}

                  {/* Item form */}
                  {selectedMed && (
                    <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      <input className="d-input" placeholder="Dosage instructions e.g. 1 tablet twice a day *" required
                        value={itemForm.dosage_instructions}
                        onChange={e => setItemForm({ ...itemForm, dosage_instructions: e.target.value })} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input className="d-input" type="number" placeholder="Duration (days) *" required min="1"
                          value={itemForm.duration_days}
                          onChange={e => setItemForm({ ...itemForm, duration_days: e.target.value })} />
                        <input className="d-input" type="number" placeholder="Quantity *" required min="1"
                          value={itemForm.quantity_prescribed}
                          onChange={e => setItemForm({ ...itemForm, quantity_prescribed: e.target.value })} />
                      </div>
                      <button type="submit" className="d-btn-primary" disabled={addingItem}>
                        {addingItem ? <><span className="spinner-sm" />Adding...</> : 'Add to Prescription'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — Prescription preview */}
            <div style={s.rightCol}>
              <div style={s.previewCard}>
                <div style={s.previewHeader}>
                  <div style={s.previewIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#2a9d8f" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={s.previewTitle}>Prescription Preview</div>
                    <div style={s.previewSub}>
                      {prescription ? `Draft · ${prescriptionItems.length} medicine${prescriptionItems.length !== 1 ? 's' : ''}` : 'No prescription started'}
                    </div>
                  </div>
                </div>

                {!prescription && (
                  <div style={s.previewEmpty}>
                    <div style={s.previewEmptyIcon}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12v4M10 14h4" stroke="#c8dfe9" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p style={s.previewEmptyText}>Select a patient to start writing a prescription</p>
                  </div>
                )}

                {prescription && (
                  <>
                    {/* Patient info */}
                    <div style={s.previewPatient}>
                      <div style={s.previewPatientAvatar}>{selectedPatient?.full_name?.charAt(0)?.toUpperCase()}</div>
                      <div>
                        <div style={s.previewPatientName}>{selectedPatient?.full_name}</div>
                        <div style={s.previewPatientMeta}>{selectedPatient?.date_of_birth} · {selectedPatient?.gender === 'M' ? 'Male' : 'Female'}</div>
                      </div>
                    </div>

                    {/* Clinical notes warning */}
                    {selectedPatient?.notes && (
                      <div style={s.noteBanner}>
                        <div style={s.noteBannerIcon}>⚕</div>
                        <div>
                          <div style={s.noteBannerLabel}>Clinical Notes</div>
                          <div style={s.noteBannerText}>{selectedPatient.notes}</div>
                        </div>
                      </div>
                    )}

                    {/* Medicines list */}
                    {prescriptionItems.length === 0 && (
                      <div style={s.previewNoMeds}>No medicines added yet</div>
                    )}

                    {prescriptionItems.map((item, idx) => (
                      <div className="rx-item-row" key={idx}>
                        {editingItem?.id === item.id ? (
                          <form onSubmit={handleUpdateItem} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input className="d-input" placeholder="Dosage instructions" required
                              value={editItemForm.dosage_instructions}
                              onChange={e => setEditItemForm({ ...editItemForm, dosage_instructions: e.target.value })} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <input className="d-input" type="number" placeholder="Days" required
                                value={editItemForm.duration_days}
                                onChange={e => setEditItemForm({ ...editItemForm, duration_days: e.target.value })} />
                              <input className="d-input" type="number" placeholder="Qty" required
                                value={editItemForm.quantity_prescribed}
                                onChange={e => setEditItemForm({ ...editItemForm, quantity_prescribed: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button type="submit" className="d-btn-primary" style={{ padding: '7px 14px', fontSize: '13px' }}>Save</button>
                              <button type="button" className="d-btn-ghost" style={{ padding: '7px 12px', fontSize: '13px' }} onClick={() => setEditingItem(null)}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div style={{
                            ...s.rxItemInner,
                            borderLeft: `4px solid ${item.alert ? '#e74c3c' : '#2a9d8f'}`,
                          }}>
                            <div style={s.rxItemTop}>
                              <div style={s.rxItemName}>
                                {item.medicine.name}
                                <span style={s.rxItemStrength}> {item.medicine.dosage_strength}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                {item.alert && <span style={s.alertPill}>⚠ No stock</span>}
                                <button className="icon-btn icon-btn-edit" onClick={() => handleEditItem(item)}>✏</button>
                                <button className="icon-btn icon-btn-delete" onClick={() => handleDeleteItem(item.id)}>✕</button>
                              </div>
                            </div>
                            <div style={s.rxItemBottom}>
                              <span>{item.dosage_instructions}</span>
                              <span style={s.rxItemStats}>{item.duration_days}d · ×{item.quantity_prescribed}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {prescriptionItems.length > 0 && (
                      <button className="d-btn-issue" onClick={handleIssue}>
                        Issue Prescription →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div>
            <div style={s.historyToolbar}>
              <p style={s.toolbarLabel}>{filteredHistory.length} prescriptions</p>
              <input
                className="d-input"
                placeholder="Search by patient name..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                style={{ width: '260px' }}
              />
            </div>

            {filteredHistory.length === 0 && (
              <div style={s.emptyState}>
                <div style={{ fontSize: '2.5rem' }}>📋</div>
                <p style={{ fontSize: '14px', color: '#7a9aaa' }}>No prescriptions found.</p>
              </div>
            )}

            {filteredHistory.map(p => (
              <div className="hist-card" key={p.id}>
                <div style={{
                  ...s.histHeader,
                  borderLeft: `4px solid ${p.status === 'dispensed' ? '#2a9d8f' : '#e9a84c'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={s.histAvatar}>{p.patient.full_name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={s.histPatientName}>{p.patient.full_name}</div>
                      <div style={s.histMeta}>
                        {new Date(p.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    ...s.histStatus,
                    background: p.status === 'dispensed' ? '#e8f7f4' : '#fef3e2',
                    color: p.status === 'dispensed' ? '#1a6b5a' : '#b7600e',
                    borderColor: p.status === 'dispensed' ? '#b8e8df' : '#fad5a5',
                  }}>
                    {p.status === 'dispensed' ? '✓ Dispensed' : '⏳ Issued'}
                  </span>
                </div>

                <div style={{ padding: '4px 0' }}>
                  {p.items.map(item => (
                    <div key={item.id} style={s.histItem}>
                      <div>
                        <span style={s.histMedName}>{item.medicine.name}</span>
                        <span style={s.histMedStrength}> {item.medicine.dosage_strength}</span>
                        <span style={s.histInstructions}> · {item.dosage_instructions}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={s.histStat}>{item.duration_days}d</span>
                        <span style={s.histStat}>×{item.quantity_prescribed}</span>
                        <span style={{
                          ...s.histAvailBadge,
                          background: item.available_at_issue ? '#e8f7f4' : '#fdf0ef',
                          color: item.available_at_issue ? '#1a6b5a' : '#c0392b',
                          borderColor: item.available_at_issue ? '#b8e8df' : '#f5c6c4',
                        }}>
                          {item.available_at_issue ? 'In stock' : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', background: '#f4f9fc', fontFamily: "'DM Sans', sans-serif" },

  header: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #ddeaf2', padding: '0 2.5rem', height: '64px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 1px 12px rgba(26,107,138,0.06)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  headerLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
  headerLogoIcon: {
    width: '34px', height: '34px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #1a6b8a, #2a9d8f)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  headerLogoText: { fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: '600', color: '#1a2e3b' },
  headerDivider: { width: '1px', height: '22px', background: '#ddeaf2' },
  headerRole: { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#5a8a9a', fontWeight: '500' },
  headerRoleDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#1a6b8a', boxShadow: '0 0 0 2px rgba(26,107,138,0.2)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerUser: { display: 'flex', alignItems: 'center', gap: '10px', marginRight: '4px' },
  userAvatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a3a4a, #1a6b8a)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: '600',
  },
  userName: { fontSize: '13.5px', fontWeight: '600', color: '#1a2e3b' },
  userRole: { fontSize: '11px', color: '#7a9aaa' },

  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 2.5rem' },

  pageTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '1.8rem',
    flexWrap: 'wrap', gap: '1rem',
  },
  pageTitleText: { fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: '600', color: '#1a2e3b' },
  pageTitleSub: { fontSize: '14px', color: '#7a9aaa', marginTop: '4px' },
  stats: { display: 'flex', gap: '12px' },
  statLabel: { fontSize: '12px', color: '#7a9aaa', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: '26px', fontWeight: '600', color: '#1a2e3b', fontFamily: "'Playfair Display', serif" },

  tabBar: { display: 'flex', borderBottom: '1.5px solid #ddeaf2', marginBottom: '1.5rem', gap: '4px' },

  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  rightCol: {},

  stepCard: {
    background: '#fff', border: '1px solid #ddeaf2', borderRadius: '16px',
    padding: '1.4rem', boxShadow: '0 2px 12px rgba(26,107,138,0.05)',
  },
  stepHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.1rem' },
  stepNum: {
    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #1a6b8a, #2a9d8f)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: '700',
  },
  stepTitle: { fontSize: '14.5px', fontWeight: '600', color: '#1a2e3b' },
  stepSub: { fontSize: '12px', color: '#7a9aaa', marginTop: '1px' },

  dropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
    background: '#fff', border: '1px solid #ddeaf2', borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(26,107,138,0.12)', zIndex: 50,
    maxHeight: '220px', overflowY: 'auto',
  },
  patientAvatar: {
    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #1a6b8a, #2a9d8f)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '600',
  },
  ddPatientName: { fontSize: '14px', fontWeight: '600', color: '#1a2e3b' },
  ddPatientSub: { fontSize: '12px', color: '#7a9aaa', marginTop: '1px' },
  ddMedName: { fontSize: '14px', fontWeight: '600', color: '#1a2e3b' },
  ddMedStrength: { fontWeight: '400', color: '#5a8a9a' },
  ddMedSub: { fontSize: '12px', color: '#7a9aaa', marginTop: '1px' },

  noResults: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 4px', marginTop: '6px',
  },
  noResultsText: { fontSize: '13.5px', color: '#7a9aaa' },

  inlineForm: {
    marginTop: '12px', background: '#f7fbfe',
    border: '1.5px solid #ddeaf2', borderRadius: '12px', padding: '14px',
  },
  inlineFormHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  inlineFormTitle: { fontSize: '14px', fontWeight: '600', color: '#1a2e3b' },

  selectedPatient: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', marginTop: '10px',
    background: '#e8f7f4', border: '1px solid #b8e8df', borderRadius: '10px',
  },
  selectedPatientAvatar: {
    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
    background: '#2a9d8f', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '600',
  },
  selectedPatientName: { fontSize: '14px', fontWeight: '600', color: '#1a6b5a' },
  selectedPatientMeta: { fontSize: '12px', color: '#2a9d8f', marginTop: '1px' },
  selectedTick: { fontSize: '16px', color: '#2a9d8f', fontWeight: '700' },

  availBanner: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: '9px', border: '1px solid',
    fontSize: '13.5px', fontWeight: '600', marginTop: '10px',
  },

  formLabel: { display: 'block', fontSize: '12px', fontWeight: '500', color: '#5a8a9a', marginBottom: '6px', letterSpacing: '0.2px' },

  previewCard: {
    background: '#fff', border: '1px solid #ddeaf2', borderRadius: '16px',
    padding: '1.4rem', boxShadow: '0 2px 12px rgba(26,107,138,0.05)',
    position: 'sticky', top: '80px',
  },
  previewHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' },
  previewIcon: {
    width: '34px', height: '34px', borderRadius: '9px',
    background: '#e8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  previewTitle: { fontSize: '14.5px', fontWeight: '600', color: '#1a2e3b' },
  previewSub: { fontSize: '12px', color: '#7a9aaa', marginTop: '1px' },

  previewEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '2.5rem 1rem', gap: '12px',
  },
  previewEmptyIcon: {
    width: '60px', height: '60px', borderRadius: '50%',
    background: '#f0f8fc', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  previewEmptyText: { fontSize: '13.5px', color: '#9bb5c5', textAlign: 'center', maxWidth: '200px' },

  previewPatient: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', background: '#f7fbfe',
    border: '1px solid #eef4f8', borderRadius: '10px', marginBottom: '10px',
  },
  previewPatientAvatar: {
    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #1a3a4a, #1a6b8a)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '600',
  },
  previewPatientName: { fontSize: '14px', fontWeight: '600', color: '#1a2e3b' },
  previewPatientMeta: { fontSize: '12px', color: '#7a9aaa', marginTop: '1px' },

  noteBanner: {
    display: 'flex', gap: '10px', alignItems: 'flex-start',
    padding: '10px 12px', marginBottom: '10px',
    background: '#fffbf0', border: '1px solid #fde8c8', borderRadius: '9px',
  },
  noteBannerIcon: { fontSize: '16px', marginTop: '1px', flexShrink: 0 },
  noteBannerLabel: { fontSize: '11.5px', fontWeight: '700', color: '#b7600e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' },
  noteBannerText: { fontSize: '13px', color: '#7a6030', lineHeight: '1.5' },

  previewNoMeds: { fontSize: '13px', color: '#9bb5c5', textAlign: 'center', padding: '1.5rem 0' },

  rxItemInner: {
    padding: '12px 14px',
  },
  rxItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' },
  rxItemName: { fontSize: '14px', fontWeight: '600', color: '#1a2e3b' },
  rxItemStrength: { fontWeight: '400', color: '#5a8a9a' },
  rxItemBottom: { display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#7a9aaa' },
  rxItemStats: { color: '#3a6b7a', fontWeight: '600' },
  alertPill: {
    padding: '2px 9px', borderRadius: '999px',
    background: '#fdf0ef', color: '#c0392b',
    fontSize: '11.5px', fontWeight: '600', border: '1px solid #f5c6c4',
  },

  historyToolbar: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '1rem',
  },
  toolbarLabel: { fontSize: '13.5px', color: '#7a9aaa', fontWeight: '500' },

  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '12px', padding: '3rem',
  },

  histHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', background: '#fafcfe', borderBottom: '1px solid #eef4f8',
  },
  histAvatar: {
    width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #1a3a4a, #1a6b8a)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: '600',
  },
  histPatientName: { fontSize: '14.5px', fontWeight: '600', color: '#1a2e3b' },
  histMeta: { fontSize: '12px', color: '#7a9aaa', marginTop: '2px' },
  histStatus: {
    padding: '4px 12px', borderRadius: '999px',
    fontSize: '12.5px', fontWeight: '600', border: '1px solid',
  },
  histItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 18px', borderBottom: '1px solid #f4f9fc',
  },
  histMedName: { fontSize: '14px', fontWeight: '600', color: '#1a2e3b' },
  histMedStrength: { fontSize: '13px', color: '#5a8a9a' },
  histInstructions: { fontSize: '13px', color: '#7a9aaa' },
  histStat: {
    fontSize: '12px', fontWeight: '600', color: '#3a6b7a',
    background: '#eef4f8', padding: '3px 8px', borderRadius: '6px',
  },
  histAvailBadge: {
    padding: '3px 10px', borderRadius: '999px',
    fontSize: '11.5px', fontWeight: '600', border: '1px solid',
  },

  modalHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' },
  modalIconWrap: {
    width: '38px', height: '38px', borderRadius: '10px',
    background: '#e8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  modalTitle: { fontSize: '17px', fontWeight: '600', color: '#1a2e3b', fontFamily: "'Playfair Display', serif" },
  modalSub: { fontSize: '12.5px', color: '#7a9aaa', marginTop: '2px' },
  modalDivider: { height: '1px', background: '#eef4f8', margin: '0 0 1.2rem' },
};

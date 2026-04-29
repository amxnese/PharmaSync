import { useState, useEffect, useRef } from 'react';
import { getFullName, logout } from '../api/auth';
import { useNavigate } from 'react-router-dom';

import {
  searchPatients, createPatient, updatePatient, deletePatient,
  searchMedicines, createPrescription, addItemToPrescription,
  updatePrescriptionItem, deletePrescriptionItem,
  issuePrescription, getPrescriptionHistory,
  checkMedicineAvailability,
} from '../api/doctor';

export default function DoctorHome() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('new');  // 'new' | 'history'

  // --- Patient state ---
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name: '', date_of_birth: '', gender: 'M', phone: '', notes: '' });

  // --- Prescription state ---
  const [prescription, setPrescription] = useState(null); // current draft prescription
  const [prescriptionItems, setPrescriptionItems] = useState([]);

  // --- Medicine search state ---
  const [medQuery, setMedQuery] = useState('');
  const [medResults, setMedResults] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [itemForm, setItemForm] = useState({ dosage_instructions: '', duration_days: '', quantity_prescribed: '' });
  const [showMedDropdown, setShowMedDropdown] = useState(false);
  const [medAvailability, setMedAvailability] = useState(null); // null | { available, quantity, unit }

  // --- History state ---
  const [history, setHistory] = useState([]);

  // patient edit modal
  const [editingPatient, setEditingPatient] = useState(null);
  const [editPatientForm, setEditPatientForm] = useState({});

  // prescription item editing
  const [editingItem, setEditingItem] = useState(null);
  const [editItemForm, setEditItemForm] = useState({});

  // history search
  const [historySearch, setHistorySearch] = useState('');

  // this must come AFTER historySearch is declared
  const filteredHistory = history.filter(p =>
    p.patient.full_name.toLowerCase().includes(historySearch.toLowerCase())
  );

  const medSearchRef = useRef(null);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab]);

  // close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (medSearchRef.current && !medSearchRef.current.contains(e.target)) {
        setShowMedDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchHistory = async () => {
    const res = await getPrescriptionHistory();
    setHistory(res.data);
  };

  // ── PATIENT SEARCH ──
  // fires on every keystroke, searches after 2 characters
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
    // immediately create a draft prescription for this patient
    const res = await createPrescription(patient.id);
    setPrescription(res.data);
    setPrescriptionItems([]);
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    const res = await createPatient(newPatient);
    setNewPatient({ full_name: '', date_of_birth: '', gender: 'M', phone: '' });
    setShowCreatePatient(false);
    handleSelectPatient(res.data); // select the new patient right away
  };

  // ── MEDICINE SEARCH ──


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
    setMedQuery(med.name + ' ' + med.dosage_strength);
    setShowMedDropdown(false);
    // check availability immediately
    const res = await checkMedicineAvailability(med.id);
    setMedAvailability(res.data);
  };

  // ── ADD ITEM TO PRESCRIPTION ──
  // this is where the alert comes back from the backend
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedMed || !prescription) return;

    const res = await addItemToPrescription(prescription.id, {
      medicine_id: selectedMed.id,
      dosage_instructions: itemForm.dosage_instructions,
      duration_days: parseInt(itemForm.duration_days),
      quantity_prescribed: parseInt(itemForm.quantity_prescribed),
    });

    // res.data = { item, alert }
    // alert: true means medicine was out of stock when added
    setPrescriptionItems(prev => [...prev, { ...res.data.item, alert: res.data.alert }]);

    // reset medicine form
    setSelectedMed(null);
    setMedQuery('');
    setItemForm({ dosage_instructions: '', duration_days: '', quantity_prescribed: '' });
  };

  // ── ISSUE PRESCRIPTION ──
  const handleIssue = async () => {
    if (!prescription || prescriptionItems.length === 0) return;
    await issuePrescription(prescription.id);
    // reset everything for a new prescription
    setPrescription(null);
    setPrescriptionItems([]);
    setSelectedPatient(null);
    setPatientQuery('');
    alert('Prescription issued successfully.');
  };

  // ── PATIENT EDIT / DELETE ──
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
    await updatePatient(editingPatient.id, editPatientForm);
    // update selected patient in state so notes refresh instantly
    setSelectedPatient(prev => ({ ...prev, ...editPatientForm }));
    setEditingPatient(null);
  };

  const handleDeletePatient = async (patient) => {
    if (!window.confirm(`Delete patient ${patient.full_name}? This cannot be undone.`)) return;
    await deletePatient(patient.id);
    // reset prescription state if this was the selected patient
    setSelectedPatient(null);
    setPatientQuery('');
    setPrescription(null);
    setPrescriptionItems([]);
  };

  // ── PRESCRIPTION ITEM EDIT / DELETE ──
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
    await updatePrescriptionItem(prescription.id, editingItem.id, editItemForm);
    // update item in local state without refetching
    setPrescriptionItems(prev =>
      prev.map(i => i.id === editingItem.id ? { ...i, ...editItemForm } : i)
    );
    setEditingItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Remove this medicine from the prescription?')) return;
    await deletePrescriptionItem(prescription.id, itemId);
    setPrescriptionItems(prev => prev.filter(i => i.id !== itemId));
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Doctor Dashboard</h2>
        <div style={styles.headerRight}>
          <span style={styles.name}>{getFullName()}</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
          <button onClick={() => navigate('/change-password')} style={styles.changePwdBtn}>
            Change Password
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === 'new' ? styles.activeTab : {}) }} onClick={() => setTab('new')}>
          New Prescription
        </button>
        <button style={{ ...styles.tab, ...(tab === 'history' ? styles.activeTab : {}) }} onClick={() => setTab('history')}>
          History
        </button>
      </div>

      <div style={styles.content}>

        {/* ── NEW PRESCRIPTION TAB ── */}
        {tab === 'new' && (
          <div style={styles.twoCol}>

            {/* LEFT — Patient + Medicine selection */}
            <div style={styles.leftCol}>

              {/* Patient Search */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>1. Find Patient</h3>
                <input
                  placeholder="Type patient name..."
                  value={patientQuery}
                  onChange={handlePatientSearch}
                  style={styles.input}
                />

                {/* Search results dropdown */}
                {patientResults.length > 0 && (
                  <div style={styles.dropdown}>
                    {patientResults.map(p => (
                      <div key={p.id} style={styles.dropdownItem}>
                        <div style={{ flex: 1 }} onClick={() => handleSelectPatient(p)}>
                          <span style={styles.dropdownName}>{p.full_name}</span>
                          <span style={styles.dropdownSub}>{p.date_of_birth} · {p.gender}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button style={styles.iconBtn} onClick={(e) => { e.stopPropagation(); handleEditPatient(p); }}>✏️</button>
                          <button style={styles.iconBtnRed} onClick={(e) => { e.stopPropagation(); handleDeletePatient(p); }}>🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results — offer to create */}
                {patientQuery.length >= 2 && patientResults.length === 0 && !selectedPatient && (
                  <div style={styles.noResults}>
                    <span>No patient found.</span>
                    <button style={styles.linkBtn} onClick={() => setShowCreatePatient(true)}>
                      + Create new patient
                    </button>
                  </div>
                )}

                {/* Create patient inline form */}
                {showCreatePatient && (
                  <form onSubmit={handleCreatePatient} style={styles.inlineForm}>
                    <h4 style={{ margin: '0 0 0.8rem' }}>New Patient</h4>
                    <input placeholder="Full name" required style={styles.input}
                      value={newPatient.full_name}
                      onChange={e => setNewPatient({ ...newPatient, full_name: e.target.value })} />
                    <input type="date" required style={styles.input}
                      value={newPatient.date_of_birth}
                      onChange={e => setNewPatient({ ...newPatient, date_of_birth: e.target.value })} />
                    <select style={styles.input}
                      value={newPatient.gender}
                      onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                    <input placeholder="Phone (optional)" style={styles.input}
                      value={newPatient.phone}
                      onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
                    <textarea
                      placeholder="Patient notes — allergies, chronic conditions, anything relevant..."
                      style={{ ...styles.input, resize: 'vertical', minHeight: '80px' }}
                      value={newPatient.notes}
                      onChange={e => setNewPatient({ ...newPatient, notes: e.target.value })}
                    />
                    <button type="submit" style={styles.submitBtn}>Create & Select</button>
                  </form>
                )}

                {/* Selected patient confirmation */}
                {selectedPatient && (
                  <div style={styles.selectedBadge}>
                    ✓ {selectedPatient.full_name} selected
                  </div>
                )}
              </div>

              {/* Medicine Search — only shown after patient is selected */}
              {prescription && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>2. Add Medicine</h3>

                  <div style={{ position: 'relative' }} ref={medSearchRef}>
                    <input
                      placeholder="Search medicine name..."
                      value={medQuery}
                      onChange={handleMedSearch}
                      style={styles.input}
                    />
                    {showMedDropdown && medResults.length > 0 && (
                      <div style={styles.dropdown}>
                        {medResults.map(m => (
                          <div key={m.id} style={styles.dropdownItem} onClick={() => handleSelectMed(m)}>
                            <span style={styles.dropdownName}>{m.name} {m.dosage_strength}</span>
                            <span style={styles.dropdownSub}>{m.form} · {m.generic_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>


                  {selectedMed && (
                    <>
                      {/* Availability indicator — shows before the form */}
                      {medAvailability !== null && (
                        <div style={{
                          padding: '0.6rem 1rem',
                          borderRadius: '7px',
                          marginBottom: '0.8rem',
                          backgroundColor: medAvailability.available ? '#d1fae5' : '#fee2e2',
                          color: medAvailability.available ? '#065f46' : '#991b1b',
                          fontWeight: '600',
                          fontSize: '0.88rem',
                        }}>
                          {medAvailability.available
                            ? `✓ In stock — ${medAvailability.quantity} ${medAvailability.unit} available`
                            : '⚠ This medicine is currently out of stock'}
                        </div>
                      )}

                      <form onSubmit={handleAddItem} style={styles.inlineForm}>
                        <input
                          placeholder="Dosage instructions e.g. 1 tablet twice a day"
                          required style={styles.input}
                          value={itemForm.dosage_instructions}
                          onChange={e => setItemForm({ ...itemForm, dosage_instructions: e.target.value })}
                        />
                        <div style={styles.twoInputRow}>
                          <input
                            type="number" placeholder="Duration (days)" required min="1"
                            style={styles.input}
                            value={itemForm.duration_days}
                            onChange={e => setItemForm({ ...itemForm, duration_days: e.target.value })}
                          />
                          <input
                            type="number" placeholder="Qty to prescribe" required min="1"
                            style={styles.input}
                            value={itemForm.quantity_prescribed}
                            onChange={e => setItemForm({ ...itemForm, quantity_prescribed: e.target.value })}
                          />
                        </div>
                        <button type="submit" style={styles.submitBtn}>Add to Prescription</button>
                      </form>
                    </>
                  )}


                </div>
              )}
            </div>

            {/* RIGHT — Live prescription preview */}
            <div style={styles.rightCol}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Prescription Preview</h3>

                {!prescription && (
                  <p style={styles.emptyMsg}>Select a patient to start a prescription.</p>
                )}

                {prescription && (
                  <>

                    <div style={styles.prescriptionMeta}>
                      <span><strong>Patient:</strong> {selectedPatient?.full_name}</span>
                      {selectedPatient?.notes && (
                        <div style={styles.patientNote}>
                          <span style={styles.patientNoteLabel}>⚠ Patient Notes:</span> {selectedPatient.notes}
                        </div>
                      )}
                    </div>

                    {prescriptionItems.length === 0 && (
                      <p style={styles.emptyMsg}>No medicines added yet.</p>
                    )}

                    {prescriptionItems.map((item, idx) => (
                      <div key={idx} style={{
                        ...styles.prescriptionItem,
                        borderLeft: item.alert ? '4px solid #ef4444' : '4px solid #10b981',
                      }}>
                        {/* editing this item inline */}
                        {editingItem?.id === item.id ? (
                          <form onSubmit={handleUpdateItem} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input style={styles.input} value={editItemForm.dosage_instructions}
                              onChange={e => setEditItemForm({ ...editItemForm, dosage_instructions: e.target.value })}
                              placeholder="Dosage instructions" required />
                            <div style={styles.twoInputRow}>
                              <input style={styles.input} type="number" value={editItemForm.duration_days}
                                onChange={e => setEditItemForm({ ...editItemForm, duration_days: e.target.value })}
                                placeholder="Days" required />
                              <input style={styles.input} type="number" value={editItemForm.quantity_prescribed}
                                onChange={e => setEditItemForm({ ...editItemForm, quantity_prescribed: e.target.value })}
                                placeholder="Qty" required />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button type="submit" style={styles.submitBtn}>Save</button>
                              <button type="button" style={styles.cancelBtn} onClick={() => setEditingItem(null)}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div style={styles.itemHeader}>
                              <span style={styles.itemName}>
                                {item.medicine.name} {item.medicine.dosage_strength}
                              </span>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                {item.alert && <span style={styles.alertBadge}>⚠ Not in stock</span>}
                                <button style={styles.iconBtn} onClick={() => handleEditItem(item)}>✏️</button>
                                <button style={styles.iconBtnRed} onClick={() => handleDeleteItem(item.id)}>🗑</button>
                              </div>
                            </div>
                            <div style={styles.itemDetails}>
                              <span>{item.dosage_instructions}</span>
                              <span>{item.duration_days} days · {item.quantity_prescribed} units</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {prescriptionItems.length > 0 && (
                      <button style={styles.issueBtn} onClick={handleIssue}>
                        Issue Prescription
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Your Prescriptions</h3>
              <input
                placeholder="Search by patient name..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                style={{ ...styles.input, width: '260px', marginBottom: 0 }}
              />
            </div>

            {filteredHistory.length === 0 && <p style={{ color: '#888' }}>No prescriptions found.</p>}

            {filteredHistory.map(p => (
              <div key={p.id} style={styles.historyCard}>
                <div style={styles.historyHeader}>
                  <div>
                    <span style={styles.patientName}>{p.patient.full_name}</span>
                    <span style={styles.historyDate}>
                      {new Date(p.issued_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: p.status === 'dispensed' ? '#d1fae5' : '#fef3c7',
                    color: p.status === 'dispensed' ? '#065f46' : '#92400e',
                  }}>
                    {p.status === 'dispensed' ? 'Dispensed' : 'Issued'}
                  </span>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHead}>
                      <th style={styles.th}>Medicine</th>
                      <th style={styles.th}>Instructions</th>
                      <th style={styles.th}>Duration</th>
                      <th style={styles.th}>Qty</th>
                      <th style={styles.th}>Stock at issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.items.map(item => (
                      <tr key={item.id} style={styles.tr}>
                        <td style={styles.td}>{item.medicine.name} {item.medicine.dosage_strength}</td>
                        <td style={styles.td}>{item.dosage_instructions}</td>
                        <td style={styles.td}>{item.duration_days} days</td>
                        <td style={styles.td}>{item.quantity_prescribed}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.stockBadge,
                            backgroundColor: item.available_at_issue ? '#d1fae5' : '#fee2e2',
                            color: item.available_at_issue ? '#065f46' : '#991b1b',
                          }}>
                            {item.available_at_issue ? 'In stock' : 'Out of stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
      {editingPatient && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ margin: '0 0 1rem' }}>Edit Patient</h3>
            <form onSubmit={handleUpdatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <input placeholder="Full name" required style={styles.input}
                value={editPatientForm.full_name}
                onChange={e => setEditPatientForm({ ...editPatientForm, full_name: e.target.value })} />
              <input type="date" required style={styles.input}
                value={editPatientForm.date_of_birth}
                onChange={e => setEditPatientForm({ ...editPatientForm, date_of_birth: e.target.value })} />
              <select style={styles.input}
                value={editPatientForm.gender}
                onChange={e => setEditPatientForm({ ...editPatientForm, gender: e.target.value })}>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
              <input placeholder="Phone (optional)" style={styles.input}
                value={editPatientForm.phone}
                onChange={e => setEditPatientForm({ ...editPatientForm, phone: e.target.value })} />
              <textarea placeholder="Notes" style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                value={editPatientForm.notes}
                onChange={e => setEditPatientForm({ ...editPatientForm, notes: e.target.value })} />
              <div style={{ display: 'flex', gap: '0.7rem' }}>
                <button type="submit" style={styles.submitBtn}>Save Changes</button>
                <button type="button" style={styles.cancelBtn} onClick={() => setEditingPatient(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: 'sans-serif' },
  header: {
    backgroundColor: '#fff', padding: '1rem 2rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  headerTitle: { margin: 0, fontSize: '1.3rem', color: '#1a1a2e' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  name: { color: '#555', fontSize: '0.95rem' },
  logoutBtn: {
    padding: '0.4rem 1rem', backgroundColor: '#ef4444',
    color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
  },
  tabs: {
    display: 'flex', backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb', padding: '0 2rem',
  },
  tab: {
    padding: '0.8rem 1.5rem', border: 'none', background: 'none',
    cursor: 'pointer', fontSize: '0.95rem', color: '#666', borderBottom: '3px solid transparent',
  },
  activeTab: { color: '#2563eb', borderBottom: '3px solid #2563eb', fontWeight: '600' },
  content: { padding: '2rem' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  rightCol: {},
  card: {
    backgroundColor: '#fff', borderRadius: '10px', padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: { margin: '0 0 1rem', fontSize: '1rem', color: '#1a1a2e', fontWeight: '700' },
  input: {
    width: '100%', padding: '0.6rem 0.9rem', borderRadius: '7px',
    border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box', marginBottom: '0.6rem',
  },
  dropdown: {
    border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'absolute',
    zIndex: 10, width: '100%', maxHeight: '200px', overflowY: 'auto',
  },
  dropdownItem: {
    padding: '0.7rem 1rem', cursor: 'pointer', display: 'flex',
    flexDirection: 'column', borderBottom: '1px solid #f1f5f9',
  },
  dropdownName: { fontWeight: '600', color: '#1a1a2e', fontSize: '0.9rem' },
  dropdownSub: { fontSize: '0.8rem', color: '#888' },
  noResults: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '0.6rem 0', color: '#666', fontSize: '0.9rem',
  },
  linkBtn: {
    background: 'none', border: 'none', color: '#2563eb',
    cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
  },
  inlineForm: { marginTop: '0.8rem', display: 'flex', flexDirection: 'column' },
  twoInputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' },
  submitBtn: {
    padding: '0.6rem 1.2rem', backgroundColor: '#2563eb',
    color: '#fff', border: 'none', borderRadius: '7px',
    cursor: 'pointer', fontWeight: '600', marginTop: '0.2rem',
  },
  selectedBadge: {
    marginTop: '0.8rem', padding: '0.5rem 1rem', backgroundColor: '#d1fae5',
    color: '#065f46', borderRadius: '7px', fontWeight: '600', fontSize: '0.9rem',
  },
  prescriptionMeta: { marginBottom: '1rem', fontSize: '0.9rem', color: '#444' },
  emptyMsg: { color: '#aaa', fontSize: '0.9rem' },
  prescriptionItem: {
    padding: '0.8rem 1rem', borderRadius: '8px', backgroundColor: '#f8fafc',
    marginBottom: '0.7rem',
  },
  itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontWeight: '700', color: '#1a1a2e', fontSize: '0.95rem' },
  alertBadge: {
    backgroundColor: '#fee2e2', color: '#991b1b',
    padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '600',
  },
  itemDetails: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.82rem', color: '#666', marginTop: '0.3rem',
  },
  issueBtn: {
    marginTop: '1rem', width: '100%', padding: '0.8rem',
    backgroundColor: '#059669', color: '#fff', border: 'none',
    borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
  },
  sectionTitle: { margin: '0 0 1rem', fontSize: '1.1rem', color: '#1a1a2e' },
  historyCard: {
    backgroundColor: '#fff', borderRadius: '10px', padding: '1.2rem',
    marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  historyHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '0.8rem',
  },
  patientName: { fontWeight: '700', fontSize: '1rem', color: '#1a1a2e', marginRight: '0.8rem' },
  historyDate: { fontSize: '0.85rem', color: '#888' },
  statusBadge: {
    padding: '0.25rem 0.8rem', borderRadius: '999px',
    fontSize: '0.8rem', fontWeight: '600',
  },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' },
  tableHead: { backgroundColor: '#f8fafc' },
  th: { padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.82rem', color: '#666', fontWeight: '600' },
  tr: { borderTop: '1px solid #f1f5f9' },
  td: { padding: '0.7rem 1rem', fontSize: '0.88rem', color: '#333' },
  stockBadge: {
    padding: '0.2rem 0.6rem', borderRadius: '999px',
    fontSize: '0.78rem', fontWeight: '600',
  },
  changePwdBtn: {
    padding: '0.4rem 1rem', backgroundColor: '#f1f5f9',
    color: '#444', border: 'none', borderRadius: '6px', cursor: 'pointer',
  },
  patientNote: {
    marginTop: '0.6rem',
    padding: '0.6rem 1rem',
    backgroundColor: '#fffbeb',
    borderLeft: '4px solid #f59e0b',
    borderRadius: '6px',
    fontSize: '0.88rem',
    color: '#92400e',
  },
  patientNoteLabel: {
    fontWeight: '700',
  },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem',
  },
  iconBtnRed: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem',
  },
  cancelBtn: {
    padding: '0.6rem 1.2rem', backgroundColor: '#f1f5f9',
    color: '#444', border: 'none', borderRadius: '7px', cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '2rem',
    width: '100%', maxWidth: '440px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
  },
};
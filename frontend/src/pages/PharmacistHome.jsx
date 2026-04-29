import { useState, useEffect } from 'react';
import { getFullName, logout } from '../api/auth';
import {
  getInventory,
  getPrescriptions,
  dispensePrescription,
  addMedicine,
  incrementInventory,
} from '../api/pharmacy';

import { useNavigate } from 'react-router-dom';

export default function PharmacistHome() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('inventory'); // 'inventory' | 'prescriptions'
  const [inventory, setInventory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Add medicine form state ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '', generic_name: '', form: 'tablet',
    dosage_strength: '', quantity: 0, unit: 'boxes'
  });

  // --- Increment state: tracks which inventory row is being incremented ---
  const [incrementing, setIncrementing] = useState({}); // { [inventoryId]: amountString }

  useEffect(() => {
    fetchInventory();
    fetchPrescriptions();
  }, []);

  const fetchInventory = async () => {
    const res = await getInventory();
    setInventory(res.data);
  };

  const fetchPrescriptions = async (name = '') => {
    const res = await getPrescriptions(name);
    setPrescriptions(res.data);
  };

  // search by patient name
  const handleSearch = (e) => {
    const val = e.target.value;
    setPatientSearch(val);
    fetchPrescriptions(val);
  };

  const handleDispense = async (id) => {
    await dispensePrescription(id);
    fetchPrescriptions(patientSearch); // refresh list
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addMedicine({ ...newMedicine, quantity: parseInt(newMedicine.quantity) });
      setShowAddForm(false);
      setNewMedicine({ name: '', generic_name: '', form: 'tablet', dosage_strength: '', quantity: 0, unit: 'boxes' });
      fetchInventory();
    } catch (err) {
      alert('Failed to add medicine. Check the fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async (inventoryId) => {
    const amount = parseInt(incrementing[inventoryId]);
    if (!amount || amount <= 0) return alert('Enter a valid amount');
    await incrementInventory(inventoryId, amount);
    setIncrementing(prev => ({ ...prev, [inventoryId]: '' }));
    fetchInventory();
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Pharmacy Dashboard</h2>
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
        <button
          style={{ ...styles.tab, ...(tab === 'inventory' ? styles.activeTab : {}) }}
          onClick={() => setTab('inventory')}
        >
          Inventory
        </button>
        <button
          style={{ ...styles.tab, ...(tab === 'prescriptions' ? styles.activeTab : {}) }}
          onClick={() => setTab('prescriptions')}
        >
          Prescriptions
        </button>
      </div>

      <div style={styles.content}>
        {/* ── INVENTORY TAB ── */}
        {tab === 'inventory' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Current Inventory</h3>
              <button style={styles.addBtn} onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Cancel' : '+ Add Medicine'}
              </button>
            </div>

            {/* Add Medicine Form */}
            {showAddForm && (
              <form onSubmit={handleAddMedicine} style={styles.form}>
                <h4 style={{ margin: '0 0 1rem' }}>New Medicine</h4>
                <div style={styles.formGrid}>
                  <input placeholder="Commercial name" required style={styles.input}
                    value={newMedicine.name}
                    onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })} />
                  <input placeholder="Generic name (active ingredient)" required style={styles.input}
                    value={newMedicine.generic_name}
                    onChange={e => setNewMedicine({ ...newMedicine, generic_name: e.target.value })} />
                  <select style={styles.input}
                    value={newMedicine.form}
                    onChange={e => setNewMedicine({ ...newMedicine, form: e.target.value })}>
                    <option value="tablet">Tablet</option>
                    <option value="syrup">Syrup</option>
                    <option value="injection">Injection</option>
                    <option value="cream">Cream</option>
                  </select>
                  <input placeholder="Dosage strength e.g. 500mg" required style={styles.input}
                    value={newMedicine.dosage_strength}
                    onChange={e => setNewMedicine({ ...newMedicine, dosage_strength: e.target.value })} />
                  <input placeholder="Initial quantity" type="number" min="0" style={styles.input}
                    value={newMedicine.quantity}
                    onChange={e => setNewMedicine({ ...newMedicine, quantity: e.target.value })} />
                  <input placeholder="Unit (boxes, vials...)" required style={styles.input}
                    value={newMedicine.unit}
                    onChange={e => setNewMedicine({ ...newMedicine, unit: e.target.value })} />
                </div>
                <button type="submit" style={styles.submitBtn} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Medicine'}
                </button>
              </form>
            )}

            {/* Inventory Table */}
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHead}>
                  <th style={styles.th}>Medicine</th>
                  <th style={styles.th}>Form</th>
                  <th style={styles.th}>Strength</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Add Stock</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.medName}>{item.medicine.name}</div>
                      <div style={styles.medGeneric}>{item.medicine.generic_name}</div>
                    </td>
                    <td style={styles.td}>{item.medicine.form}</td>
                    <td style={styles.td}>{item.medicine.dosage_strength}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.stockBadge,
                        backgroundColor: item.quantity > 0 ? '#d1fae5' : '#fee2e2',
                        color: item.quantity > 0 ? '#065f46' : '#991b1b',
                      }}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.incrementRow}>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          style={styles.incrementInput}
                          value={incrementing[item.id] || ''}
                          onChange={e => setIncrementing(prev => ({ ...prev, [item.id]: e.target.value }))}
                        />
                        <button
                          style={styles.incrementBtn}
                          onClick={() => handleIncrement(item.id)}
                        >+</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PRESCRIPTIONS TAB ── */}
        {tab === 'prescriptions' && (
          <div>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Prescriptions</h3>
              <input
                placeholder="Search by patient name..."
                value={patientSearch}
                onChange={handleSearch}
                style={{ ...styles.input, width: '260px' }}
              />
            </div>

            {prescriptions.length === 0 && (
              <p style={{ color: '#888' }}>No prescriptions found.</p>
            )}

            {prescriptions.map(p => (
              <div key={p.id} style={styles.prescriptionCard}>
                <div style={styles.prescriptionHeader}>
                  <div>
                    <span style={styles.patientName}>{p.patient.full_name}</span>
                    <span style={styles.doctorName}>Dr. {p.doctor.full_name}</span>
                  </div>
                  <div style={styles.rightSide}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: p.status === 'dispensed' ? '#d1fae5' : '#fef3c7',
                      color: p.status === 'dispensed' ? '#065f46' : '#92400e',
                    }}>
                      {p.status === 'dispensed' ? 'Done' : 'Pending'}
                    </span>
                    {p.status === 'issued' && (
                      <button
                        style={styles.dispenseBtn}
                        onClick={() => handleDispense(p.id)}
                      >
                        Mark as Dispensed
                      </button>
                    )}
                  </div>
                </div>

                {/* Prescription items */}
                <table style={{ ...styles.table, marginTop: '0.8rem' }}>
                  <thead>
                    <tr style={styles.tableHead}>
                      <th style={styles.th}>Medicine</th>
                      <th style={styles.th}>Instructions</th>
                      <th style={styles.th}>Duration</th>
                      <th style={styles.th}>Qty</th>
                      <th style={styles.th}>Available when prescribed</th>
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
                            {item.available_at_issue ? 'Was in stock' : 'Was out of stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {p.notes && <p style={styles.notes}>Notes: {p.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
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
    display: 'flex', gap: '0', backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb', padding: '0 2rem',
  },
  tab: {
    padding: '0.8rem 1.5rem', border: 'none', background: 'none',
    cursor: 'pointer', fontSize: '0.95rem', color: '#666', borderBottom: '3px solid transparent',
  },
  activeTab: { color: '#2563eb', borderBottom: '3px solid #2563eb', fontWeight: '600' },
  content: { padding: '2rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionTitle: { margin: 0, fontSize: '1.1rem', color: '#1a1a2e' },
  addBtn: {
    padding: '0.5rem 1.2rem', backgroundColor: '#2563eb',
    color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
  },
  form: {
    backgroundColor: '#fff', padding: '1.5rem', borderRadius: '10px',
    marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' },
  input: {
    padding: '0.6rem 0.9rem', borderRadius: '7px',
    border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none',
  },
  submitBtn: {
    padding: '0.6rem 1.5rem', backgroundColor: '#059669',
    color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: '600',
  },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden' },
  tableHead: { backgroundColor: '#f8fafc' },
  th: { padding: '0.8rem 1rem', textAlign: 'left', fontSize: '0.85rem', color: '#666', fontWeight: '600' },
  tr: { borderTop: '1px solid #f1f5f9' },
  td: { padding: '0.8rem 1rem', fontSize: '0.9rem', color: '#333' },
  medName: { fontWeight: '600', color: '#1a1a2e' },
  medGeneric: { fontSize: '0.8rem', color: '#888' },
  stockBadge: {
    padding: '0.25rem 0.7rem', borderRadius: '999px',
    fontSize: '0.8rem', fontWeight: '600',
  },
  incrementRow: { display: 'flex', gap: '0.4rem', alignItems: 'center' },
  incrementInput: {
    width: '60px', padding: '0.4rem 0.5rem',
    border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem',
  },
  incrementBtn: {
    padding: '0.4rem 0.7rem', backgroundColor: '#2563eb',
    color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700',
  },
  prescriptionCard: {
    backgroundColor: '#fff', borderRadius: '10px', padding: '1.2rem',
    marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  prescriptionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontWeight: '700', fontSize: '1rem', color: '#1a1a2e', marginRight: '0.8rem' },
  doctorName: { fontSize: '0.85rem', color: '#888' },
  rightSide: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  statusBadge: {
    padding: '0.25rem 0.8rem', borderRadius: '999px',
    fontSize: '0.8rem', fontWeight: '600',
  },
  dispenseBtn: {
    padding: '0.4rem 1rem', backgroundColor: '#059669',
    color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
  },
  notes: { marginTop: '0.8rem', fontSize: '0.85rem', color: '#666', fontStyle: 'italic' },
  changePwdBtn: {
    padding: '0.4rem 1rem', backgroundColor: '#f1f5f9',
    color: '#444', border: 'none', borderRadius: '6px', cursor: 'pointer',
  },
};
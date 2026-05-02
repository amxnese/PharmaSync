import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFullName, logout } from '../api/auth';
import {
  getInventory,
  getPrescriptions,
  dispensePrescription,
  addMedicine,
  incrementInventory,
} from '../api/pharmacy';

export default function PharmacistHome() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '', generic_name: '', form: 'tablet',
    dosage_strength: '', quantity: 0, unit: 'boxes'
  });
  const [incrementing, setIncrementing] = useState({});
  const [dispensingId, setDispensingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
    fetchInventory();
    fetchPrescriptions();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchInventory = async () => {
    try {
      const res = await getInventory();
      setInventory(res.data);
    } catch {}
  };

  const fetchPrescriptions = async (name = '') => {
    try {
      const res = await getPrescriptions(name);
      setPrescriptions(res.data);
    } catch {}
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setPatientSearch(val);
    fetchPrescriptions(val);
  };

  const handleDispense = async (id) => {
    setDispensingId(id);
    try {
      await dispensePrescription(id);
      fetchPrescriptions(patientSearch);
      fetchInventory();
      showToast('Prescription dispensed & inventory updated');
    } catch {
      showToast('Failed to dispense', 'error');
    } finally {
      setDispensingId(null);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addMedicine({ ...newMedicine, quantity: parseInt(newMedicine.quantity) });
      setShowAddForm(false);
      setNewMedicine({ name: '', generic_name: '', form: 'tablet', dosage_strength: '', quantity: 0, unit: 'boxes' });
      fetchInventory();
      showToast('Medicine added to inventory');
    } catch {
      showToast('Failed to add medicine', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async (inventoryId) => {
    const amount = parseInt(incrementing[inventoryId]);
    if (!amount || amount <= 0) return showToast('Enter a valid amount', 'error');
    try {
      await incrementInventory(inventoryId, amount);
      setIncrementing(prev => ({ ...prev, [inventoryId]: '' }));
      fetchInventory();
      showToast(`Stock updated +${amount}`);
    } catch {
      showToast('Failed to update stock', 'error');
    }
  };

  const pendingCount = prescriptions.filter(p => p.status === 'issued').length;
  const lowStockCount = inventory.filter(i => i.quantity === 0).length;

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .ph-input {
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
        }
        .ph-input:focus {
          border-color: #2a9d8f;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(42,157,143,0.1);
        }
        .ph-input::placeholder { color: #9bb5c5; }

        .ph-btn-primary {
          padding: 9px 20px;
          background: linear-gradient(135deg, #1a6b8a, #2a9d8f);
          color: #fff;
          border: none;
          border-radius: 9px;
          font-size: 13.5px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          white-space: nowrap;
        }
        .ph-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .ph-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .ph-btn-ghost {
          padding: 9px 18px;
          background: transparent;
          color: #3a6b7a;
          border: 1.5px solid #c8dfe9;
          border-radius: 9px;
          font-size: 13.5px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .ph-btn-ghost:hover { background: #f0f8fc; border-color: #2a9d8f; }

        .ph-btn-dispense {
          padding: 7px 16px;
          background: linear-gradient(135deg, #2a9d8f, #21867a);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }
        .ph-btn-dispense:hover { opacity: 0.88; transform: translateY(-1px); }
        .ph-btn-dispense:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .tab-btn {
          padding: 10px 22px;
          border: none;
          background: none;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          color: #7a9aaa;
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          transition: color 0.2s, border-color 0.2s;
          white-space: nowrap;
        }
        .tab-btn.active {
          color: #1a6b8a;
          border-bottom-color: #2a9d8f;
          font-weight: 600;
        }
        .tab-btn:hover:not(.active) { color: #3a6b7a; }

        .inv-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.2fr 1.4fr;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid #eef4f8;
          transition: background 0.15s;
          gap: 12px;
        }
        .inv-row:hover { background: #f7fbfe; }
        .inv-row:last-child { border-bottom: none; }

        .rx-card {
          background: #fff;
          border: 1px solid #ddeaf2;
          border-radius: 14px;
          margin-bottom: 14px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .rx-card:hover { box-shadow: 0 4px 20px rgba(26,107,138,0.08); }

        .stat-card {
          background: #fff;
          border-radius: 14px;
          padding: 18px 22px;
          border: 1px solid #ddeaf2;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(26,107,138,0.1); }

        .inc-btn {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #1a6b8a, #2a9d8f);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.2s, transform 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .inc-btn:hover { opacity: 0.88; transform: scale(1.05); }

        .page-enter { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .page-enter.visible { opacity: 1; transform: translateY(0); }

        .toast {
          position: fixed;
          bottom: 28px; right: 28px;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          color: #fff;
          z-index: 1000;
          animation: slideUp 0.3s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .logout-btn {
          padding: 7px 16px;
          background: transparent;
          color: #7a9aaa;
          border: 1.5px solid #ddeaf2;
          border-radius: 8px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .logout-btn:hover { background: #fdf0ef; color: #c0392b; border-color: #f5c6c4; }

        .change-pwd-btn {
          padding: 7px 14px;
          background: transparent;
          color: #3a6b7a;
          border: 1.5px solid #ddeaf2;
          border-radius: 8px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .change-pwd-btn:hover { background: #f0f8fc; border-color: #2a9d8f; }

        .spinner-sm {
          display: inline-block;
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 6px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ background: toast.type === 'error' ? '#c0392b' : '#2a9d8f' }}>
          {toast.type === 'error' ? '✕ ' : '✓ '}{toast.msg}
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
            Pharmacist Portal
          </div>
        </div>

        <div style={s.headerRight}>
          <div style={s.headerUser}>
            <div style={s.userAvatar}>
              {getFullName()?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div>
              <div style={s.userName}>{getFullName()}</div>
              <div style={s.userRole}>Pharmacist</div>
            </div>
          </div>
          <button className="change-pwd-btn" onClick={() => navigate('/change-password')}>
            🔑 Password
          </button>
          <button className="logout-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className={`page-enter ${mounted ? 'visible' : ''}`} style={s.main}>

        {/* Page title */}
        <div style={s.pageTitle}>
          <div>
            <h1 style={s.pageTitleText}>Pharmacy Dashboard</h1>
            <p style={s.pageTitleSub}>Manage inventory and prescription fulfillment</p>
          </div>

          {/* Stat cards */}
          <div style={s.stats}>
            <div className="stat-card">
              <div style={s.statLabel}>Total Medicines</div>
              <div style={s.statValue}>{inventory.length}</div>
            </div>
            <div className="stat-card" style={{ borderColor: lowStockCount > 0 ? '#f5c6c4' : '#ddeaf2' }}>
              <div style={s.statLabel}>Out of Stock</div>
              <div style={{ ...s.statValue, color: lowStockCount > 0 ? '#c0392b' : '#2a9d8f' }}>{lowStockCount}</div>
            </div>
            <div className="stat-card" style={{ borderColor: pendingCount > 0 ? '#fde8c8' : '#ddeaf2' }}>
              <div style={s.statLabel}>Pending Rx</div>
              <div style={{ ...s.statValue, color: pendingCount > 0 ? '#e67e22' : '#2a9d8f' }}>{pendingCount}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabBar}>
          <button className={`tab-btn ${tab === 'inventory' ? 'active' : ''}`} onClick={() => setTab('inventory')}>
            Inventory
          </button>
          <button className={`tab-btn ${tab === 'prescriptions' ? 'active' : ''}`} onClick={() => setTab('prescriptions')}>
            Prescriptions {pendingCount > 0 && <span style={s.badge}>{pendingCount}</span>}
          </button>
        </div>

        <div style={s.content}>

          {/* ── INVENTORY TAB ── */}
          {tab === 'inventory' && (
            <div>
              {/* Toolbar */}
              <div style={s.toolbar}>
                <p style={s.toolbarLabel}>{inventory.length} medicines in stock</p>
                <button
                  className="ph-btn-primary"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? '✕ Cancel' : '+ Add Medicine'}
                </button>
              </div>

              {/* Add form */}
              {showAddForm && (
                <div style={s.formCard}>
                  <div style={s.formCardHeader}>
                    <div style={s.formCardIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="#2a9d8f" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <h3 style={s.formCardTitle}>New Medicine</h3>
                  </div>
                  <form onSubmit={handleAddMedicine}>
                    <div className="form-grid">
                      <div>
                        <label style={s.formLabel}>Commercial name *</label>
                        <input className="ph-input" placeholder="e.g. Doliprane" required
                          value={newMedicine.name}
                          onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })} />
                      </div>
                      <div>
                        <label style={s.formLabel}>Generic name *</label>
                        <input className="ph-input" placeholder="e.g. Paracetamol" required
                          value={newMedicine.generic_name}
                          onChange={e => setNewMedicine({ ...newMedicine, generic_name: e.target.value })} />
                      </div>
                      <div>
                        <label style={s.formLabel}>Form *</label>
                        <select className="ph-input"
                          value={newMedicine.form}
                          onChange={e => setNewMedicine({ ...newMedicine, form: e.target.value })}>
                          <option value="tablet">Tablet</option>
                          <option value="syrup">Syrup</option>
                          <option value="injection">Injection</option>
                          <option value="cream">Cream</option>
                        </select>
                      </div>
                      <div>
                        <label style={s.formLabel}>Dosage strength *</label>
                        <input className="ph-input" placeholder="e.g. 500mg" required
                          value={newMedicine.dosage_strength}
                          onChange={e => setNewMedicine({ ...newMedicine, dosage_strength: e.target.value })} />
                      </div>
                      <div>
                        <label style={s.formLabel}>Initial quantity</label>
                        <input className="ph-input" type="number" min="0" placeholder="0"
                          value={newMedicine.quantity}
                          onChange={e => setNewMedicine({ ...newMedicine, quantity: e.target.value })} />
                      </div>
                      <div>
                        <label style={s.formLabel}>Unit *</label>
                        <input className="ph-input" placeholder="boxes, vials, bottles..." required
                          value={newMedicine.unit}
                          onChange={e => setNewMedicine({ ...newMedicine, unit: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" className="ph-btn-primary" disabled={loading}>
                        {loading ? <><span className="spinner-sm" />Adding...</> : 'Add Medicine'}
                      </button>
                      <button type="button" className="ph-btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Inventory table */}
              <div style={s.tableCard}>
                {/* Table header */}
                <div style={{ ...s.invRowHeader }}>
                  <span style={s.thLabel}>Medicine</span>
                  <span style={s.thLabel}>Form</span>
                  <span style={s.thLabel}>Strength</span>
                  <span style={s.thLabel}>Stock</span>
                  <span style={s.thLabel}>Restock</span>
                </div>

                {inventory.length === 0 && (
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>📦</div>
                    <p style={s.emptyText}>No medicines in inventory yet.</p>
                    <button className="ph-btn-primary" onClick={() => setShowAddForm(true)}>Add first medicine</button>
                  </div>
                )}

                {inventory.map(item => (
                  <div className="inv-row" key={item.id}>
                    <div>
                      <div style={s.medName}>{item.medicine.name}</div>
                      <div style={s.medGeneric}>{item.medicine.generic_name}</div>
                    </div>
                    <div>
                      <span style={s.formBadge}>{item.medicine.form}</span>
                    </div>
                    <div style={s.medStrength}>{item.medicine.dosage_strength}</div>
                    <div>
                      <span style={{
                        ...s.stockBadge,
                        background: item.quantity > 10 ? '#e8f7f4' : item.quantity > 0 ? '#fef3e2' : '#fdf0ef',
                        color: item.quantity > 10 ? '#1a6b5a' : item.quantity > 0 ? '#b7600e' : '#c0392b',
                        borderColor: item.quantity > 10 ? '#b8e8df' : item.quantity > 0 ? '#fad5a5' : '#f5c6c4',
                      }}>
                        {item.quantity > 0 ? `${item.quantity} ${item.unit}` : 'Out of stock'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="ph-input"
                        type="number" min="1" placeholder="Qty"
                        style={{ width: '70px', padding: '7px 10px', fontSize: '13px' }}
                        value={incrementing[item.id] || ''}
                        onChange={e => setIncrementing(prev => ({ ...prev, [item.id]: e.target.value }))}
                      />
                      <button className="inc-btn" onClick={() => handleIncrement(item.id)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PRESCRIPTIONS TAB ── */}
          {tab === 'prescriptions' && (
            <div>
              <div style={s.toolbar}>
                <p style={s.toolbarLabel}>{prescriptions.length} prescriptions</p>
                <input
                  className="ph-input"
                  placeholder="Search by patient name..."
                  value={patientSearch}
                  onChange={handleSearch}
                  style={{ width: '260px' }}
                />
              </div>

              {prescriptions.length === 0 && (
                <div style={s.emptyState}>
                  <div style={s.emptyIcon}>📋</div>
                  <p style={s.emptyText}>No prescriptions found.</p>
                </div>
              )}

              {prescriptions.map(p => (
                <div className="rx-card" key={p.id}>
                  {/* Card header */}
                  <div style={{
                    ...s.rxHeader,
                    borderLeft: `4px solid ${p.status === 'dispensed' ? '#2a9d8f' : '#e9a84c'}`,
                  }}>
                    <div style={s.rxHeaderLeft}>
                      <div style={s.rxPatientAvatar}>
                        {p.patient.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={s.rxPatientName}>{p.patient.full_name}</div>
                        <div style={s.rxMeta}>
                          Dr. {p.doctor.full_name}
                          <span style={s.rxMetaDot}>·</span>
                          {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={s.rxHeaderRight}>
                      <span style={{
                        ...s.rxStatus,
                        background: p.status === 'dispensed' ? '#e8f7f4' : '#fef3e2',
                        color: p.status === 'dispensed' ? '#1a6b5a' : '#b7600e',
                        borderColor: p.status === 'dispensed' ? '#b8e8df' : '#fad5a5',
                      }}>
                        {p.status === 'dispensed' ? '✓ Done' : '⏳ Pending'}
                      </span>
                      {p.status === 'issued' && (
                        <button
                          className="ph-btn-dispense"
                          onClick={() => handleDispense(p.id)}
                          disabled={dispensingId === p.id}
                        >
                          {dispensingId === p.id
                            ? <><span className="spinner-sm" />Dispensing...</>
                            : 'Mark Dispensed'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div style={s.rxItems}>
                    {p.items.map(item => (
                      <div key={item.id} style={s.rxItem}>
                        <div style={s.rxItemLeft}>
                          <div style={s.rxMedName}>
                            {item.medicine.name}
                            <span style={s.rxMedStrength}> {item.medicine.dosage_strength}</span>
                          </div>
                          <div style={s.rxMedInstructions}>{item.dosage_instructions}</div>
                        </div>
                        <div style={s.rxItemRight}>
                          <span style={s.rxItemStat}>{item.duration_days}d</span>
                          <span style={s.rxItemStat}>×{item.quantity_prescribed}</span>
                          <span style={{
                            ...s.rxAvail,
                            background: item.available_at_issue ? '#e8f7f4' : '#fdf0ef',
                            color: item.available_at_issue ? '#1a6b5a' : '#c0392b',
                            borderColor: item.available_at_issue ? '#b8e8df' : '#f5c6c4',
                          }}>
                            {item.available_at_issue ? 'Was in stock' : 'Was out of stock'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {p.notes && (
                    <div style={s.rxNotes}>
                      <span style={s.rxNotesLabel}>Notes:</span> {p.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    background: '#f4f9fc',
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #ddeaf2',
    padding: '0 2.5rem',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 12px rgba(26,107,138,0.06)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  headerLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
  headerLogoIcon: {
    width: '34px', height: '34px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #1a6b8a, #2a9d8f)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  headerLogoText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '17px',
    fontWeight: '600',
    color: '#1a2e3b',
  },
  headerDivider: {
    width: '1px', height: '22px',
    background: '#ddeaf2',
  },
  headerRole: {
    display: 'flex', alignItems: 'center', gap: '7px',
    fontSize: '13px', color: '#5a8a9a', fontWeight: '500',
  },
  headerRoleDot: {
    width: '7px', height: '7px',
    borderRadius: '50%',
    background: '#2a9d8f',
    boxShadow: '0 0 0 2px rgba(42,157,143,0.2)',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerUser: { display: 'flex', alignItems: 'center', gap: '10px', marginRight: '4px' },
  userAvatar: {
    width: '36px', height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a6b8a, #2a9d8f)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: '600',
  },
  userName: { fontSize: '13.5px', fontWeight: '600', color: '#1a2e3b' },
  userRole: { fontSize: '11px', color: '#7a9aaa' },

  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 2.5rem' },

  pageTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.8rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  pageTitleText: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '26px', fontWeight: '600',
    color: '#1a2e3b',
  },
  pageTitleSub: { fontSize: '14px', color: '#7a9aaa', marginTop: '4px' },

  stats: { display: 'flex', gap: '12px' },
  statLabel: { fontSize: '12px', color: '#7a9aaa', fontWeight: '500', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: '26px', fontWeight: '600', color: '#1a2e3b', fontFamily: "'Playfair Display', serif" },

  tabBar: {
    display: 'flex',
    borderBottom: '1.5px solid #ddeaf2',
    marginBottom: '1.5rem',
    gap: '4px',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '18px', height: '18px',
    borderRadius: '50%',
    background: '#e9a84c',
    color: '#fff',
    fontSize: '11px', fontWeight: '700',
    marginLeft: '7px',
    verticalAlign: 'middle',
  },

  content: {},

  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  toolbarLabel: { fontSize: '13.5px', color: '#7a9aaa', fontWeight: '500' },

  formCard: {
    background: '#fff',
    border: '1.5px solid #b8e8df',
    borderRadius: '14px',
    padding: '1.5rem',
    marginBottom: '1.2rem',
    boxShadow: '0 4px 20px rgba(42,157,143,0.07)',
  },
  formCardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' },
  formCardIcon: {
    width: '32px', height: '32px',
    borderRadius: '8px',
    background: '#e8f7f4',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  formCardTitle: { fontSize: '15px', fontWeight: '600', color: '#1a2e3b' },
  formLabel: { display: 'block', fontSize: '12px', fontWeight: '500', color: '#5a8a9a', marginBottom: '6px', letterSpacing: '0.2px' },

  tableCard: {
    background: '#fff',
    border: '1px solid #ddeaf2',
    borderRadius: '14px',
    overflow: 'hidden',
  },
  invRowHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1.4fr',
    padding: '11px 20px',
    background: '#f7fbfe',
    borderBottom: '1px solid #eef4f8',
    gap: '12px',
  },
  thLabel: { fontSize: '11.5px', fontWeight: '600', color: '#7a9aaa', textTransform: 'uppercase', letterSpacing: '0.5px' },

  medName: { fontSize: '14px', fontWeight: '600', color: '#1a2e3b' },
  medGeneric: { fontSize: '12px', color: '#7a9aaa', marginTop: '2px' },
  medStrength: { fontSize: '13.5px', color: '#3a6b7a', fontWeight: '500' },
  formBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    background: '#eef4f8',
    color: '#3a6b7a',
    fontSize: '12px',
    fontWeight: '500',
  },
  stockBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12.5px',
    fontWeight: '600',
    border: '1px solid',
  },

  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  emptyIcon: { fontSize: '2.5rem' },
  emptyText: { fontSize: '14px', color: '#7a9aaa' },

  rxHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    background: '#fafcfe',
    borderBottom: '1px solid #eef4f8',
  },
  rxHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  rxPatientAvatar: {
    width: '40px', height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a6b8a, #2a9d8f)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', fontWeight: '600', flexShrink: 0,
  },
  rxPatientName: { fontSize: '15px', fontWeight: '600', color: '#1a2e3b' },
  rxMeta: { fontSize: '12.5px', color: '#7a9aaa', marginTop: '2px' },
  rxMetaDot: { margin: '0 5px' },
  rxHeaderRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  rxStatus: {
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12.5px',
    fontWeight: '600',
    border: '1px solid',
  },

  rxItems: { padding: '4px 0' },
  rxItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #f4f9fc',
  },
  rxItemLeft: {},
  rxMedName: { fontSize: '14px', fontWeight: '600', color: '#1a2e3b' },
  rxMedStrength: { fontWeight: '400', color: '#5a8a9a' },
  rxMedInstructions: { fontSize: '12.5px', color: '#7a9aaa', marginTop: '3px' },
  rxItemRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  rxItemStat: {
    fontSize: '12.5px', fontWeight: '600',
    color: '#3a6b7a',
    background: '#eef4f8',
    padding: '3px 9px',
    borderRadius: '6px',
  },
  rxAvail: {
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid',
  },

  rxNotes: {
    padding: '10px 20px',
    background: '#fffbf2',
    borderTop: '1px solid #fde8c8',
    fontSize: '13px',
    color: '#7a6030',
  },
  rxNotesLabel: { fontWeight: '600' },
};

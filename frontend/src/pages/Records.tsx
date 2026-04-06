import { useEffect, useState, type FormEvent } from "react";
import { recordsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Plus, Pencil, Trash2, X, Filter } from "lucide-react";

interface FinRecord {
  id: string;
  amount: string;
  type: string;
  category: string;
  date: string;
  notes: string | null;
  createdBy?: { id: string; name: string; email: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const CATEGORIES = [
  "Salary", "Freelance", "Rent", "Utilities", "Groceries",
  "Insurance", "Travel", "Marketing", "Tax", "Equipment", "Other",
];

export default function Records() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [records, setRecords] = useState<FinRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinRecord | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    type: "INCOME",
    category: "Salary",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [page, filterType, filterCategory, filterFrom, filterTo]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "15" };
      if (filterType) params.type = filterType;
      if (filterCategory) params.category = filterCategory;
      if (filterFrom) params.from = new Date(filterFrom).toISOString();
      if (filterTo) params.to = new Date(filterTo).toISOString();

      const res = await recordsApi.list(params);
      setRecords(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch records:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    setFormData({
      amount: "",
      type: "INCOME",
      category: "Salary",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (rec: FinRecord) => {
    setEditingRecord(rec);
    setFormData({
      amount: rec.amount,
      type: rec.type,
      category: rec.category,
      date: new Date(rec.date).toISOString().slice(0, 10),
      notes: rec.notes || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError("Amount must be a positive number");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        amount: amt,
        type: formData.type,
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        notes: formData.notes || undefined,
      };

      if (editingRecord) {
        await recordsApi.update(editingRecord.id, payload);
      } else {
        await recordsApi.create(payload);
      }

      setShowModal(false);
      fetchRecords();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this record? This action uses soft-delete.")) return;
    try {
      await recordsApi.delete(id);
      fetchRecords();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const clearFilters = () => {
    setFilterType("");
    setFilterCategory("");
    setFilterFrom("");
    setFilterTo("");
    setPage(1);
  };

  const hasFilters = filterType || filterCategory || filterFrom || filterTo;

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(typeof val === "string" ? parseFloat(val) : val);

  return (
    <div className="records-page">
      <div className="page-header">
        <h1 className="page-title">Financial Records</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> New Record
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <Filter size={16} style={{ color: "var(--text-muted)" }} />
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
            title="From date"
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
            title="To date"
          />

          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="loading-container">
            <div className="spinner" />
            <span>Loading records...</span>
          </div>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th>Created By</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="empty-state">
                      No records found
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td style={{ fontWeight: 500, color: "var(--text)" }}>{r.category}</td>
                      <td>
                        <span className={`type-badge ${r.type.toLowerCase()}`}>
                          {r.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(r.amount)}</td>
                      <td className="notes-cell">{r.notes || "\u2014"}</td>
                      <td>{r.createdBy?.name || "\u2014"}</td>
                      {isAdmin && (
                        <td>
                          <div className="action-btns">
                            <button
                              className="btn-icon"
                              title="Edit"
                              onClick={() => openEditModal(r)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn-icon danger"
                              title="Delete"
                              onClick={() => handleDelete(r.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn btn-sm"
              >
                Previous
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="btn btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRecord ? "Edit Record" : "New Record"}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  maxLength={500}
                  placeholder="Add any relevant notes..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingRecord ? "Update Record" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

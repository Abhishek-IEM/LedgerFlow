import { useEffect, useState } from "react";
import { usersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { UserCheck, UserX } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersApi.list();
      setUsers(res.data.data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await usersApi.updateRole(userId, newRole);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading(userId);
    try {
      await usersApi.updateStatus(userId, newStatus);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-container">
          <div className="spinner" />
          <span>Loading users...</span>
        </div>
      </div>
    );
  }

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;

  return (
    <div className="users-page">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <span className="badge">{users.length} users</span>
          <span className="badge" style={{ background: "var(--green-subtle)", color: "var(--green)" }}>
            {activeCount} active
          </span>
        </div>
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className={isSelf ? "row-highlight" : ""}>
                    <td>
                      <div className="user-cell">
                        <span style={{ fontWeight: 500, color: "var(--text)" }}>{u.name}</span>
                        {isSelf && <span className="badge badge-sm">You</span>}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className={`role-select role-${u.role.toLowerCase()}`}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={isSelf || actionLoading === u.id}
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="ANALYST">Analyst</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${u.status.toLowerCase()}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td>
                      {!isSelf && (
                        <button
                          className={`btn btn-sm ${u.status === "ACTIVE" ? "btn-warning" : "btn-success"}`}
                          onClick={() => handleStatusToggle(u.id, u.status)}
                          disabled={actionLoading === u.id}
                          title={u.status === "ACTIVE" ? "Deactivate user" : "Activate user"}
                        >
                          {u.status === "ACTIVE" ? (
                            <><UserX size={14} /> Deactivate</>
                          ) : (
                            <><UserCheck size={14} /> Activate</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

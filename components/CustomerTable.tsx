"use client";

import { useState } from "react";
import type { Customer } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function CustomerTable({
  customers,
  onUpdate,
  onDelete,
  onSync,
}: {
  customers: Customer[];
  onUpdate: (id: string, patch: Partial<Customer>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSync: (id: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Customer>>({});
  const [syncingId, setSyncingId] = useState<string | null>(null);

  if (customers.length === 0) {
    return <p className="empty">No customers yet. Add your first customer above.</p>;
  }

  function startEdit(c: Customer) {
    setEditingId(c.id);
    setDraft({
      companyName: c.companyName,
      contactPerson: c.contactPerson,
      email: c.email,
      phone: c.phone,
    });
  }

  async function saveEdit(id: string) {
    await onUpdate(id, draft);
    setEditingId(null);
    setDraft({});
  }

  async function handleSync(id: string) {
    setSyncingId(id);
    try {
      await onSync(id);
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Contact Person</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Last Call (Fathom)</th>
            <th>Call Summary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const isEditing = editingId === c.id;
            return (
              <tr key={c.id}>
                {isEditing ? (
                  <>
                    <td>
                      <input
                        value={draft.companyName ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, companyName: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={draft.contactPerson ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, contactPerson: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={draft.email ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, email: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={draft.phone ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, phone: e.target.value }))
                        }
                      />
                    </td>
                    <td colSpan={2} className="muted">
                      Save to keep call details
                    </td>
                    <td className="actions-cell">
                      <button className="primary" onClick={() => saveEdit(c.id)}>
                        Save
                      </button>
                      <button className="secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{c.companyName}</td>
                    <td>{c.contactPerson || <span className="muted">—</span>}</td>
                    <td>{c.email || <span className="muted">—</span>}</td>
                    <td>{c.phone || <span className="muted">—</span>}</td>
                    <td>{formatDate(c.lastCallDate)}</td>
                    <td className="summary-cell">
                      {c.lastCallSummary ? (
                        c.notionPageUrl ? (
                          <a href={c.notionPageUrl} target="_blank" rel="noreferrer">
                            {c.lastCallSummary}
                          </a>
                        ) : (
                          c.lastCallSummary
                        )
                      ) : (
                        <span className="muted">No call synced yet</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="secondary"
                        onClick={() => handleSync(c.id)}
                        disabled={syncingId === c.id}
                      >
                        {syncingId === c.id ? "Syncing…" : "Sync from Notion"}
                      </button>
                      <button className="secondary" onClick={() => startEdit(c)}>
                        Edit
                      </button>
                      <button className="danger" onClick={() => onDelete(c.id)}>
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

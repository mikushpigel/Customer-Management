"use client";

import { useCallback, useEffect, useState } from "react";
import AddCustomerForm from "@/components/AddCustomerForm";
import CustomerTable from "@/components/CustomerTable";
import type { Customer, CustomerInput } from "@/lib/types";

export default function Home() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(data.customers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(input: CustomerInput) {
    setError(null);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add customer");
      return;
    }
    await load();
  }

  async function handleUpdate(id: string, patch: Partial<Customer>) {
    setError(null);
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update customer");
      return;
    }
    await load();
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete customer");
      return;
    }
    await load();
  }

  async function handleSync(id: string) {
    setError(null);
    setNotice(null);
    const res = await fetch(`/api/customers/${id}/sync-notion`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to sync from Notion");
      return;
    }
    setNotice("Synced latest call from Notion.");
    await load();
  }

  async function handleSyncAll() {
    setError(null);
    setNotice(null);
    setSyncingAll(true);
    try {
      const res = await fetch("/api/customers/sync-all", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to sync from Notion");
        return;
      }
      setNotice(`Synced ${data.results?.length ?? 0} customers from Notion.`);
      await load();
    } finally {
      setSyncingAll(false);
    }
  }

  return (
    <div className="page">
      <header className="top">
        <div>
          <h1>Customer Management</h1>
          <p className="subtitle">
            Track customers and pull their latest Fathom call details from Notion.
          </p>
        </div>
        <div className="top-actions">
          <button className="secondary" onClick={handleSyncAll} disabled={syncingAll}>
            {syncingAll ? "Syncing all…" : "Sync All From Notion"}
          </button>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}
      {notice && <div className="banner success">{notice}</div>}

      <AddCustomerForm onAdd={handleAdd} />

      <div className="card">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <CustomerTable
            customers={customers}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onSync={handleSync}
          />
        )}
      </div>
    </div>
  );
}

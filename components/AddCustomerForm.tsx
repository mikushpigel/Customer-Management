"use client";

import { FormEvent, useState } from "react";
import type { CustomerInput } from "@/lib/types";

export default function AddCustomerForm({
  onAdd,
}: {
  onAdd: (input: CustomerInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CustomerInput>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(form);
      setForm({ companyName: "", contactPerson: "", email: "", phone: "" });
    } finally {
      setSubmitting(false);
    }
  }

  function update(field: keyof CustomerInput, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div>
          <label htmlFor="companyName">Company Name</label>
          <input
            id="companyName"
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            placeholder="Acme Inc."
            required
          />
        </div>
        <div>
          <label htmlFor="contactPerson">Contact Person</label>
          <input
            id="contactPerson"
            value={form.contactPerson}
            onChange={(e) => update("contactPerson", e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@acme.com"
          />
        </div>
        <div>
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? "Adding…" : "Add Customer"}
          </button>
        </div>
      </div>
    </form>
  );
}

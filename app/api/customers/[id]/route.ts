import { NextRequest, NextResponse } from "next/server";
import { deleteCustomer, updateCustomer } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const allowed = ["companyName", "contactPerson", "email", "phone"] as const;
  const patch: Record<string, string> = {};
  for (const key of allowed) {
    if (typeof body[key] === "string") patch[key] = body[key];
  }

  const customer = await updateCustomer(id, patch);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json({ customer });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteCustomer(id);
  if (!ok) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

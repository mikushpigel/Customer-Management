import { NextRequest, NextResponse } from "next/server";
import { createCustomer, listCustomers } from "@/lib/db";

export async function GET() {
  const customers = await listCustomers();
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.companyName !== "string" || !body.companyName.trim()) {
    return NextResponse.json(
      { error: "companyName is required" },
      { status: 400 }
    );
  }

  const customer = await createCustomer({
    companyName: body.companyName ?? "",
    contactPerson: body.contactPerson ?? "",
    email: body.email ?? "",
    phone: body.phone ?? "",
  });

  return NextResponse.json({ customer }, { status: 201 });
}

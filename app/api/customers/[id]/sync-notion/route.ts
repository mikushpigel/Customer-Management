import { NextRequest, NextResponse } from "next/server";
import { getCustomer, updateCustomer } from "@/lib/db";
import { findLatestCallForCustomer, NotionConfigError } from "@/lib/notion";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  try {
    const match = await findLatestCallForCustomer({
      companyName: customer.companyName,
      email: customer.email,
    });

    if (!match) {
      return NextResponse.json(
        { error: `No matching call found in Notion for "${customer.companyName}".` },
        { status: 404 }
      );
    }

    const updated = await updateCustomer(customer.id, {
      lastCallDate: match.date,
      lastCallSummary: match.summary,
      notionPageUrl: match.pageUrl,
    });

    return NextResponse.json({ customer: updated });
  } catch (err) {
    if (err instanceof NotionConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    const message = err instanceof Error ? err.message : "Notion sync failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

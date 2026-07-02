import { NextResponse } from "next/server";
import { listCustomers, updateCustomer } from "@/lib/db";
import { findLatestCallForCustomer, NotionConfigError } from "@/lib/notion";

export async function POST() {
  const customers = await listCustomers();
  const results: { id: string; companyName: string; status: string }[] = [];

  for (const customer of customers) {
    try {
      const match = await findLatestCallForCustomer({
        companyName: customer.companyName,
        email: customer.email,
      });

      if (!match) {
        results.push({
          id: customer.id,
          companyName: customer.companyName,
          status: "no match found",
        });
        continue;
      }

      await updateCustomer(customer.id, {
        lastCallDate: match.date,
        lastCallSummary: match.summary,
        notionPageUrl: match.pageUrl,
      });
      results.push({
        id: customer.id,
        companyName: customer.companyName,
        status: "synced",
      });
    } catch (err) {
      if (err instanceof NotionConfigError) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
      const message = err instanceof Error ? err.message : "Notion sync failed";
      results.push({ id: customer.id, companyName: customer.companyName, status: `error: ${message}` });
    }
  }

  return NextResponse.json({ results });
}

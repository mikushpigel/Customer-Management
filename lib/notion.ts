import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type NotionCallMatch = {
  date: string | null;
  summary: string | null;
  pageUrl: string;
};

class NotionConfigError extends Error {}

function getClient(): Client {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new NotionConfigError(
      "NOTION_API_KEY is not set. Add it to .env.local (see README for setup steps)."
    );
  }
  return new Client({ auth: apiKey });
}

function getDatabaseId(): string {
  const dbId = process.env.NOTION_DATABASE_ID;
  if (!dbId) {
    throw new NotionConfigError(
      "NOTION_DATABASE_ID is not set. Add it to .env.local (see README for setup steps)."
    );
  }
  return dbId;
}

// Property names in the Notion database. Configurable because the exact
// schema depends on how Zapier writes Fathom calls into Notion.
const PROP_COMPANY = process.env.NOTION_PROP_COMPANY || "Company";
const PROP_EMAIL = process.env.NOTION_PROP_EMAIL || "";
const PROP_DATE = process.env.NOTION_PROP_DATE || "Call Date";
const PROP_SUMMARY = process.env.NOTION_PROP_SUMMARY || "Summary";

function extractPlainValue(property: any): string | null {
  if (!property) return null;
  switch (property.type) {
    case "title":
      return property.title.map((t: any) => t.plain_text).join("") || null;
    case "rich_text":
      return property.rich_text.map((t: any) => t.plain_text).join("") || null;
    case "select":
      return property.select?.name ?? null;
    case "multi_select":
      return property.multi_select.map((s: any) => s.name).join(", ") || null;
    case "status":
      return property.status?.name ?? null;
    case "email":
      return property.email ?? null;
    case "phone_number":
      return property.phone_number ?? null;
    case "url":
      return property.url ?? null;
    case "number":
      return property.number !== null ? String(property.number) : null;
    case "checkbox":
      return String(property.checkbox);
    case "date":
      return property.date?.start ?? null;
    case "people":
      return property.people.map((p: any) => p.name).join(", ") || null;
    default:
      return null;
  }
}

function extractAllText(page: PageObjectResponse): string {
  return Object.values(page.properties)
    .map((p) => extractPlainValue(p))
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();
}

function isFullPage(page: unknown): page is PageObjectResponse {
  return (
    typeof page === "object" &&
    page !== null &&
    (page as { object?: string }).object === "page" &&
    "properties" in page
  );
}

/**
 * Fetches every page in the configured database and returns the most recent
 * call that matches the given company name (and email, if configured).
 * Schema is unknown ahead of time (Zapier writes the rows), so matching is
 * done by scanning all extracted property text rather than a typed filter.
 */
export async function findLatestCallForCustomer(params: {
  companyName: string;
  email?: string;
}): Promise<NotionCallMatch | null> {
  const client = getClient();
  const databaseId = getDatabaseId();

  const companyNeedle = params.companyName.trim().toLowerCase();
  const emailNeedle = params.email?.trim().toLowerCase();
  if (!companyNeedle) return null;

  let cursor: string | undefined;
  let best: { date: string | null; page: PageObjectResponse } | null = null;

  do {
    const response = await client.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const result of response.results) {
      if (!isFullPage(result)) continue;

      const companyValue = extractPlainValue(
        result.properties[PROP_COMPANY]
      )?.toLowerCase();
      const emailValue = PROP_EMAIL
        ? extractPlainValue(result.properties[PROP_EMAIL])?.toLowerCase()
        : undefined;

      const companyMatches =
        companyValue?.includes(companyNeedle) ||
        (companyValue && companyNeedle.includes(companyValue));
      const emailMatches =
        emailNeedle && emailValue && emailValue === emailNeedle;
      const fallbackMatches =
        !companyValue && extractAllText(result).includes(companyNeedle);

      if (!companyMatches && !emailMatches && !fallbackMatches) continue;

      const dateValue =
        extractPlainValue(result.properties[PROP_DATE]) ??
        result.last_edited_time;

      if (!best || (dateValue && (!best.date || dateValue > best.date))) {
        best = { date: dateValue, page: result };
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  if (!best) return null;

  return {
    date: best.date,
    summary: extractPlainValue(best.page.properties[PROP_SUMMARY]),
    pageUrl: best.page.url,
  };
}

export { NotionConfigError };

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Customer, CustomerInput } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "customers.json");

// Serializes reads/writes so concurrent requests can't clobber each other.
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn, fn);
  queue = result.catch(() => undefined);
  return result;
}

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function readAll(): Promise<Customer[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw) as Customer[];
  } catch {
    return [];
  }
}

async function writeAll(customers: Customer[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(customers, null, 2), "utf8");
}

export function listCustomers(): Promise<Customer[]> {
  return withLock(async () => {
    const customers = await readAll();
    return customers.sort((a, b) => a.companyName.localeCompare(b.companyName));
  });
}

export function createCustomer(input: CustomerInput): Promise<Customer> {
  return withLock(async () => {
    const customers = await readAll();
    const now = new Date().toISOString();
    const customer: Customer = {
      id: randomUUID(),
      companyName: input.companyName.trim(),
      contactPerson: input.contactPerson.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      lastCallDate: null,
      lastCallSummary: null,
      notionPageUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    customers.push(customer);
    await writeAll(customers);
    return customer;
  });
}

export function updateCustomer(
  id: string,
  patch: Partial<Omit<Customer, "id" | "createdAt">>
): Promise<Customer | null> {
  return withLock(async () => {
    const customers = await readAll();
    const idx = customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    customers[idx] = {
      ...customers[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await writeAll(customers);
    return customers[idx];
  });
}

export function deleteCustomer(id: string): Promise<boolean> {
  return withLock(async () => {
    const customers = await readAll();
    const next = customers.filter((c) => c.id !== id);
    if (next.length === customers.length) return false;
    await writeAll(next);
    return true;
  });
}

export function getCustomer(id: string): Promise<Customer | null> {
  return withLock(async () => {
    const customers = await readAll();
    return customers.find((c) => c.id === id) ?? null;
  });
}

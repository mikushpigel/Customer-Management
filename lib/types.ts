export type Customer = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  lastCallDate: string | null;
  lastCallSummary: string | null;
  notionPageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'primary' | 'secondary';
  initials: string;
  paymentMethods: PaymentMethod[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  code: 'DC' | 'DD' | 'NC' | 'ND';
  label: string;
  balance: number;
  type: 'cash' | 'digital';
  userId: string;
}

export const PAYMENT_METHODS = {
  DC: { code: 'DC' as const, label: 'Dhaneesh Cash', type: 'cash' as const },
  DD: { code: 'DD' as const, label: 'Dhaneesh Digital', type: 'digital' as const },
  NC: { code: 'NC' as const, label: 'Nisha Cash', type: 'cash' as const },
  ND: { code: 'ND' as const, label: 'Nisha Digital', type: 'digital' as const },
} as const;

export type PaymentMethodCode = keyof typeof PAYMENT_METHODS;
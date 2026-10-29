export type CurrencyCode = 'USD' | 'SOS' | 'EUR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  rate?: number;
}

export const CURRENCY_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  SOS: 26000,
  EUR: 0.92,
};

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'USD ($)', rate: 1 },
  SOS: { code: 'SOS', symbol: 'Sh.So.', label: 'SOS (Sh.So.)', rate: 26000 },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR (€)', rate: 0.92 },
};

export interface FinancialBaseline {
  grossBalance: number;
  totalSaved?: number;
  netSpendableBalance?: number;
  monthlyIncome: number;
  paydayAnchorDay: number; // 1 to 31
  currency: CurrencyCode;
  overheadAutoGenerate: boolean;
  defaultDailyCap: number;
  warningThreshold?: number;
  updatedAt?: string;
}

export type UpdateBaselinePayload = Partial<FinancialBaseline>;

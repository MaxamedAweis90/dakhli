export type CurrencyCode = 'USD' | 'SOS' | 'EUR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'USD ($)' },
  SOS: { code: 'SOS', symbol: 'Sh.So.', label: 'SOS (Sh.So.)' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR (€)' },
};

export interface FinancialBaseline {
  grossBalance: number;
  monthlyIncome: number;
  paydayAnchorDay: number; // 1 to 31
  currency: CurrencyCode;
  overheadAutoGenerate: boolean;
  defaultDailyCap: number;
  warningThreshold?: number;
  updatedAt?: string;
}

export type UpdateBaselinePayload = Partial<FinancialBaseline>;

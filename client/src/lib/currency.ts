// Currency formatting utilities

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "en-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", locale: "en-CA" },
];

// Format currency with proper localization
export function formatCurrency(amount: number | string, currencyCode: string = "USD"): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  
  // Special formatting for INR (Indian Rupee) with lakhs/crores
  if (currencyCode === "INR") {
    return formatINR(numAmount);
  }
  
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  } catch (error) {
    // Fallback formatting
    return `${currency.symbol}${numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

// Special formatting for Indian Rupee (INR) with Indian comma system
function formatINR(amount: number): string {
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  
  // Use Indian locale formatting for proper comma placement
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount);
  
  return isNegative ? `-${formatted}` : formatted;
}

// Get currency symbol
export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || "$";
}

// Compact number formatting for summary cards
export function formatCompactCurrency(amount: number | string, currencyCode: string = "USD"): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (currencyCode === "INR") {
    return formatINR(numAmount);
  }
  
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  const absAmount = Math.abs(numAmount);
  const isNegative = numAmount < 0;
  
  let formatted = "";
  
  if (absAmount >= 1000000) {
    formatted = `${currency.symbol}${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    formatted = `${currency.symbol}${(absAmount / 1000).toFixed(1)}K`;
  } else {
    formatted = `${currency.symbol}${absAmount.toFixed(2)}`;
  }
  
  return isNegative ? `-${formatted}` : formatted;
}
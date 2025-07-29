// Month names for filtering
export const FILTER_MONTHS = [
  'January',
  'February', 
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const;

// Helper function to get month name from date
export function getMonthNameFromDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return FILTER_MONTHS[dateObj.getMonth()];
}

// Helper function to get month number from name (0-based)
export function getMonthNumberFromName(monthName: string): number {
  return FILTER_MONTHS.indexOf(monthName as any);
} 
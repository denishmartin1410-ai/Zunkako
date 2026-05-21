/**
 * Safe timezone-agnostic date parser.
 * Instantiates the date in local system time using new Date(year, month - 1, day).
 * Supports formats: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY.
 */
export const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  const cleanStr = dateStr.replace(/\//g, '-').trim();
  const parts = cleanStr.split('-');
  
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);
    
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(p0, p1 - 1, p2);
    } else {
      // DD-MM-YYYY
      return new Date(p2, p1 - 1, p0);
    }
  }
  return new Date(dateStr);
};

/**
 * Formats a DD/MM/YYYY UI date to YYYY-MM-DD database date string.
 * Returns null if the format is invalid.
 */
export const convertToDbDate = (uiDateStr) => {
  if (!uiDateStr) return '';
  const clean = uiDateStr.replace(/\//g, '-').trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];
    
    // Auto-pad single digits
    if (day.length === 1) day = '0' + day;
    if (month.length === 1) month = '0' + month;
    
    if (year.length === 4 && day.length === 2 && month.length === 2) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const d = parseInt(day, 10);
      // Basic bounds check
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${year}-${month}-${day}`;
      }
    }
  }
  return null;
};

/**
 * Formats a YYYY-MM-DD database date to DD/MM/YYYY UI date.
 */
export const formatToUiDate = (dbDateStr) => {
  if (!dbDateStr) return '';
  const parts = dbDateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dbDateStr;
};

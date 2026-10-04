export const serviceOptions = ['fulfillment', 'last-mile', 'returns'];

export function localDate(today = new Date()) {
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validateField(name, value, today = localDate()) {
  const text = typeof value === 'string' ? value.trim() : '';
  switch (name) {
    case 'fullName':
      return text.length < 2 || text.length > 100
        ? 'Enter your name using 2 to 100 characters.' : '';
    case 'email':
      return text.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ? 'Enter a valid email address, such as name@company.com.' : '';
    case 'phone': {
      if (!text) return '';
      const digits = text.replace(/\D/g, '');
      return !/^\+?[\d\s().-]+$/.test(text) || digits.length < 7 || digits.length > 15
        ? 'Enter a phone number with 7 to 15 digits, optionally starting with +.' : '';
    }
    case 'company':
      return text.length < 2 || text.length > 120
        ? 'Enter your company or brand name using 2 to 120 characters.' : '';
    case 'country':
      return ['US', 'ES'].includes(text) ? '' : 'Choose United States or Spain.';
    case 'monthlyShipments':
      return !/^\d+$/.test(text) || Number(text) < 1 || Number(text) > 1000000
        ? 'Enter a whole number between 1 and 1,000,000 shipments.' : '';
    case 'services':
      return Array.isArray(value) && value.length > 0 && value.every(service => serviceOptions.includes(service))
        ? '' : 'Select at least one logistics service.';
    case 'startDate': {
      if (!text) return '';
      const parsed = new Date(`${text}T12:00:00`);
      return !/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(parsed.getTime()) || localDate(parsed) !== text || text < today || text > '2099-12-31'
        ? 'Choose today or a future date before the year 2100.' : '';
    }
    case 'message':
      return text.length > 2000 ? 'Keep your message to 2,000 characters or fewer.' : '';
    case 'consent':
      return value === true ? '' : 'Confirm that TrackFlow may contact you about this inquiry.';
    default:
      return 'This field is not recognized.';
  }
}

export function validateApplication(values, today = localDate()) {
  const fields = ['fullName', 'email', 'phone', 'company', 'country', 'monthlyShipments', 'services', 'startDate', 'message', 'consent'];
  return Object.fromEntries(fields.map(name => [name, validateField(name, values[name], today)]).filter(([, error]) => error));
}
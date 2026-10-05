export const countryOptions = ['US', 'ES', 'both', 'other'];
export const productOptions = ['fashion', 'electronics', 'cosmetics', 'food', 'other'];
export const volumeOptions = ['0-100', '101-500', '501-2000', '2000+', 'not-sure'];
export const serviceOptions = ['warehousing', 'last-mile', 'reverse-logistics'];
export const providerOptions = ['yes', 'no', 'evaluating'];

export function validateField(name, value) {
  const text = typeof value === 'string' ? value.trim() : '';
  switch (name) {
    case 'companyName':
      return text.length >= 2 ? '' : 'Company name must have at least 2 characters';
    case 'contactPerson':
      return text.split(/\s+/).filter(Boolean).length >= 2 ? '' : 'Enter first and last name of contact';
    case 'corporateEmail':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
        ? '' : 'Enter a valid corporate email (example: <name@company.com>)';
    case 'phone':
      return /^\+\d{1,3}(?:[\s().-]*\d){6,14}$/.test(text)
        ? '' : 'Phone must include country code (example: +1 213 555 0147)';
    case 'website': {
      if (!text) return '';
      try {
        const url = new URL(text);
        return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname)
          ? '' : 'If you include website, it must be a valid URL';
      } catch {
        return 'If you include website, it must be a valid URL';
      }
    }
    case 'country':
      return countryOptions.includes(text) ? '' : 'Select main operating country';
    case 'productType':
      return productOptions.includes(text) ? '' : 'Select the type of product you handle';
    case 'monthlyVolume':
      return volumeOptions.includes(text) ? '' : 'Select estimated monthly volume';
    case 'services':
      return Array.isArray(value) && value.length > 0 && value.every(service => serviceOptions.includes(service))
        ? '' : 'Select at least one service of interest';
    case 'current3pl':
      return providerOptions.includes(text) ? '' : 'Indicate if you currently work with another logistics provider';
    case 'comments':
      return text.length <= 500 ? '' : `Comments cannot exceed 500 characters (${Math.max(0, 500 - text.length)} remaining)`;
    case 'privacyPolicy':
      return value === true ? '' : 'You must accept the privacy policy to continue';
    default:
      return 'This field is not recognized.';
  }
}

export function validateApplication(values) {
  const fields = [
    'companyName', 'contactPerson', 'corporateEmail', 'phone', 'website', 'country',
    'productType', 'monthlyVolume', 'services', 'current3pl', 'comments', 'privacyPolicy',
  ];
  return Object.fromEntries(fields.map(name => [name, validateField(name, values[name])]).filter(([, error]) => error));
}

export function needsLowVolumeWarning(values) {
  return values.monthlyVolume === '0-100' && productOptions.includes(values.productType);
}
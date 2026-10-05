import { needsLowVolumeWarning, serviceOptions, validateApplication, validateField } from './validation.js';

const form = document.querySelector('#application-form');
const summary = document.querySelector('#error-summary');
const errorList = document.querySelector('#error-list');
const success = document.querySelector('#success-panel');
const announcement = document.querySelector('#validation-announcement');
const warning = document.querySelector('#low-volume-warning');
const touched = new Set();
let submitted = false;

const labels = {
  companyName: 'Company name', contactPerson: 'Contact person', corporateEmail: 'Corporate email',
  phone: 'Phone', website: 'Company website', country: 'Main operating country', productType: 'Product type',
  monthlyVolume: 'Estimated monthly shipping volume', services: 'Services of interest', current3pl: 'Current 3PL',
  comments: 'Comments', privacyPolicy: 'Privacy policy acceptance',
};

function readValues() {
  const data = new FormData(form);
  return { ...Object.fromEntries(data), services: data.getAll('services'), privacyPolicy: data.has('privacyPolicy') };
}

function fieldTarget(name) {
  if (name === 'services') return document.querySelector('#service-warehousing');
  if (name === 'current3pl') return form.querySelector('[name="current3pl"]');
  return form.elements.namedItem(name);
}

function showError(name, error) {
  const element = document.getElementById(`${name}-error`);
  element.textContent = error;
  element.hidden = !error;
  const controls = ['services', 'current3pl'].includes(name)
    ? form.querySelectorAll(`[name="${name}"]`) : [fieldTarget(name)];
  controls.forEach(control => {
    if (error) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  });
  if (['services', 'current3pl'].includes(name)) {
    const group = document.querySelector(`#${name}-group`);
    if (error) group.setAttribute('aria-invalid', 'true');
    else group.removeAttribute('aria-invalid');
  }
}

function updateSummary(errors) {
  errorList.replaceChildren();
  for (const [name, error] of Object.entries(errors)) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${fieldTarget(name).id}`;
    link.textContent = `${labels[name]}: ${error}`;
    link.className = 'rounded-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-red-700';
    link.addEventListener('click', event => {
      event.preventDefault();
      fieldTarget(name).focus();
    });
    item.append(link);
    errorList.append(item);
  }
  summary.hidden = Object.keys(errors).length === 0;
}

function validateControl(control, announce = false) {
  const name = control.name;
  if (!(name in labels)) return;
  touched.add(name);
  const error = validateField(name, readValues()[name]);
  const previous = document.getElementById(`${name}-error`).textContent;
  showError(name, error);
  if (announce && error !== previous) announcement.textContent = error ? `${labels[name]}: ${error}` : `${labels[name]} corrected.`;
  if (submitted) updateSummary(validateApplication(readValues()));
}

const service = new URLSearchParams(window.location.search).get('service');
if (serviceOptions.includes(service)) document.getElementById(`service-${service}`).checked = true;

form.addEventListener('focusout', event => validateControl(event.target, true));
form.addEventListener('change', event => {
  warning.hidden = true;
  validateControl(event.target, true);
});
form.addEventListener('input', event => {
  warning.hidden = true;
  if (event.target.name === 'comments') document.querySelector('#comments-count').textContent = event.target.value.length;
  if (touched.has(event.target.name)) validateControl(event.target);
});

function showSuccess() {
  warning.hidden = true;
  form.hidden = true;
  success.hidden = false;
  success.focus();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  submitted = true;
  const errors = validateApplication(readValues());
  Object.keys(labels).forEach(name => {
    touched.add(name);
    showError(name, errors[name] || '');
  });
  updateSummary(errors);
  if (Object.keys(errors).length) {
    summary.focus();
    return;
  }
  if (needsLowVolumeWarning(readValues())) {
    warning.hidden = false;
    warning.focus();
    return;
  }
  showSuccess();
});

document.querySelector('#low-volume-continue').addEventListener('click', showSuccess);
document.querySelector('#low-volume-review').addEventListener('click', () => {
  warning.hidden = true;
  document.querySelector('#monthlyVolume').focus();
});

form.addEventListener('reset', () => {
  touched.clear();
  submitted = false;
  Object.keys(labels).forEach(name => showError(name, ''));
  summary.hidden = true;
  warning.hidden = true;
  errorList.replaceChildren();
  document.querySelector('#comments-count').textContent = '0';
  announcement.textContent = 'Form cleared.';
});

document.querySelector('#new-inquiry').addEventListener('click', () => {
  form.reset();
  success.hidden = true;
  form.hidden = false;
  fieldTarget('companyName').focus();
});
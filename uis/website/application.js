import { localDate, serviceOptions, validateApplication, validateField } from './validation.js';

const form = document.querySelector('#application-form');
const summary = document.querySelector('#error-summary');
const errorList = document.querySelector('#error-list');
const success = document.querySelector('#success-panel');
const announcement = document.querySelector('#validation-announcement');
const touched = new Set();
let submitted = false;

const labels = {
  fullName: 'Full name', email: 'Email address', phone: 'Phone number', company: 'Company / brand name',
  country: 'Operating market', monthlyShipments: 'Monthly shipments', services: 'Services',
  startDate: 'Preferred start date', message: 'Message', consent: 'Contact consent',
};

function readValues() {
  const data = new FormData(form);
  if (form.elements.namedItem('startDate').validity.badInput) data.set('startDate', 'invalid');
  return { ...Object.fromEntries(data), services: data.getAll('services'), consent: data.has('consent') };
}

function fieldTarget(name) {
  return name === 'services' ? document.querySelector('#service-fulfillment') : form.elements.namedItem(name);
}

function showError(name, error) {
  const element = document.getElementById(`${name}-error`);
  element.textContent = error;
  element.hidden = !error;
  const controls = name === 'services' ? form.querySelectorAll('[name="services"]') : [fieldTarget(name)];
  controls.forEach(control => {
    if (error) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  });
  if (name === 'services') {
    const group = document.querySelector('#services-group');
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

document.querySelector('#startDate').min = localDate();
const service = new URLSearchParams(window.location.search).get('service');
if (serviceOptions.includes(service)) document.getElementById(`service-${service}`).checked = true;

form.addEventListener('focusout', event => validateControl(event.target, true));
form.addEventListener('change', event => validateControl(event.target, true));
form.addEventListener('input', event => {
  if (event.target.name === 'message') document.querySelector('#message-count').textContent = event.target.value.length;
  if (touched.has(event.target.name)) validateControl(event.target);
});

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
  form.hidden = true;
  success.hidden = false;
  success.focus();
});

form.addEventListener('reset', () => {
  touched.clear();
  submitted = false;
  Object.keys(labels).forEach(name => showError(name, ''));
  summary.hidden = true;
  errorList.replaceChildren();
  document.querySelector('#message-count').textContent = '0';
  announcement.textContent = 'Form cleared.';
});

document.querySelector('#new-inquiry').addEventListener('click', () => {
  form.reset();
  success.hidden = true;
  form.hidden = false;
  fieldTarget('fullName').focus();
});

document.querySelector('#submit-button').disabled = false;
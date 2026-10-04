import './styles.css';
import '@fontsource-variable/manrope';
import { createIcons, Route, Menu, ArrowUpRight, ArrowRight, ArrowDown, ArrowLeft, Globe2, Warehouse, Truck, RotateCcw, Check, PackageCheck, Handshake, MapPin, Plus, Minus, Package, ShieldCheck } from 'lucide';

createIcons({ icons: { Route, Menu, ArrowUpRight, ArrowRight, ArrowDown, ArrowLeft, Globe2, Warehouse, Truck, RotateCcw, Check, PackageCheck, Handshake, MapPin, Plus, Minus, Package, ShieldCheck } });

document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = new Date().getFullYear();
});

const toggle = document.querySelector('#menu-toggle');
const navigation = document.querySelector('#mobile-nav');

if (toggle && navigation) {
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navigation.hidden = !open;
  }

  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !navigation.hidden) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', event => {
    if (event.matches) setMenu(false);
  });
}
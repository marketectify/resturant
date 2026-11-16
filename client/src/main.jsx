import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './style.css';

// Shareable links like https://site/checkout open the matching screen (the app itself uses #/ routes).
const PAGES = ['checkout', 'track', 'book', 'account'];
const seg = location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
if (PAGES.includes(seg) && !location.hash) history.replaceState(null, '', `/#/${seg}${location.search}`);

createRoot(document.getElementById('root')).render(<App />);

import 'react-app-polyfill/stable';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import configureStore from './store/configureStore';
import Root from './components/root/Root';
import '@fontsource/open-sans/latin.css';
import '@fontsource/open-sans/latin-300-italic.css';
import '@fontsource/open-sans/latin-400-italic.css';
import '@fontsource/open-sans/latin-600-italic.css';
import '@fontsource/open-sans/latin-700-italic.css';
import '@fontsource/open-sans/latin-800-italic.css';
import './styles/App.scss';

// setup redux store
const store = configureStore();
window.store = store;

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Router basename={process.env.PUBLIC_URL}>
    <Root store={store} />
  </Router>
);

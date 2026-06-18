import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hr_token');
      localStorage.removeItem('hr_name');
      localStorage.removeItem('hr_email');
      localStorage.removeItem('hr_role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
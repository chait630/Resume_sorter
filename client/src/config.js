const isDev = process.env.NODE_ENV === 'development';
const BASE_URL = process.env.REACT_APP_API_URL || (isDev ? 'http://localhost:5000/api' : '/api');

export const API_AUTH = `${BASE_URL}/auth`;
export const API_RESUMES = `${BASE_URL}/resumes`;
export const API_REQUIREMENTS = `${BASE_URL}/requirements`;
export const API_EMAIL = `${BASE_URL}/email`;
export const UPLOADS_URL = process.env.REACT_APP_UPLOADS_URL || (isDev ? 'http://localhost:5000/uploads' : '/uploads');

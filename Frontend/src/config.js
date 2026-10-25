export const API_BASE_URL = process.env.REACT_APP_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'https://goye-backend-bw8t.onrender.com'
    : 'https://goye-backend-bw8t.onrender.com'
);
export default API_BASE_URL;

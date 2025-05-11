import axios from "axios";

const apiCall = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  httpsAgent: false,
  timeout: 5000,
  headers:
  {
    'Content-Type': 'application/json'
  }
});

export default apiCall;
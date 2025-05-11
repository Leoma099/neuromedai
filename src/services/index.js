import axios from "axios";

const apiCall = axios.create({
  baseURL: "https://api-neuromedai.onrender.com/api",
  httpsAgent: false,
  timeout: 5000,
  headers:
  {
    'Content-Type': 'application/json'
  }
});

export default apiCall;
export const API_URL = "http://192.168.1.55:3001";

// export const API_URL = "http://localhost:3001";

// export const API_URL = "http://10.0.2.2:3001";

export const API_CONFIG = {
  timeout: 30000, 
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  retry: 3,
  retryDelay: 2000,
  validateStatus: function (status) {
    return status >= 200 && status < 500; 
  },
};

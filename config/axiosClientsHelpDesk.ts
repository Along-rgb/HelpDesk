import axios from 'axios';
const axiosClientsHelpDesk = axios.create({
  baseURL: 'https://helpdesk.edl.com.la/api/v1', // frontend path network hide the main start of endpoint and by /api/{service} when calling external API
  // withCredentials: true,
});

// Request Interceptor
axiosClientsHelpDesk.interceptors.request.use(
  async (config: any) => {
    config.headers = {
      'Content-Type': 'application/json',
      "Accept": "application/json, text/plain, */*",
      ...config.headers,
    };

    // Add Bearer Token if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosClientsHelpDesk.interceptors.response.use(
  (response) => {
    // Handle success responses
    // if (response.status === 200 || response.status === 201) {
    //   // return response?.data; // Return only the data for cleaner usage
    //   return response; 
    // }
    return response;
  },
  (error) => {
    if (error.response) {
      const response = error.response;
      if (response?.data?.code === 401 && response?.data?.error === "Unauthorized") {
        console.log("Unauthorized", error.response);
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.removeItem('token');
        localStorage.removeItem('authStore');
        localStorage.removeItem('sideMenu');
      } else {
        console.error(
          ` API Error: ${response.status} - ${response.statusText}`
        );
      }
    } else {
      console.error('Network/Server Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClientsHelpDesk;
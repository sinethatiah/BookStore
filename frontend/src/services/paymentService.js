import api from './api';

const paymentService = {
  initiatePayment: (data) => api.post('/payments/initiate/', data),
};

export default paymentService;
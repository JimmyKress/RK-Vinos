import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Rutas desde variables de entorno
const ROUTE_AUTH = import.meta.env.VITE_ROUTE_AUTH || '/auth';
const ROUTE_ADMIN = import.meta.env.VITE_ROUTE_ADMIN || '/admin';
const ROUTE_USERS = import.meta.env.VITE_ROUTE_USERS || '/users';
const ROUTE_REVIEWS = import.meta.env.VITE_ROUTE_REVIEWS || '/reviews';
const ROUTE_WINE_COMMENTS = import.meta.env.VITE_ROUTE_WINE_COMMENTS || '/wine-comments';
const ROUTE_PILOT_FEEDBACK = import.meta.env.VITE_ROUTE_PILOT_FEEDBACK || '/pilot-feedback';
const ROUTE_ORDERS = import.meta.env.VITE_ROUTE_ORDERS || '/orders';
const ROUTE_CHARTS = import.meta.env.VITE_ROUTE_CHARTS || '/charts';
const ROUTE_RED_WINES = import.meta.env.VITE_ROUTE_RED_WINES || '/getRED';
const ROUTE_WHITE_WINES = import.meta.env.VITE_ROUTE_WHITE_WINES || '/getWHITE';
const ROUTE_ROSE_WINES = import.meta.env.VITE_ROUTE_ROSE_WINES || '/getROSE';
const ROUTE_ALL_WINES = import.meta.env.VITE_ROUTE_ALL_WINES || '/getAllWines';

// Crear instancia de axios con configuración de retry
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
});

// Interceptor para reintentar automáticamente en error 429
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es error 429 y no se ha reintentado aún
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Esperar 2 segundos y reintentar
      await new Promise(resolve => setTimeout(resolve, 2000));

      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Obtener todos los vinos 
export const getAllWines = async () => {
    try {
        const response = await api.get(`/getAllWines`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener todos los vinos:', error);
        throw error;
    }
};

// Obtener todos los vinos (incluyendo ocultos) para admin
export const getAllWinesAdmin = async () => {
    try {
        const response = await api.get(`/getAllWinesAdmin`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener todos los vinos:', error);
        throw error;
    }
};

// Buscar vinos con autocompletado
export const searchWines = async (query) => {
    try {
        const response = await api.get(`/search-wines`, { params: { q: query } });
        return response.data;
    } catch (error) {
        console.error('Error al buscar vinos:', error);
        throw error;
    }
};

// Obtener todos los vinos rojos
export const getRedWines = async () => {
    try {
        const response = await api.get(`/getRED`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener vinos rojos:', error);
        throw error;
    }
};

// Obtener todos los vinos blancos
export const getWhiteWines = async () => {
    try {
        const response = await api.get(`/getWHITE`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener vinos blancos:', error);
        throw error;
    }
};

// Obtener todos los vinos rosé
export const getRoseWines = async () => {
    try {
        const response = await api.get(`/getROSE`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener vinos rosé:', error);
        throw error;
    }
};


// Obtener todos los usuarios registrados
export const getAllUsers = async () => {
    try {
        const response = await api.get(`/users`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
    }
};

// Eliminar un usuario por ID
export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw error;
    }
};

// Login de usuario
export const loginUser = async (email, password) => {
    try {
        const response = await api.post(`${ROUTE_AUTH}/login`, { email, password });
        return response.data;
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        throw error;
    }
};

// Actualizar perfil de usuario
export const updateUserProfile = async (id, userData) => {
    try {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        throw error;
    }
};

// Actualizar actividad del usuario (heartbeat)
export const updateUserActivity = async (userId) => {
    try {
        const response = await api.post(`/users/activity`, { userId });
        return response.data;
    } catch (error) {
        console.error('Error al actualizar actividad:', error);
        throw error;
    }
};

// Marcar usuario como offline (logout)
export const markUserOffline = async (userId) => {
    try {
        const response = await api.post(`/users/logout`, { userId });
        return response.data;
    } catch (error) {
        console.error('Error al marcar usuario offline:', error);
        throw error;
    }
};


// Verificar contraseña del panel admin (primera capa)
export const verifyAdminPanelPassword = async (password) => {
    try {
        const response = await api.post(`/admin/verify-panel-password`, { password });
        return response.data;
    } catch (error) {
        console.error('Error al verificar contraseña del panel:', error);
        throw error;
    }
};

// Registrar administrador
export const registerAdmin = async (fullName, email, dni, password) => {
    try {
        const response = await api.post(`/admin/register`, {
            fullName,
            email,
            dni,
            password
        });
        return response.data;
    } catch (error) {
        console.error('Error al registrar administrador:', error);
        throw error;
    }
};

// Login de administrador
export const loginAdmin = async (email, dni, password) => {
    try {
        const response = await api.post(`/admin/login`, {
            email,
            dni,
            password
        });
        return response.data;
    } catch (error) {
        console.error('Error al iniciar sesión como administrador:', error);
        throw error;
    }
};


// Solicitar recuperación de contraseña (cliente)
export const requestPasswordReset = async (email) => {
    try {
        const response = await api.post(`${ROUTE_AUTH}/forgot-password`, { email });
        return response.data;
    } catch (error) {
        console.error('Error al solicitar recuperación de contraseña:', error);
        throw error;
    }
};

// Restablecer contraseña (cliente)
export const resetPassword = async (token, password) => {
    try {
        const response = await api.post(`${ROUTE_AUTH}/reset-password`, {
            token,
            password
        });
        return response.data;
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        throw error;
    }
};

// Solicitar recuperación de contraseña (admin)
export const requestAdminPasswordReset = async (email) => {
    try {
        const response = await api.post(`/admin/forgot-password`, { email });
        return response.data;
    } catch (error) {
        console.error('Error al solicitar recuperación de contraseña de admin:', error);
        throw error;
    }
};

// Restablecer contraseña (admin)
export const resetAdminPassword = async (email, code, newPassword) => {
    try {
        const response = await api.post(`/admin/reset-password`, {
            email,
            code,
            newPassword
        });
        return response.data;
    } catch (error) {
        console.error('Error al restablecer contraseña de admin:', error);
        throw error;
    }
};

// Crear un nuevo vino rojo
export const createRedWine = async (wineData) => {
    try {
        const response = await api.post(`/postRED`, wineData);
        return response.data;
    } catch (error) {
        console.error('Error al crear vino rojo:', error);
        throw error;
    }
};

// Crear un nuevo vino blanco
export const createWhiteWine = async (wineData) => {
    try {
        const response = await api.post(`/postWHITE`, wineData);
        return response.data;
    } catch (error) {
        console.error('Error al crear vino blanco:', error);
        throw error;
    }
};

// Crear un nuevo vino rosé
export const createRoseWine = async (wineData) => {
    try {
        const response = await api.post(`/postROSE`, wineData);
        return response.data;
    } catch (error) {
        console.error('Error al crear vino rosé:', error);
        throw error;
    }
};

// Actualizar un vino rojo
export const updateRedWine = async (wineData) => {
    try {
        const response = await api.put(`/putRED`, wineData);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar vino rojo:', error);
        throw error;
    }
};

// Actualizar un vino blanco
export const updateWhiteWine = async (wineData) => {
    try {
        const response = await api.put(`/putWHITE`, wineData);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar vino blanco:', error);
        throw error;
    }
};

// Actualizar un vino rosé
export const updateRoseWine = async (wineData) => {
    try {
        const response = await api.put(`/putROSE`, wineData);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar vino rosé:', error);
        throw error;
    }
};

// Eliminar un vino rojo
export const deleteRedWine = async (id) => {
    try {
        const response = await api.delete(`/deleteRED/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar vino rojo:', error);
        throw error;
    }
};

// Eliminar un vino blanco
export const deleteWhiteWine = async (id) => {
    try {
        const response = await api.delete(`/deleteWHITE/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar vino blanco:', error);
        throw error;
    }
};

// Eliminar un vino rosé
export const deleteRoseWine = async (id) => {
    try {
        const response = await api.delete(`/deleteROSE/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar vino rosé:', error);
        throw error;
    }
};

// Toggle hidden para vino rojo
export const toggleRedWineHidden = async (id, hidden) => {
    try {
        const response = await api.put(`/red-wine/${id}/hidden`, { hidden });
        return response.data;
    } catch (error) {
        console.error('Error al cambiar estado del vino rojo:', error);
        throw error;
    }
};

// Toggle hidden para vino blanco
export const toggleWhiteWineHidden = async (id, hidden) => {
    try {
        const response = await api.put(`/white-wine/${id}/hidden`, { hidden });
        return response.data;
    } catch (error) {
        console.error('Error al cambiar estado del vino blanco:', error);
        throw error;
    }
};

// Toggle hidden para vino rosé
export const toggleRoseWineHidden = async (id, hidden) => {
    try {
        const response = await api.put(`/rose-wine/${id}/hidden`, { hidden });
        return response.data;
    } catch (error) {
        console.error('Error al cambiar estado del vino rosé:', error);
        throw error;
    }
};

// ============================================
// REVIEWS API
// ============================================

export const getReviews = async () => {
    try {
        const response = await api.get(`/reviews`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener reseñas:', error);
        throw error;
    }
};

export const createReview = async (user_id, rating, comment) => {
    try {
        const response = await api.post(`/reviews`, { user_id, rating, comment });
        return response.data;
    } catch (error) {
        console.error('Error al crear reseña:', error);
        throw error;
    }
};

export const deleteReview = async (id, user_id, admin = false) => {
    try {
        const response = await api.delete(`/reviews/${id}`, { data: { user_id, admin } });
        return response.data;
    } catch (error) {
        console.error('Error al eliminar reseña:', error);
        throw error;
    }
};

// ============================================
// WINE COMMENTS API
// ============================================

export const getWineComments = async (slug) => {
    try {
        const response = await api.get(`/wine-comments/${slug}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        throw error;
    }
};

export const createWineComment = async (user_id, wine_slug, comment) => {
    try {
        const response = await api.post(`/wine-comments`, { user_id, wine_slug, comment });
        return response.data;
    } catch (error) {
        console.error('Error al crear comentario:', error);
        throw error;
    }
};

export const deleteWineComment = async (id, user_id, admin = false) => {
    try {
        const response = await api.delete(`/wine-comments/${id}`, { data: { user_id, admin } });
        return response.data;
    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        throw error;
    }
};

export const getAllWineComments = async () => {
    try {
        const response = await api.get(`/wine-comments/all`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener todos los comentarios:', error);
        throw error;
    }
};

// Verificar si un email está registrado
export const checkEmail = async (email) => {
    try {
        const response = await api.post(`${ROUTE_AUTH}/check-email`, { email });
        return response.data;
    } catch (error) {
        console.error('Error al verificar email:', error);
        throw error;
    }
};

// ============================================
// ORDERS API
// ============================================

export const createOrder = async (orderData) => {
    try {
        const response = await api.post(`/orders`, orderData);
        return response.data;
    } catch (error) {
        console.error('Error al crear pedido:', error);
        throw error;
    }
};

export const getOrders = async () => {
    try {
        const response = await api.get(`/orders`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        throw error;
    }
};

export const getOrderById = async (id) => {
    try {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener pedido:', error);
        throw error;
    }
};

export const updateOrderStatus = async (id, status) => {
    try {
        const response = await api.put(`/orders/${id}/status`, { status });
        return response.data;
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        throw error;
    }
};

export const rejectOrder = async (id, reason) => {
    try {
        const response = await api.put(`/orders/${id}/reject`, { reason });
        return response.data;
    } catch (error) {
        console.error('Error al rechazar pedido:', error);
        throw error;
    }
};

export const deleteOrder = async (id) => {
    try {
        const response = await api.delete(`/orders/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar pedido:', error);
        throw error;
    }
};

export const getOrderStats = async () => {
    try {
        const response = await api.get(`/orders/stats`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return { topPurchased: [], topViewed: [] };
    }
};

export const trackWineView = async (slug, wine_name) => {
    try {
        await api.post(`/wine-views/${slug}`, { wine_name });
    } catch {
        // silencioso — no interrumpir la navegación
    }
};

export const confirmOrderStep = async (id, checkpoint, emailOnly = false) => {
    try {
        const response = await api.put(`/orders/${id}/checkpoint`, { checkpoint, value: true, emailOnly });
        return response.data;
    } catch (error) {
        console.error('Error al confirmar paso:', error);
        throw error;
    }
};

export const generateCharts = async (stats) => {
    try {
        const response = await api.post(`/charts/generate`, stats);
        return response.data;
    } catch (error) {
        console.error('Error al generar gráficos:', error);
        throw error;
    }
};

// ============================================
// PILOT FEEDBACK API
// ============================================

export const submitFeedback = async (data) => {
    try {
        const response = await api.post(`/pilot-feedback`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const checkFeedbackSent = async (email) => {
    try {
        const response = await api.get(`/pilot-feedback/check`, { params: { email } });
        return response.data;
    } catch (error) {
        return { alreadySent: false };
    }
};

export const getAllFeedback = async () => {
    try {
        const response = await api.get(`/pilot-feedback`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteFeedbackItem = async (id) => {
    try {
        const response = await api.delete(`/pilot-feedback/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

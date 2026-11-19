import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
//RED
import { redGET, redPOST, redPUT, redDELETE, toggleRedHidden } from '../controllers/drinksRedControllers.js';
//WHITE
import { whiteGET, whitePOST, whitePUT, whiteDELETE, toggleWhiteHidden } from '../controllers/drinksWhiteControllers.js';
//ROSE
import { roseGET, rosePOST, rosePUT, roseDELETE, toggleRoseHidden } from '../controllers/drinksRoseControllers.js';
//ALL WINES
import { getAllWines, getAllWinesAdmin, searchWines } from '../controllers/allWinesController.js';
//AUTH
import { sendVerificationCode, verifyCodeAndRegister, resendVerificationCode, loginUser, forgotPassword, resetPassword, checkEmail } from '../controllers/authController.js';
//ADMIN AUTH
import { registerAdmin, loginAdmin, verifyAdminPanelPassword } from '../controllers/adminAuthController.js';
//USERS
import { getAllUsers, deleteUser, updateUserProfile, updateUserActivity, markUserOffline } from '../controllers/usersController.js';
//REVIEWS
import { getReviews, createReview, deleteReview, getWineComments, createWineComment, deleteWineComment, getAllWineComments, createFeedback, getFeedback, deleteFeedback, checkFeedback } from '../controllers/reviewsController.js';
//ORDERS
import { createOrder, getOrders, getOrderById, updateOrderStatus, updateOrderCheckpoint, mercadopagoWebhook, rejectOrder, deleteOrder, getOrderStats, trackWineView } from '../controllers/ordersController.js';
//PILOT FEEDBACK
import { submitFeedback, getAllFeedback } from '../controllers/feedbackController.js';
//CHARTS
import { generateCharts } from '../controllers/chartsController.js';

const router = express.Router();

// Rutas desde variables de entorno
const ROUTE_AUTH = process.env.ROUTE_AUTH || '/auth';
const ROUTE_ADMIN = process.env.ROUTE_ADMIN || '/admin';
const ROUTE_USERS = process.env.ROUTE_USERS || '/users';
const ROUTE_REVIEWS = process.env.ROUTE_REVIEWS || '/reviews';
const ROUTE_WINE_COMMENTS = process.env.ROUTE_WINE_COMMENTS || '/wine-comments';
const ROUTE_PILOT_FEEDBACK = process.env.ROUTE_PILOT_FEEDBACK || '/pilot-feedback';
const ROUTE_ORDERS = process.env.ROUTE_ORDERS || '/orders';
const ROUTE_CHARTS = process.env.ROUTE_CHARTS || '/charts';
const ROUTE_RED_WINES = process.env.ROUTE_RED_WINES || '/getRED';
const ROUTE_WHITE_WINES = process.env.ROUTE_WHITE_WINES || '/getWHITE';
const ROUTE_ROSE_WINES = process.env.ROUTE_ROSE_WINES || '/getROSE';
const ROUTE_ALL_WINES = process.env.ROUTE_ALL_WINES || '/getAllWines';

//PARA RED
router.get(ROUTE_RED_WINES, redGET);
router.post("/postRED", redPOST);
router.put("/putRED", redPUT);
router.delete("/deleteRED/:id", redDELETE);
router.put("/red-wine/:id/hidden", toggleRedHidden);

//PARA WHITE
router.get(ROUTE_WHITE_WINES, whiteGET);
router.post("/postWHITE", whitePOST);
router.put("/putWHITE", whitePUT);
router.delete("/deleteWHITE/:id", whiteDELETE);
router.put("/white-wine/:id/hidden", toggleWhiteHidden);

//PARA ROSE
router.get(ROUTE_ROSE_WINES, roseGET);
router.post("/postROSE", rosePOST);
router.put("/putROSE", rosePUT);
router.delete("/deleteROSE/:id", roseDELETE);
router.put("/rose-wine/:id/hidden", toggleRoseHidden);

//ALL WINES
router.get(ROUTE_ALL_WINES, getAllWines);
router.get("/getAllWinesAdmin", getAllWinesAdmin);
router.get("/search-wines", searchWines);

//AUTH ROUTES
router.post(`${ROUTE_AUTH}/send-verification-code`, sendVerificationCode);
router.post(`${ROUTE_AUTH}/verify-code`, verifyCodeAndRegister);
router.post(`${ROUTE_AUTH}/resend-code`, resendVerificationCode);
router.post(`${ROUTE_AUTH}/login`, loginUser);
router.post(`${ROUTE_AUTH}/check-email`, checkEmail);
router.post(`${ROUTE_AUTH}/forgot-password`, forgotPassword);
router.post(`${ROUTE_AUTH}/reset-password`, resetPassword);

//ADMIN AUTH ROUTES
router.post(`${ROUTE_ADMIN}/verify-panel-password`, verifyAdminPanelPassword);
router.post(`${ROUTE_ADMIN}/register`, registerAdmin);
router.post(`${ROUTE_ADMIN}/login`, loginAdmin);

//USERS ROUTES
router.get(ROUTE_USERS, getAllUsers);
router.delete(`${ROUTE_USERS}/:id`, deleteUser);
router.put(`${ROUTE_USERS}/:id`, updateUserProfile);
router.post(`${ROUTE_USERS}/activity`, updateUserActivity);
router.post(`${ROUTE_USERS}/logout`, markUserOffline);

//REVIEWS ROUTES
router.get(ROUTE_REVIEWS, getReviews);
router.post(ROUTE_REVIEWS, createReview);
router.delete(`${ROUTE_REVIEWS}/:id`, deleteReview);

//WINE COMMENTS ROUTES
router.get(`${ROUTE_WINE_COMMENTS}/all`, getAllWineComments);
router.get(`${ROUTE_WINE_COMMENTS}/:slug`, getWineComments);
router.post(ROUTE_WINE_COMMENTS, createWineComment);
router.delete(`${ROUTE_WINE_COMMENTS}/:id`, deleteWineComment);

// PILOT FEEDBACK ROUTES
router.post(ROUTE_PILOT_FEEDBACK, submitFeedback);
router.get(ROUTE_PILOT_FEEDBACK, getAllFeedback);
router.delete(`${ROUTE_PILOT_FEEDBACK}/:id`, deleteFeedback);

//ORDERS ROUTES
router.post(ROUTE_ORDERS, createOrder);
router.get(`${ROUTE_ORDERS}/stats`, getOrderStats);
router.get(ROUTE_ORDERS, getOrders);
router.get(`${ROUTE_ORDERS}/:id`, getOrderById);
router.put(`${ROUTE_ORDERS}/:id/status`, updateOrderStatus);
router.put(`${ROUTE_ORDERS}/:id/checkpoint`, updateOrderCheckpoint);
router.put(`${ROUTE_ORDERS}/:id/reject`, rejectOrder);
router.delete(`${ROUTE_ORDERS}/:id`, deleteOrder);
router.post(`${ROUTE_ORDERS}/mercadopago/webhook`, mercadopagoWebhook);
router.post("/wine-views/:slug", trackWineView);

//CHARTS ROUTES
router.post(`${ROUTE_CHARTS}/generate`, generateCharts);

export default router;

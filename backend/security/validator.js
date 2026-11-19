import { body, param, validationResult } from 'express-validator'

// Middleware para manejar errores de validación
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

// Validaciones para Usuarios
export const validateUser = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .if(body('password').exists())
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
]

export const validateUserUpdate = [
  param('id')
    .isInt().withMessage('Invalid user ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  handleValidationErrors
]

// Validaciones para Órdenes
export const validateOrder = [
  body('user_id')
    .notEmpty().withMessage('User ID is required')
    .isInt().withMessage('Invalid user ID'),
  body('total')
    .notEmpty().withMessage('Total is required')
    .isFloat({ min: 0 }).withMessage('Total must be a positive number'),
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  handleValidationErrors
]

// Validaciones para Reviews
export const validateReview = [
  body('user_id')
    .notEmpty().withMessage('User ID is required')
    .isInt().withMessage('Invalid user ID'),
  body('wine_id')
    .notEmpty().withMessage('Wine ID is required')
    .isInt().withMessage('Invalid wine ID'),
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters'),
  handleValidationErrors
]

// Validaciones para Feedback
export const validateFeedback = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('message')
    .notEmpty().withMessage('Message is required')
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters'),
  handleValidationErrors
]

// Validaciones para Vinos
export const validateWine = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be between 2 and 200 characters'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('type')
    .optional()
    .isIn(['tinto', 'blanco', 'espumante']).withMessage('Invalid wine type'),
  handleValidationErrors
]

// Validación de ID genérica
export const validateId = [
  param('id')
    .isInt().withMessage('Invalid ID'),
  handleValidationErrors
]

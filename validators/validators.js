const { body, param, query } = require('express-validator');

/**
 * Validateurs pour l'authentification
 */
const registerValidator = [
  body('first_name')
    .trim()
    .notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères'),
  
  body('last_name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Numéro de téléphone invalide'),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  
  body('role')
    .optional()
    .isIn(['ADMIN', 'UTILISATEUR']).withMessage('Rôle invalide')
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail()
];

const resetPasswordValidator = [
  body('token')
    .notEmpty().withMessage('Le token est requis'),
  
  body('newPassword')
    .notEmpty().withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

/**
 * Validateurs pour les utilisateurs
 */
const updateUserValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères'),
  
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Numéro de téléphone invalide'),
  
  body('role')
    .optional()
    .isIn(['ADMIN', 'UTILISATEUR']).withMessage('Rôle invalide'),
  
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active doit être un booléen')
];

const changePasswordValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  
  body('currentPassword')
    .optional()
    .notEmpty().withMessage('Le mot de passe actuel est requis'),
  
  body('newPassword')
    .notEmpty().withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

/**
 * Validateurs pour les projets
 */
const createProjetValidator = [
  body('type_projet')
    .notEmpty().withMessage('Le type de projet est requis')
    .isIn(['RIDEAU', 'WALLPAPER']).withMessage('Type de projet invalide'),
  
  body('client_name')
    .optional()
    .trim(),
  
  body('projet_name')
    .optional()
    .trim(),
  
  body('ville')
    .optional()
    .trim(),
  
  body('contact_client')
    .optional()
    .trim(),
  
  body('responsable')
    .optional()
    .trim()
];

const updateProjetValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID projet invalide'),
  
  body('type_projet')
    .optional()
    .isIn(['RIDEAU', 'WALLPAPER']).withMessage('Type de projet invalide'),
  
  body('client_name')
    .optional()
    .trim(),
  
  body('projet_name')
    .optional()
    .trim(),
  
  body('ville')
    .optional()
    .trim(),
  
  body('contact_client')
    .optional()
    .trim(),
  
  body('responsable')
    .optional()
    .trim()
];

/**
 * Validateurs pour les espaces
 */
const createEspaceValidator = [
  body('projet_id')
    .notEmpty().withMessage('L\'ID du projet est requis')
    .isInt({ min: 1 }).withMessage('ID projet invalide'),
  
  body('espace_name')
    .trim()
    .notEmpty().withMessage('Le nom de l\'espace est requis'),
  
  body('type_piece')
    .optional()
    .trim(),
  
  body('largeur')
    .optional()
    .isFloat({ min: 0 }).withMessage('Largeur invalide'),
  
  body('hauteur')
    .optional()
    .isFloat({ min: 0 }).withMessage('Hauteur invalide'),
  
  // Validations pour les détails rideau
  body('details.rideau.ampleur')
    .optional()
    .isFloat({ min: 0 }).withMessage('Ampleur invalide'),
  
  body('details.rideau.ourlet')
    .optional()
    .isFloat({ min: 0 }).withMessage('Ourlet invalide')
];

const updateEspaceValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID espace invalide'),
  
  body('espace_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Le nom de l\'espace ne peut pas être vide'),
  
  body('type_piece')
    .optional()
    .trim(),
  
  body('largeur')
    .optional()
    .isFloat({ min: 0 }).withMessage('Largeur invalide'),
  
  body('hauteur')
    .optional()
    .isFloat({ min: 0 }).withMessage('Hauteur invalide'),
  
  body('details.rideau.ampleur')
    .optional()
    .isFloat({ min: 0 }).withMessage('Ampleur invalide'),
  
  body('details.rideau.ourlet')
    .optional()
    .isFloat({ min: 0 }).withMessage('Ourlet invalide')
];

/**
 * Validateurs pour les paramètres d'ID
 */
const idParamValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID invalide')
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateUserValidator,
  changePasswordValidator,
  createProjetValidator,
  updateProjetValidator,
  createEspaceValidator,
  updateEspaceValidator,
  idParamValidator

};

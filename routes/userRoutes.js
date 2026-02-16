const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword
} = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');
const {
  updateUserValidator,
  changePasswordValidator,
  idParamValidator
} = require('../validators/validators');

/**
 * @route   GET /api/users
 * @desc    Récupérer tous les utilisateurs (Admin seulement)
 * @access  Private/Admin
 */
router.get('/', authenticateToken, authorizeRoles('ADMIN'), getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Récupérer un utilisateur par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, idParamValidator, handleValidationErrors, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  updateUserValidator,
  handleValidationErrors,
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur (Admin seulement)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  idParamValidator,
  handleValidationErrors,
  deleteUser
);

/**
 * @route   PUT /api/users/:id/change-password
 * @desc    Changer le mot de passe d'un utilisateur
 * @access  Private
 */
router.put(
  '/:id/change-password',
  authenticateToken,
  changePasswordValidator,
  handleValidationErrors,
  changePassword
);

module.exports = router;
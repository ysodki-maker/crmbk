const express = require('express');
const router = express.Router();
const {
  createEspace,
  getEspacesByProjet,
  getEspaceById,
  updateEspace,
  deleteEspace
} = require('../controllers/espaceController');
const { authenticateToken } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');
const {
  createEspaceValidator,
  updateEspaceValidator,
  idParamValidator
} = require('../validators/validators');

/**
 * @route   POST /api/espaces
 * @desc    Créer un nouvel espace
 * @access  Private
 */
router.post('/', authenticateToken, createEspaceValidator, handleValidationErrors, createEspace);

/**
 * @route   GET /api/espaces/projet/:projetId
 * @desc    Récupérer tous les espaces d'un projet
 * @access  Private
 */
router.get('/projet/:projetId', authenticateToken, getEspacesByProjet);

/**
 * @route   GET /api/espaces/:id
 * @desc    Récupérer un espace par ID
 * @access  Private
 */
router.get('/:id', authenticateToken, idParamValidator, handleValidationErrors, getEspaceById);

/**
 * @route   PUT /api/espaces/:id
 * @desc    Mettre à jour un espace
 * @access  Private
 */
router.put(
  '/:id',
  authenticateToken,
  updateEspaceValidator,
  handleValidationErrors,
  updateEspace
);

/**
 * @route   DELETE /api/espaces/:id
 * @desc    Supprimer un espace
 * @access  Private
 */
router.delete('/:id', authenticateToken, idParamValidator, handleValidationErrors, deleteEspace);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  createProjet,
  getAllProjets,
  getProjetById,
  updateProjet,
  deleteProjet,
  getProjetStats
} = require('../controllers/projetController');
const { authenticateToken } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');
const {
  createProjetValidator,
  updateProjetValidator,
  idParamValidator
} = require('../validators/validators');

/**
 * @route   POST /api/projets
 * @desc    Créer un nouveau projet
 * @access  Private
 */
router.post('/', authenticateToken, createProjetValidator, handleValidationErrors, createProjet);

/**
 * @route   GET /api/projets
 * @desc    Récupérer tous les projets
 * @access  Private
 */
router.get('/', authenticateToken, getAllProjets);

/**
 * @route   GET /api/projets/stats
 * @desc    Récupérer les statistiques des projets
 * @access  Private
 */
router.get('/stats', authenticateToken, getProjetStats);

/**
 * @route   GET /api/projets/:id
 * @desc    Récupérer un projet par ID avec ses espaces
 * @access  Private
 */
router.get('/:id', authenticateToken, idParamValidator, handleValidationErrors, getProjetById);

/**
 * @route   PUT /api/projets/:id
 * @desc    Mettre à jour un projet
 * @access  Private
 */
router.put(
  '/:id',
  authenticateToken,
  updateProjetValidator,
  handleValidationErrors,
  updateProjet
);

/**
 * @route   DELETE /api/projets/:id
 * @desc    Supprimer un projet
 * @access  Private
 */
router.delete('/:id', authenticateToken, idParamValidator, handleValidationErrors, deleteProjet);

module.exports = router;
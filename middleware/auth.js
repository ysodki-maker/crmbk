const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');

/**
 * Middleware pour vérifier le token JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Récupérer le token du header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    // Vérifier le token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Token invalide ou expiré'
        });
      }

      // Vérifier que l'utilisateur existe toujours et est actif
      const [users] = await promisePool.query(
        'SELECT ID, email, role, is_active FROM users WHERE ID = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      if (!users[0].is_active) {
        return res.status(403).json({
          success: false,
          message: 'Compte désactivé'
        });
      }

      // Ajouter les informations de l'utilisateur à la requête
      req.user = {
        userId: decoded.userId,
        email: users[0].email,
        role: users[0].role
      };

      next();
    });
  } catch (error) {
    console.error('Erreur dans authenticateToken:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification'
    });
  }
};

/**
 * Middleware pour vérifier les rôles
 * @param {...string} allowedRoles - Liste des rôles autorisés
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis: ${allowedRoles.join(' ou ')}`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
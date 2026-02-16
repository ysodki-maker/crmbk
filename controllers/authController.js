const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisePool } = require('../config/database');
const { sendResetPasswordEmail } = require('../utils/emailService');

/**
 * Générer un token JWT
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

/**
 * Inscription d'un nouvel utilisateur
 */
const register = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role } = req.body;

    // Vérifier si l'email existe déjà
    const [existingUsers] = await promisePool.query(
      'SELECT email FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insérer le nouvel utilisateur
    const [result] = await promisePool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, hashedPassword, role || 'UTILISATEUR']
    );

    // Générer le token
    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        userId: result.insertId,
        email,
        first_name,
        last_name,
        role: role || 'UTILISATEUR',
        token
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
};

/**
 * Connexion d'un utilisateur
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const [users] = await promisePool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const user = users[0];

    // Vérifier si le compte est actif
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token
    const token = generateToken(user.ID);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        userId: user.ID,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

/**
 * Obtenir le profil de l'utilisateur connecté
 */
const getProfile = async (req, res) => {
  try {
    const [users] = await promisePool.query(
      'SELECT ID, first_name, last_name, email, phone, role, created_at FROM users WHERE ID = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Demander une réinitialisation de mot de passe
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await promisePool.query(
      'SELECT ID, email, first_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Pour des raisons de sécurité, ne pas révéler si l'email existe
      return res.status(200).json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
      });
    }

    const user = users[0];

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpire = new Date(Date.now() + 3600000); // 1 heure

    // Sauvegarder le token
    await promisePool.query(
      'UPDATE users SET reset_token = ?, reset_token_expire = ? WHERE ID = ?',
      [resetToken, resetTokenExpire, user.ID]
    );

    // Envoyer l'email
    await sendResetPasswordEmail(user.email, user.first_name, resetToken);

    res.status(200).json({
      success: true,
      message: 'Email de réinitialisation envoyé'
    });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Réinitialiser le mot de passe
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const [users] = await promisePool.query(
      'SELECT ID FROM users WHERE reset_token = ? AND reset_token_expire > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    const user = users[0];

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe et supprimer le token
    await promisePool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expire = NULL WHERE ID = ?',
      [hashedPassword, user.ID]
    );

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword
};
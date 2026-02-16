const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projetRoutes = require('./routes/projetRoutes');
const espaceRoutes = require('./routes/espaceRoutes');

// Initialiser Express
const app = express();

// Configuration CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://192.168.11.103:3000',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  preflightContinue: false, // Important : arrête après la réponse preflight
  optionsSuccessStatus: 204
};

// Middlewares globaux
app.use(helmet()); // Sécurité des headers HTTP
app.use(cors(corsOptions)); // CORS
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: true })); // Parser URL-encoded
app.use(morgan('dev')); // Logger HTTP

// Rate Limiting pour prévenir les abus
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Max 100 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Appliquer le rate limiting à toutes les routes
// app.use('/api/auth', limiter);

// Route de santé / test
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API CRM en ligne',
    timestamp: new Date().toISOString()
  });
});

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projets', projetRoutes);
app.use('/api/espaces', espaceRoutes);

// Route par défaut
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenue sur l\'API CRM',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      projets: '/api/projets',
      espaces: '/api/espaces'
    }
  });
});

// Gestion des erreurs 404 et autres erreurs
app.use(notFound);
app.use(errorHandler);

// Configuration du port
const PORT = process.env.PORT || 5000;

// Démarrer le serveur
// const startServer = async () => {
//   try {
//     // Tester la connexion à la base de données
//     const dbConnected = await testConnection();
    
//     if (!dbConnected) {
//       console.error('❌ Impossible de se connecter à la base de données');
//       console.log('Vérifiez vos paramètres de connexion dans le fichier .env');
//       process.exit(1);
//     }

//     // Démarrer le serveur
//     app.listen(PORT, '0.0.0.0', () => {
//       console.log('═══════════════════════════════════════════════════');
//       console.log(`🚀 Serveur démarré en mode ${process.env.NODE_ENV || 'development'}`);
//       console.log(`📡 API disponible sur: http://localhost:${PORT}`);
//       console.log(`📊 Health check: http://localhost:${PORT}/health`);
//       console.log('═══════════════════════════════════════════════════');
//     });
//   } catch (error) {
//     console.error('❌ Erreur lors du démarrage du serveur:', error);
//     process.exit(1);
//   }
// };
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Impossible de se connecter à la base de données');
      console.log('Vérifiez vos paramètres de connexion dans le fichier .env');
      process.exit(1);
    }

    // Obtenir l'adresse IP locale
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    // Trouver l'IP locale (WiFi ou Ethernet)
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
        }
      });
    });

    // Démarrer le serveur sur toutes les interfaces (0.0.0.0)
    app.listen(PORT, '0.0.0.0', () => {
      console.log('═══════════════════════════════════════════════════');
      console.log(`🚀 Serveur démarré en mode ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API locale: http://localhost:${PORT}`);
      console.log(`🌐 API réseau: http://${localIP}:${PORT}`);
      console.log(`📊 Health check: http://${localIP}:${PORT}/health`);
      console.log(`🔗 Partage cette URL avec ton équipe: http://${localIP}:${PORT}`);
      console.log('═══════════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};
// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err);
  // Fermer le serveur proprement
  process.exit(1);
});

// Démarrer l'application
startServer();

module.exports = app;
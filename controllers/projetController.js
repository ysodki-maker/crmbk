const { promisePool } = require('../config/database');

/**
 * Créer un nouveau projet
 */
const createProjet = async (req, res) => {
  try {
    const {
      type_projet,
      client_name,
      projet_name,
      ville,
      contact_client,
      responsable
    } = req.body;

    const [result] = await promisePool.query(
      `INSERT INTO clients_projets 
       (user_id, type_projet, client_name, projet_name, ville, contact_client, responsable) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userId, type_projet, client_name, projet_name, ville, contact_client, responsable]
    );

    res.status(201).json({
      success: true,
      message: 'Projet créé avec succès',
      data: {
        id: result.insertId,
        ...req.body,
        user_id: req.user.userId
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Récupérer tous les projets
 */
const getAllProjets = async (req, res) => {
  try {
    const { type_projet, ville } = req.query;
    
    let query = `
      SELECT p.*, u.first_name, u.last_name, u.email as user_email
      FROM clients_projets p
      LEFT JOIN users u ON p.user_id = u.ID
      WHERE 1=1
    `;
    const params = [];

    // Si l'utilisateur n'est pas admin, il ne voit que ses projets
    if (req.user.role !== 'ADMIN') {
      query += ' AND p.user_id = ?';
      params.push(req.user.userId);
    }

    if (type_projet) {
      query += ' AND p.type_projet = ?';
      params.push(type_projet);
    }

    if (ville) {
      query += ' AND p.ville LIKE ?';
      params.push(`%${ville}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    const [projets] = await promisePool.query(query, params);

    res.status(200).json({
      success: true,
      count: projets.length,
      data: projets
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Récupérer un projet par ID avec ses espaces
 */
const getProjetById = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le projet
    let query = `
      SELECT p.*, u.first_name, u.last_name, u.email as user_email
      FROM clients_projets p
      LEFT JOIN users u ON p.user_id = u.ID
      WHERE p.id = ?
    `;
    const params = [id];

    // Si l'utilisateur n'est pas admin, vérifier qu'il est propriétaire
    if (req.user.role !== 'ADMIN') {
      query += ' AND p.user_id = ?';
      params.push(req.user.userId);
    }

    const [projets] = await promisePool.query(query, params);

    if (projets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé ou accès non autorisé'
      });
    }

    const projet = projets[0];

    // Récupérer les espaces associés
    const [espaces] = await promisePool.query(
      `SELECT e.*, 
              r.type_tringles, r.type_rideau, r.type_ouverture, r.type_confection,
              r.ampleur, r.finition_au_sol, r.ref_tissu, r.ourlet, r.remarque_client as remarque_rideau,
              w.type_prise, w.type_produit, w.etat_mur
       FROM espaces e
       LEFT JOIN rideaux_details r ON e.id = r.espace_id
       LEFT JOIN wallpaper_details w ON e.id = w.espace_id
       WHERE e.projet_id = ?
       ORDER BY e.created_at ASC`,
      [id]
    );

    projet.espaces = espaces;

    res.status(200).json({
      success: true,
      data: projet
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Mettre à jour un projet
 */
const updateProjet = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type_projet,
      client_name,
      projet_name,
      ville,
      contact_client,
      responsable
    } = req.body;

    // Vérifier que le projet existe et que l'utilisateur y a accès
    let checkQuery = 'SELECT id FROM clients_projets WHERE id = ?';
    const checkParams = [id];

    if (req.user.role !== 'ADMIN') {
      checkQuery += ' AND user_id = ?';
      checkParams.push(req.user.userId);
    }

    const [existingProjets] = await promisePool.query(checkQuery, checkParams);

    if (existingProjets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé ou accès non autorisé'
      });
    }

    // Construire la requête de mise à jour
    const updates = [];
    const params = [];

    if (type_projet !== undefined) {
      updates.push('type_projet = ?');
      params.push(type_projet);
    }
    if (client_name !== undefined) {
      updates.push('client_name = ?');
      params.push(client_name);
    }
    if (projet_name !== undefined) {
      updates.push('projet_name = ?');
      params.push(projet_name);
    }
    if (ville !== undefined) {
      updates.push('ville = ?');
      params.push(ville);
    }
    if (contact_client !== undefined) {
      updates.push('contact_client = ?');
      params.push(contact_client);
    }
    if (responsable !== undefined) {
      updates.push('responsable = ?');
      params.push(responsable);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }

    params.push(id);

    await promisePool.query(
      `UPDATE clients_projets SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Récupérer le projet mis à jour
    const [updatedProjet] = await promisePool.query(
      'SELECT * FROM clients_projets WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Projet mis à jour avec succès',
      data: updatedProjet[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Supprimer un projet
 */
const deleteProjet = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le projet existe et que l'utilisateur y a accès
    let checkQuery = 'SELECT id FROM clients_projets WHERE id = ?';
    const checkParams = [id];

    if (req.user.role !== 'ADMIN') {
      checkQuery += ' AND user_id = ?';
      checkParams.push(req.user.userId);
    }

    const [existingProjets] = await promisePool.query(checkQuery, checkParams);

    if (existingProjets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé ou accès non autorisé'
      });
    }

    // La suppression en cascade s'occupera des espaces et détails
    await promisePool.query('DELETE FROM clients_projets WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Projet supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Récupérer les statistiques des projets
 */
const getProjetStats = async (req, res) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type_projet = 'RIDEAU' THEN 1 ELSE 0 END) as rideaux,
        SUM(CASE WHEN type_projet = 'WALLPAPER' THEN 1 ELSE 0 END) as wallpapers
      FROM clients_projets
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'ADMIN') {
      query += ' AND user_id = ?';
      params.push(req.user.userId);
    }

    const [stats] = await promisePool.query(query, params);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  createProjet,
  getAllProjets,
  getProjetById,
  updateProjet,
  deleteProjet,
  getProjetStats
};
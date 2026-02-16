const { promisePool } = require('../config/database');

/**
 * Backend espace controller
 * Créer un nouvel espace
 */
const createEspace = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { projet_id, espace_name, details } = req.body; // ❌ RETIRÉ largeur, hauteur (ne sont plus dans formData)

    // Vérifier que le projet existe et que l'utilisateur y a accès
    let checkQuery = 'SELECT id, type_projet FROM clients_projets WHERE id = ?';
    const checkParams = [projet_id];

    if (req.user.role !== 'ADMIN') {
      checkQuery += ' AND user_id = ?';
      checkParams.push(req.user.userId);
    }

    const [projets] = await connection.query(checkQuery, checkParams);

    if (projets.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé ou accès non autorisé'
      });
    }

    const projet = projets[0];

    // Créer l'espace (sans largeur/hauteur)
    const [espaceResult] = await connection.query(
      `INSERT INTO espaces (projet_id, espace_name) 
       VALUES (?, ?)`,
      [projet_id, espace_name]
    );

    const espaceId = espaceResult.insertId;

    // Insérer les détails selon le type de projet
    if (details) {
      // SUPPORT POUR PLUSIEURS RIDEAUX
      if (projet.type_projet === 'RIDEAU' && details.rideaux && Array.isArray(details.rideaux)) {
        for (const rideau of details.rideaux) {
          const {
            type_tringles,
            type_rideau,
            type_ouverture,
            type_confection,
            ampleur,
            finition_au_sol,
            ref_tissu,
            ourlet,
            remarque_client,
            largeur,  // ✅ largeur maintenant dans rideau
            hauteur   // ✅ hauteur maintenant dans rideau
          } = rideau;

          // ✅ FIX: Virgules manquantes corrigées
          await connection.query(
            `INSERT INTO rideaux_details 
             (espace_id, largeur, hauteur, type_tringles, type_rideau, type_ouverture, type_confection, 
              ampleur, finition_au_sol, ref_tissu, ourlet, remarque_client)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [espaceId, largeur, hauteur, type_tringles, type_rideau, type_ouverture, type_confection,
             ampleur, finition_au_sol, ref_tissu, ourlet, remarque_client]
          );
        }
      } 
      // SUPPORT POUR PLUSIEURS WALLPAPERS
      else if (projet.type_projet === 'WALLPAPER' && details.wallpapers && Array.isArray(details.wallpapers)) {
        for (const wallpaper of details.wallpapers) {
          const { type_produit, etat_mur, largeur, hauteur } = wallpaper;

          await connection.query(
            `INSERT INTO wallpaper_details (espace_id, largeur, hauteur, type_produit, etat_mur)
             VALUES (?, ?, ?, ?, ?)`,
            [espaceId, largeur, hauteur, type_produit, etat_mur]
          );
        }
      }
    }

    await connection.commit();

    // Récupérer l'espace créé avec tous ses détails
    const [newEspace] = await connection.query(
      `SELECT e.* FROM espaces e WHERE e.id = ?`,
      [espaceId]
    );

    // Récupérer tous les détails rideaux
    const [rideaux] = await connection.query(
      `SELECT * FROM rideaux_details WHERE espace_id = ?`,
      [espaceId]
    );

    // Récupérer tous les détails wallpapers
    const [wallpapers] = await connection.query(
      `SELECT * FROM wallpaper_details WHERE espace_id = ?`,
      [espaceId]
    );

    const espaceWithDetails = {
      ...newEspace[0],
      rideaux: rideaux,
      wallpapers: wallpapers
    };

    res.status(201).json({
      success: true,
      message: 'Espace créé avec succès',
      data: espaceWithDetails
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la création de l\'espace:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  } finally {
    connection.release();
  }
};

// MISE À JOUR de getEspacesByProjet pour récupérer tous les détails
const getEspacesByProjet = async (req, res) => {
  try {
    const { projetId } = req.params;

    // Vérifier l'accès au projet
    let checkQuery = 'SELECT id FROM clients_projets WHERE id = ?';
    const checkParams = [projetId];

    if (req.user.role !== 'ADMIN') {
      checkQuery += ' AND user_id = ?';
      checkParams.push(req.user.userId);
    }

    const [projets] = await promisePool.query(checkQuery, checkParams);

    if (projets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé ou accès non autorisé'
      });
    }

    // Récupérer les espaces
    const [espaces] = await promisePool.query(
      `SELECT e.* FROM espaces e WHERE e.projet_id = ? ORDER BY e.created_at ASC`,
      [projetId]
    );

    // Pour chaque espace, récupérer ses détails
    const espacesWithDetails = await Promise.all(
      espaces.map(async (espace) => {
        const [rideaux] = await promisePool.query(
          `SELECT * FROM rideaux_details WHERE espace_id = ?`,
          [espace.id]
        );

        const [wallpapers] = await promisePool.query(
          `SELECT * FROM wallpaper_details WHERE espace_id = ?`,
          [espace.id]
        );

        return {
          ...espace,
          rideaux,
          wallpapers
        };
      })
    );

    res.status(200).json({
      success: true,
      count: espacesWithDetails.length,
      data: espacesWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des espaces:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// MISE À JOUR de getEspaceById
const getEspaceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'espace avec vérification d'accès
    let query = `
      SELECT e.*, p.type_projet
      FROM espaces e
      JOIN clients_projets p ON e.projet_id = p.id
      WHERE e.id = ?
    `;
    const params = [id];

    if (req.user.role !== 'ADMIN') {
      query += ' AND p.user_id = ?';
      params.push(req.user.userId);
    }

    const [espaces] = await promisePool.query(query, params);

    if (espaces.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Espace non trouvé ou accès non autorisé'
      });
    }

    // Récupérer tous les détails
    const [rideaux] = await promisePool.query(
      `SELECT * FROM rideaux_details WHERE espace_id = ?`,
      [id]
    );

    const [wallpapers] = await promisePool.query(
      `SELECT * FROM wallpaper_details WHERE espace_id = ?`,
      [id]
    );

    const espaceWithDetails = {
      ...espaces[0],
      rideaux,
      wallpapers
    };

    res.status(200).json({
      success: true,
      data: espaceWithDetails
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'espace:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// MISE À JOUR de updateEspace
const updateEspace = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { espace_name, details } = req.body; // ❌ RETIRÉ largeur, hauteur

    // Vérifier l'accès à l'espace
    let checkQuery = `
      SELECT e.id, p.type_projet
      FROM espaces e
      JOIN clients_projets p ON e.projet_id = p.id
      WHERE e.id = ?
    `;
    const checkParams = [id];

    if (req.user.role !== 'ADMIN') {
      checkQuery += ' AND p.user_id = ?';
      checkParams.push(req.user.userId);
    }

    const [espaces] = await connection.query(checkQuery, checkParams);

    if (espaces.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Espace non trouvé ou accès non autorisé'
      });
    }

    const espace = espaces[0];

    // Mettre à jour l'espace
    const updates = [];
    const params = [];

    if (espace_name !== undefined) {
      updates.push('espace_name = ?');
      params.push(espace_name);
    }
    
    if (updates.length > 0) {
      params.push(id);
      await connection.query(
        `UPDATE espaces SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Mettre à jour les détails - SUPPRIMER ET RECRÉER
    if (details) {
      if (espace.type_projet === 'RIDEAU' && details.rideaux && Array.isArray(details.rideaux)) {
        // Supprimer les anciens rideaux
        await connection.query(
          `DELETE FROM rideaux_details WHERE espace_id = ?`,
          [id]
        );

        // Insérer les nouveaux rideaux
        for (const rideau of details.rideaux) {
          const {
            type_tringles, 
            type_rideau, 
            type_ouverture, 
            type_confection,
            ampleur, 
            finition_au_sol, 
            ref_tissu, 
            ourlet, 
            remarque_client,
            largeur,  // ✅ largeur maintenant dans rideau
            hauteur   // ✅ hauteur maintenant dans rideau
          } = rideau;

          // ✅ FIX: Ordre des colonnes et placeholders corrigé
          await connection.query(
            `INSERT INTO rideaux_details 
             (espace_id, largeur, hauteur, type_tringles, type_rideau, type_ouverture, type_confection, 
              ampleur, finition_au_sol, ref_tissu, ourlet, remarque_client)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, largeur, hauteur, type_tringles, type_rideau, type_ouverture, type_confection,
             ampleur, finition_au_sol, ref_tissu, ourlet, remarque_client]
          );
        }
      } else if (espace.type_projet === 'WALLPAPER' && details.wallpapers && Array.isArray(details.wallpapers)) {
        // Supprimer les anciens wallpapers
        await connection.query(
          `DELETE FROM wallpaper_details WHERE espace_id = ?`,
          [id]
        );

        // Insérer les nouveaux wallpapers
        for (const wallpaper of details.wallpapers) {
          const { type_produit, etat_mur, largeur, hauteur } = wallpaper;

          await connection.query(
            `INSERT INTO wallpaper_details (espace_id, largeur, hauteur, type_produit, etat_mur)
             VALUES (?, ?, ?, ?, ?)`,
            [id, largeur, hauteur, type_produit, etat_mur]
          );
        }
      }
    }

    await connection.commit();

    // Récupérer l'espace mis à jour avec tous ses détails
    const [updatedEspace] = await connection.query(
      `SELECT e.* FROM espaces e WHERE e.id = ?`,
      [id]
    );

    const [rideaux] = await connection.query(
      `SELECT * FROM rideaux_details WHERE espace_id = ?`,
      [id]
    );

    const [wallpapers] = await connection.query(
      `SELECT * FROM wallpaper_details WHERE espace_id = ?`,
      [id]
    );

    const espaceWithDetails = {
      ...updatedEspace[0],
      rideaux,
      wallpapers
    };

    res.status(200).json({
      success: true,
      message: 'Espace mis à jour avec succès',
      data: espaceWithDetails
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la mise à jour de l\'espace:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  } finally {
    connection.release();
  }
};

/**
 * Supprimer un espace
 */
const deleteEspace = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier l'accès
    let checkQuery = `
      SELECT e.id
      FROM espaces e
      JOIN clients_projets p ON e.projet_id = p.id
      WHERE e.id = ?
    `;
    const checkParams = [id];

    if (req.user.role !== 'ADMIN') {
      checkQuery += ' AND p.user_id = ?';
      checkParams.push(req.user.userId);
    }

    const [espaces] = await promisePool.query(checkQuery, checkParams);

    if (espaces.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Espace non trouvé ou accès non autorisé'
      });
    }

    // La suppression en cascade s'occupera des détails
    await promisePool.query('DELETE FROM espaces WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Espace supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'espace:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  createEspace,
  getEspacesByProjet,
  getEspaceById,
  updateEspace,
  deleteEspace
};
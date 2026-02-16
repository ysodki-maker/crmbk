-- Script d'insertion de données de test pour le CRM

-- Insertion d'utilisateurs de test
-- Mot de passe pour tous: "password123"
-- Hash bcrypt de "password123": $2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u

INSERT INTO `users` (`first_name`, `last_name`, `email`, `phone`, `password`, `role`, `is_active`, `email_verified`) VALUES
('Admin', 'Principal', 'admin@crm.com', '0612345678', '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', 'ADMIN', 1, 1),
('Mohammed', 'Alami', 'mohammed@crm.com', '0623456789', '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', 'COMMERCIAL', 1, 1),
('Fatima', 'Zahra', 'fatima@crm.com', '0634567890', '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', 'COMMERCIAL', 1, 1),
('Hassan', 'Bennani', 'hassan@crm.com', '0645678901', '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', 'POSEUR', 1, 1);

-- Insertion de projets de test
INSERT INTO `clients_projets` (`user_id`, `type_projet`, `client_name`, `projet_name`, `ville`, `contact_client`, `responsable`) VALUES
(2, 'RIDEAU', 'Hotel Royal Mansour', 'Rideaux Suites Présidentielles', 'Casablanca', '0522123456', 'Mohammed Alami'),
(2, 'WALLPAPER', 'Villa Dar Al Hana', 'Papier Peint Chambres', 'Rabat', '0537234567', 'Mohammed Alami'),
(3, 'RIDEAU', 'Restaurant Le Riad', 'Habillage Fenêtres', 'Marrakech', '0524345678', 'Fatima Zahra'),
(3, 'WALLPAPER', 'Bureau Premium Tower', 'Décoration Bureaux', 'Casablanca', '0522456789', 'Fatima Zahra');

-- Insertion d'espaces pour projet RIDEAU (ID 1)
INSERT INTO `espaces` (`projet_id`, `espace_name`, `type_piece`, `largeur`, `hauteur`) VALUES
(1, 'Suite Présidentielle 1', 'Chambre principale', 5.50, 3.20),
(1, 'Suite Présidentielle 2', 'Salon', 7.20, 3.20);

-- Insertion des détails rideaux
INSERT INTO `rideaux_details` (`espace_id`, `type_tringles`, `type_rideau`, `type_ouverture`, `type_confection`, `ampleur`, `finition_au_sol`, `ref_tissu`, `ourlet`, `remarque_client`) VALUES
(1, 'Rail électrique', 'Voilage + Occultant', 'Centrale', 'Plis flamands', 2.50, 'Effleurer le sol', 'LUX-001', 12.00, 'Tissu haut de gamme, couleurs chaudes'),
(2, 'Tringle décorative', 'Double rideau', 'Latérale droite', 'Plis simples', 2.00, '2cm du sol', 'LUX-002', 10.00, 'Préférence pour tons neutres');

-- Insertion d'espaces pour projet WALLPAPER (ID 2)
INSERT INTO `espaces` (`projet_id`, `espace_name`, `type_piece`, `largeur`, `hauteur`) VALUES
(2, 'Chambre Master', 'Chambre principale', 4.80, 2.80),
(2, 'Chambre Enfants', 'Chambre', 3.50, 2.80);

-- Insertion des détails wallpaper
INSERT INTO `wallpaper_details` (`espace_id`, `type_prise`, `type_produit`, `etat_mur`) VALUES
(3, 'Prise de mesure complète', 'Papier peint vinyle texturé', 'Excellent état'),
(4, 'Prise de mesure simple', 'Papier peint intissé', 'Bon état, petites retouches nécessaires');

-- Insertion d'espaces pour projet RIDEAU (ID 3)
INSERT INTO `espaces` (`projet_id`, `espace_name`, `type_piece`, `largeur`, `hauteur`) VALUES
(3, 'Salle principale', 'Restaurant', 12.00, 3.50),
(3, 'Terrasse couverte', 'Extérieur', 8.00, 2.80);

-- Insertion des détails rideaux
INSERT INTO `rideaux_details` (`espace_id`, `type_tringles`, `type_rideau`, `type_ouverture`, `type_confection`, `ampleur`, `finition_au_sol`, `ref_tissu`, `ourlet`, `remarque_client`) VALUES
(5, 'Rail manuel', 'Rideau occultant', 'Centrale', 'Œillets', 2.00, 'Effleurer le sol', 'REST-001', 10.00, 'Tissu résistant, facile à entretenir'),
(6, 'Rail manuel', 'Voilage', 'Latérale gauche', 'Plis simples', 1.80, 'Effleurer le sol', 'REST-002', 8.00, 'Protection soleil importante');

-- Insertion d'espaces pour projet WALLPAPER (ID 4)
INSERT INTO `espaces` (`projet_id`, `espace_name`, `type_piece`, `largeur`, `hauteur`) VALUES
(4, 'Bureau Directeur', 'Bureau', 5.00, 2.60),
(4, 'Salle de réunion', 'Salle de conférence', 8.50, 2.60),
(4, 'Open Space', 'Bureau partagé', 15.00, 2.60);

-- Insertion des détails wallpaper
INSERT INTO `wallpaper_details` (`espace_id`, `type_prise`, `type_produit`, `etat_mur`) VALUES
(7, 'Prise de mesure complète', 'Papier peint vinyle design moderne', 'Excellent état'),
(8, 'Prise de mesure complète', 'Papier peint acoustique', 'Bon état'),
(9, 'Prise de mesure complète avec plans', 'Papier peint lavable', 'Nécessite préparation');

-- Afficher le récapitulatif
SELECT 
    'Données de test insérées avec succès!' as Message,
    (SELECT COUNT(*) FROM users) as Total_Utilisateurs,
    (SELECT COUNT(*) FROM clients_projets) as Total_Projets,
    (SELECT COUNT(*) FROM espaces) as Total_Espaces;

-- Afficher les credentials de test
SELECT 
    '==== CREDENTIALS DE TEST ====' as Info,
    'Email: admin@crm.com | Password: password123 | Role: ADMIN' as Admin,
    'Email: mohammed@crm.com | Password: password123 | Role: COMMERCIAL' as Commercial_1,
    'Email: fatima@crm.com | Password: password123 | Role: COMMERCIAL' as Commercial_2,
    'Email: hassan@crm.com | Password: password123 | Role: POSEUR' as Poseur;
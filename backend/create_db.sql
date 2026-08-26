-- Script de création de la base de données SMART HOSTEL ATOMA
-- Exécutez ce fichier avec : mysql -u root -p < create_db.sql

CREATE DATABASE IF NOT EXISTS hostelatoma_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'hostelatoma_user'@'localhost' IDENTIFIED BY 'hostelatoma_pass';
GRANT ALL PRIVILEGES ON hostelatoma_db.* TO 'hostelatoma_user'@'localhost';
FLUSH PRIVILEGES;

SELECT 'Base de données hostelatoma_db créée avec succès.' AS message;

-- Schéma du serveur de suivi maths&go — fichier GÉNÉRÉ.
-- Ne pas modifier à la main : éditer schema() dans public/lib/bd.php
-- puis relancer : php outils/generer-sql.php

CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prof_id INTEGER NOT NULL DEFAULT 0,
  libelle VARCHAR(40) NOT NULL,
  applis VARCHAR(255) NOT NULL DEFAULT 'defi-tables',
  cree_le VARCHAR(25) NOT NULL,
  KEY classes_prof (prof_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS eleves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classe_id INTEGER NOT NULL,
  code VARCHAR(8) NOT NULL,
  prenom VARCHAR(40) NOT NULL DEFAULT '',
  initiale VARCHAR(4) NOT NULL DEFAULT '',
  cree_le VARCHAR(25) NOT NULL,
  UNIQUE KEY eleves_code (code),
  KEY eleves_classe (classe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS progressions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eleve_id INTEGER NOT NULL,
  appli VARCHAR(30) NOT NULL,
  donnees MEDIUMTEXT NOT NULL,
  maj_le VARCHAR(25) NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  donnees_avant MEDIUMTEXT NULL,
  UNIQUE KEY progressions_eleve_appli (eleve_id, appli)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifiant VARCHAR(40) NOT NULL,
  mdp_hash VARCHAR(255) NOT NULL,
  admin INTEGER NOT NULL DEFAULT 0,
  actif INTEGER NOT NULL DEFAULT 1,
  mdp_temporaire INTEGER NOT NULL DEFAULT 0,
  cree_le VARCHAR(25) NOT NULL,
  UNIQUE KEY profs_identifiant (identifiant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classe_id INTEGER NOT NULL,
  prof_id INTEGER NOT NULL,
  droit VARCHAR(10) NOT NULL DEFAULT 'lecture',
  cree_le VARCHAR(25) NOT NULL,
  UNIQUE KEY partages_classe_prof (classe_id, prof_id),
  KEY partages_prof (prof_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions_prof (
  jeton_hash VARCHAR(64) NOT NULL PRIMARY KEY,
  prof_id INTEGER NOT NULL,
  expire_le VARCHAR(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compteurs (
  cle VARCHAR(80) NOT NULL PRIMARY KEY,
  fenetre INTEGER NOT NULL,
  nombre INTEGER NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

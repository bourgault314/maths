-- Schéma du serveur de suivi maths&go — fichier GÉNÉRÉ.
-- Ne pas modifier à la main : éditer schema() dans public/lib/bd.php
-- puis relancer : php outils/generer-sql.php

CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prof_id INTEGER NOT NULL DEFAULT 0,
  libelle VARCHAR(40) NOT NULL,
  applis VARCHAR(255) NOT NULL DEFAULT 'defi-tables',
  cree_le VARCHAR(25) NOT NULL,
  reglages TEXT NULL,
  KEY classes_prof (prof_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS eleves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classe_id INTEGER NOT NULL,
  code VARCHAR(8) NOT NULL,
  prenom VARCHAR(40) NOT NULL DEFAULT '',
  initiale VARCHAR(4) NOT NULL DEFAULT '',
  cree_le VARCHAR(25) NOT NULL,
  ajouts TEXT NULL,
  reglages_eleve TEXT NULL,
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

CREATE TABLE IF NOT EXISTS billets (
  hash VARCHAR(64) NOT NULL PRIMARY KEY,
  eleve_id INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL,
  expire_le INTEGER NOT NULL,
  KEY billets_eleve (eleve_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eleve_id INTEGER NOT NULL,
  appli VARCHAR(30) NOT NULL,
  jour VARCHAR(10) NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  calculs INTEGER NOT NULL DEFAULT 0,
  donnees MEDIUMTEXT NOT NULL,
  maj_le VARCHAR(25) NOT NULL,
  UNIQUE KEY versions_eleve_appli_jour (eleve_id, appli, jour),
  KEY versions_eleve (eleve_id),
  KEY versions_jour (jour)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS records (
  eleve_id INTEGER NOT NULL PRIMARY KEY,
  meilleur INTEGER NULL,
  meilleur_le VARCHAR(32) NULL,
  semaine INTEGER NULL,
  semaine_lundi VARCHAR(10) NULL,
  nom INTEGER NULL,
  maj_le VARCHAR(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cours_ouvertures (
  eleve_id INTEGER NOT NULL,
  fiche VARCHAR(24) NOT NULL,
  jour VARCHAR(10) NOT NULL,
  UNIQUE KEY cours_ouvertures_eleve_fiche (eleve_id, fiche)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS journal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quand VARCHAR(25) NOT NULL,
  prof_id INTEGER NOT NULL DEFAULT 0,
  action VARCHAR(40) NOT NULL,
  cible_type VARCHAR(10) NOT NULL DEFAULT '',
  cible_id INTEGER NOT NULL DEFAULT 0,
  resultat VARCHAR(10) NOT NULL DEFAULT 'ok',
  KEY journal_quand (quand)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS directs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classe_id INTEGER NOT NULL,
  prof_id INTEGER NOT NULL,
  mode VARCHAR(12) NOT NULL DEFAULT 'eclair',
  etat VARCHAR(10) NOT NULL DEFAULT 'attente',
  numero INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 0,
  ouvert_le INTEGER NOT NULL,
  expire_le INTEGER NOT NULL,
  reglage TEXT NULL,
  UNIQUE KEY directs_classe (classe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS modeles_evaluation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prof_id INTEGER NOT NULL,
  nom VARCHAR(40) NOT NULL DEFAULT '',
  reglage VARCHAR(600) NOT NULL DEFAULT '{}',
  cree_le INTEGER NOT NULL,
  modifie_le INTEGER NOT NULL,
  KEY modeles_evaluation_prof (prof_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS directs_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  direct_id INTEGER NOT NULL,
  numero INTEGER NOT NULL,
  type VARCHAR(12) NOT NULL,
  reglage VARCHAR(255) NOT NULL DEFAULT '{}',
  bonne VARCHAR(40) NULL,
  UNIQUE KEY directs_questions_numero (direct_id, numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS directs_reponses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  direct_id INTEGER NOT NULL,
  numero INTEGER NOT NULL,
  eleve_id INTEGER NOT NULL,
  reponse VARCHAR(40) NOT NULL,
  UNIQUE KEY directs_reponses_eleve (direct_id, numero, eleve_id),
  KEY directs_reponses_par_eleve (eleve_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

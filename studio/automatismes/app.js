/*
 * Logique du nouveau menu Automatismes (bêta interne).
 *
 * Reprend le déroulé de l'application actuelle — réglages en haut, choix des
 * automatismes par domaine, action en bas — avec deux améliorations :
 *   - la sélection survit aux changements de réglage (l'ancien menu la vidait) ;
 *   - le lancement se fait dans le même onglet, sans fenêtre surgissante.
 * Le bouton « Lancer » fabrique un lien de série MG1 et l'ouvre dans le moteur
 * actuel : les questions restent donc les vraies questions d'Automatismes.
 */
(() => {
  'use strict';

  const CATALOGUE = globalThis.MATHSGO_CATALOGUE_AUTOMATISMES;
  const MG1 = globalThis.MATHSGO_MG1;
  const MODULE_PAR_ID_HISTORIQUE = new Map(CATALOGUE.MODULES.map(m => [m.idHistorique, m]));
  const CODE_PAR_ID_CANONIQUE = new Map(CATALOGUE.MODULES.map(m => [m.id, m.code]));

  const reglages = {
    level: '3e',
    visualMode: 'with',
    experienceMode: 'interactive',
    count: 5
  };
  const selection = new Set(); // ids historiques (dnb_…)

  function modulesVisibles() {
    return CATALOGUE.MODULES.filter(module => {
      if (module.interactifSeulement && reglages.experienceMode !== 'interactive') return false;
      if (reglages.level === '5e') return CATALOGUE.MODULES_5E.includes(module.idHistorique);
      return module.niveaux.includes(reglages.level) ||
        (reglages.level === '3e' && module.niveaux.includes('DNB'));
    });
  }

  // La sélection est la MÉMOIRE de l'utilisateur : on n'en retire jamais
  // rien quand un module devient invisible (revenir au réglage précédent
  // doit la restaurer). Seule la partie visible compte pour le lancement.
  function selectionVisible() {
    const visibles = new Set(modulesVisibles().map(module => module.idHistorique));
    return [...selection].filter(id => visibles.has(id));
  }

  function creerLigneModule(module) {
    const ligne = document.createElement('label');
    ligne.className = 'ligne-module';
    const case_ = document.createElement('input');
    case_.type = 'checkbox';
    case_.className = 'case-module';
    case_.value = module.idHistorique;
    case_.checked = selection.has(module.idHistorique);
    case_.addEventListener('change', () => {
      if (case_.checked) selection.add(module.idHistorique);
      else selection.delete(module.idHistorique);
      rafraichirCompteurs();
    });
    const texte = document.createElement('span');
    texte.className = 'titre-module';
    texte.textContent = module.titre;
    ligne.append(case_, texte);
    ligne.classList.toggle('est-choisi', case_.checked);
    return ligne;
  }

  function rendreMenu() {
    const boite = document.getElementById('modules');
    const domaineOuvert = boite.querySelector('.theme-group[open]')?.dataset.theme || null;
    boite.replaceChildren();
    const visibles = modulesVisibles();

    CATALOGUE.DOMAINES.forEach(domaine => {
      const membres = visibles.filter(module => module.domaine === domaine.id);
      if (!membres.length) return;
      const membresParId = new Set(membres.map(module => module.idHistorique));

      const groupe = document.createElement('details');
      groupe.className = 'theme-group';
      groupe.dataset.theme = domaine.id;
      groupe.open = domaine.id === domaineOuvert;

      const entete = document.createElement('summary');
      entete.className = 'theme-summary';
      entete.innerHTML =
        '<span class="theme-icon" aria-hidden="true"></span>' +
        '<span class="theme-name">' + domaine.titre + '</span>' +
        '<span class="theme-count"></span>' +
        '<span class="theme-chevron" aria-hidden="true"></span>';

      const contenu = document.createElement('div');
      contenu.className = 'theme-items';

      const barreDomaine = document.createElement('label');
      barreDomaine.className = 'tout-domaine';
      const caseDomaine = document.createElement('input');
      caseDomaine.type = 'checkbox';
      caseDomaine.className = 'case-domaine';
      caseDomaine.setAttribute('aria-label', 'Tout sélectionner dans ' + domaine.titre);
      caseDomaine.addEventListener('change', () => {
        membres.forEach(module => {
          if (caseDomaine.checked) selection.add(module.idHistorique);
          else selection.delete(module.idHistorique);
        });
        groupe.querySelectorAll('.case-module').forEach(caseModule => {
          caseModule.checked = caseDomaine.checked;
          caseModule.closest('.ligne-module').classList.toggle('est-choisi', caseDomaine.checked);
        });
        rafraichirCompteurs();
      });
      const texteDomaine = document.createElement('span');
      texteDomaine.textContent = 'Tout sélectionner dans ce domaine';
      barreDomaine.append(caseDomaine, texteDomaine);
      contenu.appendChild(barreDomaine);

      (CATALOGUE.SOUS_GROUPES[domaine.id] || []).forEach(sousGroupe => {
        const presents = sousGroupe.modules
          .filter(id => membresParId.has(id))
          .map(id => MODULE_PAR_ID_HISTORIQUE.get(id));
        if (!presents.length) return;
        const bloc = document.createElement('section');
        bloc.className = 'module-subgroup';
        const titre = document.createElement('h3');
        titre.className = 'module-subgroup-title';
        titre.textContent = sousGroupe.titre;
        const lignes = document.createElement('div');
        lignes.className = 'module-subgroup-items';
        presents.forEach(module => lignes.appendChild(creerLigneModule(module)));
        bloc.append(titre, lignes);
        contenu.appendChild(bloc);
      });

      groupe.append(entete, contenu);
      groupe.addEventListener('toggle', () => {
        if (groupe.open) {
          boite.querySelectorAll('.theme-group[open]').forEach(autre => {
            if (autre !== groupe) autre.open = false;
          });
        }
      });
      boite.appendChild(groupe);
    });

    rafraichirCompteurs();
  }

  function rafraichirCompteurs() {
    document.querySelectorAll('.theme-group').forEach(groupe => {
      const cases = [...groupe.querySelectorAll('.case-module')];
      const cochees = cases.filter(caseModule => caseModule.checked);
      cases.forEach(caseModule => {
        caseModule.closest('.ligne-module').classList.toggle('est-choisi', caseModule.checked);
      });
      const caseDomaine = groupe.querySelector('.case-domaine');
      if (caseDomaine) {
        caseDomaine.checked = cases.length > 0 && cochees.length === cases.length;
        caseDomaine.indeterminate = cochees.length > 0 && cochees.length < cases.length;
      }
      groupe.classList.toggle('has-selection', cochees.length > 0);
      const badge = groupe.querySelector('.theme-count');
      if (badge) {
        badge.innerHTML = '<span class="theme-count-value">' + cochees.length + ' / ' + cases.length +
          '</span><span class="theme-count-label"> sélectionné' + (cochees.length === 1 ? '' : 's') + '</span>';
        badge.setAttribute('aria-label',
          cochees.length + ' automatisme' + (cochees.length === 1 ? '' : 's') +
          ' sélectionné' + (cochees.length === 1 ? '' : 's') + ' sur ' + cases.length);
      }
    });
    rafraichirBarreAction();
  }

  function rafraichirBarreAction() {
    const total = selectionVisible().length;
    const barre = document.querySelector('.barre-action');
    const resume = document.getElementById('resumeSelection');
    const details = document.getElementById('resumeReglages');
    const bouton = document.getElementById('boutonLancer');
    barre.classList.toggle('est-vide', total === 0);
    resume.textContent = total
      ? total + ' automatisme' + (total === 1 ? '' : 's') + ' sélectionné' + (total === 1 ? '' : 's')
      : 'Choisis au moins un automatisme';
    const sansCalculatrice = reglages.level === 'DNB';
    const niveauResume = sansCalculatrice ? 'DNB · Sans calculatrice' : reglages.level;
    const libelleLancement = reglages.experienceMode === 'interactive'
      ? 'Lancer l’entraînement'
      : 'Lancer le diaporama';
    details.textContent = niveauResume + ' · ' + reglages.count + ' questions · ' +
      (reglages.experienceMode === 'interactive' ? 'Interactif' : 'Diaporama') + ' · ' +
      (reglages.visualMode === 'with' ? 'Avec aide' : 'Sans aide');
    bouton.disabled = total === 0;
    bouton.classList.toggle('avec-calculatrice-barree', sansCalculatrice);
    bouton.querySelector('.texte-lancement').textContent = libelleLancement;
    bouton.setAttribute('aria-label',
      libelleLancement + (sansCalculatrice ? ', sans calculatrice' : ''));
    document.getElementById('boutonAucun').disabled = total === 0;
    document.getElementById('boutonTous').disabled = total === modulesVisibles().length;
  }

  function lancer() {
    // seuls les modules VISIBLES avec les réglages courants partent en série
    const ids = selectionVisible();
    if (!ids.length) return;
    const idsCanoniques = ids.map(id => MODULE_PAR_ID_HISTORIQUE.get(id).id);
    const code = MG1.encoderSerie({
      niveau: reglages.level,
      nombreDeQuestions: reglages.count,
      idsCanoniques,
      seed: MG1.seedAleatoire(),
      aide: reglages.visualMode,
      mode: reglages.experienceMode
    }, CODE_PAR_ID_CANONIQUE);
    // Même onglet : l'application actuelle reconnaît #s=MG1-… et lance la série.
    location.href = '../../auto/#s=' + code;
  }

  function brancherSegments() {
    document.querySelectorAll('.segments').forEach(groupe => {
      const nom = groupe.dataset.reglage;
      groupe.querySelectorAll('button').forEach(bouton => {
        bouton.addEventListener('click', () => {
          reglages[nom] = nom === 'count' ? Number(bouton.dataset.value) : bouton.dataset.value;
          groupe.querySelectorAll('button').forEach(autre => {
            const actif = autre === bouton;
            autre.classList.toggle('est-actif', actif);
            autre.setAttribute('aria-pressed', actif ? 'true' : 'false');
          });
          if (nom === 'level' || nom === 'experienceMode') rendreMenu();
          else rafraichirBarreAction();
        });
      });
    });
  }

  document.getElementById('boutonTous').addEventListener('click', () => {
    modulesVisibles().forEach(module => selection.add(module.idHistorique));
    document.querySelectorAll('.case-module').forEach(caseModule => { caseModule.checked = true; });
    rafraichirCompteurs();
  });
  document.getElementById('boutonAucun').addEventListener('click', () => {
    // ne vide que ce qui est visible : les sélections des autres réglages restent
    selectionVisible().forEach(id => selection.delete(id));
    document.querySelectorAll('.case-module').forEach(caseModule => { caseModule.checked = false; });
    rafraichirCompteurs();
  });
  document.getElementById('boutonLancer').addEventListener('click', lancer);

  brancherSegments();
  rendreMenu();
})();

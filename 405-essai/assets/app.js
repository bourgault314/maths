(() => {
  "use strict";

  const screens = [...document.querySelectorAll("[data-screen]")];
  const routeButtons = [...document.querySelectorAll("[data-route]")];
  const navButtons = [...document.querySelectorAll(".nav-item[data-route]")];
  const dialog = document.querySelector("#activity-dialog");
  const dialogKicker = document.querySelector("#dialog-kicker");
  const dialogTitle = document.querySelector("#dialog-title");
  const dialogContent = document.querySelector("#dialog-content");
  const dialogClose = document.querySelector("#dialog-close");

  let activeTimer = null;

  function clearActiveTimer() {
    if (activeTimer !== null) {
      window.clearInterval(activeTimer);
      activeTimer = null;
    }
  }

  function showRoute(route) {
    const target = screens.find((screen) => screen.dataset.screen === route) || screens[0];

    screens.forEach((screen) => {
      const active = screen === target;
      screen.hidden = !active;
      screen.classList.toggle("is-active", active);
    });

    navButtons.forEach((button) => {
      const active = button.dataset.route === target.dataset.screen;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector("#main-content")?.focus({ preventScroll: true });
  }

  routeButtons.forEach((button) => {
    button.addEventListener("click", () => showRoute(button.dataset.route));
  });

  function openDialog(kicker, title, html) {
    clearActiveTimer();
    dialogKicker.textContent = kicker;
    dialogTitle.textContent = title;
    dialogContent.innerHTML = html;

    if (!dialog.hasAttribute("open")) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }

    window.requestAnimationFrame(() => dialogTitle.focus({ preventScroll: true }));
  }

  function closeDialog() {
    clearActiveTimer();
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  dialogClose.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener("close", clearActiveTimer);

  function bindChoice(selector, callback) {
    dialogContent.querySelectorAll(selector).forEach((button) => {
      button.addEventListener("click", () => callback(button));
    });
  }

  function renderTimer(seconds, task) {
    clearActiveTimer();
    openDialog("Outil · démarrer", "Deux minutes, pas plus", `
      <div class="timer-card">
        <small>Ta seule mission</small>
        <h2>${task}</h2>
        <strong id="timer-value">02:00</strong>
        <p id="timer-message">Quand tu es prêt, lance le chrono et ne fais que cette action.</p>
        <button id="timer-start" class="primary-button" type="button">Lancer</button>
      </div>
      <div class="dialog-actions">
        <button id="timer-finish" class="secondary-button" type="button">J’ai terminé avant</button>
      </div>
    `);

    const value = dialogContent.querySelector("#timer-value");
    const message = dialogContent.querySelector("#timer-message");
    const start = dialogContent.querySelector("#timer-start");
    const finish = dialogContent.querySelector("#timer-finish");
    let remaining = seconds;

    const complete = () => {
      clearActiveTimer();
      value.textContent = "✓";
      message.textContent = "Tu as commencé. Maintenant, choisis seulement la prochaine petite étape.";
      start.hidden = true;
      finish.textContent = "Fermer";
      finish.onclick = closeDialog;
    };

    start.addEventListener("click", () => {
      start.disabled = true;
      start.textContent = "C’est parti";
      activeTimer = window.setInterval(() => {
        remaining -= 1;
        const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
        const secs = String(remaining % 60).padStart(2, "0");
        value.textContent = `${minutes}:${secs}`;
        if (remaining <= 0) complete();
      }, 1000);
    });

    finish.addEventListener("click", complete);
  }

  const toolRenderers = {
    start() {
      openDialog("Outil · 2 min", "Je n’arrive pas à commencer", `
        <p class="flow-intro">Ne cherche pas à finir tout le travail. Choisis seulement la première action visible.</p>
        <div class="choice-list">
          <button class="choice-button" type="button" data-first-step="Sortir le matériel et écrire le titre"><span>1</span><strong>Je n’ai encore rien ouvert.</strong></button>
          <button class="choice-button" type="button" data-first-step="Lire une seule fois la première consigne"><span>2</span><strong>La tâche me paraît trop grande.</strong></button>
          <button class="choice-button" type="button" data-first-step="Faire seulement la toute première étape"><span>3</span><strong>Je sais quoi faire mais je repousse.</strong></button>
        </div>
        <div id="start-output" aria-live="polite"></div>
      `);

      bindChoice("[data-first-step]", (button) => {
        const output = dialogContent.querySelector("#start-output");
        output.innerHTML = `
          <div class="feedback-box feedback-info"><strong>Ta première action</strong>${button.dataset.firstStep}. Rien d’autre pour le moment.</div>
          <div class="dialog-actions"><button id="launch-two-minutes" class="primary-button" type="button">Lancer 2 minutes</button></div>
        `;
        output.querySelector("#launch-two-minutes").addEventListener("click", () => renderTimer(120, button.dataset.firstStep));
      });
    },

    focus() {
      const responses = {
        phone: ["Le téléphone m’attire", "Le mettre hors de portée et couper les alertes pendant le temps choisi."],
        noise: ["Le bruit m’embarque", "Changer de place si c’est possible, ou demander un temps calme précis."],
        tabs: ["Je saute d’un écran à l’autre", "Garder uniquement la page utile et fermer le reste."],
        thoughts: ["Une idée me revient sans arrêt", "L’écrire en trois mots sur un papier, puis revenir à la tâche."],
        others: ["Je regarde ce que font les autres", "Tourner légèrement mon matériel et fixer une étape très courte."]
      };

      openDialog("Outil · 1 min", "Je suis distrait", `
        <p class="flow-intro">Une distraction précise appelle une parade précise. Laquelle te fait décrocher maintenant&nbsp;?</p>
        <div class="choice-list">
          <button class="choice-button" type="button" data-focus="phone"><span>📱</span><strong>Mon téléphone ou ses alertes</strong></button>
          <button class="choice-button" type="button" data-focus="noise"><span>♫</span><strong>Le bruit autour de moi</strong></button>
          <button class="choice-button" type="button" data-focus="tabs"><span>▣</span><strong>Les onglets ou les applications</strong></button>
          <button class="choice-button" type="button" data-focus="thoughts"><span>✦</span><strong>Une pensée qui revient</strong></button>
          <button class="choice-button" type="button" data-focus="others"><span>◉</span><strong>Ce que font les autres</strong></button>
        </div>
        <div id="focus-output" aria-live="polite"></div>
      `);

      bindChoice("[data-focus]", (button) => {
        const [label, response] = responses[button.dataset.focus];
        dialogContent.querySelector("#focus-output").innerHTML = `
          <div class="feedback-box feedback-good"><strong>${label}</strong>${response}</div>
          <p class="micro-note">Cette parade n’améliore pas « l’attention en général ». Elle rend simplement cette situation plus facile à gérer.</p>
        `;
      });
    },

    blocked() {
      const responses = {
        instruction: ["La consigne", "Entoure le verbe d’action puis reformule : « Je dois… »"],
        begin: ["Le démarrage", "Cherche un exemple proche ou écris seulement ce que tu connais déjà."],
        method: ["La méthode", "Montre l’étape réussie et indique exactement celle qui te manque."],
        result: ["La vérification", "Teste ton résultat avec une autre représentation, une estimation ou un retour dans l’énoncé."],
        word: ["Un mot", "Repère le mot précis, cherche sa définition dans le cours ou demande seulement ce mot."]
      };

      openDialog("Outil · 2 min", "Où est mon blocage&nbsp;?", `
        <p class="flow-intro">« Je ne comprends rien » cache souvent un problème beaucoup plus petit. Choisis ce qui ressemble le plus à ta situation.</p>
        <div class="choice-list">
          <button class="choice-button" type="button" data-block="instruction"><span>A</span><strong>Je ne comprends pas ce qu’on me demande.</strong></button>
          <button class="choice-button" type="button" data-block="begin"><span>B</span><strong>Je comprends, mais je ne sais pas commencer.</strong></button>
          <button class="choice-button" type="button" data-block="method"><span>C</span><strong>J’ai commencé, puis je me suis arrêté.</strong></button>
          <button class="choice-button" type="button" data-block="result"><span>D</span><strong>J’ai une réponse, mais je ne sais pas si elle est juste.</strong></button>
          <button class="choice-button" type="button" data-block="word"><span>E</span><strong>C’est un mot ou un symbole qui me bloque.</strong></button>
        </div>
        <div id="blocked-output" aria-live="polite"></div>
      `);

      bindChoice("[data-block]", (button) => {
        const [label, response] = responses[button.dataset.block];
        dialogContent.querySelector("#blocked-output").innerHTML = `
          <div class="feedback-box feedback-info"><strong>Ton blocage : ${label}</strong>${response}</div>
          <div class="dialog-actions"><button class="primary-button" type="button" data-switch-tool="help">Préparer ma demande d’aide</button></div>
        `;
        dialogContent.querySelector("[data-switch-tool='help']").addEventListener("click", toolRenderers.help);
      });
    },

    help() {
      openDialog("Outil · 2 min", "Préparer une demande d’aide", `
        <p class="flow-intro">Une bonne demande permet à l’autre de t’aider sans faire le travail à ta place.</p>
        <div class="flow-card">
          <h2>La phrase en quatre morceaux</h2>
          <p><strong>J’ai compris…</strong><br><strong>J’ai essayé…</strong><br><strong>Je bloque à…</strong><br><strong>Peux-tu m’aider à… ?</strong></p>
        </div>
        <label class="flow-card" for="help-draft">
          <h3>Essaie avec ton problème</h3>
          <textarea id="help-draft" class="answer-textarea" placeholder="J’ai compris…\nJ’ai essayé…\nJe bloque à…\nPeux-tu m’aider à… ?"></textarea>
        </label>
        <div class="feedback-box feedback-info"><strong>Pas besoin d’écrire longtemps.</strong>Une ou deux informations précises valent mieux que « je n’ai rien compris ».</div>
      `);
    },

    error() {
      openDialog("Outil · 3 min", "Utiliser une erreur", `
        <p class="flow-intro">Ne recommence pas tout au hasard. Cherche la première étape où ton travail n’est plus d’accord avec la règle, l’exemple ou la consigne.</p>
        <div class="flow-card">
          <h2>La méthode du premier virage</h2>
          <p><strong>1.</strong> Cache la correction.<br><strong>2.</strong> Compare une étape à la fois.<br><strong>3.</strong> Entoure la première différence.<br><strong>4.</strong> Corrige seulement cette étape.<br><strong>5.</strong> Reprends la suite.</p>
        </div>
        <div class="dialog-actions">
          <button class="primary-button" type="button" data-open-inside="error-detective">Essayer sur un exemple</button>
        </div>
      `);
      dialogContent.querySelector("[data-open-inside='error-detective']").addEventListener("click", activities["error-detective"]);
    },

    memory() {
      openDialog("Outil · 3 min", "Réviser sans seulement relire", `
        <p class="flow-intro">Avant d’ouvrir le cours, essaie de retrouver quelque chose. Ensuite seulement, vérifie et corrige.</p>
        <label class="flow-card" for="memory-draft">
          <h2>Sans regarder, écris ou dis…</h2>
          <p>Une idée importante · un exemple · une question qui reste.</p>
          <textarea id="memory-draft" class="answer-textarea" placeholder="Ce dont je me souviens…"></textarea>
        </label>
        <div class="dialog-actions"><button id="memory-reveal" class="primary-button" type="button">Maintenant, je vérifie</button></div>
        <div id="memory-output" aria-live="polite"></div>
      `);
      dialogContent.querySelector("#memory-reveal").addEventListener("click", () => {
        dialogContent.querySelector("#memory-output").innerHTML = `
          <div class="feedback-box feedback-good"><strong>Ouvre le cours.</strong>Ajoute ce qui manque et barre ce qui était faux. C’est la correction qui rend l’essai utile.</div>
        `;
      });
    },

    pause() {
      openDialog("Outil · 30 s", "Pause, but, choix", `
        <p class="flow-intro">Quand tu sens que tu vas répondre ou agir trop vite, essaie cette séquence très courte.</p>
        <div class="choice-list">
          <button class="choice-button" type="button" data-pause-step="1"><span>1</span><strong>Stop : je ne fais rien pendant cinq secondes.</strong></button>
          <button class="choice-button" type="button" data-pause-step="2"><span>2</span><strong>But : qu’est-ce que j’essaie d’obtenir&nbsp;?</strong></button>
          <button class="choice-button" type="button" data-pause-step="3"><span>3</span><strong>Choix : quelle petite action m’en rapproche&nbsp;?</strong></button>
        </div>
        <div class="feedback-box feedback-info"><strong>À retenir</strong>Ce n’est pas un test d’impulsivité. C’est une courte routine à essayer dans une situation réelle.</div>
      `);
    }
  };

  const activities = {
    "focus-mission"() {
      openDialog("Activité · 3 min", "Mission anti-distraction", `
        <div class="flow-card">
          <h2>La situation</h2>
          <p>Tu as dix minutes pour apprendre quatre définitions. Ton téléphone est sur la table et six onglets sont ouverts. <strong>Choisis les deux actions les plus utiles avant de commencer.</strong></p>
        </div>
        <div class="choice-list" id="focus-options">
          <button class="toggle-choice" type="button" data-good="false"><span>○</span><strong>Retourner le téléphone sur la table.</strong></button>
          <button class="toggle-choice" type="button" data-good="true"><span>○</span><strong>Mettre le téléphone hors de portée et silencieux.</strong></button>
          <button class="toggle-choice" type="button" data-good="false"><span>○</span><strong>Garder les six onglets au cas où.</strong></button>
          <button class="toggle-choice" type="button" data-good="true"><span>○</span><strong>Ne garder ouvert que le document utile.</strong></button>
          <button class="toggle-choice" type="button" data-good="false"><span>○</span><strong>Attendre d’avoir vraiment envie.</strong></button>
        </div>
        <div class="dialog-actions"><button id="focus-validate" class="primary-button" type="button">Valider mes deux choix</button></div>
        <div id="focus-result" aria-live="polite"></div>
      `);

      const choices = [...dialogContent.querySelectorAll("#focus-options .toggle-choice")];
      choices.forEach((button) => {
        button.addEventListener("click", () => {
          if (!button.classList.contains("is-selected") && choices.filter((choice) => choice.classList.contains("is-selected")).length >= 2) return;
          button.classList.toggle("is-selected");
          button.querySelector("span").textContent = button.classList.contains("is-selected") ? "✓" : "○";
        });
      });

      dialogContent.querySelector("#focus-validate").addEventListener("click", () => {
        const selected = choices.filter((choice) => choice.classList.contains("is-selected"));
        const correct = selected.length === 2 && selected.every((choice) => choice.dataset.good === "true");
        dialogContent.querySelector("#focus-result").innerHTML = selected.length !== 2
          ? `<div class="feedback-box feedback-try"><strong>Choisis exactement deux actions.</strong>Cherche celles qui rendent les distracteurs moins accessibles avant de commencer.</div>`
          : correct
            ? `<div class="feedback-box feedback-good"><strong>Terrain préparé.</strong>Tu ne comptes pas seulement sur ta volonté : tu rends les deux distracteurs moins disponibles.</div>`
            : `<div class="feedback-box feedback-try"><strong>Essaie encore.</strong>Retourner le téléphone ou garder les onglets laisse le distracteur tout près. Agis sur l’environnement avant de travailler.</div>`;
      });
    },

    "memory-challenge"() {
      openDialog("Activité · 2 min", "Le piège de la mémoire", `
        <p class="flow-intro">Observe les huit mots. Quand tu les as lus, masque-les et essaie de les retrouver sans aide.</p>
        <div id="memory-stage">
          <div class="memory-words"><span>citron</span><span>tigre</span><span>miroir</span><span>volcan</span><span>vélo</span><span>échelle</span><span>menthe</span><span>comète</span></div>
          <div class="dialog-actions"><button id="hide-words" class="primary-button" type="button">Masquer les mots</button></div>
        </div>
      `);

      dialogContent.querySelector("#hide-words").addEventListener("click", () => {
        dialogContent.querySelector("#memory-stage").innerHTML = `
          <label class="flow-card" for="word-recall"><h2>Retrouve-les sans regarder</h2><textarea id="word-recall" class="answer-textarea" placeholder="Écris les mots dont tu te souviens…"></textarea></label>
          <div class="dialog-actions"><button id="show-words" class="primary-button" type="button">Vérifier</button></div>
          <div id="recall-result"></div>
        `;
        dialogContent.querySelector("#show-words").addEventListener("click", () => {
          dialogContent.querySelector("#recall-result").innerHTML = `
            <div class="feedback-box feedback-good"><strong>Les huit mots</strong>citron · tigre · miroir · volcan · vélo · échelle · menthe · comète</div>
            <div class="feedback-box feedback-info"><strong>L’idée utile</strong>Les relire donne vite une impression de facilité. Essayer de les retrouver montre mieux ce qui est réellement disponible. Pour un cours : essayer, vérifier, corriger.</div>
            <p class="micro-note">Ce petit défi ne « muscle » pas ta mémoire en général. Il illustre une manière plus active de réviser.</p>
          `;
        });
      });
    },

    "error-detective"() {
      openDialog("Activité · 2 min", "Erreur détective", `
        <p class="flow-intro">Une seule question : quelle est la <strong>première</strong> ligne incorrecte&nbsp;?</p>
        <div class="equation-steps">
          <button class="equation-line" type="button" data-line="1"><span>1</span>3(x + 2) = 15</button>
          <button class="equation-line" type="button" data-line="2"><span>2</span>3x + 2 = 15</button>
          <button class="equation-line" type="button" data-line="3"><span>3</span>3x = 13</button>
          <button class="equation-line" type="button" data-line="4"><span>4</span>x = 13/3</button>
        </div>
        <div id="error-result" aria-live="polite"></div>
      `);

      bindChoice("[data-line]", (button) => {
        const correct = button.dataset.line === "2";
        dialogContent.querySelector("#error-result").innerHTML = correct
          ? `<div class="feedback-box feedback-good"><strong>Exact : ligne 2.</strong>3(x + 2) donne 3x + 6, car 3 multiplie les deux termes. Une correction utile repart donc de cette première ligne.</div>`
          : `<div class="feedback-box feedback-try"><strong>Remonte d’une étape.</strong>La ligne ${button.dataset.line} dépend peut-être déjà d’une erreur précédente. Compare chaque ligne avec celle qui la précède.</div>`;
      });
    },

    "help-challenge"() {
      openDialog("Activité · 1 min", "Le meilleur SOS", `
        <div class="flow-card"><h2>La situation</h2><p>Tu comprends la consigne, tu as commencé le calcul, mais tu ne sais plus comment enlever les parenthèses. Quelle demande permettra le mieux de t’aider&nbsp;?</p></div>
        <div class="choice-list">
          <button class="choice-button" type="button" data-help-answer="vague"><span>A</span><strong>« Madame, j’ai rien compris. »</strong></button>
          <button class="choice-button" type="button" data-help-answer="answer"><span>B</span><strong>« C’est quoi la réponse&nbsp;? »</strong></button>
          <button class="choice-button" type="button" data-help-answer="good"><span>C</span><strong>« J’ai commencé, mais je bloque pour enlever les parenthèses. Peux-tu me rappeler la règle&nbsp;? »</strong></button>
          <button class="choice-button" type="button" data-help-answer="wait"><span>D</span><strong>Attendre que quelqu’un fasse l’exercice au tableau.</strong></button>
        </div>
        <div id="help-result" aria-live="polite"></div>
      `);

      bindChoice("[data-help-answer]", (button) => {
        dialogContent.querySelector("#help-result").innerHTML = button.dataset.helpAnswer === "good"
          ? `<div class="feedback-box feedback-good"><strong>Le SOS est précis.</strong>Il indique ce qui est déjà fait, l’endroit du blocage et le type d’aide attendu.</div>`
          : `<div class="feedback-box feedback-try"><strong>Cette demande aide peu.</strong>Dis ce que tu as commencé et nomme l’étape exacte qui bloque.</div>`;
      });
    },

    "maths-minute"() {
      openDialog("Révision · 1 min", "Maths minute", `
        <p class="flow-intro">Essaie de répondre avant d’utiliser une calculatrice.</p>
        <div class="flow-card"><small>Question</small><h2 class="big-prompt">Combien vaut 15&nbsp;% de 80&nbsp;?</h2></div>
        <div class="choice-list">
          <button class="choice-button" type="button" data-maths="8"><span>A</span><strong>8</strong></button>
          <button class="choice-button" type="button" data-maths="12"><span>B</span><strong>12</strong></button>
          <button class="choice-button" type="button" data-maths="15"><span>C</span><strong>15</strong></button>
          <button class="choice-button" type="button" data-maths="20"><span>D</span><strong>20</strong></button>
        </div>
        <div id="maths-result" aria-live="polite"></div>
      `);

      bindChoice("[data-maths]", (button) => {
        dialogContent.querySelector("#maths-result").innerHTML = button.dataset.maths === "12"
          ? `<div class="feedback-box feedback-good"><strong>Oui : 12.</strong>10&nbsp;% de 80 = 8 et 5&nbsp;% de 80 = 4. Donc 15&nbsp;% = 8 + 4 = 12.</div>`
          : `<div class="feedback-box feedback-try"><strong>Pas encore.</strong>Commence par 10&nbsp;% de 80, puis cherche 5&nbsp;%.</div>`;
      });
    },

    "privacy-challenge"() {
      openDialog("Activité · 2 min", "Public ou privé&nbsp;?", `
        <p class="flow-intro">Cette page est accessible avec son lien. Sélectionne les deux informations qui peuvent raisonnablement y apparaître.</p>
        <div class="choice-list" id="privacy-options">
          <button class="toggle-choice" type="button" data-safe="true"><span>○</span><strong>Le thème général travaillé cette semaine.</strong></button>
          <button class="toggle-choice" type="button" data-safe="false"><span>○</span><strong>La liste des élèves de la 405.</strong></button>
          <button class="toggle-choice" type="button" data-safe="false"><span>○</span><strong>L’heure et le lieu précis d’une sortie.</strong></button>
          <button class="toggle-choice" type="button" data-safe="true"><span>○</span><strong>Une production collective sans nom ni visage.</strong></button>
          <button class="toggle-choice" type="button" data-safe="false"><span>○</span><strong>La difficulté rencontrée par un élève.</strong></button>
        </div>
        <div class="dialog-actions"><button id="privacy-validate" class="primary-button" type="button">Valider</button></div>
        <div id="privacy-result" aria-live="polite"></div>
      `);

      const choices = [...dialogContent.querySelectorAll("#privacy-options .toggle-choice")];
      choices.forEach((button) => {
        button.addEventListener("click", () => {
          if (!button.classList.contains("is-selected") && choices.filter((choice) => choice.classList.contains("is-selected")).length >= 2) return;
          button.classList.toggle("is-selected");
          button.querySelector("span").textContent = button.classList.contains("is-selected") ? "✓" : "○";
        });
      });

      dialogContent.querySelector("#privacy-validate").addEventListener("click", () => {
        const selected = choices.filter((choice) => choice.classList.contains("is-selected"));
        const correct = selected.length === 2 && selected.every((choice) => choice.dataset.safe === "true");
        dialogContent.querySelector("#privacy-result").innerHTML = selected.length !== 2
          ? `<div class="feedback-box feedback-try"><strong>Choisis deux informations.</strong>Pense à ce qu’un inconnu pourrait apprendre sur la classe.</div>`
          : correct
            ? `<div class="feedback-box feedback-good"><strong>Exact.</strong>Le thème général et une production vraiment anonyme peuvent être publics. Les informations pratiques et personnelles restent dans l’espace sécurisé.</div>`
            : `<div class="feedback-box feedback-try"><strong>Une information est trop précise.</strong>Sur une page publique, on évite tout ce qui identifie un élève ou révèle l’organisation concrète de la classe.</div>`;
      });
    }
  };

  document.querySelectorAll("[data-tool]").forEach((button) => {
    button.addEventListener("click", () => toolRenderers[button.dataset.tool]?.());
  });

  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => activities[button.dataset.open]?.());
  });
})();

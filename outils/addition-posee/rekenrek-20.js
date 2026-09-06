import {
  REKENREK_CAPACITY,
  REKENREK_ROW_COUNT,
  REKENREK_ROW_SIZE,
  makeRekenrekCalculation,
  moveRekenrekBead,
  rekenrekValue,
  splitRekenrekValue
} from "./rekenrek-20-model.mjs?v=1";

let dialogCount = 0;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function additionInstruction(calculation) {
  const additions = calculation.additions.map((value, index) => (
    index === calculation.additions.length - 1 && calculation.carry > 0
      ? `${value} pour la retenue`
      : String(value)
  ));
  if (additions.length === 1) {
    return `Le premier chiffre est déjà placé. Déplace les billes pour ajouter ${additions[0]}.`;
  }
  return `Le premier chiffre est déjà placé. Déplace les billes pour ajouter ${additions.slice(0, -1).join(", puis ")}, puis ${additions.at(-1)}.`;
}

function makeEquation(container, calculation) {
  container.replaceChildren();
  calculation.parts.forEach((part, index) => {
    if (index > 0) container.append(element("span", "rekenrek-equation-sign", "+"));
    const value = element("span", "rekenrek-equation-value", part);
    if (calculation.carry > 0 && index === calculation.parts.length - 1) {
      value.append(element("small", "rekenrek-carry-label", "retenue"));
    }
    container.append(value);
  });
  container.append(
    element("span", "rekenrek-equation-sign", "="),
    element("span", "rekenrek-equation-question", "?")
  );
}

export function createRekenrek20Help({ trigger, getOperation }) {
  if (!(trigger instanceof HTMLElement) || typeof getOperation !== "function") {
    throw new TypeError("Le bouton et la colonne d’addition sont nécessaires.");
  }

  const id = ++dialogCount;
  const dialog = element("dialog", "rekenrek-dialog");
  const panel = element("div", "rekenrek-panel");
  const headingId = `rekenrek-title-${id}`;
  const descriptionId = `rekenrek-description-${id}`;
  dialog.setAttribute("aria-labelledby", headingId);
  dialog.setAttribute("aria-describedby", descriptionId);

  const header = element("header", "rekenrek-header");
  const heading = element("h2", "", "Rekenrek 20");
  heading.id = headingId;
  const closeButton = element("button", "rekenrek-close", "×");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Fermer le Rekenrek et revenir à l’addition");
  header.append(heading, closeButton);

  const equation = element("div", "rekenrek-equation");
  equation.setAttribute("aria-label", "Calcul à représenter");
  const description = element("p", "rekenrek-description");
  description.id = descriptionId;
  const rankNote = element(
    "p",
    "rekenrek-rank-note",
    "Les billes aident à calculer les chiffres. Le rang reste celui indiqué dans l’addition posée."
  );

  const frame = element("div", "rekenrek-frame");
  frame.setAttribute("role", "group");
  frame.setAttribute("aria-label", "Rekenrek de vingt billes, deux rangées de dix");
  const rowElements = [];
  const beadElements = [];
  for (let rowIndex = 0; rowIndex < REKENREK_ROW_COUNT; rowIndex += 1) {
    const row = element("div", "rekenrek-row");
    row.dataset.row = String(rowIndex);
    rowElements.push(row);
    const rowBeads = [];
    for (let beadIndex = 0; beadIndex < REKENREK_ROW_SIZE; beadIndex += 1) {
      const bead = element(
        "button",
        `rekenrek-bead ${beadIndex < 5 ? "is-red" : "is-white"}`
      );
      bead.type = "button";
      bead.dataset.row = String(rowIndex);
      bead.dataset.bead = String(beadIndex);
      rowBeads.push(bead);
      row.append(bead);
    }
    beadElements.push(rowBeads);
    frame.append(row);
  }

  const live = element("p", "rekenrek-live", "");
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  const controls = element("div", "rekenrek-controls");
  const decrease = element("button", "button button-light", "− 1 bille");
  const increase = element("button", "button button-light", "+ 1 bille");
  decrease.type = "button";
  increase.type = "button";
  controls.append(decrease, increase);

  const footer = element("footer", "rekenrek-footer");
  const reset = element("button", "button button-secondary", "Repartir du premier nombre");
  const back = element("button", "button button-primary", "Retour à l’addition");
  reset.type = "button";
  back.type = "button";
  footer.append(reset, back);

  panel.append(header, equation, description, rankNote, frame, live, controls, footer);
  dialog.append(panel);
  document.body.append(dialog);

  let calculation = null;
  let rows = [0, 0];
  let lastAnnouncedValue = null;

  function update({ announce = true } = {}) {
    const total = rekenrekValue(rows);
    rowElements.forEach((row, rowIndex) => {
      const count = rows[rowIndex];
      row.dataset.count = String(count);
      beadElements[rowIndex].forEach((bead, beadIndex) => {
        const selected = beadIndex < count;
        bead.classList.toggle("is-left", selected);
        bead.classList.toggle("is-first-right", !selected && beadIndex === count);
        bead.classList.toggle("is-last-left", selected && count === REKENREK_ROW_SIZE && beadIndex === REKENREK_ROW_SIZE - 1);
        bead.setAttribute("aria-pressed", String(selected));
        bead.setAttribute(
          "aria-label",
          `Rangée ${rowIndex + 1}, bille ${beadIndex + 1} : déplacer le groupe vers ${selected ? "la droite" : "la gauche"}`
        );
      });
    });
    decrease.disabled = !calculation || total <= calculation.start;
    increase.disabled = total >= REKENREK_CAPACITY;
    if (announce && total !== lastAnnouncedValue) {
      const plural = total !== 1;
      live.textContent = `${total} bille${plural ? "s" : ""} placée${plural ? "s" : ""}.`;
    }
    lastAnnouncedValue = total;
  }

  function setRows(nextRows) {
    if (!calculation || rekenrekValue(nextRows) < calculation.start) {
      live.textContent = "Le premier chiffre reste placé.";
      return;
    }
    rows = nextRows;
    update();
  }

  beadElements.flat().forEach((bead) => {
    bead.addEventListener("click", () => {
      setRows(moveRekenrekBead(rows, Number(bead.dataset.row), Number(bead.dataset.bead)));
    });
  });
  decrease.addEventListener("click", () => {
    setRows(splitRekenrekValue(rekenrekValue(rows) - 1));
  });
  increase.addEventListener("click", () => {
    setRows(splitRekenrekValue(rekenrekValue(rows) + 1));
  });
  reset.addEventListener("click", () => {
    if (!calculation) return;
    rows = [...calculation.rows];
    lastAnnouncedValue = null;
    update();
  });
  closeButton.addEventListener("click", () => dialog.close());
  back.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => trigger.focus({ preventScroll: true }));

  function open() {
    const operation = getOperation();
    if (!operation) return;
    calculation = makeRekenrekCalculation(operation);
    rows = [...calculation.rows];
    lastAnnouncedValue = null;
    makeEquation(equation, calculation);
    description.textContent = additionInstruction(calculation);
    update({ announce: false });
    const plural = calculation.start !== 1;
    live.textContent = `${calculation.start} bille${plural ? "s" : ""} déjà placée${plural ? "s" : ""}.`;
    if (dialog.open) return;
    dialog.showModal();
    window.requestAnimationFrame(() => back.focus({ preventScroll: true }));
  }

  trigger.addEventListener("click", open);

  return {
    open,
    close() {
      if (dialog.open) dialog.close();
    }
  };
}

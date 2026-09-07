import {
  REKENREK_ROW_COUNT,
  REKENREK_ROW_SIZE,
  makeRekenrekCalculation,
  moveRekenrekBead,
  settleRekenrekDrag
} from "./rekenrek-20-model.mjs?v=2";

let dialogCount = 0;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function additionInstruction(calculation) {
  if (calculation.parts.length === 2) {
    return `Représente ${calculation.parts[0]} + ${calculation.parts[1]}. Tu peux commencer par le nombre de ton choix.`;
  }
  return "Représente le calcul avec les billes. Tu peux commencer par le nombre de ton choix, puis ajouter les autres.";
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

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
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
    row.setAttribute("role", "group");
    rowElements.push(row);
    const rod = element("span", "rekenrek-rod");
    rod.setAttribute("aria-hidden", "true");
    row.append(rod);
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

  const manipulationHint = element(
    "p",
    "rekenrek-manipulation-hint",
    "Fais glisser un groupe de billes vers la gauche ou vers la droite."
  );
  const live = element("p", "sr-only", "");
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");

  const footer = element("footer", "rekenrek-footer");
  const reset = element("button", "button button-secondary", "Remettre les billes à zéro");
  const back = element("button", "button button-primary", "Retour à l’addition");
  reset.type = "button";
  back.type = "button";
  footer.append(reset, back);

  panel.append(header, equation, description, rankNote, frame, manipulationHint, live, footer);
  dialog.append(panel);
  document.body.append(dialog);

  let calculation = null;
  let rows = [0, 0];
  let activeDrag = null;
  let suppressClick = null;

  function rowDimensions(rowIndex) {
    const row = rowElements[rowIndex];
    const bead = beadElements[rowIndex][0];
    return {
      frameWidth: row.getBoundingClientRect().width,
      beadWidth: bead.getBoundingClientRect().width
    };
  }

  function beadLeft(rowIndex, beadIndex) {
    return Number.parseFloat(beadElements[rowIndex][beadIndex].style.left) || 0;
  }

  function update({ animate = true, announceRow = null } = {}) {
    rowElements.forEach((row, rowIndex) => {
      const count = rows[rowIndex];
      const { frameWidth, beadWidth } = rowDimensions(rowIndex);
      row.dataset.count = String(count);
      row.setAttribute(
        "aria-label",
        `Rangée ${rowIndex + 1} : ${count} bille${count > 1 ? "s" : ""} à gauche`
      );
      beadElements[rowIndex].forEach((bead, beadIndex) => {
        const selected = beadIndex < count;
        bead.classList.toggle("is-left", selected);
        bead.classList.toggle("is-moving", false);
        bead.style.transition = animate ? "left .22s ease-out" : "none";
        bead.style.left = selected
          ? `${beadIndex * beadWidth}px`
          : `${frameWidth - (REKENREK_ROW_SIZE - beadIndex) * beadWidth}px`;
        bead.setAttribute("aria-pressed", String(selected));
        bead.setAttribute(
          "aria-label",
          `Rangée ${rowIndex + 1}, bille ${beadIndex + 1} : déplacer le groupe vers ${selected ? "la droite" : "la gauche"}`
        );
      });
    });
    if (announceRow !== null) {
      const count = rows[announceRow];
      live.textContent = `Rangée ${announceRow + 1} : ${count} bille${count > 1 ? "s" : ""} à gauche.`;
    }
  }

  function moveVisual(bead, beadIndex, delta, fromRight, dimensions) {
    const { frameWidth, beadWidth } = dimensions;
    const base = fromRight
      ? frameWidth - (REKENREK_ROW_SIZE - beadIndex) * beadWidth
      : beadIndex * beadWidth;
    const left = clamp(
      base + delta,
      beadIndex * beadWidth,
      frameWidth - (REKENREK_ROW_SIZE - beadIndex) * beadWidth
    );
    bead.style.transition = "none";
    bead.style.left = `${left}px`;
    bead.classList.add("is-moving");
  }

  function startDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const bead = event.currentTarget;
    const rowIndex = Number(bead.dataset.row);
    const beadIndex = Number(bead.dataset.bead);
    bead.setPointerCapture(event.pointerId);
    activeDrag = {
      bead,
      beadIndex,
      dimensions: rowDimensions(rowIndex),
      moved: false,
      pointerId: event.pointerId,
      rowIndex,
      startX: event.clientX
    };
  }

  function drag(event) {
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
    const { beadIndex, dimensions, rowIndex, startX } = activeDrag;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4) activeDrag.moved = true;
    if (!activeDrag.moved) return;
    event.preventDefault();
    const beads = beadElements[rowIndex];
    if (beadIndex >= rows[rowIndex]) {
      for (let index = rows[rowIndex]; index <= beadIndex; index += 1) {
        moveVisual(beads[index], index, delta, true, dimensions);
      }
    } else {
      for (let index = beadIndex; index < rows[rowIndex]; index += 1) {
        moveVisual(beads[index], index, delta, false, dimensions);
      }
    }
  }

  function endDrag(event) {
    if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
    const { bead, beadIndex, dimensions, moved, pointerId, rowIndex } = activeDrag;
    if (bead.hasPointerCapture(pointerId)) bead.releasePointerCapture(pointerId);
    if (moved && event.type !== "pointercancel") {
      rows = settleRekenrekDrag(rows, rowIndex, beadIndex, beadLeft(rowIndex, beadIndex), dimensions);
      suppressClick = bead;
      window.setTimeout(() => {
        if (suppressClick === bead) suppressClick = null;
      }, 0);
    }
    activeDrag = null;
    update({ announceRow: moved ? rowIndex : null });
  }

  beadElements.flat().forEach((bead) => {
    bead.addEventListener("pointerdown", startDrag);
    bead.addEventListener("pointermove", drag);
    bead.addEventListener("pointerup", endDrag);
    bead.addEventListener("pointercancel", endDrag);
    bead.addEventListener("click", () => {
      if (suppressClick === bead) {
        suppressClick = null;
        return;
      }
      const rowIndex = Number(bead.dataset.row);
      rows = moveRekenrekBead(rows, rowIndex, Number(bead.dataset.bead));
      update({ announceRow: rowIndex });
    });
  });

  reset.addEventListener("click", () => {
    rows = [0, 0];
    update({ announceRow: 0 });
    live.textContent = "Toutes les billes sont revenues à droite.";
  });
  closeButton.addEventListener("click", () => dialog.close());
  back.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => trigger.focus({ preventScroll: true }));

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(() => {
        if (dialog.open && !activeDrag) update({ animate: false });
      })
    : null;
  rowElements.forEach((row) => resizeObserver?.observe(row));
  window.addEventListener("resize", () => {
    if (dialog.open && !activeDrag) update({ animate: false });
  });

  function open() {
    const operation = getOperation();
    if (!operation) return;
    calculation = makeRekenrekCalculation(operation);
    rows = [...calculation.rows];
    makeEquation(equation, calculation);
    description.textContent = additionInstruction(calculation);
    live.textContent = "Le Rekenrek est vide.";
    if (!dialog.open) dialog.showModal();
    window.requestAnimationFrame(() => {
      update({ animate: false });
      back.focus({ preventScroll: true });
    });
  }

  trigger.addEventListener("click", open);

  return {
    open,
    close() {
      if (dialog.open) dialog.close();
    }
  };
}

#!/usr/bin/env python3
"""Valide les défis inédits et génère l'outil autonome de projection."""

from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent
SITE_ROOT = HERE.parents[1]
CASES_FILE = HERE / "projection_cases.json"
PRINTED_SERIES_FILE = HERE / "series20.json"
FAVICON_FILE = SITE_ROOT / "favicon.svg"
LOGO_FILE = SITE_ROOT / "assets" / "img" / "mathsgo-logo-390.png"
OUTPUT_FILE = SITE_ROOT / "outils" / "chat-cest-toi-le-chat-projection.html"

ROWS, COLS = 2, 3
DIRECTIONS = {
    "front": (-1, 0),
    "back": (1, 0),
    "left": (0, -1),
    "right": (0, 1),
}
DIRECTION_LABELS = {
    "front": "devant",
    "back": "derrière",
    "left": "à gauche",
    "right": "à droite",
}
TRANSFORMS = (
    {"front": "front", "back": "back", "left": "left", "right": "right"},
    {"front": "front", "back": "back", "left": "right", "right": "left"},
    {"front": "back", "back": "front", "left": "left", "right": "right"},
    {"front": "back", "back": "front", "left": "right", "right": "left"},
)
EXPECTED_PATTERN = (
    True, False, False, True,
    False, True, True, False,
    False, True, False, True,
)
EXPECTED_MIN_ACTIONS = (0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 2, 0)

def validate_grid(grid: object, context: str) -> list[list[int]]:
    if not isinstance(grid, list) or len(grid) != ROWS:
        raise ValueError(f"{context}: la grille doit avoir {ROWS} rangées")
    if any(not isinstance(row, list) or len(row) != COLS for row in grid):
        raise ValueError(f"{context}: chaque rangée doit avoir {COLS} colonnes")
    flat = [value for row in grid for value in row]
    if any(not isinstance(value, int) or value not in (0, 1, 2, 3, 4) for value in flat):
        raise ValueError(f"{context}: seules les valeurs 0 à 4 sont permises")
    if sorted(value for value in flat if value) != [1, 2, 3, 4]:
        raise ValueError(f"{context}: les chats 1, 2, 3 et 4 doivent apparaître une fois")
    return grid


def validate_cards(cards: object, context: str) -> dict[str, dict[str, str]]:
    if not isinstance(cards, dict) or set(cards) != {"1", "2", "3", "4"}:
        raise ValueError(f"{context}: il faut exactement les cartes 1, 2, 3 et 4")
    for player, constraints in cards.items():
        if not isinstance(constraints, dict) or not 1 <= len(constraints) <= 4:
            raise ValueError(f"{context}, carte {player}: il faut 1 à 4 indices")
        for direction, wanted in constraints.items():
            if direction not in DIRECTIONS or wanted not in ("P", "X"):
                raise ValueError(
                    f"{context}, carte {player}: indice invalide {direction}={wanted}"
                )
    return cards


def placement_of(grid: list[list[int]]) -> dict[int, tuple[int, int]]:
    return {
        grid[row][col]: (row, col)
        for row in range(ROWS)
        for col in range(COLS)
        if grid[row][col]
    }


def error_message(direction: str, wanted: str, neighbor: int | None, inside: bool) -> str:
    label = DIRECTION_LABELS[direction].capitalize()
    if wanted == "P":
        ending = "le cercle est vide" if inside else "il n'y a pas de cercle"
        return f"{label} : un chat est attendu, mais {ending}."
    return f"{label} : aucun chat ne doit être là, mais le chat {neighbor} s'y trouve."


def evaluate(
    cards: dict[str, dict[str, str]], grid: list[list[int]]
) -> tuple[bool, dict[str, list[dict[str, object]]]]:
    placement = placement_of(grid)
    occupants = {position: player for player, position in placement.items()}
    errors: dict[str, list[dict[str, object]]] = {str(player): [] for player in range(1, 5)}

    for raw_player, constraints in cards.items():
        player = int(raw_player)
        row, col = placement[player]
        for direction, wanted in constraints.items():
            delta_row, delta_col = DIRECTIONS[direction]
            neighbor_row, neighbor_col = row + delta_row, col + delta_col
            inside = 0 <= neighbor_row < ROWS and 0 <= neighbor_col < COLS
            neighbor = occupants.get((neighbor_row, neighbor_col)) if inside else None
            somebody = neighbor is not None
            wrong = (wanted == "P" and not somebody) or (wanted == "X" and somebody)
            if wrong:
                errors[raw_player].append(
                    {
                        "direction": direction,
                        "wanted": wanted,
                        "neighbor": neighbor,
                        "inside": inside,
                        "message": error_message(direction, wanted, neighbor, inside),
                    }
                )

    return not any(errors.values()), errors


def canonical_cards(cards: dict[str, dict[str, str]]) -> tuple:
    variants = []
    for transform in TRANSFORMS:
        variants.append(
            tuple(
                sorted(
                    tuple(sorted((transform[direction], value) for direction, value in card.items()))
                    for card in cards.values()
                )
            )
        )
    return min(variants)


def moved_players(before: list[list[int]], after: list[list[int]]) -> list[int]:
    first, second = placement_of(before), placement_of(after)
    return [player for player in range(1, 5) if first[player] != second[player]]


def one_move_corrections(
    cards: dict[str, dict[str, str]], grid: list[list[int]]
) -> list[list[list[int]]]:
    """Énumère les placements vrais obtenus en déplaçant un seul chat."""
    placement = placement_of(grid)
    empty_cells = [
        (row, col)
        for row in range(ROWS)
        for col in range(COLS)
        if grid[row][col] == 0
    ]
    corrections = []
    for player, (source_row, source_col) in placement.items():
        for target_row, target_col in empty_cells:
            candidate = [row[:] for row in grid]
            candidate[source_row][source_col] = 0
            candidate[target_row][target_col] = player
            valid, _ = evaluate(cards, candidate)
            if valid:
                corrections.append(candidate)
    return corrections


def swap_corrections(
    cards: dict[str, dict[str, str]], grid: list[list[int]]
) -> list[list[list[int]]]:
    """Énumère les placements vrais obtenus en échangeant deux chats."""
    placement = placement_of(grid)
    corrections = []
    players = sorted(placement)
    for first_index, first_player in enumerate(players):
        first_row, first_col = placement[first_player]
        for second_player in players[first_index + 1 :]:
            second_row, second_col = placement[second_player]
            candidate = [row[:] for row in grid]
            candidate[first_row][first_col] = second_player
            candidate[second_row][second_col] = first_player
            valid, _ = evaluate(cards, candidate)
            if valid:
                corrections.append(candidate)
    return corrections


def grid_key(grid: list[list[int]]) -> tuple[int, ...]:
    return tuple(value for row in grid for value in row)


def grid_from_key(key: tuple[int, ...]) -> list[list[int]]:
    return [list(key[:COLS]), list(key[COLS:])]


def placement_actions(
    grid: list[list[int]],
) -> list[tuple[list[list[int]], dict[str, object]]]:
    """Énumère chaque déplacement vers un vide et chaque échange entre chats."""
    flat = list(grid_key(grid))
    actions = []
    for first in range(len(flat)):
        for second in range(first + 1, len(flat)):
            first_player, second_player = flat[first], flat[second]
            if not first_player and not second_player:
                continue
            candidate = flat[:]
            candidate[first], candidate[second] = candidate[second], candidate[first]
            players = [player for player in (first_player, second_player) if player]
            actions.append(
                (
                    grid_from_key(tuple(candidate)),
                    {
                        "type": "exchange" if len(players) == 2 else "move",
                        "players": players,
                    },
                )
            )
    return actions


def action_between(
    before: list[list[int]], after: list[list[int]]
) -> dict[str, object] | None:
    target = grid_key(after)
    for candidate, action in placement_actions(before):
        if grid_key(candidate) == target:
            return action
    return None


def shortest_corrections(
    cards: dict[str, dict[str, str]], grid: list[list[int]]
) -> tuple[int, list[list[list[int]]]]:
    """Cherche les placements vrais les plus proches et compte les buts distincts."""
    start = grid_key(grid)
    if evaluate(cards, grid)[0]:
        return 0, [grid]
    visited = {start}
    frontier = {start}
    for depth in range(1, 7):
        next_frontier: set[tuple[int, ...]] = set()
        valid_targets: set[tuple[int, ...]] = set()
        for current in frontier:
            for candidate, _ in placement_actions(grid_from_key(current)):
                candidate_key = grid_key(candidate)
                if candidate_key in visited:
                    continue
                next_frontier.add(candidate_key)
                if evaluate(cards, candidate)[0]:
                    valid_targets.add(candidate_key)
        if valid_targets:
            return depth, [grid_from_key(key) for key in sorted(valid_targets)]
        visited.update(next_frontier)
        frontier = next_frontier
    raise ValueError("aucune correction accessible n'a été trouvée")


def prepare_payload(raw_data: dict, printed_series: list[dict]) -> dict:
    if raw_data.get("version") != 1:
        raise ValueError("projection_cases.json: version attendue = 1")
    raw_cases = raw_data.get("cases")
    if not isinstance(raw_cases, list) or len(raw_cases) != 12:
        raise ValueError("projection_cases.json doit contenir exactement 12 défis")

    printed_canon = {canonical_cards(item["cards"]): item["num"] for item in printed_series}
    seen_ids: set[str] = set()
    seen_new: dict[tuple, str] = {}
    prepared = []

    for index, raw_case in enumerate(raw_cases, start=1):
        context = f"défi {index}"
        case_id = raw_case.get("id")
        if not isinstance(case_id, str) or not case_id or case_id in seen_ids:
            raise ValueError(f"{context}: identifiant absent ou dupliqué")
        seen_ids.add(case_id)

        difficulty = raw_case.get("difficulty")
        expected_difficulty = (index - 1) // 4 + 1
        if difficulty != expected_difficulty:
            raise ValueError(
                f"{context}: difficulté {difficulty}, attendue {expected_difficulty}"
            )

        cards = validate_cards(raw_case.get("cards"), context)
        proposed = validate_grid(raw_case.get("proposed"), f"{context}, placement proposé")
        correction = raw_case.get("correction")
        if correction is not None:
            correction = validate_grid(correction, f"{context}, correction")
        correction_intermediate = raw_case.get("correctionIntermediate")
        if correction_intermediate is not None:
            correction_intermediate = validate_grid(
                correction_intermediate, f"{context}, correction intermédiaire"
            )

        equivalent = canonical_cards(cards)
        if equivalent in printed_canon:
            raise ValueError(
                f"{context}: cartes équivalentes à la série imprimée {printed_canon[equivalent]}"
            )
        if equivalent in seen_new:
            raise ValueError(f"{context}: cartes équivalentes au {seen_new[equivalent]}")
        seen_new[equivalent] = context

        valid, errors = evaluate(cards, proposed)
        if valid != EXPECTED_PATTERN[index - 1]:
            raise ValueError(
                f"{context}: verdict {valid}, contraire au motif vrai/faux attendu"
            )
        if valid and (correction is not None or correction_intermediate is not None):
            raise ValueError(f"{context}: un placement vrai ne doit pas avoir de correction")
        if not valid and correction is None:
            raise ValueError(f"{context}: correction absente pour un placement faux")

        moved: list[int] = []
        solution_actions: list[dict[str, object]] = []
        correction_action_count, minimal_corrections = shortest_corrections(cards, proposed)
        if correction_action_count != EXPECTED_MIN_ACTIONS[index - 1]:
            raise ValueError(
                f"{context}: correction minimale en {correction_action_count} action(s), "
                f"{EXPECTED_MIN_ACTIONS[index - 1]} attendue(s)"
            )
        move_corrections = one_move_corrections(cards, proposed) if not valid else []
        exchange_corrections = swap_corrections(cards, proposed) if not valid else []
        if correction is not None:
            correction_valid, correction_errors = evaluate(cards, correction)
            if not correction_valid:
                raise ValueError(f"{context}: la correction reste fausse ({correction_errors})")
            correction_path = [proposed]
            if correction_intermediate is not None:
                intermediate_valid, _ = evaluate(cards, correction_intermediate)
                if intermediate_valid:
                    raise ValueError(
                        f"{context}: la correction intermédiaire ne doit pas déjà être vraie"
                    )
                correction_path.append(correction_intermediate)
            correction_path.append(correction)
            for before, after in zip(correction_path, correction_path[1:]):
                action = action_between(before, after)
                if action is None:
                    raise ValueError(
                        f"{context}: une étape de correction n'est ni un déplacement ni un échange"
                    )
                solution_actions.append(action)
            if len(solution_actions) != correction_action_count:
                raise ValueError(
                    f"{context}: le chemin officiel utilise {len(solution_actions)} action(s), "
                    f"mais le minimum est {correction_action_count}"
                )
            if grid_key(correction) not in {grid_key(item) for item in minimal_corrections}:
                raise ValueError(
                    f"{context}: la correction officielle n'est pas un but minimal"
                )
            moved = moved_players(proposed, correction)
        if index == 8 and (move_corrections or len(exchange_corrections) != 1):
            raise ValueError(
                "défi 8: l'unique correction en une action doit être un échange"
            )
        if index == 11 and [action["type"] for action in solution_actions] != ["move", "move"]:
            raise ValueError(
                "défi 11: la correction officielle doit comporter deux déplacements"
            )

        prepared.append(
            {
                "id": case_id,
                "number": index,
                "difficulty": difficulty,
                "cards": cards,
                "proposed": proposed,
                "correction": correction,
                "correctionIntermediate": correction_intermediate,
                "valid": valid,
                "errors": errors,
                "movedPlayers": moved,
                "correctionActionCount": correction_action_count,
                "solutionActions": solution_actions,
                "correctionCount": len(minimal_corrections) if not valid else 0,
                "moveCorrectionCount": len(move_corrections),
                "exchangeCorrectionCount": len(exchange_corrections),
            }
        )

    raw_guided = raw_data.get("guided")
    if not isinstance(raw_guided, dict):
        raise ValueError("projection_cases.json: exemple guidé absent")
    guided_cards = validate_cards(raw_guided.get("cards"), "exemple guidé")
    guided_proposed = validate_grid(raw_guided.get("proposed"), "exemple guidé, départ")
    guided_correction = validate_grid(
        raw_guided.get("correction"), "exemple guidé, correction"
    )
    guided_valid, guided_errors = evaluate(guided_cards, guided_proposed)
    guided_correction_valid, _ = evaluate(guided_cards, guided_correction)
    if guided_valid or not guided_correction_valid:
        raise ValueError("l'exemple guidé doit être faux puis vrai")
    if [player for player, issues in guided_errors.items() if issues] != ["2"]:
        raise ValueError("l'exemple guidé doit rendre uniquement la carte 2 fausse")
    if moved_players(guided_proposed, guided_correction) != [2]:
        raise ValueError("dans l'exemple guidé, seul le chat 2 doit changer de cercle")
    guided_equivalent = canonical_cards(guided_cards)
    if guided_equivalent in printed_canon:
        raise ValueError(
            "exemple guidé : cartes équivalentes à la série imprimée "
            f"{printed_canon[guided_equivalent]}"
        )
    if guided_equivalent in seen_new:
        raise ValueError(f"exemple guidé : cartes équivalentes au {seen_new[guided_equivalent]}")

    return {
        "version": raw_data["version"],
        "cases": prepared,
        "guided": {
            "cards": guided_cards,
            "proposed": guided_proposed,
            "correction": guided_correction,
            "valid": guided_valid,
            "errors": guided_errors,
            "movedPlayers": [2],
        },
    }


HTML_TEMPLATE = r'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>Chat, c’est toi le chat ! — À projeter | maths&amp;go</title>
  <meta name="description" content="Une activité collective de repérage spatial à projeter, de la maternelle au collège : toute la classe observe un placement, argumente puis vérifie les quatre cartes pas à pas.">
  <meta name="theme-color" content="#17365d">
  <meta name="color-scheme" content="light">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="https://mathsgo.re/outils/chat-cest-toi-le-chat-projection.html">
  <link rel="icon" href="@@FAVICON@@" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="Chat, c'est toi le chat ! – Défis à projeter">
  <meta property="og:description" content="Douze placements inédits, de la maternelle au collège, à observer, vérifier et corriger collectivement, carte après carte.">
  <meta property="og:url" content="https://mathsgo.re/outils/chat-cest-toi-le-chat-projection.html">
  <style>
    :root {
      --navy:#1f3a68; --navy-2:#294d82; --teal:#0b7d75; --teal-art:#2aa79b; --teal-soft:#e8f7f5;
      --orange:#a94f00; --orange-art:#f28c28; --red:#d1495b; --green:#25845d; --cream:#faf6ee;
      --ink:#203752; --muted:#5d6e80; --line:#d8e0e7; --white:#fff;
      --shadow:0 12px 32px rgba(31,58,104,.11); --radius:20px;
    }
    * { box-sizing:border-box; }
    html, body { min-height:100%; }
    body { margin:0; font-family:"Avenir Next","Segoe UI",system-ui,sans-serif;
      color:var(--ink); background:#f1f5f7; -webkit-tap-highlight-color:transparent; }
    button { font:inherit; }
    button:focus-visible, a:focus-visible {
      outline:3px solid white; outline-offset:2px; box-shadow:0 0 0 6px var(--navy);
    }
    [hidden] { display:none !important; }
    .app { min-height:100dvh; display:flex; flex-direction:column; }
    .topbar { min-height:64px; display:flex; align-items:center; gap:14px; padding:4px 18px;
      color:var(--navy); background:white; border-bottom:4px solid var(--teal-art);
      box-shadow:0 3px 15px rgba(31,58,104,.12); z-index:10; }
    .brand { display:flex; align-items:center; gap:14px; min-width:0; color:var(--navy); text-decoration:none; }
    .brand-logo { display:block; width:112px; height:auto; flex:none; }
    .brand-copy { min-width:0; }
    .brand-title { display:block; font-weight:850; font-size:clamp(16px,2vw,22px); white-space:nowrap; }
    .brand-sub { display:block; color:var(--teal); font-size:12px; font-weight:800; }
    .top-actions { margin-left:auto; display:flex; gap:8px; }
    .icon-button, .nav-button, .primary-button, .secondary-button, .picker-button {
      border:0; border-radius:14px; cursor:pointer; min-height:46px; font-weight:800; transition:.16s ease; }
    .icon-button { display:inline-flex; align-items:center; justify-content:center; gap:8px;
      padding:0 14px; color:var(--navy); background:#edf2f6; text-decoration:none; }
    .icon-button:hover { color:white; background:var(--navy); }
    .icon { font-size:21px; line-height:1; }
    main { flex:1; min-height:0; }
    .screen { min-height:calc(100dvh - 64px); }

    /* Accueil */
    .home { overflow:auto; padding:clamp(14px,2.2vw,28px); }
    .home-inner { width:min(1320px,100%); margin:0 auto; }
    .hero { display:grid; grid-template-columns:minmax(0,1.04fr) minmax(400px,.96fr); gap:22px; align-items:stretch; }
    .hero-copy, .guided { background:white; border-radius:var(--radius); box-shadow:var(--shadow); }
    .hero-copy { padding:clamp(24px,3.2vw,40px); display:flex; flex-direction:column; justify-content:flex-start; align-self:stretch; }
    .eyebrow { color:var(--orange); font-weight:900; text-transform:uppercase; letter-spacing:.1em; font-size:13px; }
    h1 { margin:8px 0 12px; color:var(--navy); font-size:clamp(32px,4.3vw,54px); line-height:1.02; letter-spacing:-.035em; }
    .lead { margin:0; font-size:clamp(17px,2vw,23px); line-height:1.45; color:#405a73; }
    .class-note { margin:22px 0 10px; padding:15px 17px; border-left:5px solid var(--teal);
      border-radius:12px; background:var(--teal-soft); font-weight:750; line-height:1.45; }
    .primary-button { padding:12px 22px; color:white; background:var(--teal); box-shadow:0 7px 18px rgba(19,155,145,.24); }
    .primary-button:hover { background:#0d827a; transform:translateY(-1px); }
    .primary-button.large { align-self:flex-start; min-height:56px; font-size:18px; }
    .secondary-button { padding:11px 18px; color:var(--navy); background:#e9eff4; }
    .secondary-button:hover { background:#dce7ef; }
    .guided { padding:22px; }
    .guided h2, .picker h2 { margin:0 0 6px; color:var(--navy); }
    .guided p { margin:4px 0 14px; line-height:1.45; color:var(--muted); }
    .guided .guided-legend { margin:8px 0 14px; padding:9px 11px; border-radius:11px;
      color:var(--navy); background:var(--teal-soft); font-size:13px; font-weight:700; }
    .guided-flow { display:grid; grid-template-columns:1fr auto 1fr; gap:10px; align-items:center; }
    .mini-stage { padding:12px; border:2px solid var(--line); border-radius:16px; background:var(--cream); }
    .mini-stage.good { border-color:#a9d9c5; background:#effaf4; }
    .mini-label { display:block; margin-bottom:8px; text-align:center; font-size:12px; font-weight:900; text-transform:uppercase; color:var(--muted); }
    .flow-arrow { font-size:28px; color:var(--orange); font-weight:900; }
    .guided-cards { margin-top:14px; }
    .guided-result { margin:12px 0 0 !important; padding:10px 12px; color:var(--navy) !important;
      border-radius:12px; background:#fff4e6; font-weight:750; }
    .picker { margin-top:20px; padding-top:17px; border-top:2px solid #e4eaef; }
    .picker-head { display:flex; align-items:end; justify-content:space-between; gap:16px; margin-bottom:10px; }
    .picker-head p { margin:0; color:var(--muted); }
    .picker-grid { display:grid; grid-template-columns:repeat(6,minmax(58px,1fr)); gap:7px; }
    .picker-button { position:relative; min-height:43px; padding:7px 5px; color:var(--navy); background:#eef3f7; }
    .picker-button:hover { color:white; background:var(--navy-2); }
    .picker-button small { display:block; margin-top:2px; font-size:10px; color:var(--muted); }
    .picker-button:hover small { color:#dceaf4; }

    /* Défi */
    .challenge { display:flex; flex-direction:column; height:calc(100dvh - 64px); min-height:0;
      padding:14px 18px 12px; overflow:hidden; }
    .challenge-head { display:flex; align-items:center; gap:12px; width:min(1500px,100%); margin:0 auto 10px; }
    .challenge-head h1 { margin:0; font-size:clamp(24px,3vw,38px); }
    .difficulty { padding:6px 11px; border-radius:999px; color:#9a510e; background:#fff0dc; font-size:12px; font-weight:900; text-transform:uppercase; }
    .counter { margin-left:auto; color:var(--muted); font-weight:800; }
    .workspace { flex:1; min-height:0; width:min(1500px,100%); margin:0 auto; display:grid;
      grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr); gap:14px; }
    .panel { min-width:0; padding:16px; border-radius:20px; background:white; box-shadow:var(--shadow); }
    .placement-panel { display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .front-arrow { display:flex; align-items:center; gap:10px; margin-bottom:6px; color:var(--orange);
      font-size:clamp(16px,2vw,24px); font-weight:950; letter-spacing:.06em; }
    .front-arrow .arrow-up { font-size:34px; line-height:1; }
    .placement-caption { min-height:25px; margin-bottom:4px; color:var(--muted); font-weight:800; }
    .placement-grid { --zone:clamp(96px,12vw,170px); display:grid; grid-template-columns:repeat(3,var(--zone));
      grid-template-rows:repeat(2,var(--zone)); gap:clamp(10px,1.5vw,22px); padding:12px; }
    .zone { position:relative; display:grid; place-items:center; width:var(--zone); height:var(--zone);
      border:clamp(6px,.65vw,10px) solid var(--teal-art); border-radius:50%; background:#fff; }
    button.zone { appearance:none; padding:0; color:inherit; font:inherit; }
    .zone.empty { background:var(--cream); }
    .player-cat { display:block; width:64%; height:72%; overflow:visible; }
    .player-cat text { font-weight:800; }
    .placement-grid.interactive .zone:not(:disabled) { cursor:pointer; transition:.16s ease; }
    .placement-grid.interactive .zone:not(:disabled):hover { border-color:var(--orange-art); transform:scale(1.025); }
    .placement-grid.interactive .zone:disabled { cursor:default; opacity:.7; }
    .zone.selected { border-color:var(--orange-art); outline:5px solid rgba(242,140,40,.28); outline-offset:3px;
      transform:scale(1.035); }
    .zone.target { outline:4px dashed rgba(31,58,104,.42); outline-offset:3px; }
    .zone.moved { animation:pulse-zone 1.2s ease 2; border-color:var(--orange-art); }
    .zone.departed::after { content:"départ"; position:absolute; padding:4px 8px; border-radius:999px;
      color:#98530f; background:#fff0dc; font-size:11px; font-weight:900; }
    @keyframes pulse-zone { 0%,100%{transform:scale(1)} 50%{transform:scale(1.045)} }
    .question { margin:6px 0 0; text-align:center; color:var(--navy); font-size:clamp(20px,2.6vw,34px); font-weight:950; }
    .question-hint { margin:5px 0 0; text-align:center; color:var(--muted); font-weight:650; }

    .cards-panel { --feedback-height:108px; --decision-height:76px; display:flex; flex-direction:column; }
    .cards-title { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:9px; }
    .cards-title h2 { margin:0; color:var(--navy); font-size:clamp(18px,2vw,26px); }
    .cards-title small { color:var(--muted); font-weight:700; }
    .cards-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
    .cards-panel > .cards-grid { flex:1; min-height:0; grid-template-rows:repeat(2,minmax(0,1fr)); }
    .logic-card { min-width:0; padding:7px 9px 9px; border:2px solid #d8e0e7; border-radius:12px;
      background:white; box-shadow:0 3px 10px rgba(31,58,104,.07); transition:.2s ease; }
    .logic-card.pending { color:var(--ink); }
    .logic-card.true { border-color:#5eb58e; background:#effaf4; }
    .logic-card.false { border-color:#dc7583; background:#fff3f5; }
    .logic-card.current { box-shadow:0 0 0 6px rgba(242,140,40,.34), 0 8px 20px rgba(31,58,104,.14); }
    .card-head { display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:24px;
      margin-bottom:2px; color:var(--navy); font-size:12px; font-weight:850; }
    .card-status { min-height:22px; padding:3px 7px; border-radius:999px; font-size:11px; }
    .true .card-status { color:#176746; background:#d7f2e4; }
    .false .card-status { color:#a12437; background:#ffe0e5; }
    .card-map { display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr);
      width:min(100%,220px); aspect-ratio:1.16; margin:auto; }
    .card-cell { display:grid; place-items:center; min-width:0; min-height:0; }
    .card-cell.front { grid-column:2; grid-row:1; }
    .card-cell.left { grid-column:1; grid-row:2; }
    .card-cell.self { position:relative; isolation:isolate; grid-column:2; grid-row:2; }
    .card-cell.self::before { content:""; position:absolute; z-index:0; inset:-8%; border:3px solid var(--teal-art);
      border-radius:9px; background:white; }
    .card-cell.right { grid-column:3; grid-row:2; }
    .card-cell.back { grid-column:2; grid-row:3; }
    .card-self-cat, .cat-mark { position:relative; z-index:1; overflow:visible; }
    .card-self-cat, .cat-mark svg { display:block; width:66%; height:auto; overflow:visible; }
    .cat-mark { width:100%; height:100%; display:grid; place-items:center; }
    .feedback { flex:0 0 var(--feedback-height); height:var(--feedback-height); min-height:var(--feedback-height);
      max-height:var(--feedback-height); margin-top:9px; padding:9px 12px; overflow:hidden; border-radius:14px;
      color:#405a73; background:#f0f4f7; line-height:1.4; }
    .feedback strong { color:var(--navy); }
    .feedback ul { margin:6px 0 0; padding:0; list-style:none; display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px 12px; font-size:13px; }
    .feedback ul.three-clauses { grid-template-columns:repeat(3,minmax(0,1fr));
      gap:4px 8px; font-size:12px; line-height:1.25; }
    .feedback li { padding-left:18px; position:relative; }
    .feedback li::before { position:absolute; left:0; font-weight:900; }
    .feedback li.ok::before { content:"✓"; color:var(--green); }
    .feedback li.bad::before { content:"✕"; color:var(--red); }
    .decision-slot { flex:0 0 var(--decision-height); min-height:var(--decision-height); display:grid;
      margin-top:9px; }
    .reveal-row { grid-area:1/1; display:flex; align-items:center; gap:10px; min-height:var(--decision-height); }
    .reveal-row .primary-button { flex:1; }
    .key-hint { color:var(--muted); font-size:11px; white-space:nowrap; }
    .verdict { grid-area:1/1; width:100%; min-height:var(--decision-height); margin:0; padding:8px 10px;
      border-radius:14px; display:flex; align-items:center; gap:10px; box-shadow:none; }
    .verdict.good { color:#155f42; background:#e8f8ef; border:2px solid #7ac6a2; }
    .verdict.bad { color:#872235; background:#fff0f2; border:2px solid #e18b97; }
    .verdict.editing { color:var(--navy); background:#eef7f7; border:2px solid #83c9c2; }
    .verdict-icon { font-size:24px; }
    .verdict-copy { flex:1; font-size:13px; line-height:1.25; }
    .verdict-copy strong { display:block; font-size:15px; }
    .verdict-actions { display:flex; align-items:center; gap:6px; flex:none; }
    .challenge-nav { width:min(1500px,100%); margin:10px auto 0; display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .nav-button { min-width:140px; padding:10px 16px; color:var(--navy); background:white; box-shadow:0 5px 16px rgba(18,49,78,.1); }
    .nav-button:hover:not(:disabled) { color:white; background:var(--navy-2); }
    .nav-button:disabled { opacity:.4; cursor:not-allowed; }
    .nav-center { color:var(--muted); font-size:12px; font-weight:750; text-align:center; }

    .mini-grid { --mini-zone:clamp(40px,4.2vw,58px); display:grid; grid-template-columns:repeat(3,var(--mini-zone));
      grid-template-rows:repeat(2,var(--mini-zone)); gap:5px; justify-content:center; }
    .mini-zone { display:grid; place-items:center; width:var(--mini-zone); height:var(--mini-zone); border:3px solid var(--teal-art);
      border-radius:50%; background:var(--cream); }
    .mini-zone.filled { background:white; }
    .mini-zone .player-cat { width:67%; height:76%; }
    .guided-cards .logic-card { padding:5px; border-width:2px; }
    .guided-cards .card-head { font-size:11px; margin:0; }
    .guided-cards .card-map { width:min(100%,145px); }

    @media (max-width:1050px) {
      .hero { grid-template-columns:1fr; }
      .picker-grid { grid-template-columns:repeat(6,1fr); }
    }
    @media (max-width:949px) {
      .workspace { grid-template-columns:1fr; }
      .challenge { height:auto; min-height:calc(100dvh - 64px); overflow:auto; }
      .placement-grid { --zone:clamp(78px,24vw,150px); }
      .cards-panel { --feedback-height:auto; --decision-height:auto; }
      .feedback { flex-basis:auto; height:auto; min-height:54px; max-height:none; }
      .decision-slot { flex-basis:auto; min-height:0; }
      .reveal-row, .verdict { min-height:0; }
    }
    @media (max-width:640px) {
      .topbar { min-height:62px; padding:8px 10px; }
      .brand { gap:8px; }
      .brand-logo { width:82px; }
      .brand-title { font-size:15px; }
      .brand-sub, .button-label, .key-hint { display:none; }
      .icon-button { width:46px; padding:0; }
      .home { padding:12px; }
      .hero-copy, .guided { padding:17px; border-radius:17px; }
      .guided-flow { grid-template-columns:1fr; }
      .flow-arrow { transform:rotate(90deg); text-align:center; }
      .picker-grid { grid-template-columns:repeat(4,1fr); }
      .challenge { padding:10px; }
      .workspace { grid-template-columns:1fr; }
      .panel { padding:11px; border-radius:16px; }
      .placement-grid { --zone:clamp(72px,23vw,112px); gap:7px; padding:7px; }
      .cards-grid { gap:6px; }
      .logic-card { padding:5px; border-width:2px; border-radius:12px; }
      .card-head { font-size:11px; }
      .card-status { padding:2px 4px; font-size:9px; }
      .card-map { aspect-ratio:1.05; }
      .feedback ul { grid-template-columns:1fr; }
      .nav-button { min-width:0; flex:1; }
      .nav-center { display:none; }
      .verdict { align-items:flex-start; flex-wrap:wrap; }
      .verdict-copy { min-width:calc(100% - 50px); }
      .verdict-actions { display:grid; grid-template-columns:1fr 1fr; width:100%; }
      .verdict .primary-button, .verdict .secondary-button { width:100%; }
    }
    @media (min-width:950px) and (max-height:900px) {
      .home { padding:10px 18px; }
      .hero { gap:14px; }
      .hero-copy { padding:18px 24px; }
      .hero-copy h1 { margin:4px 0 10px; font-size:clamp(38px,5vw,56px); line-height:.95; }
      .lead { font-size:17px; line-height:1.32; }
      .class-note { margin:12px 0 8px; padding:10px 14px; line-height:1.32; }
      .primary-button.large { min-height:46px; padding:8px 18px; font-size:16px; }
      .picker { margin-top:11px; padding-top:9px; }
      .picker-head { margin-bottom:7px; }
      .picker-head p { font-size:12px; }
      .picker-button { min-height:38px; padding:4px; }
      .guided { padding:14px; }
      .guided h2 { margin-bottom:3px; font-size:22px; }
      .guided .guided-legend { margin:4px 0 7px; padding:6px 9px; line-height:1.25; }
      .guided-flow { gap:6px; }
      .mini-stage { padding:7px; border-radius:13px; }
      .mini-label { margin-bottom:4px; font-size:10px; }
      .mini-grid { --mini-zone:clamp(36px,3.8vw,48px); gap:4px; }
      .flow-arrow { font-size:22px; }
      .guided-cards { margin-top:7px; }
      .guided-cards .card-map { width:min(100%,120px); }
      .guided-result { margin-top:7px !important; padding:6px 9px; font-size:13px; line-height:1.25; }
      .challenge { padding-top:5px; padding-bottom:2px; }
      .challenge-head { margin-bottom:3px; }
      .panel { padding:10px 14px; }
      .front-arrow { margin-bottom:0; }
      .placement-caption { min-height:20px; margin-bottom:0; font-size:14px; }
      .placement-grid { --zone:clamp(88px,10.2vw,134px); gap:9px; padding:5px; }
      .question { margin-top:2px; font-size:clamp(20px,2.3vw,30px); }
      .question-hint { margin-top:2px; font-size:14px; }
      .card-map { width:min(100%,clamp(148px,21dvh,180px)); aspect-ratio:1.1; }
      .logic-card { padding:5px 7px; }
      .cards-panel { --feedback-height:108px; --decision-height:68px; }
      .feedback { margin-top:6px; padding:6px 10px; font-size:13px; }
      .decision-slot { margin-top:6px; }
      .verdict { padding:6px 10px; }
      .verdict-icon { font-size:24px; }
      .verdict-copy { line-height:1.25; }
      .verdict-copy strong { font-size:15px; }
      .challenge-nav { margin-top:3px; }
      .nav-button { min-height:40px; padding:6px 14px; }
    }
    @media (min-width:950px) and (max-height:720px) {
      .card-map { width:min(100%,120px); }
    }
    @media (min-width:950px) and (max-height:680px) {
      .challenge { overflow-y:auto; }
      .workspace { flex:0 0 530px; }
      .card-map { width:min(100%,110px); }
    }
    @media (prefers-reduced-motion:reduce) {
      *, *::before, *::after { scroll-behavior:auto !important; animation:none !important; transition:none !important; }
    }
  </style>
</head>
<body>
  <div class="app">
    <header class="topbar">
      <a class="brand" href="index.html" id="brand-home" aria-label="Retourner au catalogue des outils maths&amp;go">
        <img class="brand-logo" src="@@LOGO@@" alt="maths&amp;go" width="390" height="181">
        <span class="brand-copy">
          <span class="brand-title">Chat, c'est toi le chat&nbsp;!</span>
          <span class="brand-sub">Défis à projeter</span>
        </span>
      </a>
      <div class="top-actions">
        <a class="icon-button" id="catalog-button" href="index.html" aria-label="Retourner au catalogue des outils">
          <span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9.5 20v-6h5v6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="button-label">Outils</span>
        </a>
        <button class="icon-button" id="home-button" type="button" aria-label="Retourner au menu des défis" hidden>
          <span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="button-label">Menu</span>
        </button>
        <button class="icon-button" id="fullscreen-button" type="button" aria-label="Afficher en plein écran">
          <span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="button-label">Plein écran</span>
        </button>
      </div>
    </header>

    <main>
      <section class="screen home" id="home-screen">
        <div class="home-inner">
          <div class="hero">
            <div class="hero-copy">
              <span class="eyebrow">12 défis inédits · École et collège</span>
              <h1>Observer, chercher, justifier.</h1>
              <p class="lead">Toute la classe observe le placement projeté depuis sa place. Chacun réfléchit d'abord seul, avec son ardoise s'il le souhaite, puis les idées sont mises en commun.</p>
              <p class="class-note"><strong>Le défi se joue tous ensemble.</strong> Demandez « correct ou non ? » et faites justifier les réponses. Puis vérifiez les cartes à voix haute, une à une.</p>
              <button class="primary-button large" id="start-button" type="button">Commencer le défi 1</button>
              <section class="picker" aria-labelledby="picker-title">
                <div class="picker-head">
                  <div><h2 id="picker-title">Choisir un défi</h2><p>Trois étapes progressives de quatre situations.</p></div>
                </div>
                <div class="picker-grid" id="picker-grid"></div>
              </section>
            </div>

            <aside class="guided" aria-labelledby="guided-title">
              <h2 id="guided-title">Exemple guidé</h2>
              <p class="guided-legend"><strong>Rappel :</strong> un chat signifie « quelqu’un dans le cercle voisin » ; un chat barré signifie « personne dans ce cercle, ou aucun cercle dans cette direction ».</p>
              <div class="guided-flow">
                <div class="mini-stage">
                  <span class="mini-label">Placement proposé</span>
                  <div class="mini-grid" id="guided-before"></div>
                </div>
                <span class="flow-arrow" aria-hidden="true">→</span>
                <div class="mini-stage good">
                  <span class="mini-label">Une correction</span>
                  <div class="mini-grid" id="guided-after"></div>
                </div>
              </div>
              <div class="cards-grid guided-cards" id="guided-cards"></div>
              <p class="guided-result">Dans le premier placement, seule la carte 2 est fausse. Le chat 2 change de cercle : les quatre cartes deviennent vraies.</p>
            </aside>
          </div>
        </div>
      </section>

      <section class="screen challenge" id="challenge-screen" hidden>
        <div class="challenge-head">
          <span class="difficulty" id="difficulty-label">Étape 1</span>
          <h1 id="challenge-title" tabindex="-1">Défi 1</h1>
          <span class="counter" id="counter">1 / 12</span>
        </div>

        <div class="workspace">
          <section class="panel placement-panel" aria-labelledby="placement-title">
            <div class="front-arrow"><span class="arrow-up" aria-hidden="true">↑</span><span>DEVANT</span></div>
            <div class="placement-caption" id="placement-title">Placement proposé</div>
            <div class="placement-grid" id="placement-grid" aria-label="Placement proposé dans les six zones"></div>
            <p class="question" id="placement-question">Ce placement est-il correct&nbsp;?</p>
            <p class="question-hint" id="placement-hint">Réfléchissez d'abord chacun depuis votre place, puis mettez vos idées en commun.</p>
          </section>

          <section class="panel cards-panel" aria-labelledby="cards-title">
            <div class="cards-title"><h2 id="cards-title">Les quatre cartes</h2><small>Le haut de la carte = devant</small></div>
            <div class="cards-grid" id="cards-grid"></div>
            <div class="feedback" id="card-feedback" aria-live="polite"><strong>À vous de jouer.</strong> Quand la classe a choisi, commencez par la carte 1.</div>
            <div class="decision-slot">
              <div class="reveal-row" id="reveal-row">
                <button class="primary-button" id="reveal-button" type="button">Vérifier la carte 1</button>
                <span class="key-hint">Espace : vérifier</span>
              </div>
              <div class="verdict" id="verdict" aria-live="polite" hidden></div>
            </div>
          </section>
        </div>

        <nav class="challenge-nav" aria-label="Navigation entre les défis">
          <button class="nav-button" id="previous-button" type="button">← Précédent</button>
          <div class="nav-center">Touches ← → : naviguer · F : plein écran · H : menu</div>
          <button class="nav-button" id="next-button" type="button">Suivant →</button>
        </nav>
      </section>
    </main>
  </div>

  <script id="projection-data" type="application/json">@@PAYLOAD@@</script>
  <script>
    (() => {
      'use strict';
      const DATA = JSON.parse(document.getElementById('projection-data').textContent);
      const $ = (selector) => document.querySelector(selector);
      const homeScreen = $('#home-screen');
      const challengeScreen = $('#challenge-screen');
      const catalogButton = $('#catalog-button');
      const homeButton = $('#home-button');
      const fullscreenButton = $('#fullscreen-button');
      const revealButton = $('#reveal-button');
      const revealRow = $('#reveal-row');
      const verdict = $('#verdict');
      const state = {
        index: 0,
        revealed: 0,
        mode: 'proposed',
        grid: null,
        selectedCell: null,
        actionHistory: []
      };
      const directionClass = { front:'front', back:'back', left:'left', right:'right' };
      const directionLabel = { front:'devant', back:'derrière', left:'à gauche', right:'à droite' };
      const directionTitle = { front:'Devant', back:'Derrière', left:'À gauche', right:'À droite' };
      const directionDelta = { front:[-1,0], back:[1,0], left:[0,-1], right:[0,1] };
      const directionOrder = ['front', 'left', 'right', 'back'];

      function catSVG(number = null, crossed = false, className = '') {
        const badge = number === null ? '' : `<g class="player-badge">
          <circle cx="50" cy="73" r="13" fill="#1f3a68" stroke="white" stroke-width="3"/>
          <text x="50" y="79" text-anchor="middle" fill="white" font-family="Segoe UI,Arial,sans-serif" font-size="18" font-weight="800">${number}</text>
        </g>`;
        const cross = crossed ? `<line x1="8" y1="16" x2="92" y2="104" stroke="#d1495b" stroke-width="10" stroke-linecap="round"/>
          <line x1="92" y1="16" x2="8" y2="104" stroke="#d1495b" stroke-width="10" stroke-linecap="round"/>` : '';
        return `<svg class="${className}" viewBox="0 0 100 112" aria-hidden="true" focusable="false">
          <path d="M78 88 C 96 82, 98 60, 88 52 C 84 66, 78 70, 74 74 Z" fill="#e0813f"/>
          <ellipse cx="50" cy="72" rx="30" ry="34" fill="#f09a52"/>
          <path d="M28 78 q 22 -10 44 0 l -2 8 q -20 -9 -40 0 Z" fill="#d9743a" opacity=".85"/>
          <path d="M26 62 q 24 -10 48 0 l -2 8 q -22 -9 -44 0 Z" fill="#d9743a" opacity=".85"/>
          <ellipse cx="34" cy="102" rx="9" ry="7" fill="#f09a52"/>
          <ellipse cx="66" cy="102" rx="9" ry="7" fill="#f09a52"/>
          <circle cx="50" cy="30" r="22" fill="#f09a52"/>
          <path d="M31 18 L 27 2 L 43 9 Z" fill="#f09a52"/>
          <path d="M69 18 L 73 2 L 57 9 Z" fill="#f09a52"/>
          <path d="M33 15 L 31 6 L 40 10 Z" fill="#e8b28d"/>
          <path d="M67 15 L 69 6 L 60 10 Z" fill="#e8b28d"/>
          <path d="M42 14 q 8 -6 16 0" stroke="#d9743a" stroke-width="3" fill="none" stroke-linecap="round"/>
          ${badge}${cross}
        </svg>`;
      }

      function catMark(wanted) {
        return `<span class="cat-mark" aria-hidden="true">${catSVG(null, wanted === 'X')}</span>`;
      }

      function cardHTML(player, constraints, result = null, compact = false) {
        const statusClass = result === true ? 'true' : result === false ? 'false' : 'pending';
        const statusText = result === true ? '✓ Vraie' : result === false ? '✕ Fausse' : '';
        const cells = Object.entries(constraints).map(([direction, wanted]) =>
          `<div class="card-cell ${directionClass[direction]}" title="${directionLabel[direction]}">${catMark(wanted)}<span class="sr-only">${directionLabel[direction]} : ${wanted === 'P' ? 'un chat' : 'aucun chat'}</span></div>`
        ).join('');
        return `<article class="logic-card ${statusClass}${compact ? ' compact' : ''}" data-player="${player}">
          <div class="card-head"><span>Carte ${player}</span><span class="card-status">${statusText}</span></div>
          <div class="card-map" aria-label="Carte ${player}">${cells}<div class="card-cell self">${catSVG(player, false, 'card-self-cat')}</div></div>
        </article>`;
      }

      function gridHTML(grid, mini = false, moved = [], before = null, interactive = false, selectedCell = null) {
        const beforePositions = {};
        if (before) before.flat().forEach((player, cell) => { if (player) beforePositions[player] = cell; });
        const flatGrid = grid.flat();
        const selectedPlayer = selectedCell === null ? null : flatGrid[selectedCell];
        return grid.flat().map((player, cell) => {
          const zoneLabel = player ? `Zone occupée par le chat ${player}` : 'Zone vide';
          if (mini) return `<div class="mini-zone${player ? ' filled' : ''}" aria-label="${zoneLabel}">${player ? catSVG(player, false, 'player-cat') : ''}</div>`;
          const isMoved = player && moved.includes(player);
          const departed = !player && moved.some(item => beforePositions[item] === cell);
          if (!interactive) {
            return `<div class="zone${player ? '' : ' empty'}${isMoved ? ' moved' : ''}${departed ? ' departed' : ''}" aria-label="${zoneLabel}">${player ? catSVG(player, false, 'player-cat') : ''}</div>`;
          }
          const selected = cell === selectedCell;
          const target = selectedPlayer !== null && !selected;
          const disabled = selectedPlayer === null && !player;
          let actionLabel = player ? `Sélectionner le chat ${player}` : 'Cercle vide : choisissez d’abord un chat';
          if (selected) actionLabel = `Chat ${player} sélectionné : cliquer à nouveau pour annuler`;
          else if (selectedPlayer !== null && player) actionLabel = `Échanger les places des chats ${selectedPlayer} et ${player}`;
          else if (selectedPlayer !== null) actionLabel = `Déplacer le chat ${selectedPlayer} dans ce cercle vide`;
          return `<button class="zone${player ? '' : ' empty'}${selected ? ' selected' : ''}${target ? ' target' : ''}" type="button" data-cell="${cell}" aria-label="${actionLabel}" aria-pressed="${selected ? 'true' : 'false'}"${disabled ? ' disabled' : ''}>${player ? catSVG(player, false, 'player-cat') : ''}</button>`;
        }).join('');
      }

      function renderHome() {
        $('#guided-before').innerHTML = gridHTML(DATA.guided.proposed, true);
        $('#guided-after').innerHTML = gridHTML(DATA.guided.correction, true);
        $('#guided-cards').innerHTML = [1,2,3,4].map(player => cardHTML(player, DATA.guided.cards[player], null, true)).join('');
        $('#picker-grid').innerHTML = DATA.cases.map((item, index) =>
          `<button class="picker-button" type="button" data-index="${index}">Défi ${item.number}<small>Étape ${item.difficulty}</small></button>`
        ).join('');
        $('#picker-grid').addEventListener('click', event => {
          const button = event.target.closest('[data-index]');
          if (button) openChallenge(Number(button.dataset.index));
        });
      }

      function currentCase() { return DATA.cases[state.index]; }

      function activeGrid(item = currentCase()) {
        if ((state.mode === 'editing' || state.mode === 'attempt') && state.grid) return state.grid;
        if (state.mode === 'suggested') return item.correction;
        return item.proposed;
      }

      function gridPositions(grid) {
        const positions = {};
        grid.forEach((row, rowIndex) => row.forEach((occupant, columnIndex) => {
          if (occupant) positions[occupant] = [rowIndex, columnIndex];
        }));
        return positions;
      }

      function constraintChecks(item, player, grid) {
        const positions = gridPositions(grid);
        const [row, column] = positions[player];
        return directionOrder
          .filter(direction => Object.hasOwn(item.cards[String(player)], direction))
          .map(direction => {
            const wanted = item.cards[String(player)][direction];
            const [deltaRow, deltaColumn] = directionDelta[direction];
            const neighborRow = row + deltaRow;
            const neighborColumn = column + deltaColumn;
            const inside = neighborRow >= 0 && neighborRow < 2 && neighborColumn >= 0 && neighborColumn < 3;
            const somebody = inside && Boolean(grid[neighborRow][neighborColumn]);
            const respected = wanted === 'P' ? somebody : !somebody;
            let message;
            if (wanted === 'P') {
              message = respected
                ? 'il y a bien un chat.'
                : inside ? 'un chat devrait être là, mais le cercle est vide.' : 'un chat devrait être là, mais il n’y a pas de cercle.';
            } else {
              message = respected
                ? 'il n’y a bien aucun chat.'
                : 'il ne devrait y avoir aucun chat, mais le cercle est occupé.';
            }
            return { direction, respected, message };
          });
      }

      function cardIsTrue(item, player, grid) {
        return constraintChecks(item, player, grid).every(check => check.respected);
      }

      function placementIsTrue(item, grid) {
        return [1,2,3,4].every(player => cardIsTrue(item, player, grid));
      }

      function constraintFeedback(item, player, grid) {
        return constraintChecks(item, player, grid)
          .map(check => `<li class="${check.respected ? 'ok' : 'bad'}"><b>${directionTitle[check.direction]}</b> : ${check.message}</li>`)
          .join('');
      }

      function showHome(updateHash = true) {
        homeScreen.hidden = false;
        challengeScreen.hidden = true;
        catalogButton.hidden = false;
        homeButton.hidden = true;
        if (updateHash && location.hash) history.pushState(null, '', location.pathname + location.search);
        window.scrollTo(0, 0);
      }

      function openChallenge(index, updateHash = true) {
        state.index = Math.max(0, Math.min(DATA.cases.length - 1, index));
        state.revealed = 0;
        state.mode = 'proposed';
        state.grid = null;
        state.selectedCell = null;
        state.actionHistory = [];
        homeScreen.hidden = true;
        challengeScreen.hidden = false;
        catalogButton.hidden = true;
        homeButton.hidden = false;
        if (updateHash) history.pushState(null, '', `#${currentCase().id}`);
        renderChallenge();
        $('#challenge-title').focus({ preventScroll:true });
        window.scrollTo(0, 0);
      }

      function alternativeCorrectionMessage(item) {
        const alternatives = item.correctionCount - 1;
        if (alternatives === 1) return ' Une autre correction existe : la classe peut la chercher.';
        if (alternatives === 2) return ' Deux autres corrections existent : la classe peut les chercher.';
        return alternatives > 2
          ? ` ${alternatives} autres corrections existent : la classe peut les chercher.`
          : '';
      }

      function renderChallenge() {
        const item = currentCase();
        const displayGrid = activeGrid(item);
        const correctionLabel = item.correctionCount > 1
          ? `Une correction parmi ${item.correctionCount}`
          : 'Une correction possible';
        const placementLabel = state.mode === 'suggested'
          ? correctionLabel
          : state.mode === 'editing'
            ? state.actionHistory.length
              ? 'Continuez la correction'
              : 'Construisez une correction'
            : state.mode === 'attempt'
              ? item.correctionActionCount > 1
                ? `Votre correction · ${state.actionHistory.length}/${item.correctionActionCount}`
                : 'Votre correction'
              : 'Placement proposé';
        const highlightedPlayers = state.mode === 'suggested'
          ? item.movedPlayers
          : state.mode === 'attempt'
            ? [...new Set(state.actionHistory.flatMap(action => action.players))]
            : [];
        const beforeGrid = state.mode === 'suggested' || state.mode === 'attempt'
          ? item.proposed
          : null;
        $('#difficulty-label').textContent = `Étape ${item.difficulty}`;
        $('#challenge-title').textContent = `Défi ${item.number}`;
        $('#counter').textContent = `${item.number} / ${DATA.cases.length}`;
        $('#placement-title').textContent = placementLabel;
        $('#placement-grid').classList.toggle('interactive', state.mode === 'editing');
        $('#placement-grid').innerHTML = gridHTML(
          displayGrid,
          false,
          highlightedPlayers,
          beforeGrid,
          state.mode === 'editing',
          state.selectedCell
        );
        $('#placement-grid').setAttribute('aria-label', `${placementLabel} dans les six zones`);

        if (state.mode === 'editing') {
          const selectedPlayer = state.selectedCell === null ? null : displayGrid.flat()[state.selectedCell];
          $('#placement-question').textContent = selectedPlayer === null
            ? state.actionHistory.length
              ? 'Quelle seconde modification faut-il faire\u00a0?'
              : 'Quel chat faut-il déplacer ou échanger\u00a0?'
            : `Où placer le chat ${selectedPlayer}\u00a0?`;
          $('#placement-hint').textContent = selectedPlayer === null
            ? state.actionHistory.length
              ? 'La première modification est conservée. Choisissez le prochain chat.'
              : 'Cliquez d’abord sur le chat à déplacer ou à échanger.'
            : 'Cliquez sur un cercle vide pour le déplacer, ou sur un autre chat pour échanger leurs places.';
        } else if (state.mode === 'attempt') {
          $('#placement-question').textContent = 'Votre correction est-elle valide\u00a0?';
          $('#placement-hint').textContent = 'Vérifiez à nouveau les quatre cartes avec la classe.';
        } else if (state.mode === 'suggested') {
          $('#placement-question').textContent = 'Cette correction est-elle valide\u00a0?';
          $('#placement-hint').textContent = 'Relisez les quatre cartes pour la justifier.';
        } else {
          $('#placement-question').textContent = 'Ce placement est-il correct\u00a0?';
          $('#placement-hint').textContent = 'Réfléchissez d’abord chacun depuis votre place, puis mettez vos idées en commun.';
        }

        $('#cards-grid').innerHTML = [1,2,3,4].map(player => {
          const revealed = state.revealed >= player;
          const result = revealed ? cardIsTrue(item, player, displayGrid) : null;
          return cardHTML(player, item.cards[String(player)], result);
        }).join('');

        const nextPlayer = state.revealed + 1;
        if (state.mode === 'editing') {
          const selectedPlayer = state.selectedCell === null ? null : displayGrid.flat()[state.selectedCell];
          $('#card-feedback').innerHTML = selectedPlayer === null
            ? state.actionHistory.length
              ? '<strong>Continuez votre correction.</strong> La première modification reste en place.'
              : '<strong>Construisez votre correction.</strong> Sélectionnez un chat dans le placement.'
            : `<strong>Chat ${selectedPlayer} sélectionné.</strong> Choisissez un cercle vide pour le déplacer, ou un autre chat pour échanger leurs places.`;
        } else if (state.revealed === 0) {
          $('#card-feedback').innerHTML = state.mode === 'suggested'
            ? `<strong>Une correction possible est affichée.</strong> Vérifiez-la à nouveau, carte par carte, avec la classe.${alternativeCorrectionMessage(item)}`
            : state.mode === 'attempt'
              ? state.actionHistory.length < item.correctionActionCount
                ? '<strong>Première modification en place.</strong> Vérifiez ce nouveau placement, carte par carte.'
                : '<strong>Votre correction est en place.</strong> Vérifiez-la maintenant, carte par carte.'
              : '<strong>À vous de jouer.</strong> Quand la classe a choisi, commencez par la carte 1.';
        } else {
          const cardValid = cardIsTrue(item, state.revealed, displayGrid);
          const details = constraintFeedback(item, state.revealed, displayGrid);
          const clauseCount = Object.keys(item.cards[String(state.revealed)]).length;
          $('#card-feedback').innerHTML = `${cardValid
            ? `<strong>✓ La carte ${state.revealed} est vraie.</strong>`
            : `<strong>✕ La carte ${state.revealed} est fausse.</strong>`}<ul class="${clauseCount === 3 ? 'three-clauses' : ''}">${details}</ul>`;
        }
        revealButton.hidden = state.mode === 'editing' || state.revealed >= 4;
        revealRow.hidden = revealButton.hidden;
        if (!revealButton.hidden) revealButton.textContent = `Vérifier la carte ${nextPlayer}`;
        verdict.hidden = state.mode !== 'editing' && state.revealed < 4;
        if (state.mode === 'editing' || state.revealed >= 4) renderVerdict();
        $('#previous-button').disabled = state.index === 0;
        $('#next-button').disabled = state.index === DATA.cases.length - 1;
      }

      function revealNextCard() {
        if (challengeScreen.hidden || state.revealed >= 4) return;
        state.revealed += 1;
        const player = state.revealed;
        renderChallenge();
        const card = document.querySelector(`#cards-grid .logic-card[data-player="${player}"]`);
        if (card) card.classList.add('current');
      }

      function correctionActionSentence(actions) {
        if (actions.length === 1 && actions[0].type === 'exchange') {
          return `Les chats ${actions[0].players[0]} et ${actions[0].players[1]} échangent leurs places.`;
        }
        if (actions.length === 1) return `Le chat ${actions[0].players[0]} change de cercle.`;
        const players = [...new Set(actions.flatMap(action => action.players))];
        return `Les chats ${players.join(' et ')} changent de cercle en deux déplacements.`;
      }

      function renderVerdict() {
        const item = currentCase();
        const displayGrid = activeGrid(item);
        verdict.hidden = false;
        if (state.mode === 'editing') {
          verdict.className = 'verdict editing';
          if (state.actionHistory.length) {
            verdict.innerHTML = '<span class="verdict-icon" aria-hidden="true">↔</span><div class="verdict-copy"><strong>Première modification conservée.</strong>Choisissez maintenant la seconde.</div><button class="secondary-button" id="restart-correction" type="button">Recommencer</button>';
            $('#restart-correction').addEventListener('click', restartCorrectionAttempt);
          } else {
            const instruction = item.correctionActionCount > 1
              ? 'Deux modifications sont nécessaires. Choisissez le premier chat.'
              : 'Choisissez un chat, puis sa nouvelle place.';
            verdict.innerHTML = `<span class="verdict-icon" aria-hidden="true">↔</span><div class="verdict-copy"><strong>À la classe de corriger.</strong>${instruction}</div><button class="secondary-button" id="cancel-correction" type="button">Annuler</button>`;
            $('#cancel-correction').addEventListener('click', cancelCorrectionAttempt);
          }
          return;
        }
        const valid = placementIsTrue(item, displayGrid);
        if (valid && state.mode === 'proposed') {
          verdict.className = 'verdict good';
          verdict.innerHTML = '<span class="verdict-icon" aria-hidden="true">✓</span><div class="verdict-copy"><strong>Oui, ce placement est correct.</strong>Les quatre cartes sont vraies.</div>';
          return;
        }
        if (valid && state.mode === 'attempt') {
          const action = correctionActionSentence(state.actionHistory);
          verdict.className = 'verdict good';
          verdict.innerHTML = `<span class="verdict-icon" aria-hidden="true">✓</span><div class="verdict-copy"><strong>Votre correction est valide.</strong>${action} Les quatre cartes sont vraies.</div><button class="secondary-button" id="reset-proposed" type="button">Revoir le départ</button>`;
          $('#reset-proposed').addEventListener('click', resetToProposed);
          return;
        }
        if (valid && state.mode === 'suggested') {
          const action = correctionActionSentence(item.solutionActions);
          verdict.className = 'verdict good';
          verdict.innerHTML = `<span class="verdict-icon" aria-hidden="true">✓</span><div class="verdict-copy"><strong>Correction validée.</strong>${action} Les quatre cartes sont vraies.</div><button class="secondary-button" id="reset-proposed" type="button">Revoir le départ</button>`;
          $('#reset-proposed').addEventListener('click', resetToProposed);
          return;
        }
        const falseCards = [1,2,3,4].filter(player => !cardIsTrue(item, player, displayGrid));
        const cardWord = falseCards.length === 1 ? 'carte est fausse' : 'cartes sont fausses';
        const remainingFalseMessage = falseCards.length === 1
          ? 'Une carte reste fausse.'
          : `${falseCards.length} cartes restent fausses.`;
        verdict.className = 'verdict bad';
        if (state.mode === 'attempt') {
          if (state.actionHistory.length < item.correctionActionCount) {
            verdict.innerHTML = `<span class="verdict-icon" aria-hidden="true">✕</span><div class="verdict-copy"><strong>Cette première modification ne suffit pas.</strong>${remainingFalseMessage}</div><button class="primary-button" id="continue-correction" type="button">Continuer</button>`;
            $('#continue-correction').addEventListener('click', continueCorrectionAttempt);
          } else {
            verdict.innerHTML = `<span class="verdict-icon" aria-hidden="true">✕</span><div class="verdict-copy"><strong>Cette correction ne suffit pas.</strong>${remainingFalseMessage}</div><div class="verdict-actions"><button class="primary-button" id="retry-correction" type="button">Réessayer</button><button class="secondary-button" id="show-suggested" type="button">Voir la solution</button></div>`;
            $('#retry-correction').addEventListener('click', restartCorrectionAttempt);
            $('#show-suggested').addEventListener('click', showSuggestedCorrection);
          }
        } else {
          const instruction = item.correctionActionCount > 1
            ? 'À la classe de construire une correction en deux actions.'
            : 'À la classe de proposer un déplacement ou un échange.';
          verdict.innerHTML = `<span class="verdict-icon" aria-hidden="true">✕</span><div class="verdict-copy"><strong>Non : ${falseCards.length} ${cardWord}.</strong>${instruction}</div><button class="primary-button" id="start-correction" type="button">Proposer une correction</button>`;
          $('#start-correction').addEventListener('click', beginCorrectionAttempt);
        }
      }

      function beginCorrectionAttempt() {
        const item = currentCase();
        if (!item.correction || state.revealed < 4) return;
        state.mode = 'editing';
        state.grid = item.proposed.map(row => [...row]);
        state.selectedCell = null;
        state.actionHistory = [];
        renderChallenge();
        const firstChat = $('#placement-grid .zone:not(:disabled)');
        if (firstChat) firstChat.focus({ preventScroll:true });
      }

      function continueCorrectionAttempt() {
        const item = currentCase();
        if (state.mode !== 'attempt' || state.actionHistory.length >= item.correctionActionCount) return;
        state.mode = 'editing';
        state.selectedCell = null;
        renderChallenge();
        const firstChat = $('#placement-grid .zone:not(:disabled)');
        if (firstChat) firstChat.focus({ preventScroll:true });
      }

      function restartCorrectionAttempt() {
        state.revealed = 4;
        beginCorrectionAttempt();
      }

      function cancelCorrectionAttempt() {
        state.mode = 'proposed';
        state.grid = null;
        state.selectedCell = null;
        state.actionHistory = [];
        state.revealed = 4;
        renderChallenge();
        const button = $('#start-correction');
        if (button) button.focus({ preventScroll:true });
      }

      function resetToProposed() {
        state.mode = 'proposed';
        state.grid = null;
        state.selectedCell = null;
        state.actionHistory = [];
        state.revealed = 4;
        renderChallenge();
      }

      function showSuggestedCorrection() {
        const item = currentCase();
        if (!item.correction) return;
        state.mode = 'suggested';
        state.grid = null;
        state.selectedCell = null;
        state.actionHistory = [];
        state.revealed = 0;
        renderChallenge();
        revealButton.focus({ preventScroll:true });
      }

      function applyPlacementAction(grid, sourceCell, targetCell) {
        const flatGrid = grid.flat();
        const sourcePlayer = flatGrid[sourceCell];
        const targetPlayer = flatGrid[targetCell];
        if (!sourcePlayer || sourceCell === targetCell || targetPlayer === undefined) return null;
        const candidate = grid.map(row => [...row]);
        const sourceRow = Math.floor(sourceCell / 3);
        const sourceColumn = sourceCell % 3;
        const targetRow = Math.floor(targetCell / 3);
        const targetColumn = targetCell % 3;
        candidate[sourceRow][sourceColumn] = targetPlayer;
        candidate[targetRow][targetColumn] = sourcePlayer;
        return { grid:candidate, sourcePlayer, targetPlayer };
      }

      function handlePlacementClick(event) {
        if (state.mode !== 'editing') return;
        const zone = event.target.closest('[data-cell]');
        if (!zone || zone.disabled) return;
        const cell = Number(zone.dataset.cell);
        const workingGrid = activeGrid();
        const flatGrid = workingGrid.flat();
        if (state.selectedCell === null) {
          if (!flatGrid[cell]) return;
          state.selectedCell = cell;
          renderChallenge();
          const selected = $(`#placement-grid [data-cell="${cell}"]`);
          if (selected) selected.focus({ preventScroll:true });
          return;
        }
        if (cell === state.selectedCell) {
          state.selectedCell = null;
          renderChallenge();
          const sameChat = $(`#placement-grid [data-cell="${cell}"]`);
          if (sameChat) sameChat.focus({ preventScroll:true });
          return;
        }
        const sourceCell = state.selectedCell;
        const action = applyPlacementAction(workingGrid, sourceCell, cell);
        if (!action) return;
        state.grid = action.grid;
        state.mode = 'attempt';
        state.revealed = 0;
        state.selectedCell = null;
        state.actionHistory.push({
          type: action.targetPlayer ? 'exchange' : 'move',
          players: action.targetPlayer
            ? [action.sourcePlayer, action.targetPlayer]
            : [action.sourcePlayer]
        });
        renderChallenge();
        revealButton.focus({ preventScroll:true });
      }

      async function toggleFullscreen() {
        try {
          if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
          else await document.exitFullscreen();
        } catch (_) {
          fullscreenButton.setAttribute('aria-label', 'Le plein écran n’est pas disponible');
        }
      }

      function syncFullscreenLabel() {
        const active = Boolean(document.fullscreenElement);
        fullscreenButton.setAttribute('aria-label', active ? 'Quitter le plein écran' : 'Afficher en plein écran');
        fullscreenButton.querySelector('.button-label').textContent = active ? 'Quitter' : 'Plein écran';
      }

      $('#start-button').addEventListener('click', () => openChallenge(0));
      homeButton.addEventListener('click', () => showHome());
      fullscreenButton.addEventListener('click', toggleFullscreen);
      document.addEventListener('fullscreenchange', syncFullscreenLabel);
      revealButton.addEventListener('click', revealNextCard);
      $('#placement-grid').addEventListener('click', handlePlacementClick);
      $('#previous-button').addEventListener('click', () => openChallenge(state.index - 1));
      $('#next-button').addEventListener('click', () => openChallenge(state.index + 1));
      window.addEventListener('popstate', () => routeFromHash(false));

      function routeFromHash(updateHash = false) {
        const id = location.hash.replace(/^#/, '');
        const index = DATA.cases.findIndex(item => item.id === id);
        if (index >= 0) openChallenge(index, updateHash);
        else showHome(updateHash);
      }

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && state.mode === 'editing') {
          event.preventDefault();
          if (state.selectedCell === null) cancelCorrectionAttempt();
          else {
            const previousCell = state.selectedCell;
            state.selectedCell = null;
            renderChallenge();
            const previousChat = $(`#placement-grid [data-cell="${previousCell}"]`);
            if (previousChat) previousChat.focus({ preventScroll:true });
          }
          return;
        }
        if (event.target.closest('button, a, input, select, textarea')) return;
        const key = event.key.toLowerCase();
        if (key === 'f') { event.preventDefault(); toggleFullscreen(); return; }
        if (key === 'h') { event.preventDefault(); showHome(); return; }
        if (challengeScreen.hidden) {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openChallenge(0); }
          return;
        }
        if (event.key === 'ArrowLeft' && state.index > 0) { event.preventDefault(); openChallenge(state.index - 1); }
        if (event.key === 'ArrowRight' && state.index < DATA.cases.length - 1) { event.preventDefault(); openChallenge(state.index + 1); }
        if ((event.key === 'Enter' || event.key === ' ') && state.revealed < 4) { event.preventDefault(); revealNextCard(); }
        if (key === 'c' && state.revealed >= 4 && currentCase().correction) {
          event.preventDefault();
          if (state.mode === 'editing') return;
          if (state.mode === 'suggested') resetToProposed();
          else if (
            state.mode === 'attempt'
            && state.actionHistory.length < currentCase().correctionActionCount
            && !placementIsTrue(currentCase(), activeGrid())
          ) continueCorrectionAttempt();
          else beginCorrectionAttempt();
        }
      });

      renderHome();
      routeFromHash(false);
      window.__CHAT_PROJECTION__ = DATA;
    })();
  </script>
  <style>.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style>
</body>
</html>
'''


def build_html(payload: dict) -> str:
    favicon_bytes = FAVICON_FILE.read_bytes()
    favicon = "data:image/svg+xml;base64," + base64.b64encode(favicon_bytes).decode("ascii")
    logo_bytes = LOGO_FILE.read_bytes()
    logo = "data:image/png;base64," + base64.b64encode(logo_bytes).decode("ascii")
    encoded_payload = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    encoded_payload = encoded_payload.replace("</", "<\\/")
    document = (
        HTML_TEMPLATE.replace("@@FAVICON@@", favicon)
        .replace("@@LOGO@@", logo)
        .replace("@@PAYLOAD@@", encoded_payload)
    )
    forbidden = ("Compétences", "Sac à maths")
    for phrase in forbidden:
        if phrase.casefold() in document.casefold():
            raise ValueError(f"mention interdite dans la page : {phrase}")
    for token in ("https://cdn", "http://cdn", "drag", "chrono", "score"):
        if token in document.casefold():
            raise ValueError(f"élément indésirable dans la page : {token}")
    return document


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="valider les données et vérifier que le HTML généré est à jour",
    )
    args = parser.parse_args()

    raw_data = json.loads(CASES_FILE.read_text(encoding="utf-8"))
    printed_series = json.loads(PRINTED_SERIES_FILE.read_text(encoding="utf-8"))
    payload = prepare_payload(raw_data, printed_series)
    document = build_html(payload)

    if args.check:
        if not OUTPUT_FILE.exists():
            print(f"ERREUR : fichier généré absent : {OUTPUT_FILE}", file=sys.stderr)
            return 1
        if OUTPUT_FILE.read_text(encoding="utf-8") != document:
            print("ERREUR : le HTML projeté n'est pas à jour", file=sys.stderr)
            return 1
        valid_count = sum(item["valid"] for item in payload["cases"])
        print(
            f"OK : {len(payload['cases'])} défis inédits, "
            f"{valid_count} vrais / {len(payload['cases']) - valid_count} faux, "
            "corrections et symétries vérifiées."
        )
        return 0

    OUTPUT_FILE.write_text(document, encoding="utf-8")
    print(f"Généré : {OUTPUT_FILE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

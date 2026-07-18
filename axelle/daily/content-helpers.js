(function () {
  function base(id, section, title, prompt, explanation, visual) {
    return {id, section, title, prompt, explanation, visual};
  }

  function q(id, section, title, prompt, correct, options, explanation, visual) {
    const answer = options.indexOf(correct);
    if (answer < 0) throw new Error(`Réponse absente des choix pour ${id}`);
    return {...base(id, section, title, prompt, explanation, visual), type: "qcm", options, answer, correctLabel: correct};
  }

  function input(id, section, title, prompt, accepted, correctLabel, explanation, visual, inputMode) {
    return {...base(id, section, title, prompt, explanation, visual), type: "input", accepted, correctLabel, inputMode};
  }

  function fraction(id, section, title, prompt, denominator, target, explanation) {
    return {...base(id, section, title, prompt, explanation), type: "fraction", denominator, target, correctLabel: `${target} part${target > 1 ? "s" : ""} sur ${denominator}`};
  }

  function order(id, section, title, prompt, tokens, answer, explanation, visual) {
    return {...base(id, section, title, prompt, explanation, visual), type: "order", tokens, answer, correctLabel: answer.join(" ")};
  }

  function open(id, section, title, prompt, explanation, visual, placeholder) {
    return {...base(id, section, title, prompt, explanation, visual), type: "open", placeholder};
  }

  window.AXELLE_BUILD = {q, input, fraction, order, open};
})();

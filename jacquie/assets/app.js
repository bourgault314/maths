(function () {
  const session = window.JACQUIE_SESSION || { memos: [], questions: [] };
  const screens = {
    welcome: document.getElementById("welcome-screen"),
    memo: document.getElementById("memo-screen"),
    quiz: document.getElementById("quiz-screen"),
    finish: document.getElementById("finish-screen")
  };
  const memoGrid = document.getElementById("memo-grid");
  const sectionLabel = document.getElementById("section-label");
  const questionCount = document.getElementById("question-count");
  const progressBar = document.getElementById("progress-bar");
  const questionVisual = document.getElementById("question-visual");
  const questionKicker = document.getElementById("question-kicker");
  const questionTitle = document.getElementById("question-title");
  const questionPrompt = document.getElementById("question-prompt");
  const answers = document.getElementById("answers");
  const hintButton = document.getElementById("hint-button");
  const hintBox = document.getElementById("hint-box");
  const feedback = document.getElementById("feedback");
  const nextButton = document.getElementById("next-button");
  const finalScore = document.getElementById("final-score");
  const finalRank = document.getElementById("final-rank");
  const finishMessage = document.getElementById("finish-message");

  let questionIndex = 0;
  let score = 0;
  let answered = false;

  function showScreen(name) {
    Object.entries(screens).forEach(([key, node]) => { node.hidden = key !== name; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderMemos() {
    memoGrid.innerHTML = session.memos.map((memo, index) => `
      <article class="memo-card" style="--memo-color:${memo.color};--memo-soft:${memo.soft}">
        <span class="memo-number">${index + 1}</span>
        <div class="memo-visual">${memo.visual}</div>
        <h2>${memo.title}</h2>
        <p>${memo.text}</p>
      </article>`).join("");
  }

  function renderQuestion() {
    const question = session.questions[questionIndex];
    answered = false;
    screens.quiz.classList.remove("answered-state");
    sectionLabel.textContent = question.section;
    questionCount.textContent = `Question ${questionIndex + 1} sur ${session.questions.length}`;
    progressBar.style.width = `${(questionIndex / session.questions.length) * 100}%`;
    questionVisual.innerHTML = question.visual || "";
    questionKicker.textContent = question.kicker || "";
    questionTitle.innerHTML = question.title;
    questionPrompt.textContent = question.prompt || "";

    const shuffledOptions = question.options.map((option, index) => ({ option, index }));
    for (let i = shuffledOptions.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }
    answers.innerHTML = shuffledOptions.map(({ option, index }) => `
      <button class="answer-button" type="button" data-answer="${index}">${option}</button>`).join("");

    hintBox.hidden = true;
    hintBox.textContent = question.hint;
    hintButton.hidden = false;
    hintButton.textContent = "Demander au souffleur";
    feedback.hidden = true;
    feedback.className = "feedback";
    nextButton.hidden = true;
    nextButton.querySelector("span:first-child").textContent = questionIndex === session.questions.length - 1 ? "Entendre le jury" : "Question suivante";
  }

  function chooseAnswer(button) {
    if (answered) return;
    answered = true;
    const question = session.questions[questionIndex];
    const selected = Number(button.dataset.answer);
    const correct = selected === question.answer;
    if (correct) score += 1;

    answers.querySelectorAll(".answer-button").forEach((candidate) => {
      candidate.disabled = true;
      const candidateAnswer = Number(candidate.dataset.answer);
      if (candidateAnswer === question.answer) candidate.classList.add("correct");
      if (candidateAnswer === selected && !correct) candidate.classList.add("wrong");
    });

    feedback.innerHTML = `<strong>${correct ? question.success || "Le jury acquiesce." : question.failure || "Le jury toussote."}</strong>${question.explanation}`;
    feedback.classList.add(correct ? "good" : "bad");
    feedback.hidden = false;
    hintButton.hidden = true;
    hintBox.hidden = true;
    nextButton.hidden = false;
    screens.quiz.classList.add("answered-state");
    window.requestAnimationFrame(() => feedback.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  function finish() {
    progressBar.style.width = "100%";
    finalScore.textContent = `${score}/${session.questions.length}`;
    if (score === 20) {
      finalRank.textContent = "Inquiétante";
      finishMessage.textContent = "Sans-faute. L’agrégation est maintenue et le jury demande désormais à suivre vos cours.";
    } else if (score >= 17) {
      finalRank.textContent = "Très théâtrale";
      finishMessage.textContent = "Le jury s’est retiré pour cacher son émotion. Quelques roses sont déjà tombées du balcon.";
    } else if (score >= 14) {
      finalRank.textContent = "Agrégée confirmée";
      finishMessage.textContent = "Solide, précise, et presque indulgente envers le nouveau programme. L’institution respire.";
    } else if (score >= 10) {
      finalRank.textContent = "Admise au collège";
      finishMessage.textContent = "Le niveau collège est atteint avec panache. Une formation de dix-sept heures sur le pétale pourra être envisagée.";
    } else {
      finalRank.textContent = "À encourager";
      finishMessage.textContent = "Le jury prescrit une remédiation avec Axelle, puis un goûter. La titularisation n’est pas menacée.";
    }
    showScreen("finish");
  }

  function startQuiz() {
    questionIndex = 0;
    score = 0;
    showScreen("quiz");
    renderQuestion();
  }

  document.getElementById("start-button").addEventListener("click", () => showScreen("memo"));
  document.getElementById("memo-button").addEventListener("click", startQuiz);
  document.getElementById("restart-button").addEventListener("click", () => showScreen("memo"));
  ["brand-home-button", "space-home-button"].forEach((id) => {
    document.getElementById(id).addEventListener("click", () => showScreen("welcome"));
  });
  answers.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-answer]");
    if (button) chooseAnswer(button);
  });
  hintButton.addEventListener("click", () => {
    hintBox.hidden = !hintBox.hidden;
    hintButton.textContent = hintBox.hidden ? "Demander au souffleur" : "Faire taire le souffleur";
  });
  nextButton.addEventListener("click", () => {
    if (!answered) return;
    questionIndex += 1;
    if (questionIndex >= session.questions.length) finish();
    else renderQuestion();
  });

  renderMemos();
})();

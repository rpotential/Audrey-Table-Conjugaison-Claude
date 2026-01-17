// TableQuizz — App Logic
(function () {
  "use strict";

  const state = {
    currentVerb: null,
    currentTense: null,
    currentPronounIndex: 0,
    mode: "practice",
    isTimerRunning: false,
    timerInterval: null,
    timeRemaining: 60,
    score: 0,
    correct: 0,
    total: 0,
    streak: 0,
    maxStreak: 0,
    xp: 0,
    level: 1,
    reviewList: [],
    selectedVerbs: [],
    selectedTenses: [],
  };

  const XP_PER_LEVEL = 100;
  const XP_PER_CORRECT = 10;
  const XP_STREAK_BONUS = 5;

  const elements = {};

  function init() {
    // Cache DOM elements
    elements.tablesView = document.getElementById("tables");
    elements.quizView = document.getElementById("quiz");
    elements.tablesGrid = document.getElementById("tables-grid");
    elements.tenseLabel = document.getElementById("tense-label");
    elements.verbLabel = document.getElementById("verb-label");
    elements.pronounFr = document.getElementById("pronoun-fr");
    elements.pronounEn = document.getElementById("pronoun-en");
    elements.answerInput = document.getElementById("answer-input");
    elements.submitBtn = document.getElementById("submit-answer");
    elements.skipBtn = document.getElementById("skip-question");
    elements.feedback = document.getElementById("feedback");
    elements.timer = document.getElementById("timer");
    elements.levelValue = document.getElementById("level-value");
    elements.xpValue = document.getElementById("xp-value");
    elements.streakValue = document.getElementById("streak-value");
    elements.accuracyValue = document.getElementById("accuracy-value");
    elements.scoreValue = document.getElementById("score-value");
    elements.countValue = document.getElementById("count-value");
    elements.reviewList = document.getElementById("review-list");

    loadProgress();
    renderLearnSection();
    renderTables();
    setupEventListeners();
    generateNewQuestion();
    updateUI();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Learn Section - Verb Groups & Tense Guide
  // ─────────────────────────────────────────────────────────────────────────

  function renderLearnSection() {
    renderVerbGroups();
    renderAuxiliaries();
    renderTenseGuide();
  }

  function renderVerbGroups() {
    var group1Container = document.getElementById("group1-verbs");
    var group2Container = document.getElementById("group2-verbs");
    var group3Container = document.getElementById("group3-verbs");

    if (!group1Container || !group2Container || !group3Container) return;

    var group1Verbs = [];
    var group2Verbs = [];
    var group3Verbs = [];

    Object.entries(VERBS).forEach(function(entry) {
      var verb = entry[1];
      if (verb.groupNum === 1) group1Verbs.push(verb);
      else if (verb.groupNum === 2) group2Verbs.push(verb);
      else if (verb.groupNum === 3 && !verb.isAuxiliary) group3Verbs.push(verb);
    });

    group1Container.innerHTML = group1Verbs.map(function(v) {
      return '<div class="verb-chip"><span class="verb-fr">' + v.infinitive + '</span><span class="verb-en">' + v.english + '</span></div>';
    }).join("");

    group2Container.innerHTML = group2Verbs.map(function(v) {
      return '<div class="verb-chip"><span class="verb-fr">' + v.infinitive + '</span><span class="verb-en">' + v.english + '</span></div>';
    }).join("");

    group3Container.innerHTML = group3Verbs.map(function(v) {
      return '<div class="verb-chip"><span class="verb-fr">' + v.infinitive + '</span><span class="verb-en">' + v.english + '</span></div>';
    }).join("");
  }

  function renderAuxiliaries() {
    var container = document.getElementById("auxiliaries-grid");
    if (!container) return;

    var etre = VERBS.etre;
    var avoir = VERBS.avoir;

    container.innerHTML =
      '<div class="auxiliary-card">' +
        '<div class="auxiliary-header">' +
          '<h3>ÊTRE <span class="aux-en">to be</span></h3>' +
          '<p class="aux-note">Used for: movement verbs (aller, venir, partir...) &amp; reflexive verbs</p>' +
        '</div>' +
        createBilingualTable(etre, "present") +
      '</div>' +
      '<div class="auxiliary-card">' +
        '<div class="auxiliary-header">' +
          '<h3>AVOIR <span class="aux-en">to have</span></h3>' +
          '<p class="aux-note">Used for: most other verbs in passé composé</p>' +
        '</div>' +
        createBilingualTable(avoir, "present") +
      '</div>';
  }

  function createBilingualTable(verb, tenseKey) {
    var conjugationsFr = verb.tenses[tenseKey];
    var conjugationsEn = verb.tensesEn ? verb.tensesEn[tenseKey] : null;

    var rows = PRONOUNS.map(function(pronoun, i) {
      var shouldElide = pronoun.elided && verb.startsWithVowel;
      var displayPronoun = shouldElide ? pronoun.elided : pronoun.fr;
      var enConj = conjugationsEn ? conjugationsEn[i] : "";

      return '<tr>' +
        '<td class="pronoun-cell"><span class="pronoun-fr">' + displayPronoun + '</span><span class="pronoun-en">' + pronoun.en + '</span></td>' +
        '<td class="conj-fr">' + conjugationsFr[i] + '</td>' +
        '<td class="conj-en">' + enConj + '</td>' +
      '</tr>';
    }).join("");

    return '<table class="bilingual-table"><thead><tr><th>Pronom</th><th>Français</th><th>English</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderTenseGuide() {
    var container = document.getElementById("tense-guide");
    if (!container) return;

    var html = Object.entries(TENSES).map(function(entry) {
      var key = entry[0];
      var tense = entry[1];

      var whenToUseHtml = "";
      if (tense.whenToUse) {
        whenToUseHtml = '<div class="when-to-use"><h4>Quand l\'utiliser / When to use:</h4><ul>' +
          tense.whenToUse.map(function(item) {
            return '<li><span class="use-fr">' + item.fr + '</span> <span class="use-en">(' + item.en + ')</span></li>';
          }).join("") +
        '</ul></div>';
      }

      var examplesHtml = "";
      if (tense.examples) {
        examplesHtml = '<div class="examples"><h4>Exemples / Examples:</h4><div class="examples-grid">' +
          tense.examples.map(function(ex) {
            return '<div class="example-pair"><div class="example-fr">' + ex.fr + '</div><div class="example-en">' + ex.en + '</div></div>';
          }).join("") +
        '</div></div>';
      }

      return '<div class="tense-card tense-guide-card" data-tense="' + key + '">' +
        '<div class="tense-header tense-' + key + '">' +
          '<h3>' + tense.name + ' <span class="tense-en">(' + tense.nameEn + ')</span></h3>' +
          '<p class="tense-desc">' + tense.descriptionFr + '</p>' +
          '<p class="tense-desc-en">' + tense.description + '</p>' +
        '</div>' +
        '<div class="tense-body">' +
          whenToUseHtml +
          examplesHtml +
        '</div>' +
      '</div>';
    }).join("");

    container.innerHTML = html;
  }

  function renderTables() {
    const grid = elements.tablesGrid;
    if (!grid) return;
    grid.innerHTML = "";

    Object.entries(VERBS).forEach(function(verbEntry) {
      var verbKey = verbEntry[0];
      var verb = verbEntry[1];
      Object.entries(TENSES).forEach(function(tenseEntry) {
        var tenseKey = tenseEntry[0];
        var tense = tenseEntry[1];
        var card = createConjugationCard(verb, verbKey, tense, tenseKey);
        grid.appendChild(card);
      });
    });
  }

  function createConjugationCard(verb, verbKey, tense, tenseKey) {
    var card = document.createElement("div");
    card.className = "conjugation-card";
    card.dataset.tense = tenseKey;
    card.dataset.verb = verbKey;

    var conjugationsFr = verb.tenses[tenseKey];
    var conjugationsEn = verb.tensesEn ? verb.tensesEn[tenseKey] : null;

    var tableRows = PRONOUNS.map(function(pronoun, i) {
      var shouldElide = pronoun.elided && verb.startsWithVowel;
      var displayPronoun = shouldElide ? pronoun.elided : pronoun.fr;
      var enConj = conjugationsEn ? conjugationsEn[i] : "";

      return '<tr>' +
        '<td class="pronoun-cell"><span class="pronoun-fr">' + displayPronoun + '</span><span class="pronoun-en">' + pronoun.en + '</span></td>' +
        '<td class="conjugation-cell conj-fr">' + conjugationsFr[i] + '</td>' +
        '<td class="conjugation-cell conj-en">' + enConj + '</td>' +
      '</tr>';
    }).join("");

    card.innerHTML =
      '<div class="conjugation-header">' +
        '<h3>' + verb.infinitive + ' — ' + verb.english + '</h3>' +
        '<div class="conjugation-meta">' +
          '<span class="tense-badge tense-' + tenseKey + '">' + tense.name + '</span>' +
          '<span class="verb-badge group-' + verb.groupNum + '">' + verb.group + '</span>' +
        '</div>' +
      '</div>' +
      '<table class="conjugation-table bilingual-table">' +
        '<thead><tr><th>Pronom</th><th>Français</th><th>English</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
      '</table>';

    return card;
  }

  function generateNewQuestion() {
    var verbKeys = Object.keys(VERBS);
    var randomVerbKey = verbKeys[Math.floor(Math.random() * verbKeys.length)];
    state.currentVerb = Object.assign({ key: randomVerbKey }, VERBS[randomVerbKey]);

    var tenseKeys = Object.keys(TENSES);
    var randomTenseKey = tenseKeys[Math.floor(Math.random() * tenseKeys.length)];
    state.currentTense = Object.assign({ key: randomTenseKey }, TENSES[randomTenseKey]);

    state.currentPronounIndex = Math.floor(Math.random() * PRONOUNS.length);
    displayQuestion();
  }

  function displayQuestion() {
    var pronoun = PRONOUNS[state.currentPronounIndex];
    var shouldElide = pronoun.elided && state.currentVerb.startsWithVowel;
    var displayPronoun = shouldElide ? pronoun.elided : pronoun.fr;

    if (elements.tenseLabel) {
      elements.tenseLabel.textContent = state.currentTense.name;
      elements.tenseLabel.className = "tense-badge tense-" + state.currentTense.key;
    }
    if (elements.verbLabel) {
      elements.verbLabel.textContent = state.currentVerb.infinitive + " (" + state.currentVerb.english + ")";
    }
    if (elements.pronounFr) elements.pronounFr.textContent = displayPronoun;
    if (elements.pronounEn) elements.pronounEn.textContent = "(" + pronoun.en + ")";

    if (elements.answerInput) {
      elements.answerInput.value = "";
      elements.answerInput.focus();
    }
    if (elements.feedback) {
      elements.feedback.textContent = "";
      elements.feedback.className = "feedback";
    }
  }

  function checkAnswer() {
    var userAnswer = elements.answerInput.value.trim().toLowerCase();
    var correctAnswer = state.currentVerb.tenses[state.currentTense.key][state.currentPronounIndex];

    var normalizedUser = normalizeAnswer(userAnswer);
    var normalizedCorrect = normalizeAnswer(correctAnswer);
    var normalizedWithoutParens = normalizeAnswer(correctAnswer.replace(/\([^)]*\)/g, ""));

    var isCorrect = normalizedUser === normalizedCorrect || normalizedUser === normalizedWithoutParens;

    state.total++;

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer(correctAnswer);
    }

    updateUI();
    saveProgress();

    setTimeout(function() {
      generateNewQuestion();
    }, isCorrect ? 800 : 2000);
  }

  function normalizeAnswer(str) {
    return str.toLowerCase().trim().replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function handleCorrectAnswer() {
    state.correct++;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;

    var xpGained = XP_PER_CORRECT;
    if (state.streak >= 3) xpGained += XP_STREAK_BONUS;
    if (state.streak >= 5) xpGained += XP_STREAK_BONUS;
    if (state.streak >= 10) xpGained += XP_STREAK_BONUS * 2;

    state.xp += xpGained;
    state.score += xpGained;
    checkLevelUp();

    var encouragement = ENCOURAGEMENTS.correct[Math.floor(Math.random() * ENCOURAGEMENTS.correct.length)];
    elements.feedback.textContent = encouragement + " +" + xpGained + " XP";
    elements.feedback.className = "feedback correct";
    elements.answerInput.classList.add("pulse");
    setTimeout(function() { elements.answerInput.classList.remove("pulse"); }, 400);
  }

  function handleIncorrectAnswer(correctAnswer) {
    state.streak = 0;

    var reviewItem = {
      verb: state.currentVerb.infinitive,
      tense: state.currentTense.name,
      pronoun: PRONOUNS[state.currentPronounIndex].fr,
      correct: correctAnswer,
      timestamp: Date.now(),
    };
    state.reviewList.unshift(reviewItem);
    if (state.reviewList.length > 20) state.reviewList.pop();

    elements.feedback.innerHTML = "La réponse : <strong>" + correctAnswer + "</strong>";
    elements.feedback.className = "feedback incorrect";
    elements.answerInput.classList.add("shake");
    setTimeout(function() { elements.answerInput.classList.remove("shake"); }, 300);

    updateReviewList();
  }

  function skipQuestion() {
    var correctAnswer = state.currentVerb.tenses[state.currentTense.key][state.currentPronounIndex];
    elements.feedback.innerHTML = "Réponse : <strong>" + correctAnswer + "</strong>";
    elements.feedback.className = "feedback incorrect";
    setTimeout(function() { generateNewQuestion(); }, 1500);
  }

  function checkLevelUp() {
    var newLevel = Math.floor(state.xp / XP_PER_LEVEL) + 1;
    if (newLevel > state.level) state.level = newLevel;
  }

  function startTimer() {
    state.isTimerRunning = true;
    state.timeRemaining = 60;
    updateTimerDisplay();

    state.timerInterval = setInterval(function() {
      state.timeRemaining--;
      updateTimerDisplay();
      if (state.timeRemaining <= 0) endTimedMode();
    }, 1000);
  }

  function endTimedMode() {
    clearInterval(state.timerInterval);
    state.isTimerRunning = false;
    if (elements.timer) elements.timer.textContent = "Terminé! Score: " + state.score;
  }

  function updateTimerDisplay() {
    if (elements.timer) elements.timer.textContent = state.timeRemaining + "s";
  }

  function updateUI() {
    if (elements.levelValue) elements.levelValue.textContent = state.level;
    if (elements.xpValue) elements.xpValue.textContent = state.xp;
    if (elements.streakValue) elements.streakValue.textContent = state.streak;

    var accuracy = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0;
    if (elements.accuracyValue) elements.accuracyValue.textContent = accuracy + "%";
    if (elements.scoreValue) elements.scoreValue.textContent = state.score;
    if (elements.countValue) elements.countValue.textContent = state.correct + " / " + state.total;
  }

  function updateReviewList() {
    if (!elements.reviewList) return;
    if (state.reviewList.length === 0) {
      elements.reviewList.innerHTML = '<p class="review-empty">Pas d\'erreurs!</p>';
      return;
    }

    elements.reviewList.innerHTML = state.reviewList.slice(0, 10).map(function(item) {
      return '<div class="review-item"><span>' + item.pronoun + '</span> ' +
             '<span class="correct-answer">' + item.correct + '</span> ' +
             '<span class="review-meta">(' + item.verb + ', ' + item.tense + ')</span></div>';
    }).join("");
  }

  function setupEventListeners() {
    document.querySelectorAll(".tab").forEach(function(tab) {
      tab.addEventListener("click", function() {
        var view = tab.dataset.view;
        switchView(view);
      });
    });

    if (elements.submitBtn) elements.submitBtn.addEventListener("click", checkAnswer);
    if (elements.skipBtn) elements.skipBtn.addEventListener("click", skipQuestion);

    if (elements.answerInput) {
      elements.answerInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") checkAnswer();
      });
    }

    document.querySelectorAll(".mode-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        document.querySelectorAll(".mode-btn").forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
        state.mode = btn.dataset.mode;

        if (state.mode === "timed") {
          resetQuizState();
          startTimer();
        } else {
          clearInterval(state.timerInterval);
          if (elements.timer) elements.timer.textContent = "Ready";
        }
      });
    });
  }

  function switchView(viewName) {
    document.querySelectorAll(".tab").forEach(function(tab) {
      tab.classList.toggle("active", tab.dataset.view === viewName);
    });

    document.querySelectorAll(".view").forEach(function(view) {
      view.classList.toggle("active", view.id === viewName);
    });

    if (viewName === "quiz" && elements.answerInput) elements.answerInput.focus();
  }

  function resetQuizState() {
    state.score = 0;
    state.correct = 0;
    state.total = 0;
    state.streak = 0;
    updateUI();
  }

  function saveProgress() {
    var data = {
      xp: state.xp,
      level: state.level,
      maxStreak: state.maxStreak,
      reviewList: state.reviewList,
    };
    localStorage.setItem("tablequizz_progress", JSON.stringify(data));
  }

  function loadProgress() {
    try {
      var data = JSON.parse(localStorage.getItem("tablequizz_progress"));
      if (data) {
        state.xp = data.xp || 0;
        state.level = data.level || 1;
        state.maxStreak = data.maxStreak || 0;
        state.reviewList = data.reviewList || [];
      }
    } catch (e) {
      console.log("No saved progress found");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();

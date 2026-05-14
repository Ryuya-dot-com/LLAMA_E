/* Shared local runner for LLAMA B/D/E 4.0.6-style tasks. */
(() => {
  const config = window.LLAMA_LOCAL_CONFIG;
  if (!config) {
    throw new Error("LLAMA_LOCAL_CONFIG is missing.");
  }

  const ASSET_BASE = config.assetBase || "https://www.llamatests.org/";
  const DEBUG_TIMERS = new URLSearchParams(window.location.search).get("debug") === "1";
  const LANGS = {
    ja: {
      html_lang: "ja",
      language_toggle: "English",
      language_toggle_aria: "Switch language to English",
      version_label: `Version ${config.version || "4.0.6"} local`,
      name_label: "氏名",
      id_label: "ID（1〜80 文字・日本語可）",
      begin: "開始",
      validation_error: "氏名と ID を入力してください。ID は 1〜80 文字で入力できます。",
      participant_label: "受験者:",
      id_display_label: "ID:",
      rotate_alert: "スマートフォンは横向きで操作してください。",
      soundcheck_heading: "音量を確認してください",
      soundcheck_instruction: "再生ボタンを押して、ブラウザから音が聞こえることを確認してください。",
      soundcheck_play: "再生",
      soundcheck_end: "音量確認を終了",
      soundcheck_prompt: "音が聞こえたら「音量確認を終了」を押してください。",
      learn_start_test: "テスト開始",
      test_heading: "テスト",
      next: "次へ",
      end: "終了",
      restart: "もう一度",
      exit_fullscreen: "全画面を終了",
      test_start_prompt: "「次へ」を押してテストを開始してください",
      test_next_prompt: "「次へ」を押して次の項目へ進んでください",
      test_end_prompt: "これでテストは終了です。「終了」を押してください。",
      choose_picture: "対応する絵を選んでください",
      choose_new_repeat: "新しい語か、すでに聞いた語かを選んでください",
      choose_sound: "聞こえた語を選んでください。該当するものがなければ「?」を選んでください。",
      new_word: "新しい語",
      repeated_word: "繰り返し語",
      score_label: " の得点: ",
      thank_you: "ありがとうございました",
      download_note: "結果ファイルをダウンロードしました:",
      timer_initial_2m: "2分00秒",
      time_up: "時間終了",
      audio_error: "音声を再生できませんでした。ブラウザの音量と権限を確認してください。",
      timer_format: (minutes, seconds) => `${minutes}分${pad2(seconds)}秒`
    },
    en: {
      html_lang: "en",
      language_toggle: "日本語",
      language_toggle_aria: "言語を日本語に切り替え",
      version_label: `Version ${config.version || "4.0.6"} local`,
      name_label: "Name",
      id_label: "Identifier (1 to 80 characters; Japanese allowed)",
      begin: "BEGIN",
      validation_error: "Please enter your name and an ID between 1 and 80 characters.",
      participant_label: "Participant:",
      id_display_label: "ID:",
      rotate_alert: "Please rotate your phone.",
      soundcheck_heading: "Check your sound",
      soundcheck_instruction: "Press the play button and confirm that you can hear audio from the browser.",
      soundcheck_play: "Play",
      soundcheck_end: "END SOUNDCHECK",
      soundcheck_prompt: "Press END SOUNDCHECK when you can hear the audio.",
      learn_start_test: "START TEST",
      test_heading: "Test",
      next: "NEXT",
      end: "END",
      restart: "Restart",
      exit_fullscreen: "Exit Full Screen",
      test_start_prompt: "Click NEXT to start the test",
      test_next_prompt: "Click NEXT for the next item",
      test_end_prompt: "This is the end of the test. Click END.",
      choose_picture: "Choose the matching picture",
      choose_new_repeat: "Choose whether the word is new or repeated",
      choose_sound: "Click on the sound you heard, or click ? if none matches.",
      new_word: "NEW WORD",
      repeated_word: "REPEATED WORD",
      score_label: ", you scored ",
      thank_you: "Thank you",
      download_note: "Result file downloaded:",
      timer_initial_2m: "2m 00s",
      time_up: "TIME'S UP",
      audio_error: "The audio could not be played. Check browser sound permissions and volume.",
      timer_format: (minutes, seconds) => `${minutes}m ${pad2(seconds)}s`
    }
  };

  const state = {
    participantName: "",
    identifier: "",
    currentLang: "ja",
    currentPanel: "intro",
    soundcheckStartedAt: null,
    soundcheckEndedAt: null,
    learnStartedAt: null,
    learnEndedAt: null,
    testStartedAt: null,
    testEndedAt: null,
    testStartedPerf: 0,
    currentTrialIndex: 0,
    trialStartedPerf: 0,
    trialStartedAtDates: [],
    trialSavedAtDates: [],
    trialRtMs: [],
    answers: [],
    trialScores: [],
    events: [],
    pageLoadedAt: new Date(),
    pageLoadedPerf: performance.now(),
    learnTimerId: null,
    learnUnlockId: null,
    learnEndId: null,
    nBlur: 0,
    nFocus: 0,
    nVisibilityHidden: 0,
    nFullscreenChange: 0,
    statusKey: "test_start_prompt"
  };

  let els = {};

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function dict() {
    return { ...LANGS[state.currentLang], ...(config.i18n?.[state.currentLang] || {}) };
  }

  function t(key) {
    return dict()[key];
  }

  function assetUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;
    return `${ASSET_BASE}${path}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatTimestamp(date) {
    if (!date) return "";
    return [
      date.getFullYear(),
      pad2(date.getMonth() + 1),
      pad2(date.getDate())
    ].join("-") + " " + [
      pad2(date.getHours()),
      pad2(date.getMinutes()),
      pad2(date.getSeconds())
    ].join(":");
  }

  function formatFileTimestamp(date) {
    if (!date) return "unknown";
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}_${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
  }

  function durationSeconds(startDate, endDate) {
    if (!startDate || !endDate) return "";
    return Math.round((endDate.getTime() - startDate.getTime()) / 1000);
  }

  function isValidIdentifier(value) {
    return value.length >= 1 && value.length <= 80 && !/[\r\n\t]/.test(value);
  }

  function cleanText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function safeFilePart(value, fallback) {
    const cleaned = String(value || "")
      .trim()
      .replace(/[\s/\\:*?"<>|]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    return cleaned || fallback;
  }

  function totalMaxScore() {
    return config.test.items.reduce((sum, item) => sum + (item.maxScore ?? (item.scored === false ? 0 : 1)), 0);
  }

  function scoreAnswer(item, answerId) {
    const max = item.maxScore ?? (item.scored === false ? 0 : 1);
    if (!max) return 0;
    return answerId === item.correct ? max : 0;
  }

  function selectedChoice(answerId) {
    return config.test.choices?.find((choice) => choice.id === answerId) || null;
  }

  function logEvent(eventType, extra = {}) {
    const now = new Date();
    const perfNow = performance.now();
    state.events.push({
      iso: now.toISOString(),
      timestamp: formatTimestamp(now),
      t_since_pageload_ms: Math.round(perfNow - state.pageLoadedPerf),
      t_since_test_start_ms: state.testStartedAt ? Math.round(perfNow - state.testStartedPerf) : "",
      phase: state.currentPanel,
      trial: state.currentTrialIndex || "",
      event: eventType,
      ...extra
    });
  }

  function requestFullscreen() {
    const root = document.documentElement;
    if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
  }

  function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function showPanel(name) {
    state.currentPanel = name;
    document.querySelectorAll(".panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === name);
    });
  }

  function renderParticipantLine() {
    const name = state.participantName || "-";
    const id = state.identifier || "-";
    document.querySelectorAll("[data-participant-line]").forEach((node) => {
      node.innerHTML = `<span data-i18n="participant_label">${escapeHtml(t("participant_label"))}</span> ${escapeHtml(name)} / <span data-i18n="id_display_label">${escapeHtml(t("id_display_label"))}</span> ${escapeHtml(id)}`;
    });
    if (els.resultParticipant) {
      els.resultParticipant.textContent = state.currentLang === "ja" ? name : `${name} `;
    }
    if (els.resultId) {
      els.resultId.textContent = state.currentLang === "ja" ? `（ID: ${id}）` : `(ID: ${id})`;
    }
  }

  function renderLayout() {
    const app = document.getElementById("app");
    const hasSoundcheck = Boolean(config.soundcheck);
    const hasLearn = Boolean(config.learn);
    app.innerHTML = `
      <section class="panel is-active" data-panel="intro">
        <div class="card intro-text">
          <div id="intro-copy"></div>
          <form id="identifier-form" novalidate>
            <div class="form-grid">
              <div class="field">
                <label id="participant-name-label" for="participant-name-input"></label>
                <input id="participant-name-input" name="participant_name" type="text" maxlength="80" autocomplete="name" required>
              </div>
              <div class="field">
                <label id="identifier-label" for="identifier-input"></label>
                <input id="identifier-input" name="identifier" type="text" maxlength="80" autocomplete="off" required>
              </div>
            </div>
            <div class="form-actions">
              <button id="begin-button" type="submit" class="btn btn-primary"></button>
            </div>
            <div id="identifier-error" class="error" role="alert" aria-live="polite"></div>
          </form>
        </div>
      </section>

      ${hasSoundcheck ? `
        <section class="panel" data-panel="soundcheck">
          <div class="card">
            <div class="rotate-alert" data-i18n="rotate_alert"></div>
            <div class="header-row">
              <div class="identifier" data-participant-line></div>
              <div class="timer">Sound</div>
            </div>
            <div class="prompt-stage sound-stage">
              <h2 id="soundcheck-heading"></h2>
              <p id="soundcheck-instruction"></p>
              <button id="soundcheck-play" class="btn sound-button" type="button" aria-label="Play">▶</button>
              <button id="soundcheck-end" class="btn btn-primary btn-wide" type="button" disabled></button>
              <p id="soundcheck-prompt"></p>
            </div>
          </div>
        </section>` : ""}

      ${hasLearn ? `
        <section class="panel" data-panel="learn">
          <div class="card">
            <div class="rotate-alert" data-i18n="rotate_alert"></div>
            <div class="header-row">
              <div class="identifier" data-participant-line></div>
              <div class="timer" id="learn-timer" aria-live="polite"></div>
            </div>
            <h2 id="learn-heading"></h2>
            <p id="learn-instruction"></p>
            <div id="learn-grid"></div>
            <div class="phase-actions">
              <button id="start-test" class="btn btn-primary btn-wide" type="button" disabled></button>
            </div>
          </div>
        </section>` : ""}

      <section class="panel" data-panel="test">
        <div class="card">
          <div class="rotate-alert" data-i18n="rotate_alert"></div>
          <div class="header-row">
            <div id="test-heading" class="identifier"></div>
            <div class="timer" id="progress-display">0 / ${config.test.items.length}</div>
          </div>
          <div class="task-grid">
            <div>
              <div id="prompt-stage" class="prompt-stage"></div>
              <button id="status-output" type="button" class="status-output"></button>
            </div>
            <div>
              <div id="binary-actions" class="binary-actions"></div>
              <div id="choice-grid" class="choice-grid"></div>
              <div class="answer-actions">
                <button id="next" class="btn btn-secondary" type="button"></button>
                <button id="replay" class="btn btn-secondary" type="button" hidden>Replay</button>
                <button id="end" class="btn btn-secondary" type="button" disabled></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel" data-panel="result">
        <div class="card result-card">
          <h2 class="score"><span id="result-participant"></span><span id="result-id"></span><span id="score-label"></span><span id="totalScore">0</span> / <span id="numAnswers">${totalMaxScore()}</span></h2>
          <h2><span id="thank-you-label"></span> (<span id="shorttotal">0</span>/<span id="shortnum">${totalMaxScore()}</span>)</h2>
          <p id="result-description"></p>
          <p id="download-note" class="download-note" aria-live="polite"></p>
          <div class="answer-actions">
            <button id="restart-btn" class="btn btn-secondary" type="button"></button>
            <button type="button" class="btn btn-primary" id="exitfs"></button>
          </div>
        </div>
      </section>
      <audio id="auto-audio" preload="auto"></audio>
      <audio id="preload-audio" preload="auto"></audio>
    `;

    els = {
      title: document.getElementById("test-title"),
      version: document.getElementById("version-label"),
      languageToggle: document.getElementById("language-toggle"),
      footer: document.getElementById("footer-text"),
      introCopy: document.getElementById("intro-copy"),
      identifierForm: document.getElementById("identifier-form"),
      participantNameInput: document.getElementById("participant-name-input"),
      identifierInput: document.getElementById("identifier-input"),
      participantNameLabel: document.getElementById("participant-name-label"),
      identifierLabel: document.getElementById("identifier-label"),
      beginButton: document.getElementById("begin-button"),
      identifierError: document.getElementById("identifier-error"),
      soundcheckHeading: document.getElementById("soundcheck-heading"),
      soundcheckInstruction: document.getElementById("soundcheck-instruction"),
      soundcheckPlay: document.getElementById("soundcheck-play"),
      soundcheckEnd: document.getElementById("soundcheck-end"),
      soundcheckPrompt: document.getElementById("soundcheck-prompt"),
      learnTimer: document.getElementById("learn-timer"),
      learnHeading: document.getElementById("learn-heading"),
      learnInstruction: document.getElementById("learn-instruction"),
      learnGrid: document.getElementById("learn-grid"),
      startTest: document.getElementById("start-test"),
      testHeading: document.getElementById("test-heading"),
      progressDisplay: document.getElementById("progress-display"),
      promptStage: document.getElementById("prompt-stage"),
      statusOutput: document.getElementById("status-output"),
      binaryActions: document.getElementById("binary-actions"),
      choiceGrid: document.getElementById("choice-grid"),
      next: document.getElementById("next"),
      replay: document.getElementById("replay"),
      end: document.getElementById("end"),
      resultParticipant: document.getElementById("result-participant"),
      resultId: document.getElementById("result-id"),
      scoreLabel: document.getElementById("score-label"),
      totalScore: document.getElementById("totalScore"),
      numAnswers: document.getElementById("numAnswers"),
      thankYouLabel: document.getElementById("thank-you-label"),
      shortTotal: document.getElementById("shorttotal"),
      shortNum: document.getElementById("shortnum"),
      resultDescription: document.getElementById("result-description"),
      downloadNote: document.getElementById("download-note"),
      restartBtn: document.getElementById("restart-btn"),
      exitFullscreenBtn: document.getElementById("exitfs"),
      autoAudio: document.getElementById("auto-audio"),
      preloadAudio: document.getElementById("preload-audio")
    };
  }

  function applyLanguage() {
    document.documentElement.lang = t("html_lang");
    document.title = `${config.displayTitle || config.testCode.replace("_", " ")} ${config.version || "4.0.6"} local`;
    if (els.title) els.title.textContent = config.displayTitle || config.testCode.replace("_", " ");
    if (els.version) els.version.textContent = t("version_label");
    if (els.languageToggle) {
      els.languageToggle.textContent = t("language_toggle");
      els.languageToggle.setAttribute("aria-label", t("language_toggle_aria"));
    }
    if (els.footer) els.footer.textContent = t("footer");
    els.participantNameLabel.textContent = t("name_label");
    els.identifierLabel.textContent = t("id_label");
    els.beginButton.textContent = t("begin");
    if (els.soundcheckHeading) els.soundcheckHeading.textContent = t("soundcheck_heading");
    if (els.soundcheckInstruction) els.soundcheckInstruction.textContent = t("soundcheck_instruction");
    if (els.soundcheckEnd) els.soundcheckEnd.textContent = t("soundcheck_end");
    if (els.soundcheckPrompt) els.soundcheckPrompt.textContent = t("soundcheck_prompt");
    if (els.learnHeading) els.learnHeading.textContent = t("learn_heading");
    if (els.learnInstruction) els.learnInstruction.textContent = t("learn_instruction");
    if (els.startTest) els.startTest.textContent = t("learn_start_test");
    els.testHeading.textContent = t("test_heading");
    els.next.textContent = t("next");
    els.end.textContent = t("end");
    els.replay.textContent = "Replay";
    els.replay.hidden = true;
    els.scoreLabel.textContent = t("score_label");
    els.thankYouLabel.textContent = t("thank_you");
    els.resultDescription.textContent = t("result_description");
    els.restartBtn.textContent = t("restart");
    els.exitFullscreenBtn.textContent = t("exit_fullscreen");
    document.querySelectorAll("[data-i18n='rotate_alert']").forEach((node) => {
      node.textContent = t("rotate_alert");
    });
    els.introCopy.innerHTML = (t("intro") || []).map((line) => `<p>${line}</p>`).join("");
    if (!state.learnStartedAt && els.learnTimer) els.learnTimer.textContent = t("timer_initial_2m");
    renderParticipantLine();
    renderTestStatus();
    buildBinaryActions();
    buildChoices();
  }

  function setLanguage(lang) {
    if (lang !== "ja" && lang !== "en") return;
    state.currentLang = lang;
    applyLanguage();
    logEvent("language_change", { detail: lang });
  }

  function buildLearnGrid() {
    if (!config.learn || !els.learnGrid) return;
    els.learnGrid.innerHTML = "";
    els.learnGrid.className = config.learn.mode === "audioButtons" ? "audio-grid" : "learn-grid";

    config.learn.items.forEach((item) => {
      if (config.learn.mode === "audioButtons") {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "audio-item";
        button.textContent = item.label;
        button.addEventListener("click", () => {
          playAudio(item.src, "learn_audio_play", { item_id: item.id, detail: item.label });
        });
        els.learnGrid.appendChild(button);
        return;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "learn-item";
      button.innerHTML = `
        <img src="${assetUrl(item.src)}" alt="${escapeHtml(item.word)}" width="80" height="80">
        <span class="learn-label">${escapeHtml(item.word)}</span>
      `;
      let revealTimeout = null;
      button.addEventListener("click", () => {
        button.classList.add("is-revealed");
        clearTimeout(revealTimeout);
        revealTimeout = window.setTimeout(() => button.classList.remove("is-revealed"), 1400);
        logEvent("learn_item_reveal", { item_id: item.id, detail: item.word });
      });
      els.learnGrid.appendChild(button);
    });
  }

  function buildBinaryActions() {
    els.binaryActions.innerHTML = "";
    if (config.test.mode !== "newRepeat") return;

    [
      { id: "N", label: t("new_word") },
      { id: "R", label: t("repeated_word") }
    ].forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-secondary";
      button.dataset.id = choice.id;
      button.textContent = choice.label;
      button.disabled = true;
      button.addEventListener("click", () => saveAnswer(choice.id, choice.label));
      els.binaryActions.appendChild(button);
    });
  }

  function buildChoices() {
    els.choiceGrid.innerHTML = "";
    els.choiceGrid.className = `choice-grid${config.test.choiceColumns === 7 ? " cols-7" : ""}`;
    if (!config.test.choices || config.test.mode === "newRepeat") return;

    config.test.choices.forEach((choice) => {
      if (choice.blank) {
        const blank = document.createElement("div");
        blank.className = "blank-cell";
        els.choiceGrid.appendChild(blank);
        return;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = config.test.choiceType === "text" ? "audio-item" : "choice-item";
      button.dataset.id = choice.id;
      button.disabled = true;
      if (choice.src) {
        button.innerHTML = `<img src="${assetUrl(choice.src)}" alt="${escapeHtml(choice.word || choice.id)}" width="80" height="80">`;
      } else {
        button.textContent = choice.label || choice.word || choice.id;
      }
      button.addEventListener("click", () => saveAnswer(choice.id, choice.word || choice.label || choice.id));
      els.choiceGrid.appendChild(button);
    });
  }

  function setChoiceEnabled(enabled) {
    els.choiceGrid.querySelectorAll("button").forEach((button) => {
      button.disabled = !enabled;
      button.classList.remove("is-selected");
    });
    els.binaryActions.querySelectorAll("button").forEach((button) => {
      button.disabled = !enabled;
      button.classList.remove("is-selected");
    });
  }

  function markSelected(answerId) {
    document.querySelectorAll("[data-id]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.id === answerId);
    });
  }

  async function playAudio(src, eventName = "audio_play", extra = {}) {
    if (!src) return;
    els.autoAudio.src = assetUrl(src);
    els.autoAudio.currentTime = 0;
    try {
      await els.autoAudio.play();
      logEvent(eventName, { stimulus_src: assetUrl(src), ...extra });
    } catch (error) {
      els.statusOutput.textContent = t("audio_error");
      logEvent("audio_play_error", { stimulus_src: assetUrl(src), detail: error.message || String(error), ...extra });
    }
  }

  function preloadTrial(index) {
    const item = config.test.items[index];
    if (item?.src) els.preloadAudio.src = assetUrl(item.src);
  }

  function startSoundcheck() {
    state.soundcheckStartedAt = new Date();
    if (els.soundcheckEnd) els.soundcheckEnd.disabled = true;
    showPanel("soundcheck");
    logEvent("soundcheck_start");
  }

  function endSoundcheck() {
    state.soundcheckEndedAt = new Date();
    els.autoAudio.pause();
    els.autoAudio.removeAttribute("src");
    logEvent("soundcheck_end");
    if (config.learn) startLearnPhase();
    else startTestPhase();
  }

  function startLearnPhase() {
    clearInterval(state.learnTimerId);
    clearTimeout(state.learnUnlockId);
    clearTimeout(state.learnEndId);
    state.learnStartedAt = new Date();
    state.learnEndedAt = null;
    if (els.startTest) els.startTest.disabled = true;
    buildLearnGrid();
    showPanel("learn");
    logEvent("learn_phase_start");

    const totalMs = DEBUG_TIMERS ? 1200 : (config.learn.durationMs || 120000);
    const unlockMs = DEBUG_TIMERS ? 250 : (config.learn.unlockMs || 60000);
    const start = state.learnStartedAt.getTime();
    const unlockAt = start + unlockMs;
    const endAt = start + totalMs;

    state.learnUnlockId = window.setTimeout(() => {
      if (els.startTest) els.startTest.disabled = false;
    }, unlockMs);

    state.learnEndId = window.setTimeout(() => {
      if (els.learnTimer) els.learnTimer.textContent = t("time_up");
      if (els.startTest) els.startTest.disabled = false;
      if (!state.learnEndedAt) {
        state.learnEndedAt = new Date();
        logEvent("learn_timeout");
      }
    }, totalMs);

    const updateTimer = () => {
      const remaining = Math.max(0, endAt - Date.now());
      if (Date.now() >= unlockAt && els.startTest) els.startTest.disabled = false;
      if (remaining === 0) {
        clearInterval(state.learnTimerId);
        return;
      }
      const totalSeconds = Math.ceil(remaining / 1000);
      els.learnTimer.textContent = t("timer_format")(Math.floor(totalSeconds / 60), totalSeconds % 60);
    };
    updateTimer();
    state.learnTimerId = window.setInterval(updateTimer, 250);
  }

  function startTestPhase() {
    clearInterval(state.learnTimerId);
    clearTimeout(state.learnUnlockId);
    clearTimeout(state.learnEndId);
    if (config.learn && !state.learnEndedAt) {
      state.learnEndedAt = new Date();
      logEvent("learn_phase_end");
    }
    state.testStartedAt = new Date();
    state.testStartedPerf = performance.now();
    state.testEndedAt = null;
    state.currentTrialIndex = 0;
    state.trialStartedPerf = 0;
    state.answers = [];
    state.trialScores = [];
    state.trialRtMs = [];
    state.trialStartedAtDates = [];
    state.trialSavedAtDates = [];
    state.statusKey = "test_start_prompt";
    setChoiceEnabled(false);
    els.next.disabled = false;
    els.end.disabled = true;
    els.replay.disabled = true;
    updateProgress();
    renderTestStatus();
    showPanel("test");
    preloadTrial(0);
    logEvent("test_phase_start");
  }

  function updateProgress() {
    els.progressDisplay.textContent = `${state.currentTrialIndex} / ${config.test.items.length}`;
  }

  function currentItem() {
    if (state.currentTrialIndex < 1) return null;
    return config.test.items[state.currentTrialIndex - 1] || null;
  }

  function renderPromptForItem(item) {
    if (!item) {
      els.promptStage.innerHTML = `<h2>${escapeHtml(t("test_heading"))}</h2>`;
      return;
    }

    if (config.test.mode === "imageChoice") {
      els.promptStage.innerHTML = `<h2>${escapeHtml(item.prompt)}</h2>`;
      return;
    }

    els.promptStage.innerHTML = `
      <button id="trial-play" type="button" class="btn sound-button" aria-label="Replay">▶</button>
      <h2>${escapeHtml(item.prompt || `#${state.currentTrialIndex}`)}</h2>
    `;
    document.getElementById("trial-play").addEventListener("click", () => {
      playAudio(item.src, "trial_audio_replay", { item_id: item.id });
    });
  }

  function renderTestStatus() {
    const item = currentItem();
    if (!item) {
      els.promptStage.innerHTML = `<h2>${escapeHtml(t("test_heading"))}</h2>`;
      els.statusOutput.textContent = t("test_start_prompt");
      return;
    }
    renderPromptForItem(item);
    if (state.statusKey) els.statusOutput.textContent = t(state.statusKey);
  }

  function showNextTrial() {
    if (state.currentTrialIndex >= config.test.items.length) return;
    state.currentTrialIndex += 1;
    const item = currentItem();
    state.trialStartedPerf = performance.now();
    state.trialStartedAtDates[state.currentTrialIndex - 1] = new Date();
    state.statusKey = config.test.mode === "imageChoice"
      ? "choose_picture"
      : config.test.mode === "newRepeat"
        ? "choose_new_repeat"
        : "choose_sound";
    els.next.disabled = true;
    els.end.disabled = true;
    els.replay.disabled = true;
    setChoiceEnabled(true);
    updateProgress();
    renderTestStatus();
    logEvent("trial_shown", { item_id: item.id, stimulus_src: item.src ? assetUrl(item.src) : "" });
    if (item.src) playAudio(item.src, "trial_audio_play", { item_id: item.id });
  }

  function saveAnswer(answerId, answerText) {
    const item = currentItem();
    if (!item) return;
    const index = state.currentTrialIndex - 1;
    if (state.answers[index]) return;

    const rt = state.trialStartedPerf ? Math.round(performance.now() - state.trialStartedPerf) : "";
    state.trialSavedAtDates[index] = new Date();
    state.trialRtMs[index] = rt;
    state.answers[index] = { id: answerId, text: answerText };
    state.trialScores[index] = scoreAnswer(item, answerId);
    markSelected(answerId);
    setChoiceEnabled(false);
    logEvent("answer_click", {
      item_id: item.id,
      choice: answerId,
      rt_ms: rt,
      answer_text: answerText,
      correct_id: item.correct,
      score: state.trialScores[index]
    });

    if (state.currentTrialIndex >= config.test.items.length) {
      state.statusKey = "test_end_prompt";
      els.next.disabled = true;
      els.end.disabled = false;
    } else {
      state.statusKey = "test_next_prompt";
      els.next.disabled = false;
      els.end.disabled = true;
      preloadTrial(state.currentTrialIndex);
    }
    renderTestStatus();
  }

  function calculateScores() {
    state.trialScores = config.test.items.map((item, index) => {
      return scoreAnswer(item, state.answers[index]?.id || "");
    });
    return state.trialScores.reduce((sum, value) => sum + value, 0);
  }

  function toCsvValue(value) {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
    return text;
  }

  function aoaToCsv(rows) {
    return rows.map((row) => row.map(toCsvValue).join(",")).join("\n");
  }

  function buildMetaRows(score) {
    const total = totalMaxScore();
    return [
      ["field", "value"],
      ["participant_name", state.participantName],
      ["experiment_id", state.identifier],
      ["source_version", `${config.testCode}_${config.version || "4.0.6"}_local`],
      ["official_reference", config.officialUrl],
      ["soundcheck_start", formatTimestamp(state.soundcheckStartedAt)],
      ["soundcheck_end", formatTimestamp(state.soundcheckEndedAt)],
      ["learn_start", formatTimestamp(state.learnStartedAt)],
      ["learn_end", formatTimestamp(state.learnEndedAt)],
      ["test_start", formatTimestamp(state.testStartedAt)],
      ["test_end", formatTimestamp(state.testEndedAt)],
      ["soundcheck_duration_s", durationSeconds(state.soundcheckStartedAt, state.soundcheckEndedAt)],
      ["learn_duration_s", durationSeconds(state.learnStartedAt, state.learnEndedAt)],
      ["test_duration_s", durationSeconds(state.testStartedAt, state.testEndedAt)],
      ["score", score],
      ["total", total],
      ["score_pct", total ? Math.round((score / total) * 1000) / 10 : ""],
      ["language_at_completion", state.currentLang],
      ["n_window_blur", state.nBlur],
      ["n_window_focus", state.nFocus],
      ["n_visibility_hidden", state.nVisibilityHidden],
      ["n_fullscreen_change", state.nFullscreenChange],
      ["user_agent", navigator.userAgent || ""]
    ];
  }

  function buildTrialsRows() {
    const rows = [[
      "trial", "item_id", "scored", "trial_start", "answer_saved_at",
      "prompt", "answer_id", "answer_text", "correct_id", "correct_text",
      "score", "max_score", "rt_ms", "stimulus_src", "choice_src"
    ]];

    config.test.items.forEach((item, index) => {
      const answer = state.answers[index] || { id: "", text: "" };
      const choice = selectedChoice(answer.id);
      const max = item.maxScore ?? (item.scored === false ? 0 : 1);
      rows.push([
        index + 1,
        item.id,
        max > 0 ? 1 : 0,
        formatTimestamp(state.trialStartedAtDates[index]),
        formatTimestamp(state.trialSavedAtDates[index]),
        item.prompt || "",
        answer.id,
        answer.text,
        item.correct || "",
        item.correctText || "",
        state.trialScores[index] ?? scoreAnswer(item, answer.id),
        max,
        state.trialRtMs[index] ?? "",
        item.src ? assetUrl(item.src) : "",
        choice?.src ? assetUrl(choice.src) : ""
      ]);
    });
    return rows;
  }

  function buildWideRows(score) {
    const total = totalMaxScore();
    const ids = config.test.items.map((item) => item.id);
    const header = [
      "participant_name", "experiment_id", "score", "total", "score_pct",
      "soundcheck_duration_s", "learn_duration_s", "test_duration_s",
      ...ids.map((id) => `score_${id}`),
      ...ids.map((id) => `answer_id_${id}`),
      ...ids.map((id) => `rt_ms_${id}`)
    ];
    const row = [
      state.participantName, state.identifier, score, total, total ? Math.round((score / total) * 1000) / 10 : "",
      durationSeconds(state.soundcheckStartedAt, state.soundcheckEndedAt),
      durationSeconds(state.learnStartedAt, state.learnEndedAt),
      durationSeconds(state.testStartedAt, state.testEndedAt),
      ...ids.map((_, index) => state.trialScores[index] ?? ""),
      ...ids.map((_, index) => state.answers[index]?.id || ""),
      ...ids.map((_, index) => state.trialRtMs[index] ?? "")
    ];
    return [header, row];
  }

  function buildEventsRows() {
    const rows = [[
      "iso", "timestamp", "t_since_pageload_ms", "t_since_test_start_ms",
      "phase", "trial", "event", "item_id", "choice", "rt_ms",
      "answer_text", "correct_id", "score", "stimulus_src", "detail"
    ]];
    state.events.forEach((event) => {
      rows.push([
        event.iso,
        event.timestamp,
        event.t_since_pageload_ms,
        event.t_since_test_start_ms,
        event.phase,
        event.trial,
        event.event,
        event.item_id || "",
        event.choice || "",
        event.rt_ms ?? "",
        event.answer_text || "",
        event.correct_id || "",
        event.score ?? "",
        event.stimulus_src || "",
        event.detail || ""
      ]);
    });
    return rows;
  }

  function triggerDownload(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadResults(score) {
    const endedAt = state.testEndedAt || new Date();
    const timestamp = formatFileTimestamp(endedAt);
    const safeId = safeFilePart(state.identifier, "participant");
    const metaRows = buildMetaRows(score);
    const wideRows = buildWideRows(score);
    const trialRows = buildTrialsRows();
    const eventRows = buildEventsRows();
    let files;

    if (typeof XLSX !== "undefined" && XLSX?.utils && XLSX?.write) {
      const filename = `${config.testCode}_${safeId}_${timestamp}.xlsx`;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(metaRows), "Meta");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(wideRows), "Wide");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(trialRows), "Trials");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(eventRows), "Events");
      const out = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      triggerDownload(filename, new Blob([out], { type: "application/octet-stream" }));
      files = [filename];
    } else {
      const filename = `${config.testCode}_${safeId}_${timestamp}.csv`;
      const eventsFilename = `${config.testCode}_${safeId}_${timestamp}_events.csv`;
      const csv = [aoaToCsv(metaRows), "", aoaToCsv(wideRows), "", aoaToCsv(trialRows)].join("\n");
      triggerDownload(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
      triggerDownload(eventsFilename, new Blob([aoaToCsv(eventRows)], { type: "text/csv;charset=utf-8" }));
      files = [filename, eventsFilename];
    }

    els.downloadNote.innerHTML = `${t("download_note")}<br>${files.map((file) => `&nbsp;&nbsp;<code>${escapeHtml(file)}</code>`).join("<br>")}`;
  }

  function showResults() {
    state.testEndedAt = new Date();
    logEvent("test_phase_end");
    const score = calculateScores();
    const total = totalMaxScore();
    els.totalScore.textContent = score;
    els.numAnswers.textContent = total;
    els.shortTotal.textContent = score;
    els.shortNum.textContent = total;
    renderParticipantLine();
    showPanel("result");
    downloadResults(score);
  }

  function resetAll() {
    clearInterval(state.learnTimerId);
    clearTimeout(state.learnUnlockId);
    clearTimeout(state.learnEndId);
    state.participantName = "";
    state.identifier = "";
    state.soundcheckStartedAt = null;
    state.soundcheckEndedAt = null;
    state.learnStartedAt = null;
    state.learnEndedAt = null;
    state.testStartedAt = null;
    state.testEndedAt = null;
    state.testStartedPerf = 0;
    state.currentTrialIndex = 0;
    state.trialStartedPerf = 0;
    state.trialStartedAtDates = [];
    state.trialSavedAtDates = [];
    state.trialRtMs = [];
    state.answers = [];
    state.trialScores = [];
    state.events = [];
    state.nBlur = 0;
    state.nFocus = 0;
    state.nVisibilityHidden = 0;
    state.nFullscreenChange = 0;
    state.statusKey = "test_start_prompt";
    els.participantNameInput.value = "";
    els.identifierInput.value = "";
    els.identifierError.textContent = "";
    if (els.learnTimer) els.learnTimer.textContent = t("timer_initial_2m");
    if (els.startTest) els.startTest.disabled = true;
    if (els.soundcheckEnd) els.soundcheckEnd.disabled = true;
    els.downloadNote.innerHTML = "";
    els.totalScore.textContent = "0";
    els.numAnswers.textContent = totalMaxScore();
    els.shortTotal.textContent = "0";
    els.shortNum.textContent = totalMaxScore();
    els.next.disabled = false;
    els.end.disabled = true;
    els.replay.disabled = true;
    updateProgress();
    renderParticipantLine();
    renderTestStatus();
    setChoiceEnabled(false);
    showPanel("intro");
  }

  function handleIdentifierSubmit(event) {
    event.preventDefault();
    const name = cleanText(els.participantNameInput.value);
    const id = cleanText(els.identifierInput.value);
    els.participantNameInput.value = name;
    els.identifierInput.value = id;

    if (!name || !isValidIdentifier(id)) {
      els.identifierError.textContent = t("validation_error");
      if (!name) els.participantNameInput.focus();
      else els.identifierInput.focus();
      return;
    }

    state.participantName = name;
    state.identifier = id;
    els.identifierError.textContent = "";
    renderParticipantLine();
    logEvent("participant_registered");
    requestFullscreen();

    if (config.soundcheck) startSoundcheck();
    else if (config.learn) startLearnPhase();
    else startTestPhase();
  }

  function attachEvents() {
    els.languageToggle.addEventListener("click", () => {
      setLanguage(state.currentLang === "ja" ? "en" : "ja");
    });
    els.identifierForm.addEventListener("submit", handleIdentifierSubmit);
    els.identifierInput.addEventListener("input", () => {
      if (els.identifierError.textContent) els.identifierError.textContent = "";
    });
    els.participantNameInput.addEventListener("input", () => {
      if (els.identifierError.textContent) els.identifierError.textContent = "";
    });
    if (els.soundcheckPlay) {
      els.soundcheckPlay.addEventListener("click", () => {
        playAudio(config.soundcheck.src, "soundcheck_play");
        els.soundcheckEnd.disabled = false;
      });
    }
    if (els.soundcheckEnd) els.soundcheckEnd.addEventListener("click", endSoundcheck);
    if (els.startTest) els.startTest.addEventListener("click", startTestPhase);
    els.next.addEventListener("click", showNextTrial);
    els.replay.addEventListener("click", () => {
      const item = currentItem();
      if (item?.src) playAudio(item.src, "trial_audio_replay", { item_id: item.id });
    });
    els.end.addEventListener("click", showResults);
    els.restartBtn.addEventListener("click", resetAll);
    els.exitFullscreenBtn.addEventListener("click", exitFullscreen);

    window.addEventListener("blur", () => {
      state.nBlur += 1;
      logEvent("window_blur");
    });
    window.addEventListener("focus", () => {
      state.nFocus += 1;
      logEvent("window_focus");
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") state.nVisibilityHidden += 1;
      logEvent("visibility_change", { detail: document.visibilityState });
    });
    document.addEventListener("fullscreenchange", () => {
      state.nFullscreenChange += 1;
      logEvent("fullscreen_change", { detail: document.fullscreenElement ? "entered" : "exited" });
    });
  }

  function init() {
    renderLayout();
    buildLearnGrid();
    buildBinaryActions();
    buildChoices();
    applyLanguage();
    attachEvents();
    resetAll();
  }

  init();
})();

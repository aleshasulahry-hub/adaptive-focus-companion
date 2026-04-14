const SESSION_KEY = "afc_sessions";
const CURRENT_KEY = "afc_current_session";
const THEME_KEY = "afc_theme";
const DISTRACTION_KEY = "afc_minimal_mode";

let timerInterval = null;
let timeLeft = 0;
let timerRunning = false;

document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme();
  setupThemeToggle();
  setupCheckinPage();
  setupDashboardPage();
  setupInsightsPage();
  setupDistractionMode();
});

function applySavedTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
}

function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  });
}

function setupCheckinPage() {
  const focus = document.getElementById("focus");
  const stress = document.getElementById("stress");
  const alertness = document.getElementById("alertness");

  if (!focus || !stress || !alertness) return;

  const focusValue = document.getElementById("focusValue");
  const stressValue = document.getElementById("stressValue");
  const alertnessValue = document.getElementById("alertnessValue");
  const recommendedTime = document.getElementById("recommendedTime");
  const supportMessage = document.getElementById("supportMessage");
  const checkinSuggestions = document.getElementById("checkinSuggestions");
  const startBtn = document.getElementById("startSessionBtn");
  const resetBtn = document.getElementById("resetCheckinBtn");

  function updateCheckinDisplay() {
    focusValue.textContent = focus.value;
    stressValue.textContent = stress.value;
    alertnessValue.textContent = alertness.value;

    const data = buildSessionData(
      Number(focus.value),
      Number(stress.value),
      Number(alertness.value)
    );

    recommendedTime.textContent = `${data.minutes} minutes`;
    supportMessage.textContent = data.message;

    checkinSuggestions.innerHTML = "";
    data.suggestions.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      checkinSuggestions.appendChild(li);
    });
  }

  [focus, stress, alertness].forEach((slider) => {
    slider.addEventListener("input", updateCheckinDisplay);
  });

  startBtn.addEventListener("click", () => {
    const data = buildSessionData(
      Number(focus.value),
      Number(stress.value),
      Number(alertness.value)
    );

    data.createdAt = new Date().toLocaleString();
    localStorage.setItem(CURRENT_KEY, JSON.stringify(data));

    const sessions = getSavedSessions();
    sessions.unshift(data);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));

    window.location.href = "dashboard.html";
  });

  resetBtn.addEventListener("click", () => {
    focus.value = 3;
    stress.value = 3;
    alertness.value = 3;
    updateCheckinDisplay();
  });

  updateCheckinDisplay();
}

function buildSessionData(focus, stress, alertness) {
  let minutes = 25;

  minutes += (focus - 3) * 5;
  minutes -= (stress - 3) * 3;
  minutes += (alertness - 3) * 2;

  if (minutes < 10) minutes = 10;
  if (minutes > 60) minutes = 60;

  let message = "";
  let suggestions = [];
  let tags = [];

  if (stress >= 4 && alertness <= 2) {
    message = "You may benefit from a shorter session with a gentle pace.";
    suggestions = [
      "Try a 1 minute breathing reset",
      "Lower screen brightness",
      "Do one task at a time"
    ];
    tags = ["Fatigued", "Overstimulated"];
  } else if (focus >= 4 && alertness >= 4 && stress <= 3) {
    message = "You seem ready for a stronger focus block right now.";
    suggestions = [
      "Start with your hardest task",
      "Silence extra notifications",
      "Plan a short break after the session"
    ];
    tags = ["Focused", "Steady"];
  } else if (stress >= 4) {
    message = "Your stress seems elevated. Keep the session simple and manageable.";
    suggestions = [
      "Write down one clear task",
      "Keep water nearby",
      "Pause for a stretch halfway through"
    ];
    tags = ["Stressed", "Cautious"];
  } else if (alertness <= 2) {
    message = "Your alertness seems low, so a shorter session may work better.";
    suggestions = [
      "Stand up before starting",
      "Use brighter lighting",
      "Choose a lighter task first"
    ];
    tags = ["Low Energy", "Gentle Start"];
  } else {
    message = "You seem fairly balanced right now. A steady focus session may work well.";
    suggestions = [
      "Keep water nearby",
      "Begin with your most important task",
      "Take a short break afterward"
    ];
    tags = ["Balanced", "Steady"];
  }

  return {
    focus,
    stress,
    alertness,
    minutes,
    message,
    suggestions,
    tags
  };
}

function setupDashboardPage() {
  const timerDisplay = document.getElementById("timerDisplay");
  if (!timerDisplay) return;

  const dashboardSessionLength = document.getElementById("dashboardSessionLength");
  const dashboardReason = document.getElementById("dashboardReason");
  const stateTagOne = document.getElementById("stateTagOne");
  const stateTagTwo = document.getElementById("stateTagTwo");
  const dashboardSuggestions = document.getElementById("dashboardSuggestions");
  const sessionStatus = document.getElementById("sessionStatus");

  const beginTimerBtn = document.getElementById("beginTimerBtn");
  const pauseTimerBtn = document.getElementById("pauseTimerBtn");
  const resetTimerBtn = document.getElementById("resetTimerBtn");

  const session = JSON.parse(localStorage.getItem(CURRENT_KEY));

  if (session) {
    dashboardSessionLength.textContent = `${session.minutes} min`;
    dashboardReason.textContent = session.message;
    stateTagOne.textContent = session.tags[0] || "Balanced";
    stateTagTwo.textContent = session.tags[1] || "Steady";

    dashboardSuggestions.innerHTML = "";
    session.suggestions.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      dashboardSuggestions.appendChild(li);
    });

    timeLeft = session.minutes * 60;
  } else {
    dashboardSessionLength.textContent = "25 min";
    dashboardReason.textContent = "No recent check-in found. Using default focus session.";
    stateTagOne.textContent = "Balanced";
    stateTagTwo.textContent = "Default";
    timeLeft = 25 * 60;
  }

  updateTimerDisplay(timerDisplay);

  beginTimerBtn.addEventListener("click", () => {
    if (timerRunning) return;

    timerRunning = true;
    sessionStatus.textContent = "Session in progress...";

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay(timerDisplay);

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        sessionStatus.textContent = "Session complete. Take a break, stretch, or hydrate.";
        alert("Session complete! Take a short break.");
      }
    }, 1000);
  });

  pauseTimerBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerRunning = false;
    sessionStatus.textContent = "Session paused.";
  });

  resetTimerBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerRunning = false;
    const session = JSON.parse(localStorage.getItem(CURRENT_KEY));
    timeLeft = session ? session.minutes * 60 : 25 * 60;
    updateTimerDisplay(timerDisplay);
    sessionStatus.textContent = "Timer reset.";
  });
}

function updateTimerDisplay(timerDisplay) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  timerDisplay.textContent =
    `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function setupInsightsPage() {
  const totalSessions = document.getElementById("totalSessions");
  if (!totalSessions) return;

  const avgFocus = document.getElementById("avgFocus");
  const avgStress = document.getElementById("avgStress");
  const avgAlertness = document.getElementById("avgAlertness");
  const avgMinutes = document.getElementById("avgMinutes");
  const insightRecommendations = document.getElementById("insightRecommendations");
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  const sessions = getSavedSessions();

  totalSessions.textContent = sessions.length;

  if (sessions.length === 0) {
    avgFocus.textContent = "0";
    avgStress.textContent = "0";
    avgAlertness.textContent = "0";
    avgMinutes.textContent = "0 min";
    return;
  }

  const focusAvg = averageOf(sessions, "focus");
  const stressAvg = averageOf(sessions, "stress");
  const alertnessAvg = averageOf(sessions, "alertness");
  const minutesAvg = averageOf(sessions, "minutes");

  avgFocus.textContent = focusAvg.toFixed(1);
  avgStress.textContent = stressAvg.toFixed(1);
  avgAlertness.textContent = alertnessAvg.toFixed(1);
  avgMinutes.textContent = `${minutesAvg.toFixed(1)} min`;

  insightRecommendations.innerHTML = "";

  if (focusAvg >= 4 && stressAvg <= 3) {
    addListItem(insightRecommendations, "You seem to work best when your focus is already high.");
  }
  if (stressAvg >= 4) {
    addListItem(insightRecommendations, "Your stress levels often run high. Consider shorter sessions more often.");
  }
  if (alertnessAvg <= 2.5) {
    addListItem(insightRecommendations, "Your alertness trends low. Earlier sessions may help.");
  }
  if (minutesAvg > 35) {
    addListItem(insightRecommendations, "Longer sessions appear often. Make sure to schedule breaks between them.");
  }
  if (insightRecommendations.children.length === 0) {
    addListItem(insightRecommendations, "Your sessions look fairly balanced overall. Keep using a steady pace.");
  }

  historyList.innerHTML = "";
  sessions.slice(0, 8).forEach((session) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <p><strong>Date:</strong> ${session.createdAt || "Recent session"}</p>
      <p><strong>Focus:</strong> ${session.focus} | <strong>Stress:</strong> ${session.stress} | <strong>Alertness:</strong> ${session.alertness}</p>
      <p><strong>Recommended session:</strong> ${session.minutes} minutes</p>
      <p><strong>Support message:</strong> ${session.message}</p>
    `;
    historyList.appendChild(item);
  });

  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CURRENT_KEY);
    location.reload();
  });
}

function addListItem(list, text) {
  const li = document.createElement("li");
  li.textContent = text;
  list.appendChild(li);
}

function averageOf(array, key) {
  const total = array.reduce((sum, item) => sum + Number(item[key] || 0), 0);
  return total / array.length;
}

function getSavedSessions() {
  return JSON.parse(localStorage.getItem(SESSION_KEY)) || [];
}

function setupDistractionMode() {
  const toggle = document.getElementById("distractionToggle");
  const isDashboardPage = window.location.pathname.includes("dashboard.html");

  if (!isDashboardPage) {
    document.body.classList.remove("minimal-mode");
    return;
  }

  const savedMode = localStorage.getItem(DISTRACTION_KEY);

  if (savedMode === "on") {
    document.body.classList.add("minimal-mode");
  }

  if (!toggle) return;

  toggle.checked = savedMode === "on";

  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      document.body.classList.add("minimal-mode");
      localStorage.setItem(DISTRACTION_KEY, "on");
    } else {
      document.body.classList.remove("minimal-mode");
      localStorage.setItem(DISTRACTION_KEY, "off");
    }
  });
}
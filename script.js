const SESSION_KEY = "afc_sessions";
const CURRENT_KEY = "afc_current_session";
const THEME_KEY = "afc_theme";
const STREAK_KEY = "afc_streak_data";

let timerInterval = null;
let timeLeft = 25 * 60;
let timerRunning = false;
let totalTime = 25 * 60;

const encouragementMessages = [
  "A calm start is still a strong start.",
  "You do not need perfect energy to make progress.",
  "Small focused steps still count.",
  "Steady effort builds real consistency.",
  "A gentle pace can still be productive.",
  "Progress feels better when you work with your energy, not against it.",
  "Even one focused block can move things forward.",
  "Reset, refocus, and keep going."
];

document.addEventListener("DOMContentLoaded", () => {
  clearOldAfcStorage();
  applySavedTheme();
  setupThemeToggle();
  setupCheckinPage();
  setupDashboardPage();
  setupInsightsPage();
});

function clearOldAfcStorage() {
  localStorage.removeItem("afc_minimal_mode");
}

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
  const focusStateText = document.getElementById("focusStateText");
  const sessionIntensity = document.getElementById("sessionIntensity");
  const encouragementText = document.getElementById("encouragementText");
  const smartBreakPreview = document.getElementById("smartBreakPreview"); // NEW

  function updateCheckinDisplay() {
    const currentFocus = Number(focus.value);
    const currentStress = Number(stress.value);
    const currentAlertness = Number(alertness.value);

    focusValue.textContent = currentFocus;
    stressValue.textContent = currentStress;
    alertnessValue.textContent = currentAlertness;

    const data = buildSessionData(currentFocus, currentStress, currentAlertness);

    recommendedTime.textContent = `${data.minutes} minutes`;
    focusStateText.textContent = `State: ${data.tags.join(" • ")}`;
    supportMessage.textContent = data.message;
    sessionIntensity.textContent = `Session style: ${data.intensity}`;
    encouragementText.textContent = data.encouragement;

    
    if (smartBreakPreview) {
      smartBreakPreview.textContent = `Planned break style: ${data.breakPlan.type} • ${data.breakPlan.duration}`;
    }

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
  minutes -= (stress - 3) * 4;
  minutes += (alertness - 3) * 3;

  if (minutes < 10) minutes = 10;
  if (minutes > 60) minutes = 60;

  let message = "";
  let suggestions = [];
  let tags = [];
  let intensity = "Balanced session";
  let encouragement = pickEncouragement();

  if (minutes <= 15) {
    intensity = "Light session";
  } else if (minutes <= 25) {
    intensity = "Gentle focus session";
  } else if (minutes <= 40) {
    intensity = "Steady focus session";
  } else {
    intensity = "Deep focus session";
  }

  if (stress >= 4 && alertness <= 2) {
    message = "You may benefit from a shorter session with a gentler pace.";
    suggestions = [
      "Try a 1 minute breathing reset",
      "Lower screen brightness",
      "Do one task at a time"
    ];
    tags = ["Fatigued", "Overstimulated"];
  } else if (focus >= 4 && alertness >= 4 && stress <= 2) {
    message = "You seem ready for a stronger focus block right now.";
    suggestions = [
      "Start with your hardest task",
      "Silence extra notifications",
      "Plan a short break after the session"
    ];
    tags = ["Focused", "Sharp"];
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
  } else if (focus <= 2) {
    message = "Your focus feels lower right now. Keep expectations light and clear.";
    suggestions = [
      "Close extra tabs",
      "Choose one simple starting task",
      "Use a shorter work block"
    ];
    tags = ["Distracted", "Recenter"];
  } else {
    message = "You seem fairly balanced right now. A steady focus session may work well.";
    suggestions = [
      "Keep water nearby",
      "Begin with your most important task",
      "Take a short break afterward"
    ];
    tags = ["Balanced", "Steady"];
  }

  
  const breakPlan = generateSmartBreakPlan({
    minutes,
    focus,
    stress,
    alertness,
    intensity,
    tags
  });

  return {
    focus,
    stress,
    alertness,
    minutes,
    message,
    suggestions,
    tags,
    intensity,
    encouragement,
    breakPlan // NEW
  };
}


function generateSmartBreakPlan(sessionData) {
  const { minutes, stress, alertness, focus, intensity } = sessionData;

  let duration = "5 min";
  let type = "Standard reset";
  let reason = "This break matches the length of your focus session.";
  let steps = [
    "Stand up for a moment",
    "Rest your eyes from the screen",
    "Take a few slow breaths"
  ];
  let summary = "Take a short reset before beginning again.";

  if (minutes <= 15) {
    duration = "3–5 min";
    type = "Quick recharge";
    reason = "Your session was short, so a brief reset should be enough.";
    steps = [
      "Roll your shoulders and neck",
      "Look away from the screen for 20–30 seconds",
      "Take a sip of water"
    ];
    summary = "Take a quick recharge break to stay fresh without losing momentum.";
  } else if (minutes <= 30) {
    duration = "5 min";
    type = "Light reset";
    reason = "A moderate session pairs well with a short physical and mental reset.";
    steps = [
      "Stand and stretch",
      "Hydrate",
      "Take a few deep breaths before returning"
    ];
    summary = "Take a light reset to keep your attention steady.";
  } else if (minutes <= 45) {
    duration = "8 min";
    type = "Movement break";
    reason = "A longer session benefits from more movement and screen recovery.";
    steps = [
      "Walk around for a few minutes",
      "Relax your jaw and shoulders",
      "Step away from your workspace briefly"
    ];
    summary = "Take a movement-focused break to reset your body and attention.";
  } else {
    duration = "10 min";
    type = "Full reset";
    reason = "A deep focus block needs a fuller recovery break afterward.";
    steps = [
      "Leave your screen completely",
      "Walk, stretch, or change rooms",
      "Hydrate and let your eyes rest"
    ];
    summary = "Take a fuller reset so your next session feels sustainable.";
  }

  if (stress >= 4) {
    duration = minutes >= 35 ? "10 min" : "8 min";
    type = "Calming reset";
    reason = "Your stress level was elevated, so AFC is prioritizing a calmer recovery.";
    steps = [
      "Do 1 minute of slow breathing",
      "Unclench your shoulders and jaw",
      "Avoid jumping straight into the next task"
    ];
    summary = "Take a calming break to lower tension before returning to work.";
  }

  if (stress >= 4 && alertness <= 2) {
    duration = "10 min";
    type = "Low-stimulation reset";
    reason = "You showed both high stress and low alertness, so a gentler break is recommended.";
    steps = [
      "Step away from the screen",
      "Sit somewhere quiet or dimmer",
      "Hydrate and breathe slowly for 1 minute"
    ];
    summary = "Take a quiet, low-stimulation break to reset your energy.";
  } else if (alertness <= 2 && stress < 4) {
    type = "Energy reset";
    reason = "Your alertness was low, so AFC suggests a break that helps you wake up gently.";
    steps = [
      "Stand up and move around",
      "Drink cold water",
      "Get brighter light or fresh air if possible"
    ];
    summary = "Take an energy reset to feel more awake before your next block.";
  } else if (focus >= 4 && stress <= 2 && minutes >= 35) {
    type = "Protect-your-momentum break";
    reason = "You were focused and working well, so the goal is to reset without losing momentum.";
    steps = [
      "Do a short walk or stretch",
      "Hydrate",
      "Return before distractions pull you away"
    ];
    summary = "Take a short intentional break so you can return while your momentum is still strong.";
  }

  if (intensity === "Deep focus session" && stress <= 3) {
    summary = "You completed a deep focus block, so a fuller recovery break will help sustain performance.";
  }

  return {
    duration,
    type,
    reason,
    steps,
    summary
  };
}

function setupDashboardPage() {
  const timerDisplay = document.getElementById("timerDisplay");
  if (!timerDisplay) return;

  const dashboardSessionLength = document.getElementById("dashboardSessionLength");
  const dashboardReason = document.getElementById("dashboardReason");
  const dashboardIntensity = document.getElementById("dashboardIntensity");
  const stateTagOne = document.getElementById("stateTagOne");
  const stateTagTwo = document.getElementById("stateTagTwo");
  const dashboardSuggestions = document.getElementById("dashboardSuggestions");
  const sessionStatus = document.getElementById("sessionStatus");
  const beginTimerBtn = document.getElementById("beginTimerBtn");
  const pauseTimerBtn = document.getElementById("pauseTimerBtn");
  const resetTimerBtn = document.getElementById("resetTimerBtn");
  const progressFill = document.getElementById("progressFill");
  const breakSuggestion = document.getElementById("breakSuggestion");
  const breakDuration = document.getElementById("breakDuration");
  const dashboardEncouragement = document.getElementById("dashboardEncouragement");

  
  const breakType = document.getElementById("breakType");
  const breakReason = document.getElementById("breakReason");
  const breakSteps = document.getElementById("breakSteps");

  const session = JSON.parse(localStorage.getItem(CURRENT_KEY));

  if (session) {
    dashboardSessionLength.textContent = `${session.minutes} min`;
    dashboardReason.textContent = session.message;
    dashboardIntensity.textContent = session.intensity;
    dashboardEncouragement.textContent = session.encouragement || pickEncouragement();
    stateTagOne.textContent = session.tags[0] || "Balanced";
    stateTagTwo.textContent = session.tags[1] || "Steady";

    dashboardSuggestions.innerHTML = "";
    session.suggestions.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      dashboardSuggestions.appendChild(li);
    });

    timeLeft = session.minutes * 60;
    totalTime = session.minutes * 60;

   
    setSmartBreakSuggestion(session, breakSuggestion, breakDuration, breakType, breakReason, breakSteps);
  } else {
    dashboardSessionLength.textContent = "25 min";
    dashboardReason.textContent = "No recent check-in found. Using default focus session.";
    dashboardIntensity.textContent = "Balanced session";
    dashboardEncouragement.textContent = pickEncouragement();
    stateTagOne.textContent = "Balanced";
    stateTagTwo.textContent = "Default";
    timeLeft = 25 * 60;
    totalTime = 25 * 60;

    
    setSmartBreakSuggestion(
      {
        minutes: 25,
        focus: 3,
        stress: 3,
        alertness: 3,
        intensity: "Balanced session",
        tags: ["Balanced", "Default"],
        breakPlan: generateSmartBreakPlan({
          minutes: 25,
          focus: 3,
          stress: 3,
          alertness: 3,
          intensity: "Balanced session",
          tags: ["Balanced", "Default"]
        })
      },
      breakSuggestion,
      breakDuration,
      breakType,
      breakReason,
      breakSteps
    );
  }

  updateTimerDisplay(timerDisplay);
  updateProgressBar(progressFill);

  beginTimerBtn.addEventListener("click", () => {
    if (timerRunning) return;

    timerRunning = true;
    sessionStatus.textContent = "Session in progress...";

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay(timerDisplay);
      updateProgressBar(progressFill);

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        timeLeft = 0;
        updateTimerDisplay(timerDisplay);
        updateProgressBar(progressFill);
        sessionStatus.textContent = "Session complete. Time for your personalized reset.";
        updateStreak();
        alert("Session complete! AFC has prepared a personalized break suggestion for you below.");
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

    const latestSession = JSON.parse(localStorage.getItem(CURRENT_KEY));
    const resetMinutes = latestSession ? latestSession.minutes : 25;

    timeLeft = resetMinutes * 60;
    totalTime = resetMinutes * 60;

    updateTimerDisplay(timerDisplay);
    updateProgressBar(progressFill);
    sessionStatus.textContent = "Timer reset.";

    
    if (latestSession) {
      setSmartBreakSuggestion(latestSession, breakSuggestion, breakDuration, breakType, breakReason, breakSteps);
    }
  });
}

function updateTimerDisplay(timerDisplay) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  timerDisplay.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateProgressBar(progressFill) {
  if (!progressFill || totalTime <= 0) return;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function setSmartBreakSuggestion(session, breakSuggestionEl, breakDurationEl, breakTypeEl, breakReasonEl, breakStepsEl) {
  const breakPlan = session.breakPlan || generateSmartBreakPlan(session);

  if (breakSuggestionEl) {
    breakSuggestionEl.textContent = breakPlan.summary;
  }

  if (breakDurationEl) {
    breakDurationEl.textContent = `Suggested break: ${breakPlan.duration}`;
  }

  if (breakTypeEl) {
    breakTypeEl.textContent = `Break type: ${breakPlan.type}`;
  }

  if (breakReasonEl) {
    breakReasonEl.textContent = breakPlan.reason;
  }

  if (breakStepsEl) {
    breakStepsEl.innerHTML = "";
    breakPlan.steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      breakStepsEl.appendChild(li);
    });
  }
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
  const streakCount = document.getElementById("streakCount");
  const streakMessage = document.getElementById("streakMessage");

  const sessions = getSavedSessions();
  const streakData = getStreakData();

  totalSessions.textContent = sessions.length;
  streakCount.textContent = streakData.count || 0;

  if ((streakData.count || 0) === 0) {
    streakMessage.textContent = "Complete a session to begin your streak.";
  } else if (streakData.count === 1) {
    streakMessage.textContent = "Nice start. You have completed 1 session in your current streak.";
  } else {
    streakMessage.textContent = `You are building consistency with a ${streakData.count}-session streak.`;
  }

  if (sessions.length === 0) {
    avgFocus.textContent = "0";
    avgStress.textContent = "0";
    avgAlertness.textContent = "0";
    avgMinutes.textContent = "0 min";
    historyList.innerHTML = `<p class="small-text">No sessions saved yet.</p>`;
    insightRecommendations.innerHTML = `<li>Complete a check-in to start receiving recommendations.</li>`;
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
    addListItem(insightRecommendations, "Your alertness trends lower. Earlier sessions may help.");
  }
  if (minutesAvg > 35) {
    addListItem(insightRecommendations, "Longer sessions appear often. Make sure to schedule breaks between them.");
  }
  if ((streakData.count || 0) >= 3) {
    addListItem(insightRecommendations, "Your streak is growing. Keep your routine gentle and realistic so it stays sustainable.");
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
      <p><strong>Session style:</strong> ${session.intensity || "Balanced session"}</p>
      <p><strong>Support message:</strong> ${session.message}</p>
    `;
    historyList.appendChild(item);
  });

  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CURRENT_KEY);
    localStorage.removeItem(STREAK_KEY);
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

function pickEncouragement() {
  const index = Math.floor(Math.random() * encouragementMessages.length);
  return encouragementMessages[index];
}

function getStreakData() {
  return JSON.parse(localStorage.getItem(STREAK_KEY)) || { count: 0, lastCompletedDate: null };
}

function updateStreak() {
  const today = new Date().toDateString();
  const streakData = getStreakData();

  if (streakData.lastCompletedDate === today) {
    return;
  }

  streakData.count += 1;
  streakData.lastCompletedDate = today;
  localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
}
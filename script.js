let interval;
let timeLeft = 25 * 60;

const focusSlider = document.getElementById("focus");
const stressSlider = document.getElementById("stress");
const alertnessSlider = document.getElementById("alertness");

const focusValue = document.getElementById("focusValue");
const stressValue = document.getElementById("stressValue");
const alertnessValue = document.getElementById("alertnessValue");

const sessionLengthText = document.getElementById("sessionLength");
const supportMessage = document.getElementById("supportMessage");
const timerDisplay = document.getElementById("timer");
const statusText = document.getElementById("status");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

function updateSliderValues() {
    focusValue.textContent = focusSlider.value;
    stressValue.textContent = stressSlider.value;
    alertnessValue.textContent = alertnessSlider.value;
}

function calculateSessionMinutes() {
    let focus = parseInt(focusSlider.value);
    let stress = parseInt(stressSlider.value);
    let alertness = parseInt(alertnessSlider.value);

    let minutes = 25;

    minutes += (focus - 3) * 5;
    minutes -= (stress - 3) * 3;
    minutes += (alertness - 3) * 2;

    if (minutes < 10) minutes = 10;
    if (minutes > 60) minutes = 60;

    return minutes;
}

function updateRecommendation() {
    let focus = parseInt(focusSlider.value);
    let stress = parseInt(stressSlider.value);
    let alertness = parseInt(alertnessSlider.value);

    let minutes = calculateSessionMinutes();
    sessionLengthText.textContent = `${minutes} minutes`;

    if (stress >= 4 && alertness <= 2) {
        supportMessage.textContent = "You may need a shorter session today. Try pacing yourself and taking a gentle break after.";
    } else if (focus >= 4 && alertness >= 4) {
        supportMessage.textContent = "You seem ready for a strong focus block. This could be a good time for deep work.";
    } else if (stress >= 4) {
        supportMessage.textContent = "Your stress looks a little high. Try to work slowly and stay hydrated during this session.";
    } else if (alertness <= 2) {
        supportMessage.textContent = "Your alertness seems low. A shorter session or a quick stretch may help before continuing.";
    } else {
        supportMessage.textContent = "You seem fairly balanced right now. A steady focus session may work well.";
    }

    timeLeft = minutes * 60;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startSession() {
    clearInterval(interval);

    let minutes = calculateSessionMinutes();
    timeLeft = minutes * 60;
    updateTimerDisplay();

    statusText.textContent = "Session in progress... stay focused.";

    interval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(interval);
            timerDisplay.textContent = "00:00";
            statusText.textContent = "Session complete! Take a short break, stretch, or drink some water.";
            alert("Session complete! Take a break.");
        }
    }, 1000);
}

function resetSession() {
    clearInterval(interval);
    updateRecommendation();
    statusText.textContent = "Ready to begin.";
}

focusSlider.addEventListener("input", () => {
    updateSliderValues();
    updateRecommendation();
});

stressSlider.addEventListener("input", () => {
    updateSliderValues();
    updateRecommendation();
});

alertnessSlider.addEventListener("input", () => {
    updateSliderValues();
    updateRecommendation();
});

startBtn.addEventListener("click", startSession);
resetBtn.addEventListener("click", resetSession);

updateSliderValues();
updateRecommendation();
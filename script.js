let interval;

function startSession() {

    let focus = parseInt(document.getElementById("focus").value);
    let stress = parseInt(document.getElementById("stress").value);
    let alertness = parseInt(document.getElementById("alertness").value);

    let minutes = 25;

    minutes += (focus - 3) * 5;
    minutes -= (stress - 3) * 3;
    minutes += (alertness - 3) * 2;

    if (minutes < 10) minutes = 10;
    if (minutes > 60) minutes = 60;

    let time = minutes * 60;

    clearInterval(interval);

    interval = setInterval(() => {

        time--;

        let min = Math.floor(time / 60);
        let sec = time % 60;

        document.getElementById("timer").textContent =
            `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;

        if (time <= 0) {
            clearInterval(interval);
            alert("Session complete! Take a break.");
        }

    }, 1000);
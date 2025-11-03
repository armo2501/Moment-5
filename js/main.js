// Denna fil ska innehålla din lösning till uppgiften (moment 5).

"use strict";

/*  Delar till ej obligatorisk funktionalitet, som kan ge poäng för högre betyg
*   Radera rader för funktioner du vill visa på webbsidan. */
document.getElementById("player").style.display = "none";      // Radera denna rad för att visa musikspelare
document.getElementById("shownumrows").style.display = "none"; // Radera denna rad för att visa antal träffar

/* Här under börjar du skriva din JavaScript-kod */
// ===============================
// main.js - DT084G - Projekt
// ===============================

// Kommentarera bort eller ta bort raderna som döljer HTML-elementen i början av filen i mallen.

// Bas-URL till Sveriges Radios öppna API
const BASE_URL = "https://api.sr.se/api/v2";

// Vänta tills sidan laddats
document.addEventListener("DOMContentLoaded", init);

async function init() {
    // Ladda kanaler vid start
    await loadChannels();

    // Händelselyssnare för antal-kanaler (3)
    const numRowsInput = document.getElementById("numrows");
    if (numRowsInput) {
        numRowsInput.addEventListener("change", loadChannels);
    }

    // Händelselyssnare för radio-spelare (4)
    const playBtn = document.getElementById("playbutton");
    if (playBtn) {
        playBtn.addEventListener("click", playSelectedChannel);
    }
}

// ===============================
// 1. Hämta och visa kanaler
// ===============================
async function loadChannels() {
    const num = document.getElementById("numrows")?.value || 10;
    const url = `${BASE_URL}/channels?format=json&size=${num}`;
    try {
        const res = await fetch(url);
        const data = await res.json();

        // Bygg vänster meny (1)
        renderChannelMenu(data.channels);

        // Bygg dropdown-lista (4)
        renderChannelSelect(data.channels);
    } catch (err) {
        console.error("Fel vid hämtning av kanaler:", err);
    }
}

function renderChannelMenu(channels) {
    const list = document.getElementById("mainnavlist");
    if (!list) return;

    list.innerHTML = "";

    channels.forEach(ch => {
        const li = document.createElement("li");
        li.textContent = ch.name;
        li.title = ch.tagline || "Ingen information tillgänglig";
        li.style.cursor = "pointer";
        li.addEventListener("click", () => loadSchedule(ch.id, ch.name, ch.color));

        // Gör länkarna lite mer visuellt tilltalande (valfritt)
        li.style.padding = "4px";
        li.style.listStyle = "none";
        li.style.color = ch.color || "#000";
        li.addEventListener("mouseover", () => li.style.fontWeight = "bold");
        li.addEventListener("mouseout", () => li.style.fontWeight = "normal");

        list.appendChild(li);
    });
}

// ===============================
// 2. Hämta och visa tablå
// ===============================
async function loadSchedule(channelId, channelName, color) {
    const today = new Date().toISOString().split("T")[0];
    const url = `${BASE_URL}/scheduledepisodes?channelid=${channelId}&date=${today}&format=json`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const upcoming = getUpcomingPrograms(data.schedule);
        renderSchedule(upcoming, channelName, color);
    } catch (err) {
        console.error("Fel vid hämtning av tablå:", err);
    }
}

function getUpcomingPrograms(programs) {
    const now = new Date();
    return programs.filter(p => {
        const start = new Date(parseInt(p.starttimeutc.replace("/Date(", "").replace(")/", "")));
        return start > now;
    });
}

function renderSchedule(programs, channelName, color) {
    const info = document.getElementById("info");
    if (!info) return;

    info.innerHTML = `<h2 style="color:${color}">Kommande program för ${channelName}</h2>`;

    if (programs.length === 0) {
        info.innerHTML += `<p>Inga fler program idag.</p>`;
        return;
    }

    programs.forEach(p => {
        const article = document.createElement("article");

        const start = new Date(parseInt(p.starttimeutc.replace("/Date(", "").replace(")/", "")));
        const end = new Date(parseInt(p.endtimeutc.replace("/Date(", "").replace(")/", "")));

        const startTime = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const endTime = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        article.innerHTML = `
            <h3>${p.title}</h3>
            ${p.subtitle ? `<h4><em>${p.subtitle}</em></h4>` : ""}
            <h5>${startTime} - ${endTime}</h5>
            <p>${p.description || "Ingen beskrivning tillgänglig."}</p>
            <hr>
        `;

        info.appendChild(article);
    });
}

// ===============================
// 3. Radio-spelare (valfri del 4)
// ===============================
function renderChannelSelect(channels) {
    const select = document.getElementById("playchannel");
    if (!select) return;
    select.innerHTML = "";

    channels.forEach(ch => {
        const opt = document.createElement("option");
        opt.value = ch.liveaudio.url;
        opt.textContent = ch.name;
        select.appendChild(opt);
    });
}

function playSelectedChannel() {
    const select = document.getElementById("playchannel");
    const playerDiv = document.getElementById("radioplayer");
    if (!select || !playerDiv) return;

    const url = select.value;
    if (!url) {
        playerDiv.innerHTML = "<p>Ingen ljudström tillgänglig för denna kanal.</p>";
        return;
    }

    playerDiv.innerHTML = `
        <audio controls autoplay>
            <source src="${url}" type="audio/mpeg">
        </audio>
    `;
}

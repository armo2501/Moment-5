"use strict";

// ===============================
// main.js - DT084G - Projekt
// ===============================

// Kommentera bort dessa två rader för att visa extra funktionalitet:
 // document.getElementById("player").style.display = "none";
 // document.getElementById("shownumrows").style.display = "none";

// Bas-URL till Sveriges Radios öppna API
const BASE_URL = "https://api.sr.se/api/v2";

document.addEventListener("DOMContentLoaded", init);

async function init() {
    await loadChannels();

    // Hämta senast vald kanal från localStorage
    const lastChannel = localStorage.getItem("lastChannelId");
    const lastChannelName = localStorage.getItem("lastChannelName");
    const lastChannelColor = localStorage.getItem("lastChannelColor");

    if (lastChannel) {
        loadSchedule(lastChannel, lastChannelName, lastChannelColor);
    } else {
        showNowPlayingOverview();
    }

    // Händelselyssnare för antal-kanaler
    const numRowsInput = document.getElementById("numrows");
    if (numRowsInput) numRowsInput.addEventListener("change", loadChannels);

    // Händelselyssnare för radio-spelare
    const playBtn = document.getElementById("playbutton");
    if (playBtn) playBtn.addEventListener("click", playSelectedChannel);
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

        renderChannelMenu(data.channels);
        renderChannelSelect(data.channels);
    } catch (err) {
        console.error("Fel vid hämtning av kanaler:", err);
        document.getElementById("info").innerHTML = "<p>Kunde inte ladda kanaler just nu.</p>";
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
        li.style.padding = "4px";
        li.style.listStyle = "none";
        li.style.color = ch.color || "#000";

        li.addEventListener("click", () => {
            loadSchedule(ch.id, ch.name, ch.color);

            // Spara senast valda kanal
            localStorage.setItem("lastChannelId", ch.id);
            localStorage.setItem("lastChannelName", ch.name);
            localStorage.setItem("lastChannelColor", ch.color);

            // Markera vald kanal
            document.querySelectorAll("#mainnavlist li").forEach(el => el.style.fontWeight = "normal");
            li.style.fontWeight = "bold";
        });

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
        document.getElementById("info").innerHTML = "<p>Kunde inte hämta tablån.</p>";
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
// 3. Radio-spelare
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

// ===============================
// 4. Startvy - visa "Just nu"
// ===============================
async function showNowPlayingOverview() {
    const info = document.getElementById("info");
    info.innerHTML = "<h2>Välkommen till tablån för Sveriges Radio</h2><p>Laddar aktuella sändningar...</p>";

    try {
        const res = await fetch(`${BASE_URL}/channels?format=json&size=5`);
        const data = await res.json();

        info.innerHTML = "<h2>Just nu i Sveriges Radio</h2>";

        data.channels.forEach(ch => {
            if (ch.liveaudio && ch.liveaudio.url) {
                info.innerHTML += `
                    <article>
                        <h3 style="color:${ch.color}">${ch.name}</h3>
                        <p>${ch.tagline || ""}</p>
                        <audio controls style="width:100%;">
                            <source src="${ch.liveaudio.url}" type="audio/mpeg">
                        </audio>
                    </article>
                `;
            }
        });
    } catch (err) {
        info.innerHTML = "<p>Kunde inte ladda nuvarande sändningar.</p>";
    }
}

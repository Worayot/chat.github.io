import tmi from 'https://cdn.jsdelivr.net/npm/tmi.js/+esm';

const chat = document.getElementById('chat');

const client = new tmi.Client({
    channels: ['Oat4u'] 
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    if (self) return;
    addMessage(tags, message);
});

client.on('cheer', (channel, tags, message) => {
    addAlert('BITS!', tags.username, `${tags.bits} Bits`);
});

client.on('subscription', (channel, username) => {
    addAlert('NEW SUBSCRIBER!', username);
});

client.on('subgift', (channel, username, streakMonths, recipient) => {
    addAlert('GIFT SUB!', username, `Gifted to ${recipient}`);
});

client.on('raided', (channel, username, viewers) => {
    addAlert('RAID!', username, `${viewers} viewers`);
});

function addAlert(title, username, description = '') {
    const container = document.getElementById('alerts');

    const alert = document.createElement('div');
    alert.className = 'alert';

    const heading = document.createElement('h2');
    heading.textContent = title;

    const name = document.createElement('p');
    name.textContent = username;

    const detail = document.createElement('p');
    detail.textContent = description;

    alert.append(heading, name, detail);
    container.appendChild(alert);

    setTimeout(() => alert.remove(), 8000);
}

function addMessage(tags, text) {
    const msg = document.createElement('div');
    msg.className = 'message';

    const username = tags['display-name'] || tags.username;
    const color = tags.color || '#f0f8ff';

    // Process emotes and badges
    const messageWithEmotes = parseEmotes(text, tags.emotes);
    const badgesHtml = parseBadges(tags.badges);

    // Escape username to prevent HTML injection
    const safeUsername = escapeHTML(username);

    msg.innerHTML = `
        <div class="user-info">
            ${badgesHtml}
            <span class="user"
                style="color: ${escapeHTML(color)};
                       text-shadow: 0 0 8px ${escapeHTML(color)}88;">
                ${safeUsername}
            </span>
        </div>

        <div class="message-text">
            ${messageWithEmotes}
        </div>
    `;

    chat.appendChild(msg);

    // Auto-scroll
    chat.scrollTop = chat.scrollHeight;

    // Fade out after 20 seconds
    setTimeout(() => {
        msg.classList.add('fade-out');

        setTimeout(() => msg.remove(), 500);
    }, 20000);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}


// --- Helper: Emote Parser ---

function parseEmotes(text, emotes) {
    if (!emotes) return escapeHTML(text);

    const replacements = [];

    for (const [id, positions] of Object.entries(emotes)) {
        for (const position of positions) {
            const [start, end] = position.split('-').map(Number);

            replacements.push({
                id,
                start,
                end,
                text: text.substring(start, end + 1)
            });
        }
    }

    // Sort emotes by their original position
    replacements.sort((a, b) => a.start - b.start);

    let result = '';
    let lastIndex = 0;

    for (const emote of replacements) {
        // Normal text before emote
        result += escapeHTML(
            text.substring(lastIndex, emote.start)
        );

        const emoteUrl =
            `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`;

        result += `
            <img
                src="${emoteUrl}"
                class="emote"
                alt="${escapeHTML(emote.text)}"
                title="${escapeHTML(emote.text)}"
                loading="lazy"
            >
        `;

        lastIndex = emote.end + 1;
    }

    // Remaining normal text
    result += escapeHTML(text.substring(lastIndex));

    return result;
}


function parseBadges(badges) {
    if (!badges) return '';

    let badgesHtml = '';

    // Public Twitch badge images
    const badgeMap = {
        broadcaster: 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3',
        moderator: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3',
        vip: 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3',
        premium: 'https://static-cdn.jtvnw.net/badges/v1/2d7b56f5-a1f4-4c1a-9c62-85d892a1340f/3',
        partner: 'https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/3'
    };

    for (const badge of Object.keys(badges)) {
        if (badge === 'subscriber') continue; // Subscribers have channel-specific badges

        if (badgeMap[badge]) {
            badgesHtml += `
                <img
                    class="badge"
                    src="${badgeMap[badge]}"
                    alt="${badge}"
                    title="${badge}">
            `;
        }
    }

    return badgesHtml;
}
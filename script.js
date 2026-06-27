import tmi from 'https://cdn.jsdelivr.net/npm/tmi.js/+esm';

const chat = document.getElementById('chat');

const client = new tmi.Client({
    channels: ['Kametyyy'] 
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    if (self) return;
    addMessage(tags, message);
});

function addMessage(tags, text) {
    const msg = document.createElement('div');
    msg.className = 'message';

    const username = tags['display-name'];
    const color = tags.color || '#f0f8ff';

    // 1. Process Emotes
    const messageWithEmotes = parseEmotes(text, tags.emotes);
    
    // 2. Process Badges
    const badgesHtml = parseBadges(tags.badges);

    msg.innerHTML = `
        <div class="user-info">
            ${badgesHtml}
            <span class="user" style="color: ${color}; text-shadow: 0 0 8px ${color}88;">
                ${username}
            </span>
        </div>
        <div class="message-text">${messageWithEmotes}</div>
    `;

    chat.appendChild(msg);

    // Auto-scroll to bottom (optional, good for chat widgets)
    chat.scrollTop = chat.scrollHeight;

    setTimeout(() => {
        msg.classList.add('fade-out');
        setTimeout(() => msg.remove(), 500); // Wait for fade out animation before removing
    }, 20000);
}

// --- Helper: Emote Parser ---
function parseEmotes(text, emotes) {
    // Escape HTML first for safety
    let htmlText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    if (!emotes) return htmlText;

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

    // Replace from back to front
    replacements.sort((a, b) => b.start - a.start);

    for (const { id, start, end, text: emoteText } of replacements) {

        // Animated emotes if available, fallback to static
        const emoteUrl =
            `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`;

        const emoteImg = `
            <img
                src="${emoteUrl}"
                class="emote"
                alt="${emoteText}"
                title="${emoteText}"
                loading="lazy"
            >
        `;

        htmlText =
            htmlText.substring(0, start) +
            emoteImg +
            htmlText.substring(end + 1);
    }

    return htmlText;
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
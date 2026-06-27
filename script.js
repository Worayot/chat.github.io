import tmi from 'https://cdn.jsdelivr.net/npm/tmi.js/+esm';

const chat = document.getElementById('chat');

const client = new tmi.Client({
    channels: ['oat4u']
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
    const color = tags.color || '#fff';

    msg.innerHTML = `
        <span class="user" style="color:${color}">
            ${username}:
        </span>
        <span>${text}</span>
    `;

    chat.appendChild(msg);

    setTimeout(() => msg.remove(), 20000);
}
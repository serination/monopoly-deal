# Monopoly Deal (Client-Hosted)

This is a browser-based, multiplayer Monopoly Deal implementation. One player hosts the authoritative game state locally, while all peers connect via WebRTC signaling through PeerJS.

## Quick Start

1. Open `index.html` from a local web server (required for WebRTC).
2. Click **Create Game** to become the host.
3. Share the **Invite URL** with friends.
4. Guests open the link and click **Join Game**.
5. The host clicks **Start Game** once everyone has connected.

## Local Server Options

- Node.js: `npx serve`
- PHP: `php -S localhost:8000`
- Ruby: `ruby -run -e httpd . -p 8000`

Then open the printed `http://localhost:PORT`.

## Multiplayer Notes

- Game state is kept only on the host.
- PeerJS is used purely for signaling; no game data is stored on any server.
- If the host disconnects, the game ends for all players.

## File Map

- `index.html` — UI shell and layout.
- `styles.css` — visual theme and responsive styling.
- `app.js` — game logic, rules, and multiplayer sync.

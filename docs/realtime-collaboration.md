# Real-Time Collaboration

This document details how real-time features and team interactions function in "Meira" using websockets and broadcasting (likely via Laravel Reverb).

## Mouse/Cursor Broadcasting
- Endpoint: `/{project}/cursor` broadcasts `CursorMoved` events (containing X, Y coordinates and the User ID).
- Allows feeling "present" with teammates on the board.

## Team Chat
- Projects have a dedicated `/{project}/team-chat` route.
- Messages are ordered chronologically. The eloquent relationship fetched is `project -> chat -> messages -> user`.

**[Add specific design decisions regarding websockets, Echo, Reverb, presence channels, or React context setup here]**

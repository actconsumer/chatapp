# Call Service Integration

This document summarizes the Azure-backed call APIs used by the React Native call screens.

## Environment Variables

Set the following secrets (preferably via Azure Key Vault):

- `AZURE_SIGNALR_CONNECTION_STRING`
- `AZURE_SIGNALR_HUB`
- `ACS_CONNECTION_STRING`
- `AZURE_KEY_VAULT_URL`

## REST Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/calls/initiate` | Create a new voice/video call invitation |
| `POST` | `/api/v1/calls/:callId/answer` | Answer a pending call |
| `POST` | `/api/v1/calls/:callId/reject` | Reject an incoming call |
| `POST` | `/api/v1/calls/:callId/end` | End an active call |
| `GET` | `/api/v1/calls/history` | Retrieve call history for the authenticated user |
| `GET` | `/api/v1/calls/settings` | Fetch persisted call settings |
| `PATCH` | `/api/v1/calls/settings` | Update call settings |
| `GET` | `/api/v1/calls/acs-token` | Retrieve ACS VoIP token |
| `POST` | `/api/v1/calls/telemetry` | Submit call telemetry metrics |
| `GET` | `/api/v1/calls/:callId/quality` | Fetch aggregated quality metrics |
| `POST` | `/api/v1/realtime/negotiate` | Negotiate Azure SignalR connection |

## Socket Events

| Event | Payload | Purpose |
| --- | --- | --- |
| `call:signal` | `{ callId, type, signal, from, to? }` | WebRTC signalling channel |
| `call:add-participants` | `{ callId, participantIds[] }` | Invite additional participants |
| `call:remove-participant` | `{ callId, participantId }` | Remove a participant |
| `settings:updated` | `{ type: 'call', settings }` | Broadcast call setting updates |

All socket messages are authenticated with the same JWT used across the API.

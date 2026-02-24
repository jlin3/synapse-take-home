# Synapse Engineering Take-Home Assessment

## Overview

Synapse is a research discovery platform that helps researchers find, read, and share academic papers. We're building a **direct messaging** feature so researchers can message each other about papers and collaborations.

The backend API for messaging is already built and running on a test server. Your job is to build the **frontend messaging experience** in React Native.

**Time budget:** 3 hours
**Due:** 5 days from receipt

---

## What You're Building

### Part 1 — Messaging UI (React Native)

Build the frontend screens for the messaging feature:

1. **Conversations List** — Shows the user's active conversations and pending message requests. Each row should display the other person's name/avatar, last message preview, timestamp, and unread count. Pending requests (messages from people you haven't accepted yet) should be visually distinct from active conversations.

2. **Message Thread** — A chat view for a single conversation. Messages appear in bubbles with sent vs. received styling. Includes a text input to compose and send messages. Supports scrolling to load older messages (the API uses cursor-based pagination via `before_id`).

3. **Compose / Start Conversation** — A way to initiate a new conversation with another researcher. The API has a concept of "message requests" — if the users aren't already connected, the conversation starts as PENDING and the recipient must accept or decline. Your UI should handle this flow.

4. **Navigation** — Add a way to access messaging from the app. The starter project has a basic stack navigator — you decide how messaging fits in (bottom tabs, header icon, etc.).

### Part 2 — Real-Time Strategy

The API is HTTP-only — there's no push mechanism for new messages. Add a **polling strategy** so that new messages appear without the user manually refreshing. Think about:
- Poll interval (balance responsiveness vs. battery/network)
- Pausing when the app is backgrounded
- How polling integrates with your data layer (React Query cache invalidation)

Then write a brief architecture section in your PR/README explaining:
- How you'd evolve this to true real-time (WebSocket, SSE, etc.) if you had backend access
- What mobile-specific concerns you'd address (battery, backgrounding, reconnection)

### Part 3 — Quality & Polish

- Write tests for at least **2 critical paths** (your choice of what matters most)
- Handle edge cases: empty states, error states, loading states, send failures
- Use TypeScript strictly (avoid `any`)

---

## API Reference

All endpoints are pre-authenticated via the token in your `.env` file. The test server has several pre-seeded researcher accounts you can message.

Base URL: configured via `EXPO_PUBLIC_API_URL` in your `.env`.

You've been given two tokens:
- **User A** (`EXPO_PUBLIC_API_TOKEN`): Your primary test account
- **User B** (`EXPO_PUBLIC_API_TOKEN_B`): Use this to test two-sided conversations (accepting requests, seeing the other person's view). Call `setAuthToken()` from `src/api/client.ts` to switch.

### GET /messages/conversations

List the current user's conversations.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | (all) | Filter: `"pending"`, `"active"`, or `"declined"` |
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Results per page (max 50) |

**Response:**
```json
{
  "conversations": [
    {
      "conversation_id": "507f1f77bcf86cd799439011",
      "status": "active",
      "created_at": "2026-02-20T10:30:00+00:00",
      "last_message_at": "2026-02-23T14:22:00+00:00",
      "last_message_preview": "Thanks for sharing that paper!",
      "is_initiator": true,
      "unread_count": 2,
      "other_user": {
        "user_id": "507f1f77bcf86cd799439012",
        "name": "Dr. Sarah Chen",
        "verified": true,
        "verified_author_id": "A12345678",
        "pic": "https://cdn.example.com/profiles/abc.jpg"
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "total_count": 5,
  "has_more": false
}
```

### GET /messages/requests

List pending message requests (conversations initiated by others, awaiting your approval).

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Results per page (max 50) |

**Response:**
```json
{
  "requests": [
    {
      "conversation_id": "...",
      "status": "pending",
      "created_at": "...",
      "last_message_at": "...",
      "last_message_preview": "Hi, I read your paper on...",
      "is_initiator": false,
      "unread_count": 0,
      "other_user": { "user_id": "...", "name": "...", "verified": true, "pic": "..." }
    }
  ],
  "page": 1,
  "limit": 20,
  "total_count": 1,
  "has_more": false
}
```

### POST /messages/start

Start a new conversation with another researcher. Auto-approves if users are already connected; otherwise creates a PENDING message request.

**Body (JSON):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipient_id` | string | yes | User ID of the recipient |
| `message` | string | yes | Initial message (max 5000 chars) |

**Response (201):**
```json
{
  "message": "Message sent",
  "conversation": { "conversation_id": "...", "status": "active", ... },
  "sent_message": {
    "message_id": "...",
    "content": "Hi, I loved your paper on...",
    "created_at": "2026-02-23T15:00:00+00:00",
    "read_at": null,
    "is_mine": true
  }
}
```

### POST /messages/respond

Accept or decline a message request.

**Body (JSON):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversation_id` | string | yes | The conversation ID |
| `action` | string | yes | `"accept"` or `"decline"` |

**Response:**
```json
{
  "message": "Message request accepted",
  "conversation": { ... }
}
```

### GET /messages/:conversation_id

Get messages in a conversation. Returns newest first. Use `before_id` for pagination (load older messages).

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | 50 | Messages to fetch (max 100) |
| `before_id` | string | (none) | Message ID for cursor pagination |

**Response:**
```json
{
  "messages": [
    {
      "message_id": "507f1f77bcf86cd799439099",
      "content": "Thanks for sharing that paper!",
      "created_at": "2026-02-23T14:22:00+00:00",
      "read_at": "2026-02-23T14:23:00+00:00",
      "is_mine": false
    }
  ],
  "conversation": { ... },
  "has_more": true
}
```

Note: For pending conversations, the recipient sees an empty message list with a note to accept the request first.

### POST /messages/:conversation_id/send

Send a message in an active conversation.

**Body (JSON):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | yes | Message text (max 5000 chars) |

**Response:**
```json
{
  "message": "Message sent",
  "sent_message": {
    "message_id": "...",
    "content": "...",
    "created_at": "...",
    "read_at": null,
    "is_mine": true
  }
}
```

### POST /messages/:conversation_id/read

Mark all messages in a conversation as read.

**Response:**
```json
{
  "message": "Messages marked as read",
  "marked_count": 3
}
```

### GET /messages/unread-count

Get total unread message count across all conversations.

**Response:**
```json
{
  "unread_count": 7
}
```

---

## Technical Requirements

Use the technologies pre-configured in the starter project:

| Layer | Technology | Already set up |
|-------|-----------|---------------|
| UI components | **Tamagui** (`View`, `Text`, `XStack`, `YStack`, etc.) | Yes — TamaguiProvider in App.tsx |
| Navigation | **React Navigation** (stack and/or bottom tabs) | Yes — basic stack in RootNavigator |
| Server state | **TanStack React Query** (`useQuery`, `useMutation`) | Yes — QueryClientProvider in App.tsx |
| Local/UI state | **Jotai** (atoms) | Yes — installed, use as needed |
| Type validation | **Zod** (schemas for API responses) | Yes — installed, define your schemas |
| HTTP client | **Axios** (via `src/api/client.ts`) | Yes — `apiGet`, `apiPost` helpers |
| Lists | **FlashList** (`@shopify/flash-list`) | Yes — installed |

You're free to add additional packages if needed, but the above should cover most use cases. If you do add something, mention why in your submission.

---

## Setup

### Prerequisites
- Node.js 18+
- Yarn or npm
- Expo Go app on your phone, or iOS Simulator / Android Emulator

### Install & Run
```bash
# Install dependencies
yarn install

# Copy env and fill in the provided values
cp .env.example .env

# Start the development server
npx expo start
```

Open the app in Expo Go or a simulator. You should see a "Synapse Take-Home" screen that shows whether the API connection is working. If it says "API connected", you're ready to build.

### Testing Two-Sided Conversations

You have tokens for two test users (User A and User B). To test the full message request flow:

1. As User A, start a conversation with a pre-seeded researcher
2. Use `setAuthToken()` from `src/api/client.ts` to switch to User B's token
3. As User B, see the pending request and accept/decline it
4. Switch back to User A and continue the conversation

This is just for your own testing — your UI only needs to support one authenticated user at a time.

---

## Submission

1. Initialize a git repo and make clean, atomic commits as you work
2. When done, push to a GitHub repo (public or private — invite us if private) or zip and email
3. Include a **README** or PR description with:
   - **What you built** — summary of screens and features
   - **Architecture** — how you structured hooks, components, and state
   - **Real-time strategy** — your polling approach + how you'd evolve it to WebSocket/SSE
   - **Trade-offs** — what you'd do differently with more time
   - **Testing** — what you tested and why those paths
4. Include a few **screenshots** or a short **screen recording**

### What We're Looking For

- **Architecture** — How did you structure data fetching, components, and state? Is the code well-organized?
- **Product sense** — Did you handle the message request flow thoughtfully? Empty states? Unread indicators? Does it feel like a real product?
- **TypeScript & data layer** — Zod schemas for API responses, proper types, React Query cache management
- **Polling / real-time thinking** — Is your polling approach smart? Does your write-up show systems thinking?
- **Code quality** — Error handling, test coverage, clean abstractions
- **Communication** — Clarity of your README and architectural explanations

### What We're NOT Looking For

- Pixel-perfect design — keep it clean and functional, don't stress about visual polish
- 100% test coverage — just test the paths that matter most
- Changes to the API — the backend is a black box, build against it as-is

---

## Questions?

If anything is unclear about the API, setup, or requirements, reach out. We'd rather you ask than guess. Good luck!

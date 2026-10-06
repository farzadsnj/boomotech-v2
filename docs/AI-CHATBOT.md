# AI Service Chatbot

The floating service assistant uses a small server-side OpenAI adapter for visitor questions while preserving the existing deterministic service links and consultation flow.

## Request path

1. The existing client assistant sends the current message and at most eight recent in-memory user/assistant turns to `POST /api/chat`.
2. The API accepts same-origin JSON only, reads at most 16 KB, validates the shape with Zod and applies a per-client rate limit.
3. `src/features/chat/knowledge.ts` builds public context from the canonical service, solution and FAQ records. It does not include user records, bookings, credentials or internal notes.
4. `src/features/chat/openai.ts` calls the OpenAI Responses API from the server with `store: false`, a short timeout, no retries and a bounded output.
5. The UI combines the generated explanation with deterministic links from the existing service matcher.

`OPENAI_API_KEY` never receives a `NEXT_PUBLIC_` prefix and is not included in an API response, client bundle, browser storage or log. Conversation history exists only in the open React component and is lost when the page is reloaded.

## Safety boundaries

The assistant is instructed to use the approved public website knowledge, state limits, avoid diagnosis, and avoid inventing prices, response times, guarantees, availability, service areas, credentials or policies. It must never request passwords, MFA codes, recovery keys, private keys, payment-card information, API keys or confidential customer data.

The API returns generic errors for provider, configuration and rate-limit failures. It does not expose provider messages or secrets. Missing OpenAI or shared production rate-limit configuration makes chat unavailable rather than silently bypassing protection.

This is general service guidance. It is not an emergency channel, confirmed appointment, support ticket, legal advice or substitute for situation-specific technical assessment.

## Configuration

```env
OPENAI_API_KEY=server-side-secret
OPENAI_CHAT_MODEL=gpt-6-luna
BOOKING_RATE_LIMIT_REST_URL=https://shared-rate-limit-provider.example
BOOKING_RATE_LIMIT_REST_TOKEN=server-side-secret
BOOKING_TRUST_PROXY=true
SITE_URL=https://approved.example
```

The chat limiter uses a separate `boomotech:chat:*` namespace in the existing shared expiring rate-limit provider. A bounded in-memory fallback is available only outside production. In production, the trusted proxy must overwrite `X-Forwarded-For`; otherwise the endpoint fails closed.

The model name is configurable so it can be reviewed without code changes. Verify the selected model is available to the OpenAI project and review usage limits before launch.

## Local testing

Set a development API key only in untracked `.env.local`, start the application, open the chatbot and use **Ask a service question**. Automated tests inject a fake Responses client and never call OpenAI.

```bash
pnpm test
pnpm dev
```

Test safe questions about Wi-Fi, Microsoft 365 and service selection. Also verify unavailable-provider, rate-limit, oversized-message and unsafe-data guidance. Never paste a real password or customer record into a test.

## Owner decisions before launch

- approved OpenAI project, model and monthly usage budget;
- provider data-processing and geographic handling review;
- approved public AI disclosure and privacy wording;
- production shared rate-limit provider and trusted proxy configuration;
- escalation route when the answer is insufficient;
- monitoring and incident owner for provider outages or abuse.

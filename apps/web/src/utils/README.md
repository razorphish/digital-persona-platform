# Mock Data for Testing

This directory contains mock data utilities that should **ONLY** be used in tests, not in production code.

## Files

- `mockData.ts` - Mock data definitions for feed items, personas, and tRPC responses

## Usage in Tests

### Jest/Vitest Unit Tests

```typescript
import { mockFeedItems, mockTrendingPersonas } from "@/utils/mockData";

describe("FeedPage", () => {
  it("should render feed items", () => {
    // Use mockFeedItems for testing
    render(<FeedPage feedItems={mockFeedItems} />);
    // ... test assertions
  });
});
```

### tRPC Mock Setup

```typescript
import { mockTRPCResponses } from "@/utils/mockData";

// Mock tRPC client in tests
jest.mock("@/lib/trpc", () => ({
  trpc: {
    feed: {
      getFeed: {
        useQuery: jest.fn(() => mockTRPCResponses["feed.getFeed"]),
      },
    },
    discovery: {
      getTrendingPersonas: {
        useQuery: jest.fn(
          () => mockTRPCResponses["discovery.getTrendingPersonas"]
        ),
      },
    },
  },
}));
```

### React Testing Library with MSW

```typescript
import { rest } from "msw";
import { setupServer } from "msw/node";
import { mockFeedItems } from "@/utils/mockData";

const server = setupServer(
  rest.get("/api/trpc/feed.getFeed", (req, res, ctx) => {
    return res(ctx.json({ result: { data: mockFeedItems } }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Storybook Stories

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { PersonaFeedCard } from "@/components/feed/PersonaFeedCard";
import { mockFeedItems } from "@/utils/mockData";

const meta: Meta<typeof PersonaFeedCard> = {
  title: "Feed/PersonaFeedCard",
  component: PersonaFeedCard,
};

export default meta;

export const Default: StoryObj<typeof PersonaFeedCard> = {
  args: {
    feedItem: mockFeedItems[0],
    onInteraction: () => {},
    viewportIndex: 0,
  },
};
```

## ⚠️ Important Guidelines

1. **Never import mock data in production components**
2. **Mock data should only exist in test files and utilities**
3. **Use real API calls for all environments (dev, qa, staging, prod)**
4. **Update mock data when API schemas change**

## Environment Guidelines

- **Local Development**: Use real backend API (no mocks)
- **Dev/QA/Staging**: Use real backend API (no mocks)
- **Production**: Use real backend API (no mocks)
- **Tests Only**: Use mock data from this utility

This ensures:

- ✅ Real data testing in all environments
- ✅ No production risk from mock data
- ✅ Consistent behavior across environments
- ✅ Proper API validation in dev/qa

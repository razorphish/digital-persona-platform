import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import IntegrationsPage from "./IntegrationsPage";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    getIntegrations: jest.fn(),
    connectIntegration: jest.fn(),
    syncIntegration: jest.fn(),
    getIntegrationPosts: jest.fn(),
    getIntegrationAnalytics: jest.fn(),
    updateIntegration: jest.fn(),
    deleteIntegration: jest.fn(),
    analyzeIntegrationSentiment: jest.fn(),
  },
}));

const api = require("../../services/api").default;

describe("IntegrationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders integrations list", async () => {
    api.getIntegrations.mockResolvedValue([
      {
        id: 1,
        platform: "twitter",
        platform_user_id: "123",
        platform_username: "testuser",
        is_active: true,
        last_sync_at: "2024-07-06T00:00:00Z",
        sync_frequency_hours: 24,
        platform_metadata: {},
        created_at: "2024-07-06T00:00:00Z",
        updated_at: "2024-07-06T00:00:00Z",
      },
    ]);
    await act(async () => {
      render(<IntegrationsPage />);
    });
    expect(
      await screen.findByRole("heading", { name: "Integrations" })
    ).toBeInTheDocument();
    expect(await screen.findByText(/twitter/i)).toBeInTheDocument();
    expect(await screen.findByText(/@testuser/i)).toBeInTheDocument();
  });

  it("shows empty state when no integrations", async () => {
    api.getIntegrations.mockResolvedValue([]);
    await act(async () => {
      render(<IntegrationsPage />);
    });
    expect(
      await screen.findByText(/No integrations connected/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Connect Your First Account/i)).toBeInTheDocument();
  });

  it("opens and closes the connect modal", async () => {
    api.getIntegrations.mockResolvedValue([]);
    await act(async () => {
      render(<IntegrationsPage />);
    });
    await act(async () => {
      fireEvent.click(await screen.findByText(/Connect Your First Account/i));
    });
    expect(screen.getByText(/Connect Twitter/i)).toBeInTheDocument();
    const closeBtn = screen.getByLabelText(/Close modal/i);
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    await waitFor(() => {
      expect(screen.queryByText(/Connect Twitter/i)).not.toBeInTheDocument();
    });
  });

  it("handles API error gracefully", async () => {
    api.getIntegrations.mockRejectedValue(new Error("API Error"));
    await act(async () => {
      render(<IntegrationsPage />);
    });
    expect(
      await screen.findByRole("heading", { name: "Integrations" })
    ).toBeInTheDocument();
  });

  it("calls sync handler", async () => {
    api.getIntegrations.mockResolvedValue([
      {
        id: 1,
        platform: "twitter",
        platform_user_id: "123",
        platform_username: "testuser",
        is_active: true,
        last_sync_at: "2024-07-06T00:00:00Z",
        sync_frequency_hours: 24,
        platform_metadata: {},
        created_at: "2024-07-06T00:00:00Z",
        updated_at: "2024-07-06T00:00:00Z",
      },
    ]);
    api.syncIntegration.mockResolvedValue({ new_posts_count: 1 });
    await act(async () => {
      render(<IntegrationsPage />);
    });
    const syncBtn = await screen.findByText(/Sync Now/i);
    await act(async () => {
      fireEvent.click(syncBtn);
    });
    await waitFor(() => {
      expect(api.syncIntegration).toHaveBeenCalledWith(1);
    });
  });

  it("calls delete handler", async () => {
    window.confirm = jest.fn(() => true);
    api.getIntegrations.mockResolvedValue([
      {
        id: 1,
        platform: "twitter",
        platform_user_id: "123",
        platform_username: "testuser",
        is_active: true,
        last_sync_at: "2024-07-06T00:00:00Z",
        sync_frequency_hours: 24,
        platform_metadata: {},
        created_at: "2024-07-06T00:00:00Z",
        updated_at: "2024-07-06T00:00:00Z",
      },
    ]);
    api.deleteIntegration.mockResolvedValue();
    await act(async () => {
      render(<IntegrationsPage />);
    });
    const deleteBtn = await screen.findByTitle(/Delete Integration/i);
    await act(async () => {
      fireEvent.click(deleteBtn);
    });
    await waitFor(() => {
      expect(api.deleteIntegration).toHaveBeenCalledWith(1);
    });
  });
});

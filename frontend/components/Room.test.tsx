import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerMessage } from "@/types/messages";
import Room from "@/components/Room";

const mocks = vi.hoisted(() => ({
  messages: [] as unknown[],
  send: vi.fn(),
  account: null as { id: string; displayName: string; email: string } | null,
  identity: null as { clientId: string; displayName: string; claimClientId?: string } | null,
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock("@/hooks/useWebSocket", () => ({
  useWebSocket: (_roomId: string, identity: typeof mocks.identity) => {
    mocks.identity = identity;
    return {
      messages: mocks.messages as never[],
      send: mocks.send,
      connected: true,
    };
  },
}));

vi.mock("@/lib/guest", () => ({
  getGuestId: () => "guest-1",
  getDisplayName: () => "Casey",
  getRoomParticipantId: () => "participant-1",
  setDisplayName: vi.fn(),
  setRoomParticipantId: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  useAccount: () => ({ account: mocks.account, isLoading: false }),
}));

vi.mock("@/components/OnlineUsers", () => ({
  default: () => null,
}));

function setMessages(messages: ServerMessage[]) {
  mocks.messages.splice(0, mocks.messages.length, ...messages);
}

describe("Room", () => {
  beforeEach(() => {
    mocks.send.mockReset();
    mocks.account = null;
    mocks.identity = null;
    mocks.routerPush.mockReset();
    setMessages([
      {
        type: "room_snapshot",
        room: "trip-1",
        payload: {
          entries: [],
          roomName: "Weekend Away",
          budget: "250",
          description: "Camping trip",
          date: "2026-07-20",
        },
      },
    ]);
  });

  afterEach(() => cleanup());

  it("renders room details from the server snapshot", () => {
    setMessages([
      {
        type: "room_snapshot",
        room: "trip-1",
        payload: {
          entries: [{ id: "passport", name: "Passport", quantity: 1, cost: 12.5, assignedTo: "Unassigned" }],
          roomName: "Weekend Away",
          budget: "250",
          description: "Camping trip",
          date: "2026-07-20",
        },
      },
    ]);

    render(<Room roomId="trip-1" />);

    expect(screen.getByRole("heading", { name: "Weekend Away" })).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(screen.getByText("$12.50 / $250.00")).toBeInTheDocument();
    expect(screen.getByText("Camping trip")).toBeInTheDocument();
  });

  it("uses the signed-in account name without asking for a room display name", () => {
    mocks.account = {
      id: "account-1",
      displayName: "Account Name",
      email: "alex@example.com",
    };

    render(<Room roomId="trip-1" />);

    expect(screen.queryByRole("heading", { name: "What should we call you?" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Weekend Away" })).toBeInTheDocument();
    expect(mocks.identity?.displayName).toBe("Account Name");
  });

  it("shows an account button to guests", () => {
    render(<Room roomId="trip-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Create account / Sign in" }));

    expect(mocks.routerPush).toHaveBeenCalledWith("/account");
  });

  it("shows the signed-in account menu with future options", () => {
    mocks.account = {
      id: "account-1",
      displayName: "Account Name",
      email: "alex@example.com",
    };
    render(<Room roomId="trip-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));

    expect(screen.getByRole("menu", { name: "Account options" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Preferences/ })).toBeDisabled();
    expect(screen.getByRole("menuitem", { name: /My rooms/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("menuitem", { name: "Account settings" }));
    expect(mocks.routerPush).toHaveBeenCalledWith("/account");
  });

  it("does not send an item when its name is blank", () => {
    render(<Room roomId="trip-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("sends a named item with default quantity and cost", () => {
    render(<Room roomId="trip-1" />);
    fireEvent.change(screen.getByPlaceholderText("Item name"), { target: { value: "Tent" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(mocks.send).toHaveBeenCalledWith({
      type: "add_entry",
      roomId: "trip-1",
      entry: expect.objectContaining({
        name: "Tent",
        quantity: 1,
        cost: 0,
        assignedTo: "Unassigned",
      }),
    });
  });
});
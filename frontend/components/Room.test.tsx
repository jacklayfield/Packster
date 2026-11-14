import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerMessage } from "@/types/messages";
import Room from "@/components/Room";

const mocks = vi.hoisted(() => ({
  messages: [] as unknown[],
  send: vi.fn(),
  account: null as { id: string; displayName: string; email: string } | null,
  identity: null as { clientId: string; displayName: string } | null,
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
  setDisplayName: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  useAccount: () => ({ account: mocks.account, isLoading: false }),
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

  it("shows read-only access and sign-in options to guests", () => {
    render(<Room roomId="trip-1" />);

    fireEvent.click(screen.getAllByRole("button", { name: "Sign in with Google" })[0]);

    expect(mocks.routerPush).toHaveBeenCalledWith("/account?returnTo=%2Froom%2Ftrip-1");
    expect(screen.queryByPlaceholderText("Item name")).not.toBeInTheDocument();
  });

  it("shows the signed-in account menu and opens preferences and rooms", () => {
    mocks.account = {
      id: "account-1",
      displayName: "Account Name",
      email: "alex@example.com",
    };
    render(<Room roomId="trip-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));

    expect(screen.getByRole("menu", { name: "Account options" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Preferences" })).toBeEnabled();
    fireEvent.click(screen.getByRole("menuitem", { name: "Preferences" }));
    expect(mocks.routerPush).toHaveBeenCalledWith("/preferences");
    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "My rooms" }));
    expect(mocks.routerPush).toHaveBeenCalledWith("/rooms");
    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Account settings" }));
    expect(mocks.routerPush).toHaveBeenCalledWith("/account");
  });

  it("keeps offline users out of the bar and lets the owner remove them from members", () => {
    mocks.account = {
      id: "account-1",
      displayName: "Owner",
      email: "owner@example.com",
    };
    setMessages([
      {
        type: "room_snapshot",
        room: "trip-1",
        payload: {
          entries: [],
          roomName: "Weekend Away",
          ownerId: "account-1",
        },
      },
      {
        type: "presence_snapshot",
        room: "trip-1",
        payload: {
          users: [
            { clientId: "account-1", displayName: "Owner", color: "#123456", online: true },
            { clientId: "former-member", displayName: "Former Member", color: "#654321", online: false },
          ],
        },
      },
    ]);

    render(<Room roomId="trip-1" />);

    const onlineMembers = screen.getByRole("list", { name: "Online room members" });
    expect(within(onlineMembers).getByText("Owner")).toBeInTheDocument();
    expect(within(onlineMembers).queryByText("Former Member")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Room members (2)" }));
    const membersDialog = screen.getByRole("dialog", { name: "Room members" });
    expect(within(membersDialog).getByText("Former Member")).toBeInTheDocument();
    expect(within(membersDialog).getByText("Offline")).toBeInTheDocument();

    fireEvent.click(within(membersDialog).getByRole("button", { name: "Remove Former Member" }));
    expect(within(membersDialog).getByText(/will clear their item claims/)).toBeInTheDocument();
    fireEvent.click(within(membersDialog).getByRole("button", { name: "Confirm removal" }));
    expect(mocks.send).toHaveBeenCalledWith({
      type: "remove_member",
      roomId: "trip-1",
      memberId: "former-member",
    });
  });

  it("does not send an item when its name is blank", () => {
    mocks.account = {
      id: "account-1",
      displayName: "Account Name",
      email: "alex@example.com",
    };
    render(<Room roomId="trip-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("sends a named item with default quantity and cost", () => {
    mocks.account = {
      id: "account-1",
      displayName: "Account Name",
      email: "alex@example.com",
    };
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
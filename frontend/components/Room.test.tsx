import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerMessage } from "@/types/messages";
import Room from "@/components/Room";

const mocks = vi.hoisted(() => ({
  messages: [] as unknown[],
  send: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    messages: mocks.messages as never[],
    send: mocks.send,
    connected: true,
  }),
}));

vi.mock("@/lib/guest", () => ({
  getGuestId: () => "guest-1",
  getDisplayName: () => "Casey",
  getRoomParticipantId: () => "participant-1",
  setDisplayName: vi.fn(),
  setRoomParticipantId: vi.fn(),
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
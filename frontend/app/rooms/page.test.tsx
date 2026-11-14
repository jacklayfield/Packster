import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MyRoomsPage from "@/app/rooms/page";

const mocks = vi.hoisted(() => ({
  account: { id: "owner-1", displayName: "Room Owner", email: "owner@example.com" } as
    | { id: string; displayName: string; email: string }
    | null,
  router: { replace: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("@/lib/auth", () => ({
  accountApiURL: "http://localhost:8080",
  useAccount: () => ({ account: mocks.account, isLoading: false }),
}));

describe("MyRoomsPage", () => {
  beforeEach(() => {
    mocks.account = { id: "owner-1", displayName: "Room Owner", email: "owner@example.com" };
    mocks.router.replace.mockReset();
  });

  afterEach(() => cleanup());

  it("lists owned rooms, navigates to a room, and deletes after confirmation", async () => {
    const fetchMock = vi.fn((_: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "DELETE") return Promise.resolve({ ok: true } as Response);
      return Promise.resolve({
        ok: true,
        json: async () => [{
          id: "room-1",
          name: "Weekend trip",
          description: "Camping",
          date: "2026-07-20",
          createdAt: "2026-07-01T10:00:00Z",
        }],
      } as Response);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MyRoomsPage />);

    const roomLink = await screen.findByRole("link", { name: /Weekend trip/ });
    expect(roomLink).toHaveAttribute("href", "/room/room-1");
    expect(screen.getByRole("link", { name: "Create new room" })).toHaveAttribute("href", "/create");

    fireEvent.click(screen.getByRole("button", { name: "Delete Weekend trip" }));
    const dialog = screen.getByRole("dialog", { name: "Delete this room?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete room" }));

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:8080/api/auth/rooms/room-1",
      { method: "DELETE", credentials: "include" },
    ));
    await waitFor(() => expect(screen.queryByRole("link", { name: /Weekend trip/ })).not.toBeInTheDocument());
  });
});

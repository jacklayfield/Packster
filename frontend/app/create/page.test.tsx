import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateRoomPage from "@/app/create/page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  account: { id: "owner-1", displayName: "Room Owner", email: "owner@example.com" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth", () => ({
  useAccount: () => ({ account: mocks.account, isLoading: false }),
}));

describe("CreateRoomPage", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    window.sessionStorage.clear();
    vi.stubGlobal("crypto", { randomUUID: () => "room-id" });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("allows the trip name to be changed and saves it when creating the room", () => {
    render(<CreateRoomPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "Trip name" }), {
      target: { value: "Alaska adventure" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Budget" }), {
      target: { value: "500" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "A week in Alaska" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Trip Room" }));

    expect(JSON.parse(window.sessionStorage.getItem("packster-create:roomid") ?? "{}")).toMatchObject({
      roomName: "Alaska adventure",
      budget: "500",
      description: "A week in Alaska",
    });
    expect(mocks.push).toHaveBeenCalledWith("/room/roomid");
  });
});

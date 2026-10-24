import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/components/Home";

const mocks = vi.hoisted(() => ({
  account: null as { id: string; displayName: string; email: string } | null,
}));

vi.mock("@/lib/auth", () => ({
  useAccount: () => ({ account: mocks.account, isLoading: false }),
}));

vi.mock("@/lib/guest", () => ({
  getDisplayName: () => "Guest Name",
  setDisplayName: vi.fn(),
}));

describe("Home", () => {
  afterEach(() => {
    cleanup();
    mocks.account = null;
  });

  it("shows account access to guests", () => {
    render(<Home onJoin={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Create an account or sign in (optional)" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What should we call you?")).toHaveValue("Guest Name");
  });

  it("uses the account display name and changes account access to My account", () => {
    mocks.account = {
      id: "account-1",
      displayName: "Account Name",
      email: "alex@example.com",
    };
    const onJoin = vi.fn();

    render(<Home onJoin={onJoin} />);

    expect(screen.getByText("Signed in as Account Name")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Display name" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My account" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Create Room" })[1]);

    expect(onJoin).toHaveBeenCalledWith("", "My Trip");
  });
});

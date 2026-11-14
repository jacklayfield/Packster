import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PreferencesPage from "@/app/preferences/page";
import { PreferencesProvider } from "@/lib/preferences";

describe("PreferencesPage", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark", "reduce-motion");
  });

  it("applies and persists appearance and reduced-motion preferences", async () => {
    render(
      <PreferencesProvider>
        <PreferencesPage />
      </PreferencesProvider>,
    );

    await waitFor(() => expect(screen.getByRole("radio", { name: /System/ })).toBeChecked());
    fireEvent.click(screen.getByRole("radio", { name: /Dark/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Reduce motion/ }));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark", "reduce-motion");
    });
    expect(JSON.parse(window.localStorage.getItem("packster-preferences") ?? "{}")).toEqual({
      theme: "dark",
      reduceMotion: true,
    });
  });
});

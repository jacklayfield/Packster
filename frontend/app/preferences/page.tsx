"use client";

import Link from "next/link";
import { usePreferences, type ThemePreference } from "@/lib/preferences";

const themeOptions: { value: ThemePreference; label: string; description: string }[] = [
  { value: "system", label: "System", description: "Follow your device's appearance." },
  { value: "light", label: "Light", description: "Use the light appearance." },
  { value: "dark", label: "Dark", description: "Use the dark appearance." },
];

export default function PreferencesPage() {
  const { preferences, updatePreferences } = usePreferences();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-300 to-purple-200 px-4 py-12 font-sans">
      <section className="mx-auto w-full max-w-2xl rounded-3xl bg-white/95 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">Your preferences</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Preferences</h1>
        <p className="mt-2 text-sm text-slate-600">These settings are saved in this browser.</p>

        <fieldset className="mt-8">
          <legend className="text-lg font-semibold text-slate-800">Appearance</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {themeOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  preferences.theme === option.value
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="theme"
                    value={option.value}
                    checked={preferences.theme === option.value}
                    onChange={() => updatePreferences({ ...preferences, theme: option.value })}
                    className="accent-blue-600"
                  />
                  {option.label}
                </span>
                <span className="mt-2 block text-sm text-slate-600">{option.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="mt-8 rounded-2xl border border-slate-200 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={(event) => updatePreferences({ ...preferences, reduceMotion: event.target.checked })}
              className="mt-1 accent-blue-600"
            />
            <span>
              <span className="block font-semibold text-slate-800">Reduce motion</span>
              <span className="mt-1 block text-sm text-slate-600">
                Minimize animations and transitions throughout Packster.
              </span>
            </span>
          </label>
        </section>

        <Link href="/" className="mt-8 inline-block text-sm font-semibold text-blue-600 hover:underline">
          Back to Packster
        </Link>
      </section>
    </main>
  );
}

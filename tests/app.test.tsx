import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "./native-render";
import App from "../src/App";
import { db } from "../src/db/database";

describe("App", () => {
  beforeEach(async () => { await db.delete(); window.location.hash = "#/library"; localStorage.clear(); });
  afterEach(async () => { cleanup(); await db.delete(); });

  it("初回起動でCC0サンプルを表示する", async () => {
    render(<App />);
    await waitFor(() => expect(document.querySelector('[data-tour-id="manual-author"]')).not.toBeNull());
    expect(document.querySelector(".sidebar .course-switch")).toBeNull();
    fireEvent.click(document.querySelector('[data-tour-id="manual-author"]')!);
    await waitFor(() => expect(screen.getAllByText("算数の基礎").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Web安全の基礎").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ITパスポート").length).toBeGreaterThan(0);
    expect(screen.getAllByText("基本情報技術者").length).toBeGreaterThan(0);
    expect(screen.getAllByText("応用情報技術者").length).toBeGreaterThan(0);
    expect(screen.getAllByText("第二種電気工事士").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "教材をつくる" })).toBeInTheDocument();
  });
});

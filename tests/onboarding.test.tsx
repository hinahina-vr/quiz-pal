import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../src/db/database";
import { Onboarding } from "../src/features/onboarding/Onboarding";
import { cleanup, fireEvent, render, screen, waitFor } from "./native-render";

function renderTour(force = false) {
  return render(<>
    <button data-tour-id="library-choice">作り方</button>
    <button data-tour-id="ai-author">AI</button>
    <button data-tour-id="manual-author">手動</button>
    <button data-tour-id="data">データ</button>
    <button data-tour-id="practice">クイズ</button>
    <button data-tour-id="guide">ガイド</button>
    <Onboarding force={force} onClose={vi.fn()} />
  </>);
}

describe("Onboarding", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    window.location.hash = "#/library";
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("更新後の初回表示で現在の操作場所を順番に案内する", async () => {
    await db.settings.put({ key: "onboardingCompletedVersion", value: 3 });
    renderTour();

    expect(await screen.findByRole("dialog", { name: "教材管理へようこそ" })).toBeInTheDocument();
    for (const title of [
      "AIに相談して下書きを作る",
      "順番に手動で編集する",
      "取込・保存・復元をまとめて管理",
      "できた教材で学習する",
      "困ったらガイドをもう一度",
    ]) {
      fireEvent.click(screen.getByRole("button", { name: "次へ" }));
      expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
      if (title === "AIに相談して下書きを作る") {
        expect(screen.getByText(/AI機能の利用にはAPIキーの登録が必要です/)).toBeInTheDocument();
      }
    }

    fireEvent.click(screen.getByRole("button", { name: "使ってみる" }));
    await waitFor(async () => expect((await db.settings.get("onboardingCompletedVersion"))?.value).toBe(4));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("完了後でもガイド操作から再表示できる", async () => {
    await db.settings.put({ key: "onboardingCompletedVersion", value: 4 });
    renderTour(true);
    expect(await screen.findByRole("dialog", { name: "教材管理へようこそ" })).toBeInTheDocument();
  });
});

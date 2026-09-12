import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataDialog } from "../src/features/backup/DataDialog";
import type { LibrarySnapshot } from "../src/domain/types";
import { cleanup, fireEvent, render, screen, waitFor } from "./native-render";

const snapshot: LibrarySnapshot = {
  subjects: Array.from({ length: 2 }, (_, index) => ({ id: `s${index}`, name: `科目${index}`, description: "", color: "#157", order: index, createdAt: "", updatedAt: "" })),
  sections: Array.from({ length: 3 }, (_, index) => ({ id: `c${index}`, subjectId: "s0", name: `節${index}`, description: "", order: index, createdAt: "", updatedAt: "" })),
  questions: [],
  attempts: [],
  questionStates: [],
  studySessions: [],
};

describe("DataDialog", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) { this.setAttribute("open", ""); });
    HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) { this.removeAttribute("open"); });
  });
  afterEach(cleanup);

  it("バックアップ画面に全データ概要と専用ファイル選択を表示する", async () => {
    render(<DataDialog open onClose={() => undefined} snapshot={snapshot} reload={async () => undefined} announce={() => undefined} />);
    fireEvent.click(await screen.findByRole("tab", { name: /バックアップ/ }));

    await waitFor(() => expect(screen.getByText("全データを、ひとつのファイルで。")).toBeInTheDocument());
    const overview = screen.getByLabelText("現在の教材データ");
    expect(overview).toHaveTextContent("2科目");
    expect(overview).toHaveTextContent("3セクション");
    expect(screen.getByText("バックアップJSONを選択")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /完全バックアップを保存/ })).toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "./native-render";
import type { LibrarySnapshot } from "../src/domain/types";
import { LibraryView } from "../src/features/library/LibraryView";
import { sampleQuestions, sampleSections, sampleSubjects } from "../src/samples/sampleData";

const snapshot: LibrarySnapshot = {
  subjects: sampleSubjects.slice(0, 1),
  sections: sampleSections.filter((item) => item.subjectId === sampleSubjects[0].id),
  questions: sampleQuestions.filter((item) => item.sectionId === "sample-arithmetic"),
  attempts: [],
  questionStates: [],
  studySessions: [],
};

afterEach(cleanup);

describe("LibraryView", () => {
  it("最初はAI作成と手動編集の2択だけを表示する", () => {
    render(<LibraryView snapshot={snapshot} reload={vi.fn()} announce={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "どちらの方法でつくりますか？" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AIに丸投げ/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /手動で編集/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "科目を選ぶ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "セクションを選ぶ" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "問題を編集する" })).not.toBeInTheDocument();
  });

  it("手動編集では科目、セクション、問題を1画面ずつ進める", async () => {
    const user = userEvent.setup();
    render(<LibraryView snapshot={snapshot} reload={vi.fn()} announce={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /手動で編集/ }));
    expect(screen.getByRole("heading", { name: "科目を選ぶ" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "セクションを選ぶ" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /セクションを編集/ }));
    expect(screen.getByRole("heading", { name: "セクションを選ぶ" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "科目を選ぶ" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /問題を編集/ }));
    expect(screen.getByRole("heading", { name: "問題を編集する" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "セクションを選ぶ" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "← セクションへ戻る" }));
    expect(screen.getByRole("heading", { name: "セクションを選ぶ" })).toBeInTheDocument();
  });

  it("手動編集から作り方の選択へ戻れる", async () => {
    const user = userEvent.setup();
    render(<LibraryView snapshot={snapshot} reload={vi.fn()} announce={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /手動で編集/ }));
    await user.click(screen.getByRole("button", { name: "← 作り方を選び直す" }));

    expect(screen.getByRole("heading", { name: "どちらの方法でつくりますか？" })).toBeInTheDocument();
  });
});

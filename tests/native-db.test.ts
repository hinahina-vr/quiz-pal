import { afterEach, describe, expect, it } from "vitest";
import { NativeDatabase, type EntityTable } from "../src/native-db";

type Row = { id: string; value: number };

class TestDatabase extends NativeDatabase {
  rows!: EntityTable<Row, "id">;
  constructor() {
    super("local-quiz-studio-native-db-test");
    this.version(1).stores({ rows: "id, value" });
  }
}

const database = new TestDatabase();

afterEach(async () => database.delete());

describe("native IndexedDB transaction", () => {
  it("commits all writes together", async () => {
    await database.transaction("rw", database.rows, async () => {
      await database.rows.add({ id: "a", value: 1 });
      await database.rows.add({ id: "b", value: 2 });
    });
    expect(await database.rows.count()).toBe(2);
  });

  it("rolls back every write when the callback fails", async () => {
    await expect(database.transaction("rw", database.rows, async () => {
      await database.rows.add({ id: "a", value: 1 });
      throw new Error("stop");
    })).rejects.toThrow("stop");
    expect(await database.rows.count()).toBe(0);
  });
});

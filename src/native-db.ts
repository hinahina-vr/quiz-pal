/* Minimal IndexedDB data layer tailored to Local Quiz Studio. */
type Key = IDBValidKey;
type Mode = "readonly" | "readwrite";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB operation failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error || new Error("IndexedDB transaction failed.")), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error || new Error("IndexedDB transaction aborted.")), { once: true });
  });
}

type Predicate<T> = (value: T) => boolean;

class NativeQuery<T extends object> {
  constructor(private table: EntityTable<T, keyof T>, private predicate: Predicate<T>) {}
  async toArray(): Promise<T[]> { return (await this.table.toArray()).filter(this.predicate); }
  async primaryKeys(): Promise<Key[]> { return (await this.toArray()).map((item) => item[this.table.keyPath] as Key); }
  async count(): Promise<number> { return (await this.toArray()).length; }
  async delete(): Promise<void> { await this.table.bulkDelete(await this.primaryKeys()); }
  async sortBy(field: keyof T): Promise<T[]> {
    return (await this.toArray()).sort((a, b) => String(a[field] ?? "").localeCompare(String(b[field] ?? ""), "ja", { numeric: true }));
  }
}

class NativeWhere<T extends object> {
  constructor(private table: EntityTable<T, keyof T>, private field: keyof T) {}
  equals(value: unknown) { return new NativeQuery(this.table, (item) => Object.is(item[this.field], value)); }
  anyOf(values: unknown[]) {
    const accepted = new Set(values);
    return new NativeQuery(this.table, (item) => accepted.has(item[this.field]));
  }
}

class NativeCollection<T extends object> {
  constructor(private table: EntityTable<T, keyof T>) {}
  async primaryKeys(): Promise<Key[]> { return (await this.table.toArray()).map((item) => item[this.table.keyPath] as Key); }
}

class NativeOrder<T extends object> {
  constructor(private table: EntityTable<T, keyof T>, private field: keyof T) {}
  async toArray(): Promise<T[]> {
    return (await this.table.toArray()).sort((a, b) => {
      const left = a[this.field];
      const right = b[this.field];
      if (typeof left === "number" && typeof right === "number") return left - right;
      return String(left ?? "").localeCompare(String(right ?? ""), "ja", { numeric: true });
    });
  }
}

export class EntityTable<T extends object, K extends keyof T> {
  constructor(private database: NativeDatabase, readonly name: string, readonly keyPath: K) {}

  private async store(mode: Mode): Promise<{ store: IDBObjectStore; transaction: IDBTransaction; owned: boolean }> {
    const active = this.database.activeStore(this.name, mode);
    if (active) return { store: active.objectStore(this.name), transaction: active, owned: false };
    const database = await this.database.open();
    const transaction = database.transaction(this.name, mode);
    return { store: transaction.objectStore(this.name), transaction, owned: true };
  }

  async get(key: Key): Promise<T | undefined> {
    const { store } = await this.store("readonly");
    return await requestResult(store.get(key)) as T | undefined;
  }

  async add(value: T): Promise<Key> {
    const { store, transaction, owned } = await this.store("readwrite");
    const request = store.add(value);
    const result = await requestResult(request);
    if (owned) await transactionDone(transaction);
    return result;
  }

  async put(value: T): Promise<Key> {
    const { store, transaction, owned } = await this.store("readwrite");
    const result = await requestResult(store.put(value));
    if (owned) await transactionDone(transaction);
    return result;
  }

  private async many(values: T[], method: "add" | "put"): Promise<void> {
    if (!values.length) return;
    const { store, transaction, owned } = await this.store("readwrite");
    const requests = values.map((value) => requestResult(method === "add" ? store.add(value) : store.put(value)));
    await Promise.all(requests);
    if (owned) await transactionDone(transaction);
  }

  async bulkAdd(values: T[]): Promise<void> { await this.many(values, "add"); }
  async bulkPut(values: T[]): Promise<void> { await this.many(values, "put"); }

  async toArray(): Promise<T[]> {
    const { store } = await this.store("readonly");
    return await requestResult(store.getAll()) as T[];
  }

  async count(): Promise<number> {
    const { store } = await this.store("readonly");
    return await requestResult(store.count());
  }

  async delete(key: Key): Promise<void> {
    const { store, transaction, owned } = await this.store("readwrite");
    store.delete(key);
    if (owned) await transactionDone(transaction);
  }

  async bulkDelete(keys: Key[]): Promise<void> {
    if (!keys.length) return;
    const { store, transaction, owned } = await this.store("readwrite");
    keys.forEach((key) => store.delete(key));
    if (owned) await transactionDone(transaction);
  }

  async clear(): Promise<void> {
    const { store, transaction, owned } = await this.store("readwrite");
    store.clear();
    if (owned) await transactionDone(transaction);
  }

  async update(key: Key, patch: Partial<T>): Promise<number> {
    const current = await this.get(key);
    if (!current) return 0;
    await this.put({ ...current, ...patch });
    return 1;
  }

  where(field: keyof T) { return new NativeWhere(this as EntityTable<T, keyof T>, field); }
  filter(predicate: Predicate<T>) { return new NativeQuery(this as EntityTable<T, keyof T>, predicate); }
  orderBy(field: keyof T) { return new NativeOrder(this as EntityTable<T, keyof T>, field); }
  toCollection() { return new NativeCollection(this as EntityTable<T, keyof T>); }
}

export class NativeDatabase {
  private definitions = new Map<string, string>();
  private databasePromise: Promise<IDBDatabase> | null = null;
  private database: IDBDatabase | null = null;
  private active: { transaction: IDBTransaction; mode: Mode; stores: Set<string> } | null = null;
  [tableName: string]: unknown;

  constructor(readonly name: string) {}

  version(_version: number) {
    return {
      stores: (definitions: Record<string, string>) => {
        for (const [name, definition] of Object.entries(definitions)) {
          this.definitions.set(name, definition);
          const keyPath = definition.split(",")[0].trim().replace(/^&/, "");
          (this as Record<string, unknown>)[name] = new EntityTable<any, any>(this, name, keyPath);
        }
        return this;
      },
    };
  }

  open(): Promise<IDBDatabase> {
    if (this.database) return Promise.resolve(this.database);
    if (this.databasePromise) return this.databasePromise;
    this.databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name);
      request.onupgradeneeded = () => {
        const database = request.result;
        for (const [name, definition] of this.definitions) {
          if (database.objectStoreNames.contains(name)) continue;
          const keyPath = definition.split(",")[0].trim().replace(/^&/, "");
          database.createObjectStore(name, { keyPath });
        }
      };
      request.onsuccess = () => {
        this.database = request.result;
        this.database.onversionchange = () => { this.database?.close(); this.database = null; this.databasePromise = null; };
        resolve(request.result);
      };
      request.onerror = () => { this.databasePromise = null; reject(request.error || new Error("データベースを開けませんでした。")); };
      request.onblocked = () => { this.databasePromise = null; reject(new Error("別のタブがデータベースを使用しています。閉じてから再試行してください。")); };
    });
    return this.databasePromise;
  }

  table(name: string): EntityTable<any, any> {
    const table = (this as Record<string, unknown>)[name];
    if (!(table instanceof EntityTable)) throw new Error(`Unknown table: ${name}`);
    return table as EntityTable<any, any>;
  }

  activeStore(name: string, mode: Mode): IDBTransaction | null {
    if (!this.active || !this.active.stores.has(name)) return null;
    if (mode === "readwrite" && this.active.mode !== "readwrite") return null;
    return this.active.transaction;
  }

  async transaction(modeName: string, ...args: unknown[]): Promise<unknown> {
    const callback = args.at(-1);
    if (typeof callback !== "function") throw new Error("Transaction callback is required.");
    if (this.active) return await (callback as () => unknown)();
    const tables = args.slice(0, -1).filter((value): value is EntityTable<any, any> => value instanceof EntityTable);
    const stores = [...new Set(tables.map((table) => table.name))];
    if (!stores.length) return await (callback as () => unknown)();
    const database = await this.open();
    const mode: Mode = modeName.includes("w") ? "readwrite" : "readonly";
    const transaction = database.transaction(stores, mode);
    const completion = transactionDone(transaction);
    this.active = { transaction, mode, stores: new Set(stores) };
    try {
      const result = await (callback as () => unknown)();
      await completion;
      return result;
    } catch (error) {
      try { transaction.abort(); } catch { /* already completed or aborted */ }
      try { await completion; } catch { /* preserve the original callback error */ }
      throw error;
    } finally {
      this.active = null;
    }
  }

  close() {
    this.database?.close();
    this.database = null;
    this.databasePromise = null;
  }

  async delete(): Promise<void> {
    this.close();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("データベースを削除できませんでした。"));
      request.onblocked = () => reject(new Error("別のタブがデータベースを使用しています。"));
    });
  }
}

declare namespace React {
  type CSSProperties = Record<string, string | number | undefined>;
  type FormEvent = Event & { currentTarget: HTMLFormElement };
}

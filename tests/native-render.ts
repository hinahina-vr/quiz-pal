import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { createRoot } from "../src/native-ui/core";

type NativeRoot = ReturnType<typeof createRoot>;
const mountedRoots = new Set<NativeRoot>();

export function render(view: unknown) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mountedRoots.add(root);
  root.render(view as never);
  return {
    container,
    unmount() {
      root.unmount();
      mountedRoots.delete(root);
      container.remove();
    },
  };
}

export function cleanup() {
  mountedRoots.forEach((root) => root.unmount());
  mountedRoots.clear();
  document.body.replaceChildren();
}

export { fireEvent, screen, waitFor };

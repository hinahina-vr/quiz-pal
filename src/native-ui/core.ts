/* A deliberately small UI runtime for this application. Browser APIs only. */
export type CSSProperties = Record<string, string | number | undefined>;
type DependencyList = readonly unknown[];
type StateAction<T> = T | ((previous: T) => T);
type RefObject<T> = { current: T };
type EffectRecord = { deps?: DependencyList; nextDeps?: DependencyList; callback?: () => void | (() => void); cleanup?: void | (() => void); pending?: boolean };
type ComponentInstance = { hooks: unknown[]; hookIndex: number; effects: EffectRecord[]; visited: boolean };
type Props = Record<string, unknown> & { children?: unknown; key?: string | number };
type VNode = { type: unknown; props: Props; key?: string | number; dom?: Node; rendered?: VNode; children?: VNode[]; path?: string };
export type ReturnTypePlaceholder = VNode;
type Root = {
  id: number;
  host: Element;
  source: VNode | null;
  current: VNode | null;
  scheduled: boolean;
  render(vnode: VNode): void;
  unmount(): void;
};

export const Fragment = Symbol("native-ui-fragment");
export function StrictMode(props: Props): any { return props.children; }
export function Suspense(props: Props): any { return props.children; }

const roots = new Set<Root>();
const instances = new Map<string, ComponentInstance>();
let nextRootId = 1;
let activeInstance: ComponentInstance | null = null;
let activeRoot: Root | null = null;

function dependenciesChanged(previous?: DependencyList, next?: DependencyList) {
  if (!previous || !next || previous.length !== next.length) return true;
  return previous.some((item, index) => !Object.is(item, next[index]));
}

function schedule(root = activeRoot) {
  if (!root || root.scheduled) return;
  root.scheduled = true;
  queueMicrotask(() => { root.scheduled = false; if (root.source) updateRoot(root); });
}

function hookInstance() {
  if (!activeInstance) throw new Error("Hooks can only be used while rendering a component.");
  return activeInstance;
}

export function useState<T>(initial: T | (() => T)): [T, (action: StateAction<T>) => void] {
  const instance = hookInstance();
  const index = instance.hookIndex++;
  if (!instance.hooks[index]) {
    const record = { value: typeof initial === "function" ? (initial as () => T)() : initial };
    const root = activeRoot;
    const setValue = (action: StateAction<T>) => {
      const next = typeof action === "function" ? (action as (value: T) => T)(record.value) : action;
      if (Object.is(next, record.value)) return;
      record.value = next;
      schedule(root);
    };
    instance.hooks[index] = { record, setValue };
  }
  const state = instance.hooks[index] as { record: { value: T }; setValue: (action: StateAction<T>) => void };
  return [state.record.value, state.setValue];
}

export function useRef<T>(initial: T): RefObject<T>;
export function useRef<T>(initial: T | null): RefObject<T | null>;
export function useRef<T>(initial: T | null): RefObject<T | null> {
  const instance = hookInstance();
  const index = instance.hookIndex++;
  if (!instance.hooks[index]) instance.hooks[index] = { current: initial };
  return instance.hooks[index] as RefObject<T>;
}

export function useMemo<T>(factory: () => T, deps?: DependencyList): T {
  const instance = hookInstance();
  const index = instance.hookIndex++;
  const previous = instance.hooks[index] as { value: T; deps?: DependencyList } | undefined;
  if (!previous || dependenciesChanged(previous.deps, deps)) {
    const next = { value: factory(), deps };
    instance.hooks[index] = next;
    return next.value;
  }
  return previous.value;
}

export function useCallback<T extends (...args: never[]) => unknown>(callback: T, deps?: DependencyList): T {
  return useMemo(() => callback, deps);
}

export function useEffect(callback: () => void | (() => void), deps?: DependencyList) {
  const instance = hookInstance();
  const index = instance.hookIndex++;
  const record = instance.effects[index] || {};
  if (dependenciesChanged(record.deps, deps)) {
    record.callback = callback;
    record.nextDeps = deps;
    record.pending = true;
  }
  instance.effects[index] = record;
}

export function lazy(loader: () => Promise<{ default: (props: never) => unknown }>): any {
  let component: ((props: never) => unknown) | null = null;
  let loading: Promise<void> | null = null;
  return function LazyComponent(props: Props) {
    if (component) return component(props as never);
    if (!loading) loading = loader().then((module) => { component = module.default; roots.forEach((root) => schedule(root)); });
    return null;
  };
}

export function jsx(type: unknown, props: Props | null, key?: string | number): VNode { return { type, props: props || {}, key: key ?? props?.key }; }
export const jsxs = jsx;
export const jsxDEV = jsx;

function normalize(value: unknown): VNode {
  if (value === null || value === undefined || value === false || value === true) return { type: "#comment", props: {} };
  if (Array.isArray(value)) return { type: Fragment, props: { children: value } };
  if (typeof value === "string" || typeof value === "number") return { type: "#text", props: { nodeValue: String(value) } };
  return value as VNode;
}

function flatChildren(value: unknown): VNode[] {
  const output: VNode[] = [];
  const visit = (item: unknown) => { if (Array.isArray(item)) item.forEach(visit); else output.push(normalize(item)); };
  visit(value ?? []);
  return output;
}

function componentPath(parentPath: string, vnode: VNode, index = 0) {
  const name = typeof vnode.type === "function" ? (vnode.type as Function).name || "component" : String(vnode.type);
  return `${parentPath}/${vnode.key ?? `${name}:${index}`}`;
}

function renderComponent(vnode: VNode, path: string): VNode {
  let instance = instances.get(path);
  if (!instance) { instance = { hooks: [], hookIndex: 0, effects: [], visited: true }; instances.set(path, instance); }
  instance.visited = true;
  instance.hookIndex = 0;
  const previous = activeInstance;
  activeInstance = instance;
  try { return normalize((vnode.type as (props: Props) => unknown)({ ...vnode.props, children: vnode.props.children })); }
  finally { activeInstance = previous; }
}

function eventName(prop: string, node: Element) {
  if (prop === "onDoubleClick") return "dblclick";
  if (prop === "onChange") return node instanceof HTMLSelectElement ? "change" : "input";
  return prop.slice(2).toLowerCase();
}

function setStyle(element: HTMLElement, previous: unknown, next: unknown) {
  const oldStyle = (previous || {}) as CSSProperties;
  const newStyle = (next || {}) as CSSProperties;
  for (const name of Object.keys(oldStyle)) if (!(name in newStyle)) element.style.removeProperty(name.startsWith("--") ? name : name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`));
  for (const [name, value] of Object.entries(newStyle)) {
    const property = name.startsWith("--") ? name : name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    element.style.setProperty(property, typeof value === "number" && !["opacity", "zIndex", "fontWeight", "order", "flex", "scale"].includes(name) ? `${value}px` : String(value ?? ""));
  }
}

function setProperty(element: Element, name: string, previous: unknown, next: unknown) {
  if (name === "children" || name === "key" || name === "dangerouslySetInnerHTML") return;
  if (name === "className") { element.setAttribute("class", String(next || "")); return; }
  if (name === "htmlFor") { element.setAttribute("for", String(next || "")); return; }
  if (name === "style" && element instanceof HTMLElement) { setStyle(element, previous, next); return; }
  if (name === "ref") {
    if (previous && previous !== next && typeof previous === "object") (previous as RefObject<Element | null>).current = null;
    if (next && typeof next === "object") (next as RefObject<Element | null>).current = element;
    return;
  }
  if (/^on[A-Z]/.test(name)) {
    const target = element as Element & { __nativeHandlers?: Record<string, EventListener>; __nativeProps?: Props };
    const handlers = (target.__nativeHandlers ||= {});
    const event = eventName(name, element);
    if (!handlers[event]) {
      handlers[event] = ((domEvent: Event) => {
        const current = target.__nativeProps?.[name];
        if (typeof current === "function") (current as (event: Event) => void)(domEvent);
      }) as EventListener;
      element.addEventListener(event, handlers[event]);
    }
    return;
  }
  if (["disabled", "hidden", "checked", "selected", "multiple", "required", "readOnly", "open"].includes(name)) {
    (element as unknown as Record<string, unknown>)[name] = Boolean(next);
    const attribute = name === "readOnly" ? "readonly" : name;
    if (next) element.setAttribute(attribute, ""); else element.removeAttribute(attribute);
    return;
  }
  if (name === "value" && "value" in element) {
    const value = String(next ?? "");
    if ((element as HTMLInputElement).value !== value) (element as HTMLInputElement).value = value;
    return;
  }
  if (next === null || next === undefined || next === false) element.removeAttribute(name);
  else element.setAttribute(name, next === true ? "" : String(next));
}

function updateProperties(element: Element, previous: Props, next: Props) {
  (element as Element & { __nativeProps?: Props }).__nativeProps = next;
  const names = new Set([...Object.keys(previous), ...Object.keys(next)]);
  names.forEach((name) => { if (!Object.is(previous[name], next[name])) setProperty(element, name, previous[name], next[name]); });
}

function mount(vnodeInput: VNode, parent: Node, path: string, index = 0, before: Node | null = null): VNode {
  const vnode = normalize(vnodeInput);
  vnode.path = path;
  if (typeof vnode.type === "function") {
    const childPath = componentPath(path, vnode, index);
    vnode.rendered = mount(renderComponent(vnode, childPath), parent, childPath, 0, before);
    vnode.dom = vnode.rendered.dom;
    return vnode;
  }
  if (vnode.type === Fragment) {
    const wrapper = document.createElement("span");
    wrapper.style.display = "contents";
    parent.insertBefore(wrapper, before);
    vnode.dom = wrapper;
    vnode.children = flatChildren(vnode.props.children).map((child, childIndex) => mount(child, wrapper, componentPath(path, child, childIndex), childIndex));
    return vnode;
  }
  if (vnode.type === "#text") { const node = document.createTextNode(String(vnode.props.nodeValue || "")); parent.insertBefore(node, before); vnode.dom = node; return vnode; }
  if (vnode.type === "#comment") { const node = document.createComment(""); parent.insertBefore(node, before); vnode.dom = node; return vnode; }
  const element = document.createElement(String(vnode.type));
  parent.insertBefore(element, before);
  vnode.dom = element;
  updateProperties(element, {}, vnode.props);
  const rawHtml = (vnode.props.dangerouslySetInnerHTML as { __html?: string } | undefined)?.__html;
  if (rawHtml !== undefined) element.innerHTML = rawHtml;
  else vnode.children = flatChildren(vnode.props.children).map((child, childIndex) => mount(child, element, componentPath(path, child, childIndex), childIndex));
  return vnode;
}

function sameType(previous: VNode, next: VNode) { return previous.type === next.type && previous.key === next.key; }

function patch(previousInput: VNode, nextInput: VNode, parent: Node, path: string, index = 0): VNode {
  const previous = normalize(previousInput);
  const next = normalize(nextInput);
  next.path = path;
  if (!sameType(previous, next)) {
    const mounted = mount(next, parent, path, index, previous.dom || null);
    if (previous.dom?.parentNode) previous.dom.parentNode.removeChild(previous.dom);
    return mounted;
  }
  if (typeof next.type === "function") {
    const childPath = componentPath(path, next, index);
    next.rendered = patch(previous.rendered || normalize(null), renderComponent(next, childPath), parent, childPath, 0);
    next.dom = next.rendered.dom;
    return next;
  }
  next.dom = previous.dom;
  if (next.type === "#text") {
    if (previous.props.nodeValue !== next.props.nodeValue && next.dom) next.dom.nodeValue = String(next.props.nodeValue || "");
    return next;
  }
  if (next.type === "#comment") return next;
  const element = next.dom as Element;
  updateProperties(element, previous.props, next.props);
  const oldHtml = (previous.props.dangerouslySetInnerHTML as { __html?: string } | undefined)?.__html;
  const newHtml = (next.props.dangerouslySetInnerHTML as { __html?: string } | undefined)?.__html;
  if (newHtml !== undefined) { if (oldHtml !== newHtml) element.innerHTML = newHtml; next.children = []; return next; }
  const oldChildren = previous.children || [];
  const newChildren = flatChildren(next.props.children);
  const patched: VNode[] = [];
  const length = Math.max(oldChildren.length, newChildren.length);
  for (let childIndex = 0; childIndex < length; childIndex += 1) {
    const oldChild = oldChildren[childIndex];
    const newChild = newChildren[childIndex];
    if (!newChild) { if (oldChild?.dom?.parentNode) oldChild.dom.parentNode.removeChild(oldChild.dom); continue; }
    const childPath = componentPath(path, newChild, childIndex);
    patched.push(oldChild ? patch(oldChild, newChild, element, childPath, childIndex) : mount(newChild, element, childPath, childIndex));
  }
  next.children = patched;
  return next;
}

function flushEffects() {
  instances.forEach((instance, path) => {
    if (!instance.visited) { instance.effects.forEach((effect) => effect.cleanup?.()); instances.delete(path); return; }
    instance.effects.forEach((effect) => {
      if (!effect.pending || !effect.callback) return;
      effect.cleanup?.();
      effect.cleanup = effect.callback();
      effect.deps = effect.nextDeps;
      effect.pending = false;
    });
  });
}

function updateRoot(root: Root) {
  instances.forEach((instance) => { instance.visited = false; });
  const previousRoot = activeRoot;
  activeRoot = root;
  try {
    const fresh = root.source ? { ...root.source, props: { ...root.source.props } } : normalize(null);
    const rootPath = `root:${root.id}`;
    root.current = root.current ? patch(root.current, fresh, root.host, rootPath) : mount(fresh, root.host, rootPath);
  } finally { activeRoot = previousRoot; }
  queueMicrotask(flushEffects);
}

export function createRoot(host: Element) {
  const id = nextRootId++;
  const root: Root = {
    id,
    host,
    source: null,
    current: null,
    scheduled: false,
    render(vnode: VNode) { root.source = vnode; updateRoot(root); },
    unmount() {
      const prefix = `root:${id}`;
      instances.forEach((instance, path) => {
        if (!path.startsWith(prefix)) return;
        instance.effects.forEach((effect) => effect.cleanup?.());
        instances.delete(path);
      });
      host.replaceChildren();
      root.source = null;
      root.current = null;
      roots.delete(root);
    },
  };
  roots.add(root);
  return root;
}

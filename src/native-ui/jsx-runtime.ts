export { Fragment, jsx, jsxs, jsxDEV } from "./core";

declare global {
  namespace JSX {
    type Element = import("./core").ReturnTypePlaceholder;
    interface IntrinsicAttributes { key?: string | number; }
    interface NativeElementProps {
      [property: string]: any;
      onCancel?: (event: any) => any;
      onChange?: (event: any) => any;
      onClick?: (event: any) => any;
      onClose?: (event: any) => any;
      onInput?: (event: any) => any;
      onKeyDown?: (event: any) => any;
      onSubmit?: (event: any) => any;
    }
    interface IntrinsicElements { [elementName: string]: NativeElementProps; }
  }
}

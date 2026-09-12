import { StrictMode, createRoot } from "native-ui";
import App from "./App";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

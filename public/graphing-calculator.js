(function () {
  "use strict";

  const DEFAULT_COLORS = ["#2d8cff", "#e04f5f", "#26a269", "#a45ee5", "#f39c12", "#00a7a7"];
  const FUNCTION_NAMES = new Set(["sin", "cos", "tan", "log", "ln", "exp", "sqrt", "abs"]);
  const NAME_TOKENS = ["sqrt", "sin", "cos", "tan", "log", "exp", "abs", "ln", "pi", "x", "e"];
  const CONSTANTS = {
    e: Math.E,
    pi: Math.PI,
  };

  class ParseError extends Error {
    constructor(message) {
      super(message);
      this.name = "ParseError";
    }
  }

  function stripHtml(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    return template.content.textContent || "";
  }

  function normalizeTeX(value) {
    let text = String(value || "");
    text = text.replace(/\\\(/g, "").replace(/\\\)/g, "").replace(/\\\[/g, "").replace(/\\\]/g, "");
    text = text.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1)/($2)");
    text = text.replace(/\\sqrt\s*\{([^{}]+)\}/g, "sqrt($1)");
    text = text.replace(/\\left|\\right/g, "");
    text = text.replace(/\\cdot|\\times/g, "*");
    text = text.replace(/\\pi/g, "pi");
    text = text.replace(/\\sin/g, "sin");
    text = text.replace(/\\cos/g, "cos");
    text = text.replace(/\\tan/g, "tan");
    text = text.replace(/\\log/g, "log");
    text = text.replace(/\\ln/g, "ln");
    text = text.replace(/\\exp/g, "exp");
    return text;
  }

  function normalizeExpressionText(value) {
    let text = stripHtml(value);
    text = normalizeTeX(text);
    text = text
      .replace(/[ｘＸ]/g, "x")
      .replace(/[＋]/g, "+")
      .replace(/[－−–]/g, "-")
      .replace(/[＊×・]/g, "*")
      .replace(/[／÷]/g, "/")
      .replace(/[＾]/g, "^")
      .replace(/√/g, "sqrt")
      .replace(/π/g, "pi")
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text;
  }

  function expressionFromText(value) {
    let text = expressionBodyFromText(value);
    if (!text) return null;
    if (/[ぁ-んァ-ヶ一-龠]/.test(text)) return null;
    if (/[∫∑∏lim]/i.test(text) && /∫|∑|∏|\\lim|\blim\b/i.test(text)) return null;
    if (text.includes("=")) return null;
    if (!/[xX]/.test(text)) return null;
    if (/[^0-9A-Za-z_.+\-*/^(),\s]/.test(text)) return null;
    try {
      compileExpression(text);
      return text.replace(/\s+/g, "");
    } catch {
      return null;
    }
  }

  function expressionBodyFromText(value) {
    let text = normalizeExpressionText(value);
    text = text.replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, "");
    text = text.replace(/^y\s*=\s*/i, "");
    return text;
  }

  function tokenize(source) {
    const input = String(source || "");
    const tokens = [];
    let index = 0;
    while (index < input.length) {
      const char = input[index];
      if (/\s/.test(char)) {
        index += 1;
        continue;
      }
      if (/[0-9.]/.test(char)) {
        const match = input.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
        if (!match) throw new ParseError("数値を読めません");
        tokens.push({ type: "number", value: Number(match[0]) });
        index += match[0].length;
        continue;
      }
      if (/[A-Za-z_]/.test(char)) {
        const knownName = knownNameAt(input, index);
        if (knownName) {
          tokens.push({ type: "name", value: knownName });
          index += knownName.length;
          continue;
        }
        const match = input.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
        if (!match) throw new ParseError("名前を読めません");
        tokens.push({ type: "name", value: match[0].toLowerCase() });
        index += match[0].length;
        continue;
      }
      if ("+-*/^(),".includes(char)) {
        tokens.push({ type: char, value: char });
        index += 1;
        continue;
      }
      throw new ParseError(`未対応の文字: ${char}`);
    }
    tokens.push({ type: "eof", value: "" });
    return tokens;
  }

  function knownNameAt(input, index) {
    const rest = input.slice(index).toLowerCase();
    return NAME_TOKENS.find((name) => rest.startsWith(name)) || "";
  }

  class Parser {
    constructor(source) {
      this.tokens = tokenize(source);
      this.index = 0;
    }

    current() {
      return this.tokens[this.index];
    }

    match(type) {
      if (this.current().type !== type) return false;
      this.index += 1;
      return true;
    }

    expect(type) {
      if (!this.match(type)) throw new ParseError(`${type} が必要です`);
    }

    parse() {
      const node = this.parseAdditive();
      if (this.current().type !== "eof") throw new ParseError("式の末尾に未対応の文字があります");
      return node;
    }

    parseAdditive() {
      let node = this.parseMultiplicative();
      while (this.current().type === "+" || this.current().type === "-") {
        const op = this.current().type;
        this.index += 1;
        node = { type: "binary", op, left: node, right: this.parseMultiplicative() };
      }
      return node;
    }

    parseMultiplicative() {
      let node = this.parsePower();
      while (true) {
        if (this.current().type === "*" || this.current().type === "/") {
          const op = this.current().type;
          this.index += 1;
          node = { type: "binary", op, left: node, right: this.parsePower() };
          continue;
        }
        if (this.startsImplicitFactor()) {
          node = { type: "binary", op: "*", left: node, right: this.parsePower() };
          continue;
        }
        return node;
      }
    }

    parsePower() {
      const node = this.parseUnary();
      if (!this.match("^")) return node;
      return { type: "binary", op: "^", left: node, right: this.parsePower() };
    }

    parseUnary() {
      if (this.match("+")) return this.parseUnary();
      if (this.match("-")) return { type: "unary", op: "-", value: this.parseUnary() };
      return this.parsePrimary();
    }

    parsePrimary() {
      const token = this.current();
      if (this.match("number")) return { type: "number", value: token.value };
      if (this.match("(")) {
        const node = this.parseAdditive();
        this.expect(")");
        return node;
      }
      if (token.type === "name") {
        this.index += 1;
        if (token.value === "x") return { type: "variable" };
        if (Object.hasOwn(CONSTANTS, token.value)) return { type: "constant", name: token.value, value: CONSTANTS[token.value] };
        if (FUNCTION_NAMES.has(token.value)) {
          let arg;
          if (this.match("(")) {
            arg = this.parseAdditive();
            this.expect(")");
          } else {
            arg = this.parseUnary();
          }
          return { type: "call", name: token.value, arg };
        }
        throw new ParseError(`未対応の名前: ${token.value}`);
      }
      throw new ParseError("式の形を読めません");
    }

    startsImplicitFactor() {
      const token = this.current();
      return token.type === "number" || token.type === "name" || token.type === "(";
    }
  }

  function evaluate(node, x) {
    switch (node.type) {
      case "number":
        return node.value;
      case "constant":
        return node.value;
      case "variable":
        return x;
      case "unary":
        return -evaluate(node.value, x);
      case "binary": {
        const left = evaluate(node.left, x);
        const right = evaluate(node.right, x);
        if (node.op === "+") return left + right;
        if (node.op === "-") return left - right;
        if (node.op === "*") return left * right;
        if (node.op === "/") return left / right;
        if (node.op === "^") return Math.pow(left, right);
        throw new ParseError("未対応の演算子です");
      }
      case "call": {
        const value = evaluate(node.arg, x);
        if (node.name === "sin") return Math.sin(value);
        if (node.name === "cos") return Math.cos(value);
        if (node.name === "tan") return Math.tan(value);
        if (node.name === "log" || node.name === "ln") return Math.log(value);
        if (node.name === "exp") return Math.exp(value);
        if (node.name === "sqrt") return Math.sqrt(value);
        if (node.name === "abs") return Math.abs(value);
        throw new ParseError("未対応の関数です");
      }
      default:
        throw new ParseError("式を評価できません");
    }
  }

  function compileExpression(source) {
    const ast = new Parser(source).parse();
    return (x) => evaluate(ast, x);
  }

  function parseExpressionAst(value) {
    const source = expressionBodyFromText(value);
    if (!source) throw new ParseError("式が空です");
    return new Parser(source).parse();
  }

  function expressionDerivative(value) {
    const ast = parseExpressionAst(value);
    return nodeToSource(simplifyNode(derivativeNode(ast)));
  }

  function expressionIntegral(value) {
    const ast = parseExpressionAst(value);
    return nodeToSource(simplifyNode(integralNode(ast)));
  }

  function numberNode(value) {
    return { type: "number", value };
  }

  function variableNode() {
    return { type: "variable" };
  }

  function unaryNode(value) {
    return { type: "unary", op: "-", value };
  }

  function binaryNode(op, left, right) {
    return { type: "binary", op, left, right };
  }

  function callNode(name, arg) {
    return { type: "call", name, arg };
  }

  function containsVariable(node) {
    if (!node) return false;
    if (node.type === "variable") return true;
    if (node.type === "number" || node.type === "constant") return false;
    if (node.type === "unary") return containsVariable(node.value);
    if (node.type === "binary") return containsVariable(node.left) || containsVariable(node.right);
    if (node.type === "call") return containsVariable(node.arg);
    return true;
  }

  function constantValue(node) {
    return containsVariable(node) ? null : evaluate(node, 0);
  }

  function derivativeNode(node) {
    switch (node.type) {
      case "number":
      case "constant":
        return numberNode(0);
      case "variable":
        return numberNode(1);
      case "unary":
        return unaryNode(derivativeNode(node.value));
      case "binary":
        return derivativeBinaryNode(node);
      case "call":
        return derivativeCallNode(node);
      default:
        throw new ParseError("微分できない式です");
    }
  }

  function derivativeBinaryNode(node) {
    const u = node.left;
    const v = node.right;
    const du = derivativeNode(u);
    const dv = derivativeNode(v);
    if (node.op === "+") return binaryNode("+", du, dv);
    if (node.op === "-") return binaryNode("-", du, dv);
    if (node.op === "*") return binaryNode("+", binaryNode("*", du, v), binaryNode("*", u, dv));
    if (node.op === "/") {
      return binaryNode(
        "/",
        binaryNode("-", binaryNode("*", du, v), binaryNode("*", u, dv)),
        binaryNode("^", v, numberNode(2))
      );
    }
    if (node.op === "^") {
      const exponent = constantValue(v);
      if (exponent !== null) {
        return binaryNode("*", binaryNode("*", numberNode(exponent), binaryNode("^", u, numberNode(exponent - 1))), du);
      }
      return binaryNode(
        "*",
        binaryNode("^", u, v),
        binaryNode("+", binaryNode("*", dv, callNode("ln", u)), binaryNode("/", binaryNode("*", v, du), u))
      );
    }
    throw new ParseError("微分できない演算です");
  }

  function derivativeCallNode(node) {
    const u = node.arg;
    const du = derivativeNode(u);
    if (node.name === "sin") return binaryNode("*", callNode("cos", u), du);
    if (node.name === "cos") return binaryNode("*", unaryNode(callNode("sin", u)), du);
    if (node.name === "tan") {
      return binaryNode("*", binaryNode("/", numberNode(1), binaryNode("^", callNode("cos", u), numberNode(2))), du);
    }
    if (node.name === "log" || node.name === "ln") return binaryNode("/", du, u);
    if (node.name === "exp") return binaryNode("*", callNode("exp", u), du);
    if (node.name === "sqrt") return binaryNode("/", du, binaryNode("*", numberNode(2), callNode("sqrt", u)));
    throw new ParseError("この関数は微分未対応です");
  }

  function integralNode(node) {
    switch (node.type) {
      case "number":
      case "constant":
        return binaryNode("*", node, variableNode());
      case "variable":
        return binaryNode("/", binaryNode("^", variableNode(), numberNode(2)), numberNode(2));
      case "unary":
        return unaryNode(integralNode(node.value));
      case "binary":
        return integralBinaryNode(node);
      case "call":
        return integralCallNode(node);
      default:
        throw new ParseError("積分できない式です");
    }
  }

  function integralBinaryNode(node) {
    const u = node.left;
    const v = node.right;
    if (node.op === "+") return binaryNode("+", integralNode(u), integralNode(v));
    if (node.op === "-") return binaryNode("-", integralNode(u), integralNode(v));
    if (node.op === "*") {
      const leftConstant = constantValue(u);
      const rightConstant = constantValue(v);
      if (leftConstant !== null) return binaryNode("*", numberNode(leftConstant), integralNode(v));
      if (rightConstant !== null) return binaryNode("*", numberNode(rightConstant), integralNode(u));
    }
    if (node.op === "/" && constantValue(v) !== null) {
      return binaryNode("/", integralNode(u), numberNode(constantValue(v)));
    }
    if (node.op === "^" && node.left.type === "variable") {
      const exponent = constantValue(node.right);
      if (exponent === -1) return callNode("ln", callNode("abs", variableNode()));
      if (exponent !== null) {
        return binaryNode("/", binaryNode("^", variableNode(), numberNode(exponent + 1)), numberNode(exponent + 1));
      }
    }
    throw new ParseError("この形の積分は未対応です");
  }

  function integralCallNode(node) {
    const slope = linearCoefficient(node.arg);
    if (slope === null || slope === 0) throw new ParseError("この形の積分は未対応です");
    if (node.name === "sin") return binaryNode("/", unaryNode(callNode("cos", node.arg)), numberNode(slope));
    if (node.name === "cos") return binaryNode("/", callNode("sin", node.arg), numberNode(slope));
    if (node.name === "exp") return binaryNode("/", callNode("exp", node.arg), numberNode(slope));
    throw new ParseError("この関数の積分は未対応です");
  }

  function linearCoefficient(node) {
    const derivative = simplifyNode(derivativeNode(node));
    const value = constantValue(derivative);
    return value === null ? null : value;
  }

  function simplifyNode(node) {
    if (!node) return node;
    if (node.type === "unary") {
      const value = simplifyNode(node.value);
      if (value.type === "number") return numberNode(-value.value);
      if (value.type === "unary") return simplifyNode(value.value);
      return unaryNode(value);
    }
    if (node.type === "binary") {
      const left = simplifyNode(node.left);
      const right = simplifyNode(node.right);
      const leftNumber = left.type === "number" ? left.value : null;
      const rightNumber = right.type === "number" ? right.value : null;
      if (leftNumber !== null && rightNumber !== null) {
        if (node.op === "+") return numberNode(leftNumber + rightNumber);
        if (node.op === "-") return numberNode(leftNumber - rightNumber);
        if (node.op === "*") return numberNode(leftNumber * rightNumber);
        if (node.op === "/" && rightNumber !== 0) return numberNode(leftNumber / rightNumber);
        if (node.op === "^") return numberNode(Math.pow(leftNumber, rightNumber));
      }
      if (node.op === "+") {
        if (isZero(left)) return right;
        if (isZero(right)) return left;
      }
      if (node.op === "-") {
        if (isZero(right)) return left;
      }
      if (node.op === "*") {
        if (isZero(left) || isZero(right)) return numberNode(0);
        if (isOne(left)) return right;
        if (isOne(right)) return left;
        return simplifyMultiplication(left, right);
      }
      if (node.op === "/") {
        if (isZero(left)) return numberNode(0);
        if (isOne(right)) return left;
      }
      if (node.op === "^") {
        if (isZero(right)) return numberNode(1);
        if (isOne(right)) return left;
      }
      return binaryNode(node.op, left, right);
    }
    if (node.type === "call") return callNode(node.name, simplifyNode(node.arg));
    return node;
  }

  function simplifyMultiplication(left, right) {
    const factors = [];
    collectMultiplicationFactors(left, factors);
    collectMultiplicationFactors(right, factors);

    let coefficient = 1;
    const rest = [];
    factors.forEach((factor) => {
      if (factor.type === "number") {
        coefficient *= factor.value;
      } else {
        rest.push(factor);
      }
    });

    if (Math.abs(coefficient) < 1e-12) return numberNode(0);
    if (!rest.length) return numberNode(coefficient);

    const normalized = Math.abs(coefficient - 1) < 1e-12 ? rest : [numberNode(coefficient), ...rest];
    return normalized.reduce((acc, factor) => (acc ? binaryNode("*", acc, factor) : factor), null);
  }

  function collectMultiplicationFactors(node, factors) {
    if (node?.type === "binary" && node.op === "*") {
      collectMultiplicationFactors(node.left, factors);
      collectMultiplicationFactors(node.right, factors);
      return;
    }
    factors.push(node);
  }

  function isZero(node) {
    return node.type === "number" && Math.abs(node.value) < 1e-12;
  }

  function isOne(node) {
    return node.type === "number" && Math.abs(node.value - 1) < 1e-12;
  }

  function nodeToSource(node, parentPrecedence = 0) {
    const precedence = nodePrecedence(node);
    let source;
    switch (node.type) {
      case "number":
        source = numberToTex(node.value);
        break;
      case "constant":
        source = node.name;
        break;
      case "variable":
        source = "x";
        break;
      case "unary":
        source = `-${nodeToSource(node.value, precedence)}`;
        break;
      case "binary":
        source = binaryToSource(node);
        break;
      case "call":
        source = `${node.name}(${nodeToSource(node.arg)})`;
        break;
      default:
        throw new ParseError("式を文字列化できません");
    }
    return precedence < parentPrecedence ? `(${source})` : source;
  }

  function binaryToSource(node) {
    if (node.op === "+" || node.op === "-") {
      return `${nodeToSource(node.left, 1)}${node.op}${nodeToSource(node.right, node.op === "-" ? 2 : 1)}`;
    }
    if (node.op === "*") return `${nodeToSource(node.left, 2)}*${nodeToSource(node.right, 2)}`;
    if (node.op === "/") return `${nodeToSource(node.left, 2)}/${nodeToSource(node.right, 2)}`;
    if (node.op === "^") return `${nodeToSource(node.left, 4)}^${nodeToSource(node.right, 3)}`;
    throw new ParseError("式を文字列化できません");
  }

  function expressionToTex(value) {
    const source = expressionBodyFromText(value);
    if (!source) return "";
    const ast = new Parser(source).parse();
    return `f\\left(x\\right)=${nodeToTex(ast)}`;
  }

  function nodePrecedence(node) {
    if (!node) return 0;
    if (node.type === "binary") {
      if (node.op === "+" || node.op === "-") return 1;
      if (node.op === "*" || node.op === "/") return 2;
      if (node.op === "^") return 3;
    }
    if (node.type === "unary") return 4;
    return 5;
  }

  function wrapTex(node, parentPrecedence) {
    const tex = nodeToTex(node);
    return nodePrecedence(node) < parentPrecedence ? `\\left(${tex}\\right)` : tex;
  }

  function nodeToTex(node) {
    switch (node.type) {
      case "number":
        return numberToTex(node.value);
      case "constant":
        return node.name === "pi" ? "\\pi" : "e";
      case "variable":
        return "x";
      case "unary":
        return `-${wrapTex(node.value, nodePrecedence(node))}`;
      case "binary":
        return binaryToTex(node);
      case "call":
        return callToTex(node);
      default:
        throw new ParseError("式を表示できません");
    }
  }

  function binaryToTex(node) {
    if (node.op === "+") return `${wrapTex(node.left, 1)}+${wrapTex(node.right, 1)}`;
    if (node.op === "-") return `${wrapTex(node.left, 1)}-${wrapTex(node.right, 2)}`;
    if (node.op === "/") return `\\frac{${nodeToTex(node.left)}}{${nodeToTex(node.right)}}`;
    if (node.op === "^") return `${wrapTex(node.left, 4)}^{${nodeToTex(node.right)}}`;
    if (node.op === "*") {
      const left = wrapTex(node.left, 2);
      const right = wrapTex(node.right, 2);
      return `${left}${multiplicationJoiner(node.left, node.right)}${right}`;
    }
    throw new ParseError("式を表示できません");
  }

  function multiplicationJoiner(left, right) {
    if (left?.type === "number" && (right?.type === "variable" || right?.type === "constant" || right?.type === "call")) return "";
    if (left?.type === "number" && right?.type === "binary") return "";
    if ((left?.type === "variable" || left?.type === "constant") && right?.type === "number") return "\\cdot ";
    return "\\,";
  }

  function callToTex(node) {
    const arg = nodeToTex(node.arg);
    if (node.name === "sqrt") return `\\sqrt{${arg}}`;
    if (node.name === "abs") return `\\left|${arg}\\right|`;
    if (node.name === "exp") return `e^{${arg}}`;
    const name = node.name === "ln" ? "\\ln" : `\\${node.name}`;
    return `${name}\\left(${arg}\\right)`;
  }

  function numberToTex(value) {
    if (!Number.isFinite(value)) return "";
    if (Number.isInteger(value)) return String(value);
    return String(Number(value.toPrecision(8)));
  }

  function niceStep(rawStep) {
    if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;
    const exponent = Math.floor(Math.log10(rawStep));
    const magnitude = Math.pow(10, exponent);
    const normalized = rawStep / magnitude;
    const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return multiplier * magnitude;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  class GraphingCalculator {
    constructor(root, items = [], options = {}) {
      this.root = root;
      this.items = [];
      this.theme = options.theme === "light" ? "light" : "dark";
      this.centerX = 0;
      this.centerY = 0;
      this.scaleX = 52;
      this.scaleY = 52;
      this.pointerMap = new Map();
      this.dragState = null;
      this.traceX = null;
      this.specialPoints = [];
      this.hoverPoint = null;
      this.resizeObserver = null;
      this.render(items);
      this.setItems(items);
      this.bind();
      this.resize();
    }

    render() {
      this.root.innerHTML = `
        <div class="graphing-calculator-shell" data-graphing-theme="${this.theme}">
          <div class="graphing-expression-panel">
            <div class="graphing-expression-head">
              <strong>グラフ</strong>
              <button class="graphing-add-button" type="button" data-graphing-action="add">式を追加</button>
            </div>
            <div class="graphing-expression-list" data-graphing-list></div>
          </div>
          <div class="graphing-stage">
            <div class="graphing-toolbar">
              <button type="button" data-graphing-action="reset">リセット</button>
              <span data-graphing-trace>ドラッグで移動 / ホイールで拡大</span>
            </div>
            <canvas class="graphing-canvas" data-graphing-canvas></canvas>
          </div>
        </div>
      `;
      this.shell = this.root.querySelector(".graphing-calculator-shell");
      this.list = this.root.querySelector("[data-graphing-list]");
      this.canvas = this.root.querySelector("[data-graphing-canvas]");
      this.trace = this.root.querySelector("[data-graphing-trace]");
      this.ctx = this.canvas.getContext("2d");
    }

    bind() {
      this.root.addEventListener("click", (event) => {
        const action = event.target?.closest?.("[data-graphing-action]")?.dataset.graphingAction;
        if (!action) return;
        if (action === "add") this.addItem({ label: `f${this.items.length + 1}`, expression: "" }, true);
        if (action === "reset") this.resetView();
        if (action === "delete") {
          const row = event.target.closest("[data-graphing-row]");
          if (row) this.removeItem(row.dataset.graphingRow);
        }
        if (action === "differentiate" || action === "integrate") {
          const row = event.target.closest("[data-graphing-row]");
          if (row) this.addTransformedItem(row.dataset.graphingRow, action);
        }
      });
      this.list.addEventListener("input", (event) => {
        const row = event.target.closest("[data-graphing-row]");
        if (!row) return;
        const item = this.items.find((entry) => entry.id === row.dataset.graphingRow);
        if (!item) return;
        if (event.target.matches("[data-graphing-expression]")) item.expression = event.target.value;
        if (event.target.matches("[data-graphing-enabled]")) item.enabled = event.target.checked;
        this.compileItem(item);
        this.updateRowStatus(row, item);
        this.fitToItems();
        this.draw();
      });
      this.list.addEventListener("keydown", (event) => {
        if (!event.target.matches("[data-graphing-expression]")) return;
        if (event.key !== "Enter") return;
        event.preventDefault();
        this.addItem({ label: `f${this.items.length + 1}`, expression: "" }, true);
      });
      this.canvas.addEventListener("wheel", (event) => this.handleWheel(event), { passive: false });
      this.canvas.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
      this.canvas.addEventListener("pointermove", (event) => this.handlePointerMove(event));
      this.canvas.addEventListener("pointerup", (event) => this.handlePointerUp(event));
      this.canvas.addEventListener("pointercancel", (event) => this.handlePointerUp(event));
      this.canvas.addEventListener("pointerleave", () => {
        if (this.pointerMap.size) return;
        this.traceX = null;
        this.hoverPoint = null;
        this.updateCanvasCursor();
        this.updateTrace(null);
        this.draw();
      });
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas.parentElement);
    }

    destroy() {
      this.resizeObserver?.disconnect();
      this.root.innerHTML = "";
    }

    setTheme(theme) {
      this.theme = theme === "light" ? "light" : "dark";
      if (this.shell) this.shell.dataset.graphingTheme = this.theme;
      this.draw();
    }

    setItems(items) {
      this.items = [];
      items.forEach((item, index) => {
        this.items.push(this.normalizeItem(item, index));
      });
      this.items.forEach((item) => this.compileItem(item));
      this.fitToItems();
      this.renderList();
      this.draw();
    }

    addItem(item, focus = false) {
      const normalized = this.normalizeItem(item, this.items.length);
      this.compileItem(normalized);
      this.items.push(normalized);
      this.fitToItems();
      this.renderList();
      this.draw();
      if (focus) requestAnimationFrame(() => this.focusItem(normalized.id));
    }

    removeItem(id) {
      this.items = this.items.filter((item) => item.id !== id);
      this.fitToItems();
      this.renderList();
      this.draw();
    }

    addTransformedItem(id, action) {
      const source = this.items.find((item) => item.id === id);
      const row = this.list.querySelector(`[data-graphing-row="${CSS.escape(id)}"]`);
      if (!source) return;
      try {
        const expression =
          action === "differentiate" ? expressionDerivative(source.expression) : expressionIntegral(source.expression);
        const label = action === "differentiate" ? `${source.label}'` : `∫${source.label}`;
        this.addItem({ label, expression, enabled: true }, true);
      } catch (error) {
        source.error = error?.message || "式を変換できません";
        if (row) this.updateRowStatus(row, source);
      }
    }

    normalizeItem(item, index) {
      return {
        id: item.id || `expr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
        label: item.label || `f${index + 1}`,
        expression: item.expression || "",
        color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        enabled: item.enabled !== false,
        fn: null,
        tex: "",
        error: "",
      };
    }

    compileItem(item) {
      if (!String(item.expression || "").trim()) {
        item.fn = null;
        item.tex = "";
        item.error = "";
        return;
      }
      try {
        const expression = expressionFromText(item.expression) || expressionBodyFromText(item.expression);
        item.fn = compileExpression(expression);
        item.tex = expressionToTex(expression);
        item.error = "";
      } catch (error) {
        item.fn = null;
        item.tex = "";
        item.error = error?.message || "式を読めません";
      }
    }

    renderList() {
      this.list.innerHTML = this.items
        .map(
          (item) => `
            <div class="graphing-expression-row ${item.error ? "has-error" : ""}" data-graphing-row="${item.id}">
              <label class="graphing-toggle">
                <input type="checkbox" data-graphing-enabled ${item.enabled ? "checked" : ""} />
                <span style="--graph-color:${item.color}"></span>
              </label>
              <span class="graphing-label">${escapeHtml(item.label)}</span>
              <div class="graphing-expression-field" data-graphing-field>
                <input class="graphing-expression-input" data-graphing-expression value="${escapeHtml(item.expression)}" placeholder="式を入力" spellcheck="false" autocomplete="off" autocapitalize="off" />
                <div class="graphing-expression-typeset" data-graphing-typeset aria-hidden="true"></div>
              </div>
              <button type="button" data-graphing-action="delete" aria-label="式を削除">×</button>
              <div class="graphing-expression-actions">
                <button type="button" data-graphing-action="differentiate">微分する</button>
                <button type="button" data-graphing-action="integrate">積分する</button>
              </div>
              ${item.error ? `<small>${escapeHtml(item.error)}</small>` : ""}
            </div>
          `
        )
        .join("");
      this.renderMathFields();
    }

    focusItem(id) {
      const input = this.list.querySelector(`[data-graphing-row="${CSS.escape(id)}"] [data-graphing-expression]`);
      input?.focus();
    }

    updateRowStatus(row, item) {
      row.classList.toggle("has-error", Boolean(item.error));
      this.renderMathField(row, item);
      let message = row.querySelector("small");
      if (!item.error) {
        message?.remove();
        return;
      }
      if (!message) {
        message = document.createElement("small");
        row.appendChild(message);
      }
      message.textContent = item.error;
    }

    renderMathFields() {
      this.items.forEach((item) => {
        const row = this.list.querySelector(`[data-graphing-row="${CSS.escape(item.id)}"]`);
        if (row) this.renderMathField(row, item);
      });
    }

    renderMathField(row, item) {
      const field = row.querySelector("[data-graphing-field]");
      const typeset = row.querySelector("[data-graphing-typeset]");
      if (!field || !typeset) return;
      field.classList.toggle("is-empty", !String(item.expression || "").trim());
      field.classList.toggle("is-rendered", Boolean(item.tex && !item.error));
      field.classList.toggle("is-error", Boolean(item.error));
      if (!item.tex) {
        typeset.textContent = "";
        return;
      }
      if (window.katex?.render) {
        window.katex.render(item.tex, typeset, {
          displayMode: false,
          throwOnError: false,
          output: "html",
          strict: "ignore",
        });
        return;
      }
      typeset.textContent = item.tex;
    }

    resetView() {
      this.centerX = 0;
      this.centerY = 0;
      this.scaleX = 52;
      this.scaleY = 52;
      this.fitToItems();
      this.draw();
    }

    fitToItems() {
      const values = [];
      this.items.forEach((item) => {
        if (!item.enabled) return;
        if (!item.fn) return;
        for (let index = 0; index <= 80; index += 1) {
          const x = -6 + (12 * index) / 80;
          const y = item.fn(x);
          if (Number.isFinite(y) && Math.abs(y) < 1e5) values.push(y);
        }
      });
      if (!values.length) return;
      values.sort((a, b) => a - b);
      const low = values[Math.floor(values.length * 0.08)];
      const high = values[Math.floor(values.length * 0.92)];
      const span = Math.max(4, Math.abs(high - low));
      this.centerY = (low + high) / 2;
      const targetPixels = Math.max(180, (this.height || 620) * 0.62);
      const horizontalScale = clamp((this.width || 960) / 18, 34, 64);
      const fittedScale = clamp(Math.min(horizontalScale, targetPixels / span), 18, 80);
      this.scaleX = fittedScale;
      this.scaleY = fittedScale;
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(260, Math.floor(rect.height));
      this.canvas.width = Math.floor(width * dpr);
      this.canvas.height = Math.floor(height * dpr);
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.width = width;
      this.height = height;
      this.draw();
    }

    toScreenX(x) {
      return this.width / 2 + (x - this.centerX) * this.scaleX;
    }

    toScreenY(y) {
      return this.height / 2 - (y - this.centerY) * this.scaleY;
    }

    toMathX(screenX) {
      return this.centerX + (screenX - this.width / 2) / this.scaleX;
    }

    toMathY(screenY) {
      return this.centerY - (screenY - this.height / 2) / this.scaleY;
    }

    draw() {
      if (!this.ctx || !this.width || !this.height) return;
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.drawBackground();
      this.drawGrid();
      this.drawAxes();
      this.items.forEach((item) => this.drawExpression(item));
      this.drawTrace();
      this.specialPoints = this.computeSpecialPoints();
      this.drawSpecialPoints();
    }

    drawBackground() {
      if (this.theme === "dark") {
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, "#061225");
        gradient.addColorStop(0.45, "#0a1d36");
        gradient.addColorStop(0.72, "#062632");
        gradient.addColorStop(1, "#160f2e");
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        const sheen = this.ctx.createLinearGradient(0, this.height, this.width, 0);
        sheen.addColorStop(0, "rgba(45, 140, 255, 0.06)");
        sheen.addColorStop(0.5, "rgba(20, 184, 166, 0.035)");
        sheen.addColorStop(1, "rgba(167, 139, 250, 0.055)");
        this.ctx.fillStyle = sheen;
        this.ctx.fillRect(0, 0, this.width, this.height);
        return;
      }
      const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
      gradient.addColorStop(0, "#fbfdff");
      gradient.addColorStop(0.58, "#eef9ff");
      gradient.addColorStop(1, "#f5f0ff");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
      const step = niceStep(86 / this.scaleX);
      this.ctx.lineWidth = 1;
      this.ctx.font = "11px system-ui, sans-serif";
      this.ctx.textBaseline = "top";
      this.ctx.fillStyle = this.theme === "dark" ? "rgba(214, 226, 244, 0.64)" : "#667085";
      this.ctx.strokeStyle = this.theme === "dark" ? "rgba(148, 163, 184, 0.18)" : "rgba(65, 83, 110, 0.16)";
      this.drawGridLines("x", step);
      this.drawGridLines("y", step);
    }

    drawGridLines(axis, step) {
      const isX = axis === "x";
      const min = isX ? this.toMathX(0) : this.toMathY(this.height);
      const max = isX ? this.toMathX(this.width) : this.toMathY(0);
      const start = Math.floor(min / step) * step;
      for (let value = start; value <= max + step; value += step) {
        const rounded = Math.abs(value) < step / 1000 ? 0 : value;
        const position = isX ? this.toScreenX(rounded) : this.toScreenY(rounded);
        this.ctx.beginPath();
        if (isX) {
          this.ctx.moveTo(position, 0);
          this.ctx.lineTo(position, this.height);
          if (Math.abs(position) > 18 && position < this.width - 32) this.ctx.fillText(formatNumber(rounded), position + 3, this.height / 2 + 4);
        } else {
          this.ctx.moveTo(0, position);
          this.ctx.lineTo(this.width, position);
          if (Math.abs(position) > 18 && position < this.height - 18) this.ctx.fillText(formatNumber(rounded), this.width / 2 + 4, position + 3);
        }
        this.ctx.stroke();
      }
    }

    drawAxes() {
      this.ctx.save();
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeStyle = this.theme === "dark" ? "rgba(226, 237, 255, 0.6)" : "rgba(18, 31, 50, 0.52)";
      const x0 = this.toScreenX(0);
      const y0 = this.toScreenY(0);
      this.ctx.beginPath();
      this.ctx.moveTo(x0, 0);
      this.ctx.lineTo(x0, this.height);
      this.ctx.moveTo(0, y0);
      this.ctx.lineTo(this.width, y0);
      this.ctx.stroke();
      this.ctx.restore();
    }

    drawExpression(item) {
      if (!item.enabled || !item.fn) return;
      this.ctx.save();
      this.ctx.strokeStyle = item.color;
      this.ctx.lineWidth = 2.4;
      this.ctx.lineJoin = "round";
      this.ctx.lineCap = "round";
      this.ctx.shadowColor = item.color;
      this.ctx.shadowBlur = this.theme === "dark" ? 8 : 4;
      this.ctx.beginPath();
      let drawing = false;
      let lastY = null;
      for (let sx = 0; sx <= this.width; sx += 1.5) {
        const x = this.toMathX(sx);
        const y = item.fn(x);
        const sy = this.toScreenY(y);
        const valid = Number.isFinite(y) && Math.abs(y) < 1e6 && Number.isFinite(sy);
        const jump = lastY !== null && Math.abs(sy - lastY) > this.height * 1.4;
        if (!valid || jump) {
          drawing = false;
          lastY = null;
          continue;
        }
        if (!drawing) {
          this.ctx.moveTo(sx, sy);
          drawing = true;
        } else {
          this.ctx.lineTo(sx, sy);
        }
        lastY = sy;
      }
      this.ctx.stroke();
      this.ctx.restore();
    }

    drawTrace() {
      if (this.hoverPoint) return;
      if (this.traceX === null) return;
      const sx = this.toScreenX(this.traceX);
      this.ctx.save();
      this.ctx.strokeStyle = this.theme === "dark" ? "rgba(226, 237, 255, 0.32)" : "rgba(15, 23, 42, 0.28)";
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(sx, 0);
      this.ctx.lineTo(sx, this.height);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.items.forEach((item) => {
        if (!item.enabled || !item.fn) return;
        const y = item.fn(this.traceX);
        if (!Number.isFinite(y)) return;
        this.ctx.fillStyle = item.color;
        this.ctx.beginPath();
        this.ctx.arc(sx, this.toScreenY(y), 4, 0, Math.PI * 2);
        this.ctx.fill();
      });
      this.ctx.restore();
    }

    computeSpecialPoints() {
      const points = [];
      const visibleItems = this.items.filter((item) => item.enabled && item.fn);
      const xMin = this.toMathX(0);
      const xMax = this.toMathX(this.width);
      const yMin = this.toMathY(this.height);
      const yMax = this.toMathY(0);
      const yTolerance = Math.max(1e-5, Math.min(0.035, 3 / this.scaleY));

      this.addSpecialPoint(points, {
        x: 0,
        y: 0,
        label: "原点",
        kind: "origin",
        color: this.theme === "dark" ? "#f8fafc" : "#111827",
      });

      visibleItems.forEach((item) => {
        const yAtZero = safeEval(item.fn, 0);
        if (Number.isFinite(yAtZero)) {
          this.addSpecialPoint(points, {
            x: 0,
            y: yAtZero,
            label: `${item.label} y切片`,
            kind: "intercept",
            color: item.color,
          });
        }
        findZeros((x) => safeEval(item.fn, x), xMin, xMax, yTolerance).forEach((x) => {
          this.addSpecialPoint(points, {
            x,
            y: 0,
            label: `${item.label} x切片`,
            kind: "intercept",
            color: item.color,
          });
        });
      });

      for (let a = 0; a < visibleItems.length; a += 1) {
        for (let b = a + 1; b < visibleItems.length; b += 1) {
          const first = visibleItems[a];
          const second = visibleItems[b];
          const diff = (x) => {
            const y1 = safeEval(first.fn, x);
            const y2 = safeEval(second.fn, x);
            return Number.isFinite(y1) && Number.isFinite(y2) ? y1 - y2 : NaN;
          };
          findZeros(diff, xMin, xMax, yTolerance).forEach((x) => {
            const y = safeEval(first.fn, x);
            this.addSpecialPoint(points, {
              x,
              y,
              label: `${first.label} と ${second.label}`,
              kind: "intersection",
              color: first.color,
              secondaryColor: second.color,
            });
          });
          findTangencies(diff, xMin, xMax, yTolerance).forEach((x) => {
            const y = safeEval(first.fn, x);
            this.addSpecialPoint(points, {
              x,
              y,
              label: `${first.label} と ${second.label}`,
              kind: "intersection",
              color: first.color,
              secondaryColor: second.color,
            });
          });
        }
      }

      return points.filter((point) => {
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
        if (point.x < xMin - 1 || point.x > xMax + 1) return false;
        if (point.y < yMin - 1 || point.y > yMax + 1) return false;
        const sx = this.toScreenX(point.x);
        const sy = this.toScreenY(point.y);
        return sx >= -14 && sx <= this.width + 14 && sy >= -14 && sy <= this.height + 14;
      });
    }

    addSpecialPoint(points, point) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
      const duplicate = points.find((existing) => {
        const dx = this.toScreenX(existing.x) - this.toScreenX(point.x);
        const dy = this.toScreenY(existing.y) - this.toScreenY(point.y);
        return Math.hypot(dx, dy) < 10;
      });
      if (duplicate) {
        if (duplicate.kind === "origin" && point.kind !== "intersection") return;
        if (point.kind === "origin" && duplicate.kind !== "intersection") return;
        if (!duplicate.label.includes(point.label)) duplicate.label = `${duplicate.label} / ${point.label}`;
        if (point.kind === "intersection") duplicate.kind = "intersection";
        return;
      }
      points.push(point);
    }

    nearestSpecialPoint(screenX, screenY) {
      let best = null;
      this.specialPoints.forEach((point) => {
        const sx = this.toScreenX(point.x);
        const sy = this.toScreenY(point.y);
        const distance = Math.hypot(sx - screenX, sy - screenY);
        if (distance > 13) return;
        if (!best || distance < best.distance) best = { point, distance };
      });
      return best?.point || null;
    }

    drawSpecialPoints() {
      if (!this.specialPoints.length) return;
      this.ctx.save();
      this.specialPoints.forEach((point) => {
        const sx = this.toScreenX(point.x);
        const sy = this.toScreenY(point.y);
        const hovered = this.hoverPoint === point;
        this.ctx.lineWidth = hovered ? 3 : 2;
        this.ctx.shadowColor = point.color || "#38bdf8";
        this.ctx.shadowBlur = hovered ? 13 : 8;
        this.ctx.fillStyle = this.theme === "dark" ? "rgba(6, 18, 36, 0.94)" : "rgba(255, 255, 255, 0.96)";
        this.ctx.strokeStyle = point.color || "#38bdf8";
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, hovered ? 6 : 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        if (point.secondaryColor) {
          this.ctx.strokeStyle = point.secondaryColor;
          this.ctx.beginPath();
          this.ctx.arc(sx, sy, hovered ? 9 : 8, 0, Math.PI * 2);
          this.ctx.stroke();
        }
      });
      if (this.hoverPoint) this.drawPointTooltip(this.hoverPoint);
      this.ctx.restore();
    }

    drawPointTooltip(point) {
      const sx = this.toScreenX(point.x);
      const sy = this.toScreenY(point.y);
      const text = `${point.label} (${formatNumber(point.x)}, ${formatNumber(point.y)})`;
      this.ctx.font = "12px system-ui, sans-serif";
      const metrics = this.ctx.measureText(text);
      const paddingX = 9;
      const paddingY = 7;
      const width = metrics.width + paddingX * 2;
      const height = 30;
      let left = sx + 12;
      let top = sy - height - 12;
      if (left + width > this.width - 8) left = sx - width - 12;
      if (top < 8) top = sy + 12;
      left = clamp(left, 8, Math.max(8, this.width - width - 8));
      top = clamp(top, 8, Math.max(8, this.height - height - 8));
      this.ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
      this.ctx.shadowBlur = 14;
      this.ctx.fillStyle = this.theme === "dark" ? "rgba(8, 16, 31, 0.96)" : "rgba(255, 255, 255, 0.98)";
      roundRect(this.ctx, left, top, width, height, 8);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.strokeStyle = point.color || (this.theme === "dark" ? "#93c5fd" : "#2563eb");
      this.ctx.stroke();
      this.ctx.fillStyle = this.theme === "dark" ? "#f8fbff" : "#0f172a";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(text, left + paddingX, top + height / 2);
    }

    handleWheel(event) {
      event.preventDefault();
      event.stopPropagation();
      const rect = this.canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const beforeX = this.toMathX(px);
      const beforeY = this.toMathY(py);
      const factor = Math.exp(-event.deltaY * 0.001);
      const nextScale = clamp(this.scaleX * factor, 8, 420);
      this.scaleX = nextScale;
      this.scaleY = nextScale;
      this.centerX = beforeX - (px - this.width / 2) / this.scaleX;
      this.centerY = beforeY + (py - this.height / 2) / this.scaleY;
      this.draw();
    }

    handlePointerDown(event) {
      event.stopPropagation();
      this.canvas.setPointerCapture?.(event.pointerId);
      this.pointerMap.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.dragState = this.pointerState();
      this.updateCanvasCursor();
    }

    handlePointerMove(event) {
      event.stopPropagation();
      if (!this.pointerMap.has(event.pointerId)) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = event.clientX - rect.left;
        const sy = event.clientY - rect.top;
        this.hoverPoint = this.nearestSpecialPoint(sx, sy);
        this.traceX = this.hoverPoint ? null : this.toMathX(sx);
        this.updateCanvasCursor();
        this.updateTrace(this.traceX);
        this.draw();
        return;
      }
      this.pointerMap.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const current = this.pointerState();
      if (!this.dragState || !current) return;
      if (current.count >= 2 && this.dragState.distance > 0) {
        const factor = clamp(current.distance / this.dragState.distance, 0.35, 2.8);
        const nextScale = clamp(this.dragState.scaleX * factor, 8, 420);
        this.scaleX = nextScale;
        this.scaleY = nextScale;
      }
      this.centerX = this.dragState.centerX - (current.x - this.dragState.x) / this.scaleX;
      this.centerY = this.dragState.centerY + (current.y - this.dragState.y) / this.scaleY;
      this.traceX = null;
      this.hoverPoint = null;
      this.updateCanvasCursor();
      this.updateTrace(null);
      this.draw();
    }

    handlePointerUp(event) {
      event.stopPropagation();
      this.pointerMap.delete(event.pointerId);
      this.dragState = this.pointerMap.size ? this.pointerState() : null;
      this.updateCanvasCursor();
    }

    updateCanvasCursor() {
      if (!this.canvas) return;
      if (this.pointerMap.size) {
        this.canvas.style.cursor = "grabbing";
        return;
      }
      this.canvas.style.cursor = this.hoverPoint ? "pointer" : "";
    }

    pointerState() {
      const points = [...this.pointerMap.values()];
      if (!points.length) return null;
      const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
      const y = points.reduce((sum, point) => sum + point.y, 0) / points.length;
      const distance =
        points.length >= 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0;
      return {
        count: points.length,
        x,
        y,
        distance,
        centerX: this.centerX,
        centerY: this.centerY,
        scaleX: this.scaleX,
      };
    }

    updateTrace(x) {
      if (this.hoverPoint) {
        this.trace.textContent = `${this.hoverPoint.label} (${formatNumber(this.hoverPoint.x)}, ${formatNumber(this.hoverPoint.y)})`;
        return;
      }
      if (x === null) {
        this.trace.textContent = "ドラッグで移動 / ホイールで拡大";
        return;
      }
      const parts = [`x=${formatNumber(x)}`];
      this.items.slice(0, 4).forEach((item) => {
        if (!item.enabled || !item.fn) return;
        const y = item.fn(x);
        if (Number.isFinite(y)) parts.push(`${item.label}: ${formatNumber(y)}`);
      });
      this.trace.textContent = parts.join("  ");
    }
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "";
    const abs = Math.abs(value);
    if (abs >= 1000) {
      return value.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 0 });
    }
    if (abs >= 100) return trimFixed(value, 0);
    if (abs >= 10) return trimFixed(value, 1);
    if (abs >= 1) return trimFixed(value, 2);
    if (abs >= 0.01) return trimFixed(value, 3);
    return trimFixed(value, 6);
  }

  function trimFixed(value, digits) {
    return Number(value.toFixed(digits)).toString();
  }

  function safeEval(fn, x) {
    try {
      return fn(x);
    } catch {
      return NaN;
    }
  }

  function findZeros(fn, xMin, xMax, tolerance) {
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) return [];
    const roots = [];
    const samples = 720;
    const span = xMax - xMin;
    const step = span / samples;
    const minSeparation = span / 1600;
    let previousX = null;
    let previousY = null;

    for (let index = 0; index <= samples; index += 1) {
      const x = xMin + step * index;
      const y = fn(x);
      if (!Number.isFinite(y) || Math.abs(y) > 1e8) {
        previousX = null;
        previousY = null;
        continue;
      }
      if (Math.abs(y) <= tolerance) {
        const refined = minimizeAbs(fn, Math.max(xMin, x - step), Math.min(xMax, x + step));
        if (Math.abs(fn(refined)) <= tolerance * 1.2) addNumericPoint(roots, refined, minSeparation);
      }
      if (
        previousX !== null &&
        previousY !== null &&
        Number.isFinite(previousY) &&
        previousY * y < 0
      ) {
        addNumericPoint(roots, bisectZero(fn, previousX, x), minSeparation);
      }
      previousX = x;
      previousY = y;
    }
    return roots;
  }

  function bisectZero(fn, left, right) {
    let a = left;
    let b = right;
    let fa = fn(a);
    for (let index = 0; index < 44; index += 1) {
      const mid = (a + b) / 2;
      const fm = fn(mid);
      if (!Number.isFinite(fm)) break;
      if (Math.abs(fm) < 1e-10) return mid;
      if (fa * fm <= 0) {
        b = mid;
      } else {
        a = mid;
        fa = fm;
      }
    }
    return (a + b) / 2;
  }

  function findTangencies(fn, xMin, xMax, tolerance) {
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMin >= xMax) return [];
    const roots = [];
    const samples = 360;
    const span = xMax - xMin;
    const minSeparation = span / 1000;
    const points = [];

    for (let index = 0; index <= samples; index += 1) {
      const x = xMin + (span * index) / samples;
      const y = Math.abs(fn(x));
      points.push({ x, y: Number.isFinite(y) && y < 1e8 ? y : Infinity });
    }

    for (let index = 1; index < points.length - 1; index += 1) {
      const prev = points[index - 1];
      const current = points[index];
      const next = points[index + 1];
      if (!Number.isFinite(current.y)) continue;
      if (current.y > tolerance * 1.6) continue;
      if (current.y <= prev.y && current.y <= next.y) {
        const x = minimizeAbs(fn, prev.x, next.x);
        if (Math.abs(fn(x)) <= tolerance * 1.4) addNumericPoint(roots, x, minSeparation);
      }
    }
    return roots;
  }

  function minimizeAbs(fn, left, right) {
    let a = left;
    let b = right;
    const phi = (Math.sqrt(5) - 1) / 2;
    let c = b - (b - a) * phi;
    let d = a + (b - a) * phi;
    for (let index = 0; index < 34; index += 1) {
      const fc = Math.abs(fn(c));
      const fd = Math.abs(fn(d));
      if (!Number.isFinite(fc) || !Number.isFinite(fd)) break;
      if (fc < fd) {
        b = d;
        d = c;
        c = b - (b - a) * phi;
      } else {
        a = c;
        c = d;
        d = a + (b - a) * phi;
      }
    }
    return (a + b) / 2;
  }

  function addNumericPoint(points, value, minSeparation) {
    if (!Number.isFinite(value)) return;
    if (points.some((item) => Math.abs(item - value) <= minSeparation)) return;
    points.push(value);
  }

  function roundRect(ctx, x, y, width, height, radius) {
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  window.QuizGraphingCalculator = {
    create(root, items, options) {
      return new GraphingCalculator(root, items, options);
    },
    expressionFromText,
    compileExpression,
  };
})();

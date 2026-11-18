// Builds one element safely. textContent always shows text as plain text and
// never interprets it as HTML, so user-entered names cannot inject markup.
export function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

// A button that runs `onClick` when pressed. type="button" stops it from
// submitting a form if it is ever placed inside one.
export function createButton(label, className, onClick) {
  const button = el("button", className, label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}
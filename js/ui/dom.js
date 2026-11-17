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
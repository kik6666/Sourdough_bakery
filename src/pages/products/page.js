import template from "./index.html?raw";
import "./styles.css";

export function render() {
  return template;
}

export function mount() {
  document.title = "Sourdough Bakery | Products";
}

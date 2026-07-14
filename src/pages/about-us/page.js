import template from "./index.html?raw";
import "./styles.css";

export function render() {
  return template;
}

export function mount() {
  document.title = "Sourdough Bakery | About Us";
  const container = document.getElementById("page-container");
  
  if (container) {
    container.classList.remove('py-4', 'py-md-5');
  }
}

export function unmount() {
  const container = document.getElementById("page-container");
  if (container) {
    container.classList.add('py-4', 'py-md-5');
  }
}

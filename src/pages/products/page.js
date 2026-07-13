import template from "./index.html?raw";
import "./styles.css";
import { getRouteParams } from "../../router/router.js";

export function render() {
  return template;
}

export function mount() {
  document.title = "Sourdough Bakery | Products";

  const { category } = getRouteParams();

  if (category) {
    document.querySelectorAll(".products-category").forEach((section) => {
      section.hidden = section.dataset.category !== category;
    });
  }
}

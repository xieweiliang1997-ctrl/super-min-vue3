export const patchStyle = (el, prev, next) => {
  const style = el.style;
  if (next == null) {
    el.removeAttribute("style");
  } else {
    if (prev) {
      for (const key in prev) {
        if (next[key] == null) {
          style[key] = "";
        }
      }
    }
    for (const key in next) {
      style[key] = next[key];
    }
  }
};

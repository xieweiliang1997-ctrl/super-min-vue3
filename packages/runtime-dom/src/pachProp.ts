import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/events";
import { patchStyle } from "./modules/style";

//针对属性
/**
 * 
 * @param el 元素
 * @param key sttyle
 * @param prevValue 旧值
 * @param nextValue 新值
 */
export const patchProp = (el, key, prevValue, nextValue) => {
  switch (key) {
    case "class":
      patchClass(el, nextValue);
      break;
    case "style":
      patchStyle(el, prevValue, nextValue);
      break;

    default:
      if (/^on[^a-z]/.test(key)) {
        patchEvent(el,key,nextValue)
      } else {
        patchAttr(el, prevValue, nextValue);
      }

      break;
  }
};

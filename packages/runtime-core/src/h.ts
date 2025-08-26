import { isArray, isObject } from "@vuexwl/shared";
import { createVNode, isVnode } from "./vnode";

export function h(type, propsOrChildren, children) {
  const len = arguments.length;
  if (len === 2) {
    //类型 + 属性 ,类型+孩子
    if (isObject(propsOrChildren) && isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren, null);
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (len > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (len === 3 && isVnode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
  // console.log(type, propsOrChildren, children);
}

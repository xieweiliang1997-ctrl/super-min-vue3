import { isArray, isObject, isString, ShapeFlags } from "@vuexwl/shared";

export function isVnode(vnode) {
  return vnode.__v_isVnode;
}

//createvNode 创建虚拟节点
/**
 *
 * @param type 组件
 * @param props 数据
 * @param children 子节点
 * @returns 虚拟节点
 */
export function createVNode(type, props, children = null) {
  //根据type来区分是组件，还是普通的元素
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;
  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    component: null,
    el: null,
    key: props && props.key,
    shapeFlag,
  };
  normalizeChildren(vnode, vnode.children);
  return vnode;
}
function normalizeChildren(vnode, children) {
  let type = 0;
  if (children == null) {
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.shapeFlag |= type;
}

export const TEXT = Symbol("Text");
export function normalizeVNode(child) {
  if (isObject(child)) {
    return child;
  }
  return createVNode(TEXT, null, String(child));
}

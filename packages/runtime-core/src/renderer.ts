import { effect } from "@vuexwl/reactivity";
import { ShapeFlags } from "@vuexwl/shared";
import { createAppAPI } from "./apiCreayteApi";
import { createComponetInstance, setupComponent } from "./component";
import { queueJob } from "./scheduler";
import { normalizeVNode, TEXT } from "./vnode";

/**
 *
 * @param rendererOptions 操纵element的方法
 * @returns 返回renderer渲染器
 */
export function createRenderer(rendererOptions) {
  const {
    createElement: hostCreateElement,
    remove: hostRemove,
    insert: hostInsert,
    querySelector: hostQuerySelector,
    setElementText: hostSetElementText,
    createText: hostCreateText,
    setText: hostSetText,
    patchProp: hostPatchProp,
    nextSibling: hostNextSibling,
  } = rendererOptions;
  const setupRenderEffect = (instance, container) => {
    //使用effect包裹render;
    instance.update = effect(
      function componentEffect() {
        //每个组件都有一个effect ,vue3是组件级更新,数据改变相应的组件做出变化
        if (!instance.isMounted) {
          //初次挂载
          let proxyToUse = instance.proxy;
          let subTree = (instance.subTree = instance.render.call(
            proxyToUse,
            proxyToUse
          ));
          patch(null, subTree, container);
          instance.isMounted = true;
        } else {
          //更新
          //diff (核心 diff + 序列优化 watchApi 生命周期)
          const prevTree = instance.subTree;

          let proxyToUse = instance.proxy;
          const nextTree = instance.render.call(proxyToUse, proxyToUse);

          patch(prevTree, nextTree, container);
        }
      },
      {
        scheduler: queueJob,
      }
    );
    instance.render();
  };

  /**
   *
   * @param initialVnode 新节点
   * @param container 容器
   */
  const mountComponent = (initialVnode, container) => {
    //调用setup 拿到返回值， 获取render函数返回的结果进行渲染
    //1.创建实例
    const instance = (initialVnode.component =
      createComponetInstance(initialVnode));
    //2.需要的数据解析到实例
    setupComponent(instance);
    //3.创建一个effect 让render函数执行
    setupRenderEffect(instance, container);
  };
  /**
   *
   * @param n1 老节点
   * @param n2 新节点
   * @param container 容器
   */
  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      //组件没有上一次的虚拟节点
      mountComponent(n2, container);
    } else {
      //组件更新
    }
  };

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    }
  };
  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };
  const unmount = (n1) => {
    hostRemove(n1.el);
  };
  /**
   *
   * @param n1 老节点
   * @param n2 新节点
   * @param container 容器
   */
  const patch = (n1, n2, container, anchor = null) => {
    const { shapeFlag, type } = n2;
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = hostNextSibling(n1.el);
      unmount(n1);
      n1 = null;
    }
    switch (type) {
      case TEXT:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container);
        }
        break;
    }
  };
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalizeVNode(children[i]);
      patch(null, child, container);
    }
  };
  const mountElement = (vnode, container, anchor = null) => {
    //递归渲染
    const { props, shapeFlag, type, children } = vnode;
    let el = (vnode.el = hostCreateElement(type));
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }

    hostInsert(el, container, anchor);
  };
  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next);
        }
      }
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  };
  const unmountChildren = (children) => {
    for (let index = 0; index < children.length; index++) {
      unmount(children[index]);
    }
  };

  const patchKeydChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    // sync from start 从头开始一个个比 遇到不太同的停止

    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    //sync from end
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    //两个比较后多一个 common squence + mount
    if (i > e1) {
      //新增了一个
      if (i <= e2) {
        //想知道向前插入还是向后插入
        const nextProp = e2 + 1;
        const anchor = nextProp < c2.length ? c2[nextProp].el : null;
        while (i <= e2) {
          patch(null, c2[i], el, anchor); //向后添加
          i++;
        }
      }
    } else if (i > e2) {
      //老的多新的少
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    } else {
      //乱序比较 尽可能复用，用新的元素做成一个映射表，一样的就服用,不一样的要不插入，要不删除
      let s1 = i;
      let s2 = i;
      const KeyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const childVNode = c2[i]; //
        KeyToNewIndexMap.set(childVNode.key, i);
      }
      for (let i = s1; i <= e1; i++) {
        const oldVNode = c1[i];
        let newIndex = KeyToNewIndexMap.get(oldVNode.key);
        if (newIndex === undefined) {
          unmount(oldVNode);
        } else {
          patch(oldVNode, c2[newIndex], el);
        }
      }
    }
  };

  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;

    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //case1:之前是数组,现在是文本
      //文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }

      if (c2 !== c1) {
        //case 两个都是文本
        hostSetElementText(el, c2);
      }
    } else {
      //元素
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        //两个都是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          //
          //当前是一个数组,之前是数组
          //两个数组的比对 -> diff算法 *********

          patchKeydChildren(c1, c2, el);
        } else {
          //没有孩子
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & shapeFlag.TEXT_CHILDREN) {
          //case4现在是数组之前是文本
          hostSetElementText(el, "");
        }

        if (shapeFlag & shapeFlag.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2, container) => {
    //元素是相同节点
    let el = (n2.el = n1.el);

    //g更新属性,更新儿子
    const oldPorops = n1.props || {};
    const newPorops = n2.props || {};
    patchProps(oldPorops, newPorops, el);
    patchChildren(n1, n2, el);
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2, container);
    }
  };
  /**
   *
   * @param vnode 虚拟dom
   * @param container 容器
   */
  const render = (vnode, container) => {
    //  console.log(vnode, container);
    // core的核心，根据不同的虚拟节点，创建对应的真是dom
    //默认调用render,可能是初始化流程
    patch(null, vnode, container);
  };
  return {
    createApp: createAppAPI(render),
  };
}

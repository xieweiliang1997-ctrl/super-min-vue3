
import { ShapeFlags, isFunction, isObject } from "@vuexwl/shared";
import { PublicInstanceProxyHandlers } from "./componentPublicInstanceProxyHandlers";

export function createComponetInstance(vnode) {
  // webcomponent 组件 "插槽" "属性"
  const instance = {
    //组件实例
    vnode,
    type: vnode.type,
    props: { a: 1 },
    attrs: {},
    slots: {},
    data: { c: 3 },
    setupState: { b: 2 },
    ctx: null,
    isMounted: false,
    render: null,
  };
  instance.ctx = { _: instance };
  return instance;
}
export function setupComponent(instance) {
  const { props, children } = instance;

  instance.props = props;
  instance.children = children;

  //查看组件是否有状态
  let isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
  if (isStateful) {
    //调用当前实例的 setup方法
    isStatefulComponent(instance);
  }
}

function isStatefulComponent(instance) {
  //代理 传递给render函数的参数
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any);
  //获取组件的类型,拿到组件的setup

  let Component = instance.type;
  let { setup } = Component;

  if (setup) {
    let setupContext = createSetContext(instance);
    const setupReult = setup(instance.props, setupContext);
    handleSetupResult(instance, setupReult);
  } else {
    // Component.render(instance.proxy);
    finishhComponentSetup(instance);
  }
}
function handleSetupResult(instance, setupReult) {
  if (isFunction(setupReult)) {
    instance.render = setupReult;
  } else if (isObject(setupReult)) {
    instance.setupState = setupReult;
  }
  finishhComponentSetup(instance);
}
function finishhComponentSetup(instance) {
  let Component = instance.type;

  if (!instance.render) {
    //对template模板进行编译,产生render函数
    // instance.render = render;
    if(!Component.render && Component.template){
      
    }
    instance.render = Component.render;
  }
}
function createSetContext(instance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    // props: instance.props,
    emit: () => {},
    expose: () => {},
  };
}

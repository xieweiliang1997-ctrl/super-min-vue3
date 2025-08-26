import { createRenderer } from "@vuexwl/runtime-core";
import { extend } from "@vuexwl/shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./pachProp";

//reactime-dom的核心是提供domAPI方法

export const rendererOptions = extend({ patchProp }, nodeOps);

//VUE-runtime-core
/**
 * 
 * @param rootComponent 跟组件
 * @param rootProps 跟节点数据
 * @returns 渲染器
 */
export function createApp(rootComponent, rootProps = null) {
  const app = createRenderer(rendererOptions).createApp(
    rootComponent,
    rootProps
  );
  let { mount } = app;
  app.mount = function (container) {
    container = nodeOps.querySelector(container);
    container.innerHTML = "";
    mount(container);
  };
  return app;
}

export * from "@vuexwl/runtime-core" 

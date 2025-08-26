import { createVNode } from "./vnode";
/**
 *
 * @param render 渲染器
 * @returns createApp Api
 */
export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,
      mount(container) {
        // let vnode ={}
        // render(vnode,container)

        //1.根据组件创建虚拟节点
        //2.将虚拟节点和容器获取到后用render方法进行渲染
        const vnode = createVNode(rootComponent, rootProps);
        render(vnode, container);
        //创造虚拟节点
        //调用render
        app._container = container;
      },
    };
    return app;
  };
}

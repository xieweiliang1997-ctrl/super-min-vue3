export declare const rendererOptions: {
    patchProp: (el: any, key: any, prevValue: any, nextValue: any) => void;
} & {
    createElement: (tagName: any) => any;
    remove: (child: any) => void;
    insert: (child: any, parent: any, anchor?: any) => void;
    querySelector: (selector: any) => any;
    setElementText: (el: any, text: any) => any;
    createText: (text: any) => Text;
    setText: (node: any, text: any) => any;
    nextSibling: (node: any) => any;
};
/**
 *
 * @param rootComponent 跟组件
 * @param rootProps 跟节点数据
 * @returns 渲染器
 */
export declare function createApp(rootComponent: any, rootProps?: any): {
    _props: any;
    _component: any;
    /**
     *
     * @param rootComponent 跟组件
     * @param rootProps 跟节点数据
     * @returns 渲染器
     */
    _container: any;
    mount(container: any): void;
};
export * from "@vuexwl/runtime-core";

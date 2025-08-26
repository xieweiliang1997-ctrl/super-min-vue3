import { ShapeFlags } from "@vuexwl/shared";
export declare function isVnode(vnode: any): any;
/**
 *
 * @param type 组件
 * @param props 数据
 * @param children 子节点
 * @returns 虚拟节点
 */
export declare function createVNode(type: any, props: any, children?: any): {
    __v_isVnode: boolean;
    type: any;
    props: any;
    children: any;
    component: any;
    el: any;
    key: any;
    shapeFlag: number | ShapeFlags;
};
export declare const TEXT: unique symbol;
export declare function normalizeVNode(child: any): any;

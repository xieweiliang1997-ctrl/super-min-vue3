/**
 *
 * @param rendererOptions 操纵element的方法
 * @returns 返回renderer渲染器
 */
export declare function createRenderer(rendererOptions: any): {
    createApp: (rootComponent: any, rootProps: any) => {
        _props: any;
        _component: any;
        _container: any;
        /**
         *
         * @param rendererOptions 操纵element的方法
         * @returns 返回renderer渲染器
         */
        mount(container: any): void;
    };
};

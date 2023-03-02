import {RouteRecordRaw, RouterOptions} from "vue-router";
import {Plugin} from 'vite'
export type Config = {
    /**
     * 动态生成的route文件名称，默认输出在根目录，且名称为 route
     */
    route:string
    /**
     * 动态生成的路由文件后缀名称，默认 ts
     */
    route_suffix:string
    /**
     * 被监听的动态路由的文件类型，默认为 ["vue","jsx","tsx"]
     */
    suffix:string[]
    /**
     * 被监听文件类型所属的目录名称，可以指路径写法，默认为 views
     */
    views:string
    /**
     * 被监听文件类型所属的页面配置文件，默认为 page.json
     */
    pageJson:string
    /**
     * 扩展路由的文件位置，可实现传统配置写法
     */
    routes_extend?:string
    /**
     * 自定义路由配置文件位置，可覆盖路由模式等功能
     */
    routesCustomConfig?:string
    /**
     * 过滤被不需要动态生成的文件路由，默认为禁止弹框相关的文件，即 /\/alert\//
     */
    routesFilter:RegExp | string
}

declare function AutoRoute(config:Partial<Config>):Plugin


export default AutoRoute

declare global{
    const ROUTES_META:Record<string, any>
    const ROUTES_CUSTOM_ROUTER:Readonly<RouteRecordRaw[]>;
    const ROUTES_CUSTOM_CONFIG:RouterOptions
    const ROUTES_FILTER_REG:RegExp
}

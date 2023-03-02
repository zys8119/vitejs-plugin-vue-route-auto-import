import {RouteRecordRaw, RouterOptions} from "vue-router";

export {}
declare global{
    const ROUTES_META:Record<string, any>
    const ROUTES_CUSTOM_ROUTER:Readonly<RouteRecordRaw[]>;
    const ROUTES_CUSTOM_CONFIG:RouterOptions
    const ROUTES_FILTER_REG:RegExp
}

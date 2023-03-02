import {Plugin} from 'vite'
import {readFileSync, writeFileSync} from 'fs'
import {resolve} from 'path'
import * as sfc from '@vue/compiler-sfc'
import glob from 'fast-glob'
import _ from 'lodash'
import {RouteRecordRaw, RouterOptions} from "vue-router";
export type Config = {
    /**
     * 动态生成的route文件名称，默认输出在根目录，且名称为 route
     */
    route:string
    /**
     * 动态生成的路由文件后缀名称，默认 .ts
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
const ROUTES_META = function (config?:Partial<Config>):Plugin{
    const currConfig:Config = _.merge({
        route:'route',
        route_suffix:'ts',
        suffix:["vue","jsx","tsx"],
        views:"views",
        pageJson:"page.json",
        routesFilter:/\/alert\//
    },config)
    const fileReg = new RegExp(`\\.(${currConfig.suffix.join("|")})$`)
    const routeReg = new RegExp(`${currConfig.route}\.${currConfig.route_suffix}$`)
    const routePath = resolve(process.cwd(), currConfig.route+'.'+currConfig.route_suffix)
    const cwd = resolve(process.cwd(), 'node_modules', 'vitejs-plugin-vue-route-auto-import')
    const routeCode = currConfig.route_suffix === 'ts' ? readFileSync(resolve(cwd,'src/route.ts'), 'utf-8') : readFileSync(resolve(cwd,'dist/route.js'), 'utf-8')
    writeFileSync(routePath, routeCode)
    const ROUTES_CUSTOM_ROUTER = currConfig.routes_extend ? `import ROUTES_CUSTOM_ROUTER from "${currConfig.routes_extend}"`:'const ROUTES_CUSTOM_ROUTER = []'
    const ROUTES_CUSTOM_CONFIG = currConfig.routesCustomConfig ? `import ROUTES_CUSTOM_CONFIG from "${currConfig.routesCustomConfig}"`:'const ROUTES_CUSTOM_CONFIG = {}'
    let routeModuleId = null
    return {
        name:"ROUTES_META",
        enforce:'pre',
        load(id){
            if(routeReg.test(id)){
                routeModuleId = id
                const map = glob.sync("**/*.vue", {absolute:true}).reduce((res, id)=>{
                    const code = readFileSync(id, 'utf-8')
                    const descriptor = sfc.parse(`${code.match(/<script([^>])*>/)?.[0] || '<script>'}console.log(1)<script/>`).descriptor
                    return {
                        ...res,
                        [id.replace(process.cwd(),'.')]:descriptor?.scriptSetup?.attrs
                    }
                },{})

                return `${ROUTES_CUSTOM_ROUTER}\n${ROUTES_CUSTOM_CONFIG}\n`+readFileSync(id, 'utf-8')
                    .replace(/ROUTES_META/img, JSON.stringify(map))
                    .replace(/ROUTES_FILTER_REG/img, (new RegExp(currConfig.routesFilter)).toString())
                    .replace(/views/img, currConfig.views)
                    .replace(/page\.json/img, currConfig.pageJson)
                    .replace(/\{vue\,jsx\,tsx\}/img, `{${currConfig.suffix.join(',')}}`)
                    .replace(/\(vue\|jsx\|tsx\)/img, `(${currConfig.suffix.join('|')})`)

            }
        },
        handleHotUpdate(cxt){
            if(fileReg.test(cxt.file)){
                cxt.server.reloadModule(cxt.server.moduleGraph.getModuleById(routeModuleId))
            }
        }
    }
}

export default ROUTES_META


import {Plugin} from 'vite'
import {readFileSync, writeFileSync} from 'fs'
import {resolve} from 'path'
import * as sfc from '@vue/compiler-sfc'
import glob from 'fast-glob'
import _ from 'lodash'
import {Config} from "../type"
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
                    .replace(/VIEWREG/img, currConfig.views.replace(/\//img,'\\/'))
                    .replace(/VIEWSDIR/img, currConfig.views)
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


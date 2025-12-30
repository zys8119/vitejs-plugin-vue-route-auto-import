const { readFileSync, writeFileSync }  = require( "fs");
const { resolve }  = require( "path");
const sfc  = require( "@vue/compiler-sfc");
const glob  = require( "fast-glob");
const _  = require( "lodash");
const ROUTES_META = function(config) {
  let map = {};
  const currConfig = _.merge(
    {
      route: "route",
      route_suffix: "ts",
      suffix: ["vue", "jsx", "tsx"],
      views: "views",
      pageJson: "page.json",
      routesFilter: /\/alert\//
    },
    config
  );
  const fileReg = new RegExp(`\\.(${currConfig.suffix.join("|")})$`);
  const routeReg = new RegExp(
    `${resolve(process.cwd(), currConfig.route)}.${currConfig.route_suffix}$`
  );
  const routePath = resolve(
    process.cwd(),
    currConfig.route + "." + currConfig.route_suffix
  );
  const cwd = resolve(
    process.cwd(),
    "node_modules",
    "vitejs-plugin-vue-route-auto-import"
  );
  const routeCode = currConfig.route_suffix === "ts" ? readFileSync(resolve(cwd, "src/route.ts"), "utf-8") : readFileSync(resolve(cwd, "dist/route.js"), "utf-8");
  writeFileSync(routePath, routeCode);
  const ROUTES_CUSTOM_ROUTER = currConfig.routes_extend ? `import ROUTES_CUSTOM_ROUTER from "${currConfig.routes_extend}"` : "const ROUTES_CUSTOM_ROUTER = []";
  const ROUTES_CUSTOM_CONFIG = currConfig.routesCustomConfig ? `import ROUTES_CUSTOM_CONFIG from "${currConfig.routesCustomConfig}"` : "const ROUTES_CUSTOM_CONFIG = {}";
  const load = (id) => {
    try {
      map = glob.sync("**/*.vue", { absolute: true }).reduce((res, id2) => {
        const code2 = readFileSync(id2, "utf-8");
        const descriptor = sfc.parse(
          `${code2.match(/<script([^>])*>/)?.[0] || "<script>"}console.log(1)<script/>`
        ).descriptor;
        const attrs = ((attr) => {
          return Object.fromEntries(
            Object.entries(attr).map(([key, value]) => {
              if (/^\d+(\.\d+)?$/.test(value)) {
                value = Number(value);
              }
              if (/^\[.*\]$/.test(key)) {
                key = key.replace(/^\[|\]$/gim, "");
                try {
                  if (typeof value === "string") {
                    value = JSON.parse(value.replace(/'/gim, '"'));
                  }
                } catch (error) {
                  value = value;
                }
              }
              return [key, value];
            })
          );
        })(descriptor?.scriptSetup?.attrs || {});
        return {
          ...res,
          [id2.replace(process.cwd(), ".")]: attrs
        };
      }, {});
      const code = `${ROUTES_CUSTOM_ROUTER}
${ROUTES_CUSTOM_CONFIG}
` + readFileSync(id, "utf-8").replace(/ROUTES_META/gim, JSON.stringify(map)).replace(
        /ROUTES_FILTER_REG/gim,
        new RegExp(currConfig.routesFilter).toString()
      ).replace(/VIEWREG/gim, currConfig.views.replace(/\//gim, "\\/")).replace(/VIEWSDIR/gim, currConfig.views).replace(/page\.json/gim, currConfig.pageJson).replace(/\{vue\,jsx\,tsx\}/gim, `{${currConfig.suffix.join(",")}}`).replace(/\(vue\|jsx\|tsx\)/gim, `(${currConfig.suffix.join("|")})`);
      return {
        id,
        code,
        map
      };
    } catch (error) {
      return {
        id,
        code: "",
        map: {}
      };
    }
  };
  let routeModuleId = null;
  return {
    name: "ROUTES_META",
    enforce: "pre",
    load(id) {
      if (routeReg.test(id)) {
        routeModuleId = id;
        return load(id).code;
      }
    },
    handleHotUpdate(cxt) {
      try {
        if (routeModuleId && fileReg.test(cxt.file) && /\.vue$/.test(cxt.file)) {
          const file = cxt.file.replace(process.cwd(), ".");
          const fileMap = map[file];
          if (fileMap) {
            if (JSON.stringify(fileMap) !== JSON.stringify(load(file).map[file])) {
              cxt.server.reloadModule(
                cxt.server.moduleGraph.getModuleById(
                  routeModuleId
                )
              );
            }
          }
        }
      } catch (error) {
      }
    }
  };
};
module.exports =  ROUTES_META;
module.exports.default =  ROUTES_META;

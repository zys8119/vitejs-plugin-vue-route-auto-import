import { Plugin } from "vite";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import * as sfc from "@vue/compiler-sfc";
import glob from "fast-glob";
import _ from "lodash";
import { Config } from "../type";
const diff = (a: any, b: any) => {
  if (Object.keys(a).length !== Object.keys(b).length) {
    return true;
  }
  for (const key in a) {
    if (a[key] !== b[key]) {
      return true;
    }
  }
  return false;
};
const ROUTES_META = function (config?: Partial<Config>): Plugin {
  let map: any = {};
  const currConfig: Config = _.merge(
    {
      route: "route",
      route_suffix: "ts",
      suffix: ["vue", "jsx", "tsx"],
      views: "views",
      pageJson: "page.json",
      routesFilter: /\/alert\//,
    },
    config
  );
  const fileReg = new RegExp(`\\.(${currConfig.suffix.join("|")})$`);
  const routeReg = new RegExp(
    `${resolve(process.cwd(), currConfig.route)}\.${currConfig.route_suffix}$`
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
  const routeCode =
    currConfig.route_suffix === "ts"
      ? readFileSync(resolve(cwd, "src/route.ts"), "utf-8")
      : readFileSync(resolve(cwd, "dist/route.js"), "utf-8");
  writeFileSync(routePath, routeCode);
  const ROUTES_CUSTOM_ROUTER = currConfig.routes_extend
    ? `import ROUTES_CUSTOM_ROUTER from "${currConfig.routes_extend}"`
    : "const ROUTES_CUSTOM_ROUTER = []";
  const ROUTES_CUSTOM_CONFIG = currConfig.routesCustomConfig
    ? `import ROUTES_CUSTOM_CONFIG from "${currConfig.routesCustomConfig}"`
    : "const ROUTES_CUSTOM_CONFIG = {}";
  const load = (id: string) => {
    try {
      map = glob.sync("**/*.vue", { absolute: true }).reduce((res, id) => {
        const code = readFileSync(id, "utf-8");
        const descriptor = sfc.parse(
          `${
            code.match(/<script([^>])*>/)?.[0] || "<script>"
          }console.log(1)<script/>`
        ).descriptor;
        const attrs = ((attr) => {
          return Object.fromEntries(
            Object.entries(attr).map(([key, value]: any) => {
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
          [id.replace(process.cwd(), ".")]: attrs,
        };
      }, {});
      const code =
        `${ROUTES_CUSTOM_ROUTER}\n${ROUTES_CUSTOM_CONFIG}\n` +
        readFileSync(id, "utf-8")
          .replace(/ROUTES_META/gim, JSON.stringify(map))
          .replace(
            /ROUTES_FILTER_REG/gim,
            new RegExp(currConfig.routesFilter).toString()
          )
          .replace(/VIEWREG/gim, currConfig.views.replace(/\//gim, "\\/"))
          .replace(/VIEWSDIR/gim, currConfig.views)
          .replace(/page\.json/gim, currConfig.pageJson)
          .replace(/\{vue\,jsx\,tsx\}/gim, `{${currConfig.suffix.join(",")}}`)
          .replace(/\(vue\|jsx\|tsx\)/gim, `(${currConfig.suffix.join("|")})`);
      return {
        id,
        code,
        map,
      };
    } catch (error) {
      return {
        id,
        code: "",
        map: {},
      };
    }
  };

  let routeModuleId: any = null;
  return {
    name: "ROUTES_META",
    enforce: "pre",
    load(id) {
      if (routeReg.test(id)) {
        routeModuleId = id;
        return load(id).code;
      }
    },
    configureServer(server) {
      server.watcher.on("all", async (type, fileId) => {
        const file = fileId.replace(process.cwd(), ".");
        try {
          const fileMap = map[file];
          if (routeModuleId && /\.vue$/.test(fileId) && fileMap) {
            if (diff(fileMap, load(file).map[file])) {
              server.reloadModule(
                server.moduleGraph.getModuleById(
                  routeModuleId as unknown as string
                ) as any
              );
            }
          }
        } catch (error) {}
      });
    },
  };
};

export default ROUTES_META;

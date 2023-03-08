import {buildSync} from "esbuild"
import fastGlob from "fast-glob"
import fsExtra from "fs-extra"
import {parse, resolve} from "path"
const {writeFileSync, mkdirsSync} = fsExtra

const {outputFiles} = buildSync({
    entryPoints:fastGlob.sync("./src/**/*", {absolute:true}),
    outdir:'dist',
    write:false
})
outputFiles.forEach(({path, text})=>{
    const {name, dir} = parse(path)
    mkdirsSync(dir)
    writeFileSync(resolve(path, `../${name}.js`), text)
    writeFileSync(resolve(path, `../${name}.mjs`), text)
    writeFileSync(resolve(path, `../${name}.cjs`), text
        .replace(/^(\s*import)(\s*\*\s*as\s*)(.*)(\s*?from)(.*)(;)/img, '$1 $3$4$5$6')
        .replace(/^(\s*)(import)(.*)(from)(.*)(;)/img, '$1const$3 = require($5)$6')
        .replace(/^(export\s*)(default)(\s*.*)/img, `module.exports = $3\nmodule.exports.default = $3`)
    )
})

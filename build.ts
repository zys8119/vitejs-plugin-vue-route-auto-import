import {buildSync} from "esbuild"
import fastGlob from "fast-glob"

buildSync({
    entryPoints:fastGlob.sync("./src/**/*", {absolute:true}),
    outdir:'dist',
    platform:"node",
    loader:{
        '.ts':'ts'
    },
})

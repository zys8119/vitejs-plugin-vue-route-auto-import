# vitejs-plugin-vue-route-auto-import

vue3路由自动引入vitejs插件

## 安装

`
npm i vitejs-plugin-vue-route-auto-import
`
## 使用方法

1. vite.config.ts

```typescript
import {defineConfig} from "vite"
import AutoRoute from 'vitejs-plugin-vue-route-auto-import'
export default defineConfig({
    plugins:[
        AutoRoute({
            routes:"./test2.ts",
            views:'aa'
        })
    ]
})
```

2. main.ts

```typescript
import App from "./App.vue"
import route from "./route"
const app = createApp(App)
.use(route)
app.mount('#app')
```

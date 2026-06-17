import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { viteMockServe } from 'vite-plugin-mock'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: true
      }),
      viteMockServe({
        mockPath: 'src/mock',
        localEnabled: env.VITE_USE_MOCK === 'true',
        prodEnabled: false,
        injectCode: `
          import { setupProdMockServer } from './mock/index';
          setupProdMockServer();
        `,
        logger: true
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        [env.VITE_API_BASE_URL]: {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
          bypass(req) {
            if (env.VITE_USE_MOCK === 'true') return req.url
          }
        }
      }
    }
  }
})
/**
 * Mock 数据入口
 * vite-plugin-mock 会自动加载 src/mock 目录下所有 export default 的文件
 */
// 无需手动导入，vite-plugin-mock 自动扫描
export function setupProdMockServer() {
  console.log('[Mock] 生产环境 Mock 已启用')
}

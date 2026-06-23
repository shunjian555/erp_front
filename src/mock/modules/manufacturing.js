/**
 * Mock 数据 - 生产管理（PLM/MES）
 */
import Mock from 'mockjs'
const Random = Mock.Random

const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴']
const maleNames = ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '超', '华']
const femaleNames = ['芳', '娜', '敏', '静', '丽', '娟', '艳', '霞', '燕', '玲']
function genCName() {
  const surname = surnames[Random.integer(0, surnames.length - 1)]
  const names = Math.random() > 0.4 ? maleNames : femaleNames
  return surname + names[Random.integer(0, names.length - 1)] + (Math.random() > 0.5 ? names[Random.integer(0, names.length - 1)] : '')
}

function genList(opts) {
  const { total = 50, recordName, fields } = opts
  const list = Array.from({ length: Math.min(total, 10) }, (_, i) => {
    const item = { id: i + 1 }
    Object.entries(fields).forEach(([k, v]) => {
      if (typeof v === 'function') { item[k] = v(i) }
      else if (v === '{{name}}') item[k] = `${recordName}-${i + 1}`
      else if (v === '{{code}}') item[k] = `CODE${Random.string('number', 8)}`
      else if (v === '{{amount}}') item[k] = Random.float(100, 99999, 2, 2)
      else if (v === '{{date}}') item[k] = Random.datetime('yyyy-MM-dd HH:mm:ss')
      else if (Array.isArray(v)) item[k] = v[Random.integer(0, v.length - 1)]
      else item[k] = v
    })
    return item
  })
  return { code: 200, data: { list, total } }
}

// 产品物料
const products = ['智能控制器', '电机组件', '传感器模块', '电路板', '外壳组件', '连接线束', '电源模块', '显示屏', '按键组件', '包装盒']
const materials = ['PCB板', '电阻', '电容', 'IC芯片', '塑料颗粒', '螺丝M3', '硅胶垫', '铜线', '锡膏', '标签贴']
const workshops = ['装配一车间', '装配二车间', 'SMT车间', '注塑车间', '冲压车间', '包装车间']
const workCenters = ['CNC加工中心', '注塑机组', 'SMT贴片线', '手工装配线', '自动装配线', '测试工位', '包装工位']
const equipmentNames = ['CNC数控机床', '注塑机', 'SMT贴片机', '回流焊', '波峰焊', '自动测试台', '激光打标机', '老化测试柜', '包装机', '输送线']
const operations = ['备料', '上料', '加工', '焊接', '组装', '测试', '老化', '包装', '入库']
const priorities = ['低', '普通', '高', '紧急']
const levels = ['低', '中', '高']
const productUnits = ['个', '件', '套', '台', 'kg']

export default [
  // ========== BOM管理 ==========
  {
    url: '/api/production/bom/list',
    method: 'get',
    response: () => {
      const list = Array.from({ length: 8 }, (_, i) => {
        const productName = products[i % products.length]
        return {
          id: i + 1,
          bomNo: 'BOM' + Random.string('number', 8),
          productCode: 'P' + Random.string('number', 6),
          productName,
          productUnit: productUnits[Random.integer(0, productUnits.length - 1)],
          version: `V${Random.integer(1, 5)}.${Random.integer(0, 9)}`,
          level: Random.integer(0, 3),
          isMain: Math.random() > 0.3 ? 1 : 0,
          status: Random.integer(0, 2),
          effectiveDate: Random.date('yyyy-MM-dd'),
          expiryDate: '',
          totalQty: Random.float(5, 50, 2, 2),
          cost: Random.float(50, 5000, 2, 2),
          createBy: genCName(),
          createTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
        }
      })
      return { code: 200, data: { list, total: 32 } }
    }
  },
  {
    url: '/api/production/bom/detail',
    method: 'get',
    response: (params) => {
      const id = params.id
      const lines = Array.from({ length: Random.integer(4, 8) }, (_, i) => {
        const isSemi = Math.random() > 0.6
        return {
          id: id * 100 + i,
          lineNo: i + 1,
          level: 1,
          materialCode: 'M' + Random.string('number', 6),
          materialName: isSemi ? products[Random.integer(0, products.length - 1)] : materials[Random.integer(0, materials.length - 1)],
          spec: Random.ctitle(4, 10),
          unit: productUnits[Random.integer(0, productUnits.length - 1)],
          quantity: Random.float(1, 10, 2, 2),
          wastageRate: Random.float(0, 5, 1, 2),
          effectiveQty: Random.float(1, 10, 2, 2),
          isKey: Math.random() > 0.7 ? 1 : 0,
          isSubstitute: Math.random() > 0.8 ? 1 : 0,
          substituteRate: Math.random() > 0.8 ? 100 : 0,
          sourceType: isSemi ? '自制' : '采购',
          remark: ''
        }
      })
      return { code: 200, data: { lines } }
    }
  },

  // ========== 工艺路线 ==========
  {
    url: '/api/production/process/list',
    method: 'get',
    response: () => {
      const list = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        routingNo: 'RT' + Random.string('number', 8),
        productCode: 'P' + Random.string('number', 6),
        productName: products[i % products.length],
        version: `V${Random.integer(1, 3)}.0`,
        status: Random.integer(0, 2),
        totalTime: Random.float(60, 480, 0, 0),
        totalCost: Random.float(20, 500, 2, 2),
        processCount: Random.integer(3, 8),
        isMain: Math.random() > 0.3 ? 1 : 0,
        createBy: genCName(),
        createTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
      }))
      return { code: 200, data: { list, total: 24 } }
    }
  },
  {
    url: '/api/production/process/detail',
    method: 'get',
    response: (params) => {
      const id = params.id
      const count = Random.integer(4, 7)
      const lines = Array.from({ length: count }, (_, i) => ({
        id: id * 100 + i,
        sequence: (i + 1) * 10,
        operationName: operations[i % operations.length],
        workCenter: workCenters[Random.integer(0, workCenters.length - 1)],
        standardTime: Random.float(10, 60, 0, 0),
        setupTime: Random.float(5, 20, 0, 0),
        waitTime: Random.float(2, 10, 0, 0),
        moveTime: Random.float(1, 5, 0, 0),
        unitCost: Random.float(2, 50, 2, 2),
        isKey: Math.random() > 0.7 ? 1 : 0,
        isQc: Math.random() > 0.7 ? 1 : 0,
        description: '按工艺要求执行'
      }))
      return { code: 200, data: { lines } }
    }
  },

  // ========== 产能数据 ==========
  {
    url: '/api/production/capacity/list',
    method: 'get',
    response: () => {
      const list = workCenters.map((wc, i) => ({
        id: i + 1,
        workCenterCode: 'WC' + Random.string('number', 6),
        workCenterName: wc,
        workshop: workshops[Random.integer(0, workshops.length - 1)],
        standardCapacity: Random.float(80, 200, 0, 0),
        actualCapacity: Random.float(50, 180, 0, 0),
        utilization: Random.float(60, 100, 1, 1),
        efficiency: Random.float(70, 100, 1, 1),
        workerCount: Random.integer(3, 20),
        equipmentCount: Random.integer(1, 10),
        status: Random.integer(0, 1)
      }))
      return { code: 200, data: { list, total: list.length } }
    }
  },

  // ========== 主生产计划 MPS ==========
  {
    url: '/api/production/mps/list',
    method: 'get',
    response: () => {
      const list = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        planNo: 'MPS' + Random.datetime('yyyyMMdd') + Random.string('number', 3),
        productCode: 'P' + Random.string('number', 6),
        productName: products[i % products.length],
        planQty: Random.integer(100, 5000),
        planStartDate: Random.date('yyyy-MM-dd'),
        planEndDate: Random.date('yyyy-MM-dd'),
        actualStartDate: '',
        actualEndDate: '',
        priority: priorities[Random.integer(0, priorities.length - 1)],
        status: Random.integer(0, 4),
        workshop: workshops[Random.integer(0, workshops.length - 1)],
        sourceType: Math.random() > 0.5 ? '订单' : '预测',
        createBy: genCName(),
        createTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
      }))
      return { code: 200, data: { list, total: 18 } }
    }
  },

  // ========== 物料需求计划 MRP ==========
  {
    url: '/api/production/mrp/list',
    method: 'get',
    response: () => {
      const list = Array.from({ length: 8 }, (_, i) => {
        const materialName = materials[Random.integer(0, materials.length - 1)]
        const demandQty = Random.integer(500, 10000)
        const onHandQty = Random.integer(0, Math.floor(demandQty * 0.6))
        const onOrderQty = Random.integer(0, Math.floor(demandQty * 0.3))
        return {
          id: i + 1,
          planNo: 'MRP' + Random.datetime('yyyyMMdd') + Random.string('number', 3),
          materialCode: 'M' + Random.string('number', 6),
          materialName,
          spec: Random.ctitle(4, 10),
          unit: productUnits[Random.integer(0, productUnits.length - 1)],
          demandQty,
          onHandQty,
          onOrderQty,
          netReqQty: Math.max(0, demandQty - onHandQty - onOrderQty),
          suggestedQty: Math.max(0, demandQty - onHandQty - onOrderQty),
          sourceType: Math.random() > 0.4 ? '采购' : '生产',
          requiredDate: Random.date('yyyy-MM-dd'),
          status: Random.integer(0, 3),
          runTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
        }
      })
      return { code: 200, data: { list, total: 45 } }
    }
  },

  // ========== 生产订单 ==========
  {
    url: '/api/production/order/list',
    method: 'get',
    response: () => {
      const list = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        orderNo: 'MO' + Random.datetime('yyyyMMdd') + Random.string('number', 3),
        productCode: 'P' + Random.string('number', 6),
        productName: products[i % products.length],
        spec: Random.ctitle(4, 10),
        unit: productUnits[Random.integer(0, productUnits.length - 1)],
        plannedQty: Random.integer(100, 2000),
        completedQty: Random.integer(0, 100),
        scrapQty: Random.integer(0, 10),
        planStartDate: Random.date('yyyy-MM-dd'),
        planEndDate: Random.date('yyyy-MM-dd'),
        actualStartDate: Random.date('yyyy-MM-dd'),
        actualEndDate: '',
        workshop: workshops[Random.integer(0, workshops.length - 1)],
        priority: priorities[Random.integer(0, priorities.length - 1)],
        status: Random.integer(0, 6),
        sourceNo: 'MPS' + Random.string('number', 6),
        createBy: genCName(),
        createTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
      }))
      return { code: 200, data: { list, total: 28 } }
    }
  },

  // ========== 工序管理 ==========
  {
    url: '/api/production/operation/list',
    method: 'get',
    response: () => {
      const list = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        dispatchNo: 'OP' + Random.string('number', 8),
        productionOrderNo: 'MO' + Random.datetime('yyyyMMdd') + Random.string('number', 3),
        productName: products[Random.integer(0, products.length - 1)],
        sequence: (i % 5 + 1) * 10,
        operationName: operations[i % operations.length],
        workCenter: workCenters[Random.integer(0, workCenters.length - 1)],
        worker: genCName(),
        plannedQty: Random.integer(50, 500),
        completedQty: Random.integer(0, 500),
        qualifiedQty: Random.integer(0, 500),
        defectQty: Random.integer(0, 10),
        standardTime: Random.float(10, 60, 0, 0),
        actualTime: Random.float(8, 70, 1, 1),
        startTime: Random.datetime('yyyy-MM-dd HH:mm:ss'),
        endTime: '',
        status: Random.integer(0, 4)
      }))
      return { code: 200, data: { list, total: 56 } }
    }
  },

  // ========== 车间管理 ==========
  {
    url: '/api/production/workshop/list',
    method: 'get',
    response: () => {
      const list = workshops.map((w, i) => ({
        id: i + 1,
        workshopCode: 'WS' + Random.string('number', 6),
        workshopName: w,
        manager: genCName(),
        workCenterCount: Random.integer(2, 6),
        workerCount: Random.integer(20, 80),
        activeOrders: Random.integer(0, 8),
        area: Random.float(500, 3000, 0, 0),
        location: '厂区' + Random.integer(1, 5) + '栋',
        description: '',
        status: Random.integer(0, 1)
      }))
      return { code: 200, data: { list, total: list.length } }
    }
  },

  // ========== 委外加工 ==========
  {
    url: '/api/production/outsourcing/list',
    method: 'get',
    response: () => {
      const list = Array.from({ length: 8 }, (_, i) => {
        const supplierName = ['外协供应商A', '外协供应商B', '外协供应商C', '外协供应商D'][Random.integer(0, 3)]
        const price = Random.float(2, 50, 2, 2)
        const outsourceQty = Random.integer(100, 2000)
        return {
          id: i + 1,
          outsourceNo: 'OS' + Random.datetime('yyyyMMdd') + Random.string('number', 3),
          supplierName,
          contact: '联系' + Math.floor(Random.integer(1, 9)),
          materialCode: 'P' + Random.string('number', 6),
          materialName: products[i % products.length],
          spec: Random.ctitle(4, 10),
          unit: productUnits[Random.integer(0, productUnits.length - 1)],
          outsourceQty,
          receivedQty: Random.integer(0, outsourceQty),
          price,
          totalAmount: +(price * outsourceQty).toFixed(2),
          outboundDate: Random.date('yyyy-MM-dd'),
          deliveryDate: Random.date('yyyy-MM-dd'),
          status: Random.integer(0, 5),
          createBy: genCName(),
          createTime: Random.datetime('yyyy-MM-dd HH:mm:ss')
        }
      })
      return { code: 200, data: { list, total: 22 } }
    }
  },

  // ========== 设备管理 ==========
  {
    url: '/api/production/equipment/list',
    method: 'get',
    response: () => {
      const list = equipmentNames.map((name, i) => {
        const originalValue = Random.float(10000, 500000, 2, 2)
        return {
          id: i + 1,
          equipmentCode: 'EQ' + Random.string('number', 6),
          equipmentName: name,
          equipmentType: name.includes('CNC') ? '数控' : (name.includes('注塑') ? '注塑' : (name.includes('SMT') || name.includes('焊') ? '焊接' : '辅助')),
          spec: 'M' + Random.string('upper', 2) + '-' + Random.integer(100, 999),
          workshop: workshops[Random.integer(0, workshops.length - 1)],
          manufacturer: '上海' + Random.ctitle(2, 4) + '机械',
          purchaseDate: Random.date('yyyy-MM-dd'),
          usedYears: Random.integer(1, 8),
          originalValue,
          netValue: +(originalValue * Random.float(0.4, 0.9, 2, 2)).toFixed(2),
          responsible: genCName(),
          location: '厂区' + Random.integer(1, 5) + '栋-' + Random.integer(1, 3) + '层',
          healthLevel: Random.integer(1, 5),
          status: Random.integer(0, 3)
        }
      })
      return { code: 200, data: { list, total: list.length } }
    }
  },
  {
    url: '/api/production/equipment/maintenance',
    method: 'get',
    response: () => {
      const types = ['保养', '维修', '点检', '校准']
      const statuses = ['待执行', '进行中', '已完成']
      const list = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        maintenanceNo: 'MN' + Random.datetime('yyyyMMdd') + Random.string('number', 3),
        equipmentName: equipmentNames[Random.integer(0, equipmentNames.length - 1)],
        maintenanceType: types[Random.integer(0, types.length - 1)],
        planDate: Random.date('yyyy-MM-dd'),
        responsible: genCName(),
        status: statuses[Random.integer(0, statuses.length - 1)],
        description: '按维护计划执行设备保养/维修工作'
      }))
      return { code: 200, data: { list } }
    }
  }
]

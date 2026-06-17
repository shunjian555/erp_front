/**
 * Mock 数据 - CRM 模块
 */
import Mock from "mockjs";
const Random = Mock.Random;

// 中文姓名生成（替代不可用的 Random.cname）
const surnames = [
  "张",
  "王",
  "李",
  "赵",
  "刘",
  "陈",
  "杨",
  "黄",
  "周",
  "吴",
  "徐",
  "孙",
  "马",
  "朱",
  "胡",
  "郭",
  "何",
  "林",
  "罗",
  "高",
];
const maleNames = [
  "伟",
  "强",
  "磊",
  "军",
  "勇",
  "杰",
  "涛",
  "明",
  "超",
  "华",
  "鹏",
  "辉",
  "志",
  "建",
  "文",
  "斌",
  "宇",
  "浩",
  "凯",
  "俊",
];
const femaleNames = [
  "芳",
  "娜",
  "敏",
  "静",
  "丽",
  "娟",
  "艳",
  "霞",
  "燕",
  "玲",
  "婷",
  "雪",
  "莉",
  "欣",
  "怡",
  "佳",
  "慧",
  "琳",
  "莹",
  "倩",
];

function genCName() {
  const surname = surnames[Random.integer(0, surnames.length - 1)];
  const isMale = Math.random() > 0.4;
  const names = isMale ? maleNames : femaleNames;
  return (
    surname +
    names[Random.integer(0, names.length - 1)] +
    (Math.random() > 0.5 ? names[Random.integer(0, names.length - 1)] : "")
  );
}

function genList(opts) {
  const { total = 50, recordName, fields } = opts;
  const list = Array.from({ length: Math.min(total, 10) }, (_, i) => {
    const item = { id: i + 1 };
    Object.entries(fields).forEach(([k, v]) => {
      if (typeof v === "function") {
        item[k] = v(i);
      } else if (v === "{{name}}") item[k] = `${recordName}-${i + 1}`;
      else if (v === "{{title}}") item[k] = Random.ctitle(6, 12);
      else if (v === "{{code}}") item[k] = `CODE${Random.string("number", 8)}`;
      else if (v === "{{amount}}") item[k] = Random.float(100, 99999, 2, 2);
      else if (v === "{{date}}")
        item[k] = Random.datetime("yyyy-MM-dd HH:mm:ss");
      else if (Array.isArray(v)) item[k] = v[Random.integer(0, v.length - 1)];
      else item[k] = v;
    });
    return item;
  });
  return { code: 200, data: { list, total } };
}

export default [
  // 客户管理
  {
    url: "/api/crm/customer/list",
    method: "get",
    response: () =>
      genList({
        total: 56,
        recordName: "客户",
        fields: {
          customerName: "{{name}}",
          contactName: genCName(),
          phone: 12345678911,
          email: Random.email(),
          address: Random.city(true),
          level: ["A", "B", "C"],
          status: [0, 1],
          createTime: "{{date}}",
        },
      }),
  },
  // 联系人管理
  {
    url: "/api/crm/contact/list",
    method: "get",
    response: () =>
      genList({
        total: 89,
        recordName: "联系人",
        fields: {
          contactName: genCName(),
          customerName: "{{name}}",
          phone: 12345678911,
          email: Random.email(),
          position: ["经理", "主管", "专员", "总监", "助理"],
          status: [0, 1],
          createTime: "{{date}}",
        },
      }),
  },
  // 线索管理
  {
    url: "/api/crm/lead/list",
    method: "get",
    response: () =>
      genList({
        total: 42,
        recordName: "线索",
        fields: {
          leadName: "{{name}}",
          source: ["官网", "电话", "展会", "推荐", "广告"],
          contactName: genCName(),
          phone: 12345678911,
          status: [0, 1, 2],
          createTime: "{{date}}",
        },
      }),
  },
  // 商机管理
  {
    url: "/api/crm/opportunity/list",
    method: "get",
    response: () =>
      genList({
        total: 35,
        recordName: "商机",
        fields: {
          opportunityName: "{{title}}",
          customerName: "{{name}}",
          expectedAmount: "{{amount}}",
          stage: ["初步接触", "需求确认", "方案报价", "商务谈判", "合同签订"],
          probability: Random.integer(10, 100),
          ownerName: genCName(),
          createTime: "{{date}}",
        },
      }),
  },
  // 报价单管理
  {
    url: "/api/crm/quote/list",
    method: "get",
    response: () =>
      genList({
        total: 28,
        recordName: "报价单",
        fields: {
          quoteNo: `QT${Random.string("number", 8)}`,
          customerName: "{{name}}",
          totalAmount: "{{amount}}",
          validDays: Random.integer(15, 90),
          status: [0, 1, 2],
          creator: genCName(),
          createTime: "{{date}}",
        },
      }),
  },
  // 合同管理
  {
    url: "/api/crm/contract/list",
    method: "get",
    response: () =>
      genList({
        total: 22,
        recordName: "合同",
        fields: {
          contractNo: `CT${Random.string("number", 8)}`,
          customerName: "{{name}}",
          contractAmount: "{{amount}}",
          startDate: Random.date("yyyy-MM-dd"),
          endDate: Random.date("yyyy-MM-dd"),
          status: [0, 1, 2],
          createTime: "{{date}}",
        },
      }),
  },
];

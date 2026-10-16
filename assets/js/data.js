/* =========================================================================
 *  data.js —— 全站唯一数据源（v2）
 *  ---------------------------------------------------------------------
 *  王可儿的个人主页 · 改这一个文件，网站页面 + 一键导出的简历会同步更新。
 *  也可以直接在网站上点右上角「✏️ 编辑内容」在浏览器里改，改完点保存即可。
 * ========================================================================= */

window.SITE_DATA = {

  /* ------------------------------ 个人基本信息 ------------------------------ */
  profile: {
    name: "王可儿",
    enName: "WANG Keer",
    avatar: "assets/img/avatar.jpg",
    eyebrow: "商丘师范学院 · 地理信息科学 · 大二在读 · 辅修智能遥感微专业",
    title: "地理信息科学 × 内容运营 × AI Agent 学习者",
    summary: "商丘师范学院地理信息科学专业大二在读。做过一段互联网线上运营推广实习，" +
             "在抖音、小红书、视频号、快手等平台做出过爆款视频；业余时间运营两个自己的抖音号。" +
             "2026 年 9 月起开始自学 Python、MySQL、数据结构与 AI Agent 开发，" +
             "正在把学到的东西变成一个个真实项目。",
    badge: "GPA 3.93 / 5.0",

    phone: "",
    email: "1399509752@qq.com",          // 私人邮箱
    workEmail: "13070655295@163.com",    // 工作/对外邮箱
    city: "河南 · 商丘",
    github: "https://github.com/wke-engineer",
    website: "https://wke-engineer.github.io/wke-portfolio/",
    wechat: "",
    jobTarget: "",
    available: ""
  },

  /* ------------------------------ 首屏数字卡片 ------------------------------ */
  stats: [
    { value: "3.93", unit: "/5.0", label: "加权 GPA" },
    { value: "5",    unit: "个",   label: "内容平台账号" },
    { value: "3",    unit: "个",   label: "进行中的项目" },
    { value: "1",    unit: "段",   label: "互联网实习" }
  ],

  /* --------------------------- 受众视角模式 ---------------------------
   * 不同对象关心不同的东西。切换视角后：
   *  1) 首屏简介换成该视角的文案
   *  2) 页面板块按 order 重新排序，越靠前越突出
   *  3) 一键导出的简历同步使用该视角的简介与板块顺序
   * order 里没列出的板块会被暂时隐藏（想全部显示就不切换视角）。
   * ------------------------------------------------------------------ */
  audience: {
    intro: "针对不同对象，展示不同的重点：",
    modes: [
      {
        key: "default", label: "完整版",
        summary: "",
        order: ["education", "internship", "project", "media", "award", "volunteer", "organization", "certificate", "skill"],
        note: "展示全部内容，适合日常浏览。"
      },
      {
        key: "hr", label: "求职 HR",
        summary: "地理信息科学专业大二学生，有一段互联网线上运营推广实习经历，多平台爆款视频产出经验；" +
                 "正在自学 Python / MySQL / AI Agent 开发，并把学习成果沉淀为三个真实项目（见 GitHub）。" +
                 "执行力强、数据敏感，能快速上手内容运营与推广类工作。",
        order: ["internship", "project", "award", "organization", "skill", "media", "education", "volunteer", "certificate"],
        note: "实习与项目优先，突出执行力与岗位匹配度。"
      },
      {
        key: "kaoyan", label: "考研导师",
        summary: "商丘师范学院地理信息科学专业大二在读，加权 GPA 3.93 / 5.0，辅修智能遥感微专业。" +
                 "对 GIS 与人工智能的交叉方向有浓厚兴趣，2026 年 9 月起系统自学 Python、MySQL、数据结构" +
                 "与 AI Agent 开发，并以真实项目驱动学习（全部开源在 GitHub）。" +
                 "参与易智瑞杯地理设计组等学科竞赛，动手实践与数据分析能力强，期望在深造阶段深入空间信息与智能体方向。",
        order: ["education", "award", "project", "volunteer", "organization", "internship", "skill", "certificate", "media"],
        note: "学业成绩与科研潜力优先，弱化自媒体。"
      },
      {
        key: "abroad", label: "留学考官",
        summary: "Geoinformation Science undergraduate at Shangqiu Normal University (GPA 3.93/5.0, top-tier), " +
                 "minoring in the Intelligent Remote Sensing micro-program. Strong interest in the intersection of " +
                 "GIS and artificial intelligence: self-studying Python, MySQL, data structures and AI Agent " +
                 "development since Sept 2026, with all learning outcomes open-sourced on GitHub. Experienced in " +
                 "academic competitions (Esri Cup Geo-design track) and provincial-level sports event volunteering.",
        order: ["education", "award", "project", "volunteer", "organization", "internship", "skill", "certificate", "media"],
        note: "学术表现 + 综合素养 + 英文简介优先。"
      }
    ]
  },

  /* --------------------------- 教育背景 --------------------------- */
  educationDesc: "在读专业、成绩表现与专业主要课程。",
  education: [
    {
      school: "商丘师范学院",
      college: "",
      major: "地理信息科学（本科）",
      degree: "理学学士",
      period: "2025.09 – 2029.06",
      gpa: "3.93 / 5.0",
      rank: "",
      location: "河南 · 商丘",
      coursesLabel: "专业主要课程",
      /* —— 辅修微专业 —— */
      minor: {
        name: "辅修微专业：智能遥感",
        org: "低空技术与空间信息学院",
        period: "2026.09 – 2027.06（在读）",
        desc: "全校选拔 30 人的交叉学科微专业，围绕「学科前沿感知—智能算法运用—行业应用专题」构建课程体系，" +
              "聚焦遥感影像智能处理与 AI 交叉应用，修满 12 学分后由学校颁发「智能遥感」微专业结业证书。",
        courses: [
          "智能遥感应用前沿", "智能目标识别", "智能环境遥感",
          "智能农业遥感", "智能城市遥感", "低空智能感知"
        ]
      },
      courses: [
        { name: "地图学" },
        { name: "地理信息科学导论" },
        { name: "遥感导论" },
        { name: "数据库系统概论" },
        { name: "GIS 软件应用" },
        { name: "GIS 空间分析" },
        { name: "遥感数字图像处理" },
        { name: "卫星导航定位技术应用" },
        { name: "GIS 应用开发" }
      ],
      honors: [
        "加权 GPA 3.93 / 5.0",
        "大一寒假、暑期「三下乡」社会实践，所在团队两次获院级三等奖"
      ]
    }
  ],

  /* --------------------------- 实习经历 --------------------------- */
  internshipDesc: "线上运营推广实习经历。",
  internships: [
    {
      company: "炫图 AI",
      role: "互联网线上运营推广（实习）",
      period: "2026.03 – 2026.06",
      location: "线上",
      tags: ["内容运营", "短视频推广", "多平台分发", "数据复盘"],
      points: [
        "负责线上运营推广工作，参与抖音、小红书、视频号、快手等多平台内容的策划与分发。",
        "配合完成视频选题与文案打磨，参与推广节奏与发布时间安排。",
        "跟踪各平台内容数据表现并做复盘，逐步沉淀出可复用的选题与投放方法。"
      ]
    }
  ],

  /* --------------------------- 项目作品 ---------------------------
   * 三个项目全部开源在 GitHub，按重要性排序展示。
   * emoji 字段是卡片上的「可爱标识」，可以随意换成喜欢的表情。
   * ---------------------------------------------------------------- */
  projectDesc: "包含导师科研项目、三个开源项目（GitHub: wke-engineer），按重要性排序，持续更新中。",
  projects: [
    {
      title: "道路破损识别（导师科研项目）",
      type: "科研项目",
      period: "2026.10 起",
      emoji: "🛣️",
      badge: "导师科研",
      cover: "",
      summary: "参与导师科研项目，围绕道路路面破损的自动识别开展研究与实现。" +
               "旨在利用计算机视觉 / 遥感影像智能处理技术，对路面裂缝、坑槽等病害进行自动检测与分类，" +
               "为道路养护巡检提供更高效的智能化方案。",
      highlights: [
        "参与导师课题组，负责资料调研与实验数据整理",
        "学习并实践成像数据预处理与破损特征提取思路",
        "项目成果后续会持续补充：算法方案、实验结果、论文/报告等"
      ],
      stack: ["Python", "计算机视觉", "图像处理", "遥感应用"],
      links: []
    },
    {
      title: "KingPath · 每日计划与理财管理",
      type: "全栈应用",
      period: "2026 进行中",
      emoji: "🚀",
      badge: "主力项目",
      cover: "",
      summary: "每日固定计划提醒 + 理财管理工具，React PWA + Node/Prisma 全栈实现，随时随地记录与提醒。",
      highlights: [
        "React PWA 架构，手机桌面可直接安装使用",
        "Node.js + Prisma 后端，数据云端同步",
        "TypeScript 全栈类型安全"
      ],
      stack: ["TypeScript", "React", "Node.js", "Prisma", "PWA"],
      links: [{ label: "GitHub 仓库", url: "https://github.com/wke-engineer/kingpath" }]
    },
    {
      title: "Agent 280 天成长计划",
      type: "AI Agent",
      period: "2026.09 起",
      emoji: "🤖",
      badge: "自学主线",
      cover: "",
      summary: "280 天 AI Agent 开发者成长之旅：以日更实践记录 Python、数据结构、MySQL 与 Agent 开发的学习路径。",
      highlights: [
        "以项目驱动学习，每个知识点都落成代码",
        "公开学习路线与进度，可被复用与检验"
      ],
      stack: ["Python", "AI Agent", "数据结构", "MySQL"],
      links: [{ label: "GitHub 仓库", url: "https://github.com/wke-engineer/agent-280-days" }]
    },
    {
      title: "Homie · 居家小助手",
      type: "应用开发",
      period: "2026 进行中",
      emoji: "🏠",
      badge: "新手上路",
      cover: "",
      summary: "Homie 的家 —— 一个正在学习中的 Python 小项目，边学边做，记录成长。",
      highlights: [
        "Python 实践项目，用于巩固自学成果"
      ],
      stack: ["Python"],
      links: [{ label: "GitHub 仓库", url: "https://github.com/wke-engineer/-" }]
    }
  ],

  /* --------------------- 科研项目后续进展（持续补充区） ---------------------
   * 导师科研项目「道路破损识别」的进展记录。有新增内容时往数组最前面加一条即可，
   * 日期用 YYYY.MM 格式；整块删掉也不会影响网站其他部分。
   * --------------------------------------------------------------------- */
  researchLogTitle: "道路破损识别 · 进展记录",
  researchLogDesc: "科研项目会随进展持续更新，以下为已完成 / 进行中的里程碑。",
  researchLog: [
    { date: "2026.10", title: "加入课题组，项目启动",
      desc: "开始参与导师科研项目，确定研究方向为道路破损的自动识别，进行资料调研与技术路线了解。" },
    { date: "待补充", title: "数据集与实验方案",
      desc: "后续将补充数据集来源、预处理方式、模型选型与实验设计等内容。" },
    { date: "待补充", title: "实验结果与成果",
      desc: "后续将补充模型效果指标、可视化结果，以及论文 / 报告 / 专利等成果信息。" }
  ],

  /* --------------------------- 自媒体 --------------------------- */
  mediaDesc: "在多个平台做过内容创作与分发，产出过爆款视频；目前业余运营两个自己的抖音号。",
  media: {
    intro: "在抖音、小红书、视频号、快手等平台均有内容创作与分发经验，多条视频成为爆款；" +
           "现在业余时间运营两个抖音账号「挚友」和「22er」，各自都有爆款视频产出。" +
           "（出于隐私考虑，具体账号 ID 暂不公开，可私下交流）",

    platforms: [
      { name: "抖音号 · 挚友",  handle: "个人账号", main: "有爆款视频", mainLabel: "内容成绩",
        meta: [{ k: "状态", v: "持续更新" }, { k: "账号", v: "私聊可见" }], url: "" },
      { name: "抖音号 · 22er",  handle: "个人账号", main: "有爆款视频", mainLabel: "内容成绩",
        meta: [{ k: "状态", v: "持续更新" }, { k: "账号", v: "私聊可见" }], url: "" },
      { name: "小红书",   handle: "内容分发", main: "有爆款笔记", mainLabel: "内容成绩",
        meta: [{ k: "状态", v: "实习期间分发" }], url: "" },
      { name: "视频号",   handle: "内容分发", main: "有爆款视频", mainLabel: "内容成绩",
        meta: [{ k: "状态", v: "实习期间分发" }], url: "" },
      { name: "快手",     handle: "内容分发", main: "有爆款视频", mainLabel: "内容成绩",
        meta: [{ k: "状态", v: "实习期间分发" }], url: "" }
    ],

    mediaWorks: [
      { title: "抖音号「挚友」爆款视频",   platform: "抖音",   metric: "播放数据可私聊展示", url: "" },
      { title: "抖音号「22er」爆款视频",   platform: "抖音",   metric: "播放数据可私聊展示", url: "" },
      { title: "多平台爆款内容产出", platform: "多平台", metric: "抖音 / 小红书 / 视频号 / 快手", url: "" }
    ]
  },

  /* --------------------------- 志愿服务与社会实践 --------------------------- */
  volunteerDesc: "省级赛会志愿服务与校内社会实践经历。",
  volunteers: [
    {
      title: "山东省第十六届全民健身运动会「好运山东」射箭比赛志愿服务",
      role: "赛会志愿者",
      period: "2026.07.18 – 2026.07.19",
      org: "省级赛会 · 山东",
      desc: "负责引导、安检、计分与应急救护等岗位的志愿服务工作，保障赛事各环节顺畅运行。"
    },
    {
      title: "齐鲁足球超级联赛志愿服务 · 淄博站",
      role: "赛会志愿者",
      period: "2026.07.19",
      org: "省级赛会 · 淄博",
      desc: "负责安检、闸机验票、观众引导及各类突发情况的现场处置，完成整场比赛的赛会服务保障。"
    },
    {
      title: "大学生暑期「三下乡」社会实践",
      role: "团队成员",
      period: "2026.06 – 2026.07",
      org: "商丘师范学院",
      desc: "作为团队成员参与暑期「三下乡」社会实践，所在团队获院级三等奖。"
    },
    {
      title: "大学生寒假「三下乡」社会实践",
      role: "团队成员",
      period: "2026.01 – 2026.02",
      org: "商丘师范学院",
      desc: "作为团队成员参与寒假「三下乡」社会实践，所在团队获院级三等奖。"
    }
  ],

  /* --------------------------- 竞赛与荣誉 --------------------------- */
  awardDesc: "学科竞赛与创新创业赛事经历（含备赛中与已完赛）。",
  awards: [
    {
      title: "首届「数智地理，慧能中原」科技创新创业大赛",
      level: "备赛中",
      status: "ongoing",
      date: "2026.10",
      desc: "已报名参赛，正在备赛（报名系统：数智地理创新创业大赛）。"
    },
    {
      title: "北控水务杯第九届中国国际生态环境创新大赛",
      level: "备赛中",
      status: "ongoing",
      date: "2026.10",
      desc: "已报名参赛，正在备赛，方向为生态环境领域创新方案。"
    },
    {
      title: "第十八届蓝桥杯全国软件和信息技术专业人才大赛",
      level: "备赛中",
      status: "ongoing",
      date: "2026.10",
      desc: "已报名备赛中，结合 Python 与算法基础的系统训练。"
    },
    {
      title: "易智瑞杯 B 组 · 地理设计组（B1001）",
      level: "已完赛",
      status: "done",
      date: "2026.08",
      desc: "参赛作品《自然-人为复合影响下长江中游城市群植被增绿的空间异质性与非线性响应》，已完成比赛提交。"
    },
    {
      title: "大学生暑期「三下乡」社会实践",
      level: "院级三等奖",
      status: "done",
      date: "2026.07",
      desc: "作为团队成员参与，所在团队获院级三等奖。"
    },
    {
      title: "大学生寒假「三下乡」社会实践",
      level: "院级三等奖",
      status: "done",
      date: "2026.02",
      desc: "作为团队成员参与，所在团队获院级三等奖。"
    }
  ],

  /* --------------------------- 校园组织与社团 --------------------------- */
  orgDesc: "校内工作室与组织任职。",
  organizations: [
    {
      name: "校创「北斗行」工作室",
      role: "宣传部成员",
      period: "2026.10 起",
      desc: "加入校创北斗行工作室宣传部，负责工作室的内容宣传与新媒体运营相关工作。"
    }
  ],

  /* --------------------------- 证书与资质 --------------------------- */
  certificateDesc: "语言、专业技能与职业资格等。",
  certificates: [
    { name: "全国计算机等级考试二级", issuer: "教育部教育考试院", date: "", score: "已通过", cover: "" }
  ],

  /* --------------------------- 技能栈 --------------------------- */
  skillDesc: "数字代表熟练度自评（0–100），可以按自己的感觉随时调整。",
  skills: [
    { group: "编程与数据（自学中）", items: [
      { name: "Python",        level: 55 },
      { name: "MySQL",         level: 50 },
      { name: "数据结构",       level: 45 },
      { name: "AI Agent 开发",  level: 40 }
    ]},
    { group: "内容运营", items: [
      { name: "短视频选题策划", level: 80 },
      { name: "多平台内容分发", level: 85 },
      { name: "文案与脚本",     level: 75 },
      { name: "内容数据复盘",   level: 70 }
    ]},
    { group: "专业与办公", items: [
      { name: "GIS 基础与空间分析", level: 70 },
      { name: "Office / WPS",      level: 80 }
    ]}
  ],

  /* --------------------------- 联系区 --------------------------- */
  contactText: "欢迎交流内容运营和 AI Agent 学习，也欢迎一起做点有意思的项目。",
  footerText: "© 2026 王可儿 · 商丘师范学院 地理信息科学"
};

'use strict';
const reportTemplates=[{id:'REP-01',name:'运行概览',icon:'◫',description:'负载、续航、SOC/SOH与数据质量',formats:['PDF','XLSX']},{id:'REP-02',name:'指标历史',icon:'⌁',description:'按设备与测点分组的源历史',formats:['XLSX','CSV']},{id:'REP-03',name:'告警事件',icon:'⚑',description:'期内发生、跨期持续及普通事件',formats:['PDF','XLSX','CSV']},{id:'REP-04',name:'维护与健康',icon:'◷',description:'当前资产、评估依据与计划展望',formats:['PDF','XLSX']}];
let reportState={template:'REP-01',format:'PDF',from:'',to:'',timezone:'',aggregation:'raw',preview:null,jobs:[]};

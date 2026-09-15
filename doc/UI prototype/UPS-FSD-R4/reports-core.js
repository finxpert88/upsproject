'use strict';
const reportTemplates=[{id:'REP-01',name:L.m664,icon:'◫',description:L.m665,formats:['PDF','XLSX']},{id:'REP-02',name:L.m666,icon:'⌁',description:L.m667,formats:['XLSX','CSV']},{id:'REP-03',name:L.alarmEventReport,icon:'⚑',description:L.m668,formats:['PDF','XLSX','CSV']},{id:'REP-04',name:L.m669,icon:'◷',description:L.m670,formats:['PDF','XLSX']}];
let reportState={template:'REP-01',format:'PDF',from:'',to:'',timezone:'',aggregation:'raw',preview:null,jobs:[]};

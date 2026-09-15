# DP-F01逐项勘误

仅改变新执行计划的类型引用，不改冻结B1或公共schema。

| 接口／方法 | 旧请求引用 | 正确请求／响应引用 | 实现包／传输 |
|---|---|---|---|
| OP-01 sessionCapabilities | Contracts['sessionCapabilities']['request'] | Contracts['OP-01']['request']<br>Contracts['OP-01']['response'] | DEV-02 / WireResponse<'OP-01'> |
| OP-02 equipmentList | Contracts['equipmentList']['request'] | Contracts['OP-02']['request']<br>Contracts['OP-02']['response'] | DEV-04 / WireResponse<'OP-02'> |
| OP-03 equipmentSnapshot | Contracts['equipmentSnapshot']['request'] | Contracts['OP-03']['request']<br>Contracts['OP-03']['response'] | DEV-04 / WireResponse<'OP-03'> |
| OP-04 metricHistory | Contracts['metricHistory']['request'] | Contracts['OP-04']['request']<br>Contracts['OP-04']['response'] | DEV-05 / WireResponse<'OP-04'> |
| OP-05 alarmListDetail | Contracts['alarmListDetail']['request'] | Contracts['OP-05']['request']<br>Contracts['OP-05']['response'] | DEV-07 / WireResponse<'OP-05'> |
| OP-06 alarmAcknowledge | Contracts['alarmAcknowledge']['request'] | Contracts['OP-06']['request']<br>Contracts['OP-06']['response'] | DEV-07 / WireResponse<'OP-06'> |
| OP-07 operationStatus | Contracts['operationStatus']['request'] | Contracts['OP-07']['request']<br>Contracts['OP-07']['response'] | DEV-02 / WireResponse<'OP-07'> |
| OP-08 configGetSaveDraft | Contracts['configGetSaveDraft']['request'] | Contracts['OP-08']['request']<br>Contracts['OP-08']['response'] | DEV-08 / WireResponse<'OP-08'> |
| OP-09 configValidate | Contracts['configValidate']['request'] | Contracts['OP-09']['request']<br>Contracts['OP-09']['response'] | DEV-08 / WireResponse<'OP-09'> |
| OP-10 configPublish | Contracts['configPublish']['request'] | Contracts['OP-10']['request']<br>Contracts['OP-10']['response'] | DEV-08 / WireResponse<'OP-10'> |
| OP-11 configRollbackDraft | Contracts['configRollbackDraft']['request'] | Contracts['OP-11']['request']<br>Contracts['OP-11']['response'] | DEV-08 / WireResponse<'OP-11'> |
| OP-12 diagnostics | Contracts['diagnostics']['request'] | Contracts['OP-12']['request']<br>Contracts['OP-12']['response'] | DEV-12 / WireResponse<'OP-12'> |
| OP-13 auditList | Contracts['auditList']['request'] | Contracts['OP-13']['request']<br>Contracts['OP-13']['response'] | DEV-07 / WireResponse<'OP-13'> |
| OP-14 commissioningAccept | Contracts['commissioningAccept']['request'] | Contracts['OP-14']['request']<br>Contracts['OP-14']['response'] | DEV-08 / WireResponse<'OP-14'> |
| OP-15 reportCreate | Contracts['reportCreate']['request'] | Contracts['OP-15']['request']<br>Contracts['OP-15']['response'] | DEV-09 / WireResponse<'OP-15'> |
| OP-16 reportGetList | Contracts['reportGetList']['request'] | Contracts['OP-16']['request']<br>Contracts['OP-16']['response'] | DEV-09 / WireResponse<'OP-16'> |
| OP-17 reportDownload | Contracts['reportDownload']['request'] | Contracts['OP-17']['request']<br>Contracts['OP-17']['response'] | DEV-09 / BinaryDownload | Response<never>；成功二进制，失败JSON |
| OP-18 reportCancel | Contracts['reportCancel']['request'] | Contracts['OP-18']['request']<br>Contracts['OP-18']['response'] | DEV-09 / WireResponse<'OP-18'> |
| OP-19 notificationTest | Contracts['notificationTest']['request'] | Contracts['OP-19']['request']<br>Contracts['OP-19']['response'] | DEV-10 / WireResponse<'OP-19'> |
| OP-20 notificationDeliveryList | Contracts['notificationDeliveryList']['request'] | Contracts['OP-20']['request']<br>Contracts['OP-20']['response'] | DEV-10 / WireResponse<'OP-20'> |
| OP-21 notificationRetry | Contracts['notificationRetry']['request'] | Contracts['OP-21']['request']<br>Contracts['OP-21']['response'] | DEV-10 / WireResponse<'OP-21'> |
| OP-22 metricDictionary | Contracts['metricDictionary']['request'] | Contracts['OP-22']['request']<br>Contracts['OP-22']['response'] | DEV-04 / WireResponse<'OP-22'> |
| OP-23 simulationCreate | Contracts['simulationCreate']['request'] | Contracts['OP-23']['request']<br>Contracts['OP-23']['response'] | DEV-11 / WireResponse<'OP-23'> |
| OP-24 simulationGenerate | Contracts['simulationGenerate']['request'] | Contracts['OP-24']['request']<br>Contracts['OP-24']['response'] | DEV-11 / WireResponse<'OP-24'> |
| OP-25 simulationControl | Contracts['simulationControl']['request'] | Contracts['OP-25']['request']<br>Contracts['OP-25']['response'] | DEV-11 / WireResponse<'OP-25'> |
| OP-26 simulationStep | Contracts['simulationStep']['request'] | Contracts['OP-26']['request']<br>Contracts['OP-26']['response'] | DEV-11 / WireResponse<'OP-26'> |
| OP-27 simulationScenario | Contracts['simulationScenario']['request'] | Contracts['OP-27']['request']<br>Contracts['OP-27']['response'] | DEV-11 / WireResponse<'OP-27'> |
| OP-28 simulationReset | Contracts['simulationReset']['request'] | Contracts['OP-28']['request']<br>Contracts['OP-28']['response'] | DEV-11 / WireResponse<'OP-28'> |
| OP-29 simulationDelete | Contracts['simulationDelete']['request'] | Contracts['OP-29']['request']<br>Contracts['OP-29']['response'] | DEV-11 / WireResponse<'OP-29'> |
| OP-30 simulationGetList | Contracts['simulationGetList']['request'] | Contracts['OP-30']['request']<br>Contracts['OP-30']['response'] | DEV-11 / WireResponse<'OP-30'> |
| OP-31 notificationPause | Contracts['notificationPause']['request'] | Contracts['OP-31']['request']<br>Contracts['OP-31']['response'] | DEV-10 / WireResponse<'OP-31'> |

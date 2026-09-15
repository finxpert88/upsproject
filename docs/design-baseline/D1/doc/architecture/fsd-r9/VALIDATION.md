# A2.2 验证记录

日期：2026-09-15。区分架构师自检、联合复核和目标运行验收。

|检查|最新结果|证据与边界|
|---|---|---|
|Trio/manifest静态检查|111 Rec：35设备、76业务；通过|local-validation.json；顶层及已声明嵌套Ref闭合|
|原评审嵌套Ref漏改反例|预期拒绝，通过|validate-delivery.cjs；不是仅JSON可解析|
|A2.2故障/契约夹具|19组通过|revision-a2-tests.json；含联合复核新增版本覆盖、非法日期、scope索引、owner拒绝反例|
|TypeScript 5.9.3严格检查|通过|contracts.ts、handlers.ts、persistence-contracts.ts|
|批准FSD/PRD|hash保持原值；contracts.ts逐字提取一致|PRD 240d4bbb2a00f9ed3b754e011e5fc9b71d52f0daeb923ef5012a19923dc020ae；FSD 45e6029acaeb0e61ab7b0338c28f3f9882f6835f467043ed5d99fcf160d822ac|
|FIN Expert离线Trio|最新结果见fin-validation-a2.json|target unknown、runtime false；与联合复核是否调用工具分开记录|
|A2-review-1联合复核|两方独立重跑111 Rec与当时14组通过；发现补充负例|该轮只有AR06/08设计级关闭，其余反馈已在A2.2修订|
|A2.2独立复核|评审/开发分别重跑111 Rec/31 OP和19组通过；7项设计关闭|两方不曾独立运行本表tsc/FIN Expert/重复生成，证据归属分开|
|完整Haystack本体|仍待绑定真实模型/角色|A1 fin-validation.json保持历史记录，不伪造标签过关|
|FIN实际构建/事务/外发/容量|未执行|persistence-design.md G1矩阵|

## 重跑

```text
node doc/architecture/fsd-r9/build-delivery.cjs
node doc/architecture/fsd-r9/validate-delivery.cjs
node doc/architecture/fsd-r9/test-revision-a2.cjs
tsc --noEmit --strict --lib es2020 contracts.ts handlers.ts persistence-contracts.ts
```

codec registry由build-codecs.cjs从FSD指定类型生成，第二个命令行参数是本机TypeScript模块路径。运行codec需要服务端trustedEnvelope；公开DTO不新增项目字段。

Store.tx仅在内存模拟原子事务，模拟时间夹具是调度/检查点的抽象验证，不等于完整UPS生成器/全部规则算法测试。日期验证覆盖公历、显式UTC偏移以及ReportParams.start/end。不存在网络外发、现场Folio导入或设备控制。

schema2.1仅在fsd-change-proposal.md为候选，当前支持版本仍2.0；AR03未决不能标为已通过。

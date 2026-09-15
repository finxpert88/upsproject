# 架构评审整改结果汇报

日期：2026-09-15；责任人角色：软件架构师；交付修订：A2.2-review-2。

**本轮结果：8项全部接受并实际处置；7项经评审与开发联合复核设计级关闭，1项AR03完成候选方案、待用户公开契约决策。** 已批准PRD/FSD修订9及schema2.0保持原样。整体设计不能在AR03决策前称完整冻结，目标FIN运行验收另外执行。

## 逐项完成情况

|项|实际整改|关闭证据/状态|
|---|---|---|
|AR01 跨发生告警|独立RuleOccurrence、不可变Command payload、ordinal/前置链、原始起止、scope/fence；事务失败不前移水位，旧CLEAR绑定旧源ID|多次发生、未知CREATE/CLEAR、outbox满、发送后落库前崩溃；联合设计关闭|
|AR02 模拟恢复|ScenarioEvent和Checkpoint；Session独立保留初始场景/算法/生成参数；同事务推进样本/事件/水位；generation与worker栅栏|步长/速度等价、检查点前后崩溃、reset重启与旧worker拒绝；联合设计关闭|
|AR03 资产配置|Q取R01、阻抗取同目标R03；UPS/电池投影拆分；环境点父设备保留；提出AssetProfile/EnvironmentBinding及完整2.1候选|规划支持提交用户作范围决策；尚未批准，不关闭|
|AR04 配置重建|全量SEALED清单与不可变EntityVersion；规范hash、成员完整性、原子Pointer；同键异内容拒绝|并发CAS、删除/回退、缺失hash、旧版覆盖拒绝、同内容幂等；联合设计关闭|
|AR05 编解码|机器schema、语义Ref递归重映射、严格Date/Ts；可信服务端project/session/generation索引；解码范围一致性|5类roundtrip及0/false/null、漏改Ref、非法start/公历、索引/跨域反例；联合设计关闭|
|AR06 幂等|唯一键projectId+operationId；actor/action/context/hash是绑定字段，保留root create及原cleanup定位|改动作/请求/actor拒绝、create复用、旧generation新操作拒绝；前轮设计关闭保持|
|AR07 模式权限|逐OP permissionByMode/ACL/root/owner元数据；OP07按原动作/mode鉴权并保留业务owner拒绝|live/simulation权限正反例、共享ACL、原owner拒绝；联合设计关闭|
|AR08 bootstrap|独立无版本GET元信息路由和类型；完整能力POST仍要求登录及2.0|旧版/缺版本/有效版/未登录矩阵；前轮设计关闭保持|

## 文件与模型交付

- 设备Trio仍35个工程模板Rec；业务Trio从71增加到76，总计111。增加RuleOccurrence、SimulationScenarioEvent、SimulationCheckpoint、EntityVersion、BatteryAssetProjection，AssetConfiguration改为明确的AssetProjection。
- 31项操作清单增加模式授权、作用域、owner、幂等及root规则；bootstrap独立路由。24项功能规格追踪保留。
- 新增persistence-design.md、persistence-contracts.ts、record-codecs.json/record-codec.cjs、build-codecs.cjs、contract-model.cjs/test-revision-a2.cjs。
- revision-a2.cjs作为生成器修订入口，统一更新Trio、manifest、接口清单、handlers及架构图，避免手改衍生文件漂移。
- 独立候选包在../schema2.1-candidate/；不进入当前2.0构建或公开处理器。

## 实际验证

1. 111 Rec/31 OP静态验证通过，顶层及声明的嵌套Ref闭合；评审原Ref反例被正确拒绝。
2. 19组参考模型夹具通过。评审和开发分别独立重跑，开发另复现上轮关键负例，确认修复。
3. 架构师执行TypeScript 5.9.3 strict/noEmit检查通过；2.1候选类型另行检查通过。
4. 架构师验证11个生成文件重复生成一致；两Trio重新执行FIN Expert离线审查通过，issues为空、runtime=false。
5. PRD/FSD hash与批准版本一致，contracts.ts仍逐字抽取批准FSD的类型。

完整证据与复跑入口见VALIDATION.md、local-validation.json、revision-a2-tests.json、fin-validation-a2.json；联合结论、修订hash及历史处置记录见review-disposition.md。

## 尚需决策及开发边界

AR03建议批准“插件工程资产配置＋显式环境绑定＋schema2.1升级”。决策材料已包含严格联合类型、逐字段证据/时效、资产删除/迁移状态、旧版逐OP只读白名单、新指标/报表兼容和BatteryAsset过期投影。需要接受三点：迁移证据未齐不切换；旧2.0客户端确认、下载、暂停等需升级；2.1配置生效后不能直接换回旧POD。批准后再同步正式FSD、公开validator、UI和迁移验收。

后端实现仍须把RuleState最小类型与目录中的候选/计数/epoch字段合并到完整runtime codec，并统一currentOccurrenceId/occurrenceId命名。该项是联合评审认可的非阻断实现交接检查，不能只从简化类型生成全部存储。

G1仍需确认目标FIN build/SDK、真实点表与模型角色、Folio事务/CAS/唯一约束、真实告警对账/外发、模拟容量、secrets/文件与生命周期。内存参考事务不证明Folio原子性；本轮未进行生产导入、设备写入或真实通知投递。7项关闭是设计级结论，不是后端POD完成或生产验收通过。

# AR-03 公开契约差异提案 CP-AR03

状态：架构方案已完成，待规划与评审确认；没有修改已批准FSD或contracts.ts。A2其他整改不依赖批准本提案。该决策未通过前，不冻结资产编辑模块。

## 已有schema2.0可确定的单一权威

|字段|权威及对象范围|修改/投影|
|---|---|---|
|requiredRuntimeMinutes Q|该UPS当前ConfigVersion中的唯一R-01.requiredMinutes|OP-08 rule patch→09→10；Dashboard按equip+activeConfigRevision取R-01。enabled=false仍可显示已配置Q并标规则Disabled，但不评估；无规则/无合法Q则null，不算余量。拒绝同设备多条歧义R-01。|
|baselineImpedance|R-03.baseline及comparableEvidenceRef；由primaryMapping.targetObjectRef确定电池串/单体|同rule patch发布；显示基准与方法证据。disabled仍可展示基准及可比变化但不产生规则风险；没有唯一同对象基准则未知，不默认0。|
|环境点归属|FIN点真实equipRef不变；当前Mapping.pointRef及其targetObjectRef绑定环境对象|OP-08 mapping patch，经点引用/范围/位置证据核验后发布；EnvironmentAssociation仅内部派生投影，不作为独立直接写入口。|
|额定容量、chemistry/cellCount|当前FSD尚未声明可编辑公开payload|2.0可显示经验证平台资产，但不能宣称插件内编辑闭环已完成。拆分UPS AssetProjection与BatteryAssetProjection，禁止混合层级。|

## 建议差异：schema2.1显式工程资产编辑

在Entity新增assetProfile与environmentBinding两种，沿用OP-08～10局部patch/范围/CAS/发布及OP-11范围回退，不新增直写Rec操作。其余现有字段及动作语义不变。新2.1不被当前2.0处理器静默接收；批准后升级版本声明、严格验证器、类型提取及客户端能力协商。本提案没有自行把2.1设为支持版本。

```typescript
type AssetProfileProposal = {
  profileId: Id; equipRef: Id; targetObjectRef: Id;
  assetKind: "ups" | "batteryString";
  ratedCapacityKw: number | null; ratedCapacityKva: number | null;
  nameplateCapacityKw: number | null; nameplateCapacityKva: number | null;
  batteryChemistry: string | null; cellCount: number | null;
  primaryEvidenceRef: Id; evidenceRefs: Id[];
  fieldEvidence: {field: string; evidenceRef: Id; method: string;
    observedAt: Ts; validFrom: Ts; validTo: Ts | null}[];
};
type EnvironmentBindingProposal = {
  bindingId: Id; equipRef: Id; sensorEquipRef: Id;
  locationEvidenceRef: Id; pointRefs: Id[];
  required: boolean;
};
```

约束：ups的targetObjectRef必须等于equipRef，电池字段必须null；batteryString必须真实父UPS一致，额定字段必须null，cellCount为正整数或null；额定值为正有限数或null。不得在新资产对象再加入Q/阻抗基准。引用/证据必须可访问、同一获准范围；新旧归属双边授权，发布时冻结来源指纹和完整字段，历史版本不因外部资产后来变化而改写。EnvironmentBinding表达位置证据和允许源点，Mapping必须引用其中点且target为该环境设备；任何配置矛盾阻断，不强改源equipRef。

新字段投影到Snapshot仍遵循现有Metric/Identity/BatteryAsset语义；如需新增额定值Metric logicalField应登记现有逻辑字典，不塞额外顶层字段。回退用历史实体值生成当前授权scope的patch，不改变平台设备主数据；外部设备资料改动后须重新核验来源再发布。未经批准，新增Entity必须被2.0严格拒绝。

## 决策请求及关闭条件

建议采用以上2.1实体，保留2.0只读兼容模式，不扩展设备控制。请规划与评审确认：是否允许插件内编辑工程资产、环境关联显式实体及2.1版本迁移。若坚持仅平台工程流程，则需明确放弃“全部经OP-08编辑”的关闭条件并指定平台资产冻结与回退流程，不能两者同时声称支持。

批准后以实际schema夹具验证编辑→校验→发布→回退、UPS/电池作用域隔离、Dashboard/规则同源和跨范围拒绝；当前AR-03状态是“内部权威已修正，公开差异待决策”，不是已关闭。

## 规划六项补充：候选语义（尚未生效）

1. **权威/空值/容量**：ratedCapacityKw/Kva为工程批准的当前有效能力，nameplateCapacityKw/Kva为铭牌，不用同一字段代表两者。有效能力的降额依据必须有fieldEvidence，不能自动从铭牌推算。有效Profile是唯一配置权威；显式null表示该字段未知，不能fallback补满。删除Profile也只投影unknown，若拟转用平台资产需另建带证据的新版本Profile，不静默fallback。平台与Profile冲突给工程诊断，已发布值不被平台覆盖；历史/报表按当时有效ConfigVersion解释。
2. **唯一键/证据**：Profile在活动版本内唯一(equipRef,targetObjectRef,assetKind)，非空字段逐项具备evidenceRef/method/observedAt/validFrom/validTo；primaryEvidenceRef必须包含在evidenceRefs中。环境Binding唯一(equipRef,sensorEquipRef)，允许同一传感器被多个UPS显式引用，不能按数组位置关联。每一条关联单独校验双方授权，不允许借共享传感器扩大权限。
3. **Mapping/Binding**：Binding声明获准的环境源点集合与位置依据，Mapping声明具体logicalField/目标/转换/质量。环境Mapping的pointRef须在Binding.pointRefs，且FIN点equipRef等于sensorEquipRef；targetObjectRef保持sensor设备。required=true只用于B必要集合引用的关联，不能单独改变B；required=false为可选环境。删除被Mapping/B/规则引用的Binding先要求同草稿显式解除所有合法依赖；涉及活动发生按8.4阻断。2.0迁移不得自动制造位置证据：既有映射生成待工程确认候选，不能自动accepted。
4. **规则/验收/历史**：有效容量改变可能改变派生loadPct及R-02输入，按8.4检查活动/未知命令链，有关链未结不发布破坏性变更。原生loadPct与基于有效kW/kVA的派生值仍分开命名。chemistry/cellCount变更使相关能力/规则/验收指纹失效，重新ready并经OP-14验收；不能保留旧accepted。所有变化通过同epoch发布，新增映射有效边界，过去报告不使用新额定或新电池属性。
5. **版本矩阵**：当前服务器仅支持2.0，新Entity及2.1请求拒绝。候选2.1服务器对2.1客户端返回完整2.1契约；对2.0客户端只允许明确兼容的只读投影，任何涉及新实体配置的编辑/发布一律提示升级，不能让2.0全量配置视图覆盖新字段。配置迁移保留旧版备份与升级审计；已使用2.1实体后禁止直接降级旧POD，须经受审查的导出/迁移或恢复流程。正式批准后由规划同步PRD FR-05/06/08/13追踪、FSD Entity/版本矩阵、bootstrap/能力、严格validator与英文UI。2.0→2.1完整响应类型仍需规划形成正式候选正文，本文不预先启用。
6. **投影**：有效ratedCapacityKw与ratedCapacityKva分别为Metric，unit=kW/kVA、origin=configured、sourceRef=已发布EntityVersion实际Ref、mappingRevision=ConfigVersion；quality只有来源有效且类型/范围合法时good，null为unknown。nameplate字段明确名称，不覆盖有效能力。BatteryAsset.evidenceRef取primaryEvidenceRef，完整字段级证据从受权详情取得，不把多条证据无规则地折叠。Mapping校验使用相同版本的Profile/Binding与真实点归属，冲突阻断发布。

请规划与设计据此形成正式2.1候选修订并沿既有流程批准；架构提供设计方案但不以条件性同意替代用户批准。

# DEV-01 开发交付与自测

状态：实际Fantom编译与FT-01最小向量通过，待独立评审；未commit/push。
工作目录 `C:/work/upsproject-implementation`，分支 `feature/ups-pod-implementation`，
起点及当前HEAD `3cdc8f5675a0cd32856597d97932f5d5d38ae71a`。

## 实现与验收关联

- `upsFleet/build.fan`：一个 `upsFleet` 命名空间，版本0.0.1，仅运行依赖 `sys 1.0`。
- `QualityEvaluator.isStale(sourceTs, now, staleAfter)`：只判定已验证源时间的新鲜度。
  `now - sourceTs > staleAfter` 才陈旧。调用者必须传原采样时间，函数不读取时钟或改写采样。
- `QualityEvaluatorTest.testCachedSampleFreshness`：FT-01 / AC-02 / SF-02最小切片，
  RTM关联FR-03；不代表FR-03整体、SF-02整体或AC-02全部通过。
- 不实现无源时间、时钟异常、原生故障或质量优先级；这些属于DEV-04。
  不引入连接器、生命周期、菜单、前端资源、权限服务或占位类。

冻结FSD定位：4.1缓存重读不能刷新freshnessTs；6.4严格大于过期阈值；
第12节FT-01（当前快照1017行）；D1 `first-work-package.md` 的29/31秒最小向量。

## 可重复命令

需PowerShell 7及Java；候选SDK只读使用。本次PowerShell封装与子进程退出码均为0。

```powershell
./scripts/build.ps1 -FinHome 'C:/Program Files (x86)/FIN Framework/FIN Framework 5.3.0.2761' -OutputRoot '.artifacts/DEV-01'
./scripts/test.ps1 -FinHome 'C:/Program Files (x86)/FIN Framework/FIN Framework 5.3.0.2761' -OutputRoot '.artifacts/DEV-01'
```

`build.json`、`build-test.json`、`test.json`保存实际Java可执行文件、逐项参数、工作目录、
UTC记录时间、退出码和源文件哈希。对应`.log`为真实输出。

本次最终结果：正式构建1个领域源文件；测试构建2个源文件；Fantom报告
`All tests passed! [1 tests, 1 methods, 36 verifies]`。包括每2秒读取同一源时间、
29秒和30秒有效、31秒和32秒陈旧，源时间保持不变。
测试内同时断言实际POD解析路径；封装比较测试构建与加载副本SHA-256。
正式与测试构建的领域源码及build.fan哈希相同。

|产物|SHA-256|
|---|---|
|`.artifacts/DEV-01/upsFleet.pod`|`96196584499a132a35c5d0da85afac15506dd0bf1a3b58653c2cabe04c30b38a`|
|`.artifacts/DEV-01/test/upsFleet.pod`（仅测试变体）|`8daf8c823b499e135fc78b337cfbaea53a1ac5ef675924f41bba8732751cbb3c`|

产物ZIP与meta.props已解析，详见`artifacts.json`。正式包只有元数据和QualityEvaluator字节码，
不含测试类、SDK、源码或静态DEMO。测试变体使用同一pod.name，不是第二个生产插件。
编译器写入build.ts等时间元数据，重跑产物hash可能变化；这里记录具体构建哈希，
不承诺逐字节可重现构建。新的运行日志与产物在`.artifacts/DEV-01`，本目录保留本次证据快照。

## SDK依据与输出隔离

本机候选FIN安装为5.3.0.2761，sys/compiler/build为1.0.78.3105，Java为11.0.32.1。
`environment.json`保存POD元数据版本、SHA与实际Java版本输出。
只读核验SDK内`finBuild` 1.1.0的BuildFinPod/BuildFinArgs，以及继承的BuildPod API：
`outPodDir`、`outDocDir`、`srcDirs`、`docApi`、`docSrc`。
首包不需FIN构建扩展，采用实际SDK自带的基础BuildPod，未复制示例完整依赖。
语言检索证据 `fin_web_language_reference_29b1ab20b34f11b5` 只作语言参考，
实际版本符号来自本机POD apidoc并已通过本次真实编译验证。

封装只复制sys/compiler/build三个POD、sys.jar、时区及单位数据至`.runtime/DEV-01`；
子进程的fan.home、user.home、临时目录显式指向隔离路径，移除可能改变加载环境的继承变量。
正式与测试构建均设置outPodDir，未使用安装目录默认输出。
输出必须精确为本worktree的`.artifacts/DEV-01`，已有重解析链接拒绝；
额外负例 `-OutputRoot '../forbidden-dev01'` 已在创建目录前拒绝。
SDK输入文件构建前后hash一致，安装目录未出现upsFleet.pod。
未启动FIN服务、安装或启用插件、连接现场或发送外部消息。

## 基线及其他检查

`baseline-transfer.json`：85个清单文件复制前后hash一致，交付前再次核对源和目标一致。
未覆盖原工作区文件，未修改公共schema。`git diff --check`通过。
`.runtime`和`.artifacts`为忽略的本地工具/产物，不进入源码提交；必要证据单独保留。

FIN Expert规定的connector artifact检查已执行，完整结果保留在`fin-expert-review.json`。
第一次直接传Fan文本产生ARTIFACT_PARSE；读取校验器输入契约后改为结构化设计及完整源码。
第二次仍passed=false：该校验要求完整connector架构、支持版本、重试、秘密、写入校验及
parser/mapping/lifecycle测试，本DEV-01没有这些功能。没有虚报这些组件以使校验通过。
5.3.0.2761也在该离线校验器证据版本矩阵之外，兼容性保持unverified。
此检查不替代实际编译与FT-01测试，不据此扩充已限定的首包。

## 未验证与后续边界

本包只证明该候选本机工具链能构建最小Fantom POD，并执行指定纯领域测试。
它不是可安装的完整FIN业务插件；最终目标build、真实生命周期/菜单/权限/事务、
点值/历史/告警、报表、通知、容量与现场验收仍未验证。
DEV-02及后续工作包未获本次实现授权；等待Leader安排独立评审和下一包。

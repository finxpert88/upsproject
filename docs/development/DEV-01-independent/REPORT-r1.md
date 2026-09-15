# DEV-01-r1 独立测试结论

结论：通过本包限定验收。FT-01 / AC-02 / SF-02 最小切片，RTM FR-03；不代表这些需求整体通过。

指定分支 feature/ups-pod-implementation；HEAD 3cdc8f5675a0cd32856597d97932f5d5d38ae71a。r1冻结7项源码哈希全部匹配，包括Leader指定的build.ps1与test.ps1。运行前独立artifact/runtime目录均不存在。

## 实际执行

在 C:/work/upsproject-implementation 使用 PowerShell 7.6.5 执行：

```powershell
pwsh -NoProfile -File scripts/build.ps1 -FinHome 'C:/Program Files (x86)/FIN Framework/FIN Framework 5.3.0.2761' -OutputRoot '.artifacts/DEV-01-independent'
pwsh -NoProfile -File scripts/test.ps1 -FinHome 'C:/Program Files (x86)/FIN Framework/FIN Framework 5.3.0.2761' -OutputRoot '.artifacts/DEV-01-independent'
```

两条封装命令退出码0；内部正式编译、测试编译和Fantom测试退出码均0。真实Fantom报告1 tests、1 methods、36 verifies通过。Java 11.0.32.1；实际SDK元数据见r1-sdk-metadata.json。完整Java参数、fan.home、临时目录、工作目录和源码哈希见build.json、build-test.json、test.json。

测试核对：固定t0，每2秒重复传同一源时间；29/30秒fresh，31/32秒stale；源时间保持不变；Fantom断言实际加载的新测试POD路径。该纯函数测试不证明真实FIN缓存采集链路。

## 产物与隔离

正式包 .artifacts/DEV-01-independent/upsFleet.pod
SHA256 B9324BEF880FA3C7257B158F9C16A582CF3F512F52D6FF783D91F702B842EA46

测试变体 .artifacts/DEV-01-independent/test/upsFleet.pod
SHA256 6B227513E39D4CEE1CBA404A89BA9B152BB289A343E821C95EDCD8ED5171C275

实际加载 .runtime/DEV-01-independent/lib/fan/upsFleet.pod，与新测试变体哈希相同。正式包ZIP只含QualityEvaluator领域类型及元数据，不含QualityEvaluatorTest；pod.name及完整元数据见r1-artifacts.json。测试变体不是第二个生产插件。

受控负例：外部相对目录、.artifacts根、多层输出路径均退出1，在路径校验处拒绝；未实际越界写入。未执行默认目录构建；本轮未新建junction负例。默认参数及reparse拒绝逻辑只读审查。

158项受保护文件前后哈希一致，包含冻结源码、指定7项SDK输入、D1基线、原DEV-01与r1报告、原产物及原runtime。证据r1-preservation-before.json及r1-preservation-result.json。该哈希范围不是整个FIN安装目录的全盘审计。

## 范围与历史

前次README.md、commands.json、result.json及inputs-before/after.json保留，记录旧封装阻塞。本次r1复测解除该执行阻塞。

原connector validator仍为passed=false，其完整connector要求及版本适用限制未由本包解决。本次未重跑或将其改为通过。未安装启用、未连接现场、未写设备、未发送通知；不宣称FIN G1、生命周期、菜单或插件运行通过。未修改源码/基线、未提交推送。产物build.ts允许改变，未要求与开发产物字节一致。

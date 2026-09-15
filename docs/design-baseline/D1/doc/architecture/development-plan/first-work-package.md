# DEV-01 首个可执行开发包

## 授权位置和输入

Leader已准备 `C:/work/upsproject-implementation`，分支 `feature/ups-pod-implementation`，起点 `3cdc8f5675a0cd32856597d97932f5d5d38ae71a`。开发开始前核验分支、HEAD及状态。当前该分支不包含原工作区未提交的批准文档；必须先按 transfer-manifest.json 校验、复制到只读设计输入目录，不能以旧README代替批准基线。具体开始指令由Leader下发。

## 只完成这一条切片

1. 只读核验候选SDK的构建类、依赖及输出目录机制，记录实际符号、版本和依据。
2. 编写最小 `upsFleet/build.fan`。首包仅依赖实际需要的基础库；不复制示例全部依赖。
3. 在既有QualityEvaluator责任内实现一项新鲜度判定：使用传入的源采样时间、当前时间和失效阈值；缓存重读不得刷新源采样时间。只增加支持该行为必需的类型，不预造其余类。该首包不宣称完整实现SF-02。
4. 编写真正Fantom测试：固定t0，阈值30秒；t0+29秒仍有效，反复读缓存后t0+31秒陈旧；同一源时间始终不变。数值和单位不由测试伪造为生产资产。此为FT-01最小向量，其余质量优先级在DEV-04完成。
5. 用本机真实Fantom编译器生成一个 `upsFleet.pod` 并执行上述测试；解析产物元数据，记录测试摘要、完整命令、退出码和SHA-256。

## 文件与输出约定

业务文件：`upsFleet/build.fan`、`upsFleet/fan/domain/telemetry/QualityEvaluator.fan`、`upsFleet/test/domain/QualityEvaluatorTest.fan`。测试需要的小值类型可放同一领域文件，不新建泛化框架。工具：`scripts/build.ps1`、`scripts/test.ps1`。证据：`docs/development/DEV-01/`。

构建输出统一限制在 `C:/work/upsproject-implementation/.artifacts/DEV-01/`，隔离运行环境使用 `.runtime/DEV-01/`。严禁写入 FIN 安装目录；不安装、启用或启动插件，不连接现场，不写设备，不发送Telegram。

开发需提供可重复的项目封装命令，例如：

```powershell
./scripts/build.ps1 -FinHome 'C:/Program Files (x86)/FIN Framework/FIN Framework 5.3.0.2761' -OutputRoot '.artifacts/DEV-01'
./scripts/test.ps1 -FinHome 'C:/Program Files (x86)/FIN Framework/FIN Framework 5.3.0.2761' -OutputRoot '.artifacts/DEV-01'
```

以上是要求开发实现的脚本调用界面，不是声称FIN官方存在这些参数。脚本内部必须先核验BuildFinPod或其他实际支持构建机制，并在编译前确认所有输出路径落在worktree；测试加载的必须是隔离目录中新构建的POD，不能碰巧加载安装目录同名旧产物。若构建机制默认写fan.home/lib/fan，先建立已验证的隔离环境或显式输出配置，不允许直接尝试污染安装目录。

## 完成与停止条件

完成：干净输入基线验证；一个upsFleet.pod及正确pod.name；真实Fantom测试通过；命令退出码和产物哈希可复现；安装目录未被写入；没有39类空壳、假API或额外服务。首包可编译POD不等于FIN菜单/生命周期注册、可安装插件或功能完成。

停止并报告：实际分支/路径与授权不符；基线hash不符；输出无法隔离；需要未经核验SDK符号；编译/测试失败；必须修改公共schema；需要安装启用/现场操作。不得将这些失败隐藏成成功或自行转做Node替身后宣称Fantom完成。纯代码可保留为未通过状态，但不推进真实集成。

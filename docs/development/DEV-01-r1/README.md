# DEV-01-r1：独立运行输出修订

Leader授权的最小脚本修订，2026-09-15。只修改`build.ps1`与`test.ps1`路径处理；
Fantom源码、FT-01预期、原冻结基线、原自测记录、原产物及原runtime均不修改。
本目录为新证据；`../DEV-01/`记载旧脚本，其“仅允许精确DEV-01输出目录”的说明为历史行为。

## 调用约定

OutputRoot允许本worktree `.artifacts` 下单层运行目录，名称仅含字母、数字、下划线、连字符，
首字符为字母或数字。默认仍为`.artifacts/DEV-01`。
对应runtime固定派生为`.runtime/<同一运行目录名>`，不能独立指向其他环境。
拒绝worktree外路径、根目录、`.artifacts`本身、多层子路径和现存重解析链接。
编译和测试都使用相同的OutputRoot；测试加载目录及POD hash记录在test.json并由Fantom断言路径。

从`C:/work/upsproject-implementation`执行独立重跑：

```powershell
./scripts/build.ps1 -FinHome 'C:/Program Files (x86)/FIN Framework/FIN Framework 5.3.0.2761' -OutputRoot '.artifacts/DEV-01-independent'
./scripts/test.ps1 -FinHome 'C:/Program Files (x86)/FIN Framework/FIN Framework 5.3.0.2761' -OutputRoot '.artifacts/DEV-01-independent'
```

独立测试将只使用`.runtime/DEV-01-independent`，不会使用原`.runtime/DEV-01`。
本次开发验证实际使用全新名称`DEV-01-r1-validation`；没有占用上述独立测试目录。

## 本次验证证据

- 新目录正式构建及测试构建均exit 0；真实Fantom FT-01为1方法、36断言通过。
- 正式包SHA-256：`e7c512ab8790de831ebd6fca954930d4bbd78beae906ab05a4f5c28c14f6d759`。
- 测试包SHA-256：`82193e78cbd9963f2c96d39a916fc54487b65e80c1767eae6da851ad47e60c07`。
- 测试实际加载`.runtime/DEV-01-r1-validation/lib/fan/upsFleet.pod`，与本次新测试构建hash一致。
- PowerShell AST核对两个脚本默认参数仍为`.artifacts/DEV-01`，未执行默认构建或覆盖原产物。
- 越界、worktree根、`.artifacts`根、多层路径及输出junction负例均在目录创建/SDK复制前拒绝。
  测试junction指向本次新目录，验证后仅移除链接，未删除目标。
- 原基线、原报告、原产物及原runtime共116文件前后SHA-256一致；Fantom三文件与原源码hash一致。
- `git diff --check`通过。未commit/push、未写FIN安装目录、未安装启用或连接现场。

命令/退出码/日志见本目录build、build-test、test的json/log；
产物目录和元数据见artifacts.json；路径负例见path-checks.json；
冻结新源码见source-hashes.json；历史保留校验见preservation-before/result.json。

原DEV-01的FIN Expert connector校验范围限制继续有效。此次仅调整PowerShell路径传递，
不重做或虚报Fantom/FIN connector静态校验；实际编译和纯域测试不代表FIN运行验收。

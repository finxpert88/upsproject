# UPS Fleet Monitor 静态 DEMO

依据 `doc/planning/UPS-Fleet-FIN-POD-FSD-v0.1.md` 修订6，尤其第19节SF-23 / SIM-01～08。修订6已替代修订5的无预置数据交付要求。

## 打开与体验

双击 **UPS-Fleet-Static.html**。所有CSS、脚本和中文PDF字体均已内嵌，无CDN，无需安装服务器。`index.html`是拆分源码入口。首次默认浅色、完整场景、3台设备、24小时历史；模拟会话初始为ready，数值在启动或步进后推进。

1. Dashboard中切换设备，查看Hero健康环、三列六卡、32项说明、SOC/SOH与负载趋势、日期范围、事件及三类维护展望。
2. 顶部“模拟工具”管理会话。创建→生成→启动/暂停/继续/步进/停止；可针对单台或全部设备应用七类场景。异常场景切换后步进2秒可观察数值规则，通信场景步进35秒可观察质量告警。
3. 点击告警详情→确认模拟告警。确认不会恢复故障；切换完整场景并推进新样本，触发独立恢复。
4. 报表中选择模板、设备、日期、IANA时区、格式和指标→预览→生成→下载。可使用“采用已有历史日期范围”；部分日期没有数据时会标注缺口。
5. 工程→通知渠道可本地测试accepted、429、rejected、unknown，或启用当前会话的模拟事件订阅。unknown人工重试需确认重复风险；429使用虚拟时间等待30秒。
6. 切到“真实模式”后清除模拟显示缓存。没有提供真实适配时显示未接入，失败不会自动填入模拟数据。可从模拟工具选择会话返回。

## 实现与隔离

|文件|职责|
|---|---|
|simulation-scenarios.js|七类场景、确定性seed生成器、资产/当前值/初始历史、纯数值规则门槛|
|simulation-service.js|本地SimulationRepository与OP-23～30语义、幂等/revision、虚拟时间、告警生命周期、本地通知及会话记录|
|data-provider.js|live / simulation边界，sim命名空间与跨会话校验，快照/历史/设备/告警契约|
|simulation-ui.js|工程模拟面板、源模式标识及会话操作|
|app.js / dashboard.js / bootstrap.js|同一套业务视图与交互，不另建简化模拟Dashboard|
|report-engine.js|[start,end)统计、IANA日期边界、有效时间加权、质量、源峰值、事件截断与报表数据|
|reports-ui.js / exporters.js|任务/取消/下载，真实PDF、XLSX ZIP包和UTF-8 BOM CSV编码|
|notification-simulation-ui.js|独立的本地模拟投递界面，不调用Telegram|
|theme-init.js / CSS|默认浅色、按项目/用户保存偏好、同布局双主题|

相同seed、初始场景版本、保存的startAt和推进序列可重放。每个响应标sourceMode、sessionId、scenario、seed、virtualTime；业务引用以`sim:<sessionId>:`开头。每会话最多100设备、100万条指标历史；最多5会话/2运行。超限显式拒绝或暂停，不静默截断。生成仅在ready执行一次；停止后须重置才能继续。重置/删除先展示仅当前会话的清理范围。

会话数据保存于本浏览器localStorage；刷新时running恢复为paused。离开/隐藏页面暂停，不模拟跨页面后台运行。容量不足时明确提示当前仅内存保留。报告文件仅保留当前页内存，刷新后需重新生成；24小时到期后下载拒绝。下载前重查当前UI权限和设备范围。这些检查不是服务端安全边界。

阈值W75/C90/Hw5/Hc3、Q15/H2、阻抗变化30%/回差5%、N2仅为明确标注的模拟规则参数；不会回写正式工程配置。评分、窗口仅用于模拟，不代表厂家或标准认证。R-01/02/03使用新样本、去抖与回差；R-05使用虚拟时钟过期/持续时间；模拟确认、恢复和普通事件独立。

## 导出与来源

- PDF：本地中文字体、浅色分页、重复表头、页码；概览含趋势与质量，告警按类别区分，维护报告区分SOC/SOH/模拟评分和计划/预测。
- XLSX：说明、指标字典、数据质量与对应模板明细，冻结表头、筛选、数值类型、可排序日期；外部文本使用文字类型，不解释成公式。
- CSV：UTF-8 BOM、引号转义、质量/单位/来源/时区；公式前缀文本转义，数值负数保留。所有文件标“模拟数据”。
- 字体为[Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc)的子集，重命名UPSDemoSans；遵循随包提供的[SIL OFL](vendor/OFL-NotoSansSC.txt)。授权文本亦嵌入单文件。

## 构建与验证

```text
node build.cjs
node verify.cjs
python verify-files.py
```

`verify.cjs`无需npm依赖，运行行为测试并将格式验证文件放到被Git忽略的`tmp/verified`。`verify-files.py`使用pypdf、pdfplumber和openpyxl重新打开文件、核对数值和类型、检查中文字体及边界并渲染PDF。验证结果见ACCEPTANCE.md。

## 产品后台尚未实现

当前工作区未发现本产品可核验的build.fan / FIN SDK后台骨架。此交付是静态前端与本地模拟服务，不是已安装、已编译或已验收的FIN POD。M-15后台持久化、服务端身份/权限、跨用户共享、后台调度、24小时无活动停止/7天清理、后台重启恢复及平台容量验证尚未实施。

真实模式可由宿主提供`window.upsFleetAdapter`，只读预留getSession、listEquipment、getSnapshot、listAlarms、getHistory；目标FIN SDK接口仍待第14节版本门槛核验。真实配置发布、接入验收、告警确认、报表服务和Telegram传输尚未实现。没有连接现场、导入FIN对象、写点或外发消息。

先前浏览器本地文件策略阻止页面视觉核验，本轮未绕过。两主题实屏、1440/1366/390宽、200%缩放和键盘操作仍待实际浏览器验收，不能仅凭静态检查宣称完整FSD已经1:1验收。

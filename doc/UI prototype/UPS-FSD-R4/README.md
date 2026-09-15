# UPS Fleet Monitor 静态 DEMO

依据当前 `doc/planning/UPS-Fleet-FIN-POD-FSD-v0.1.md` 修订9，包括FR-25模拟、FR-26响应式、第21节英文和第22节SF-24。此次只改UI目录，保留规划任务正在修改的PRD/FSD。修订6、7、8验证分别保存在VALIDATION-R6.md、VALIDATION-R7.md、VALIDATION-R8.md，不当作本轮响应式验收。

## 打开与体验

双击 **UPS-Fleet-Static.html**。所有CSS、脚本和PDF字体均已内嵌，无CDN，无需安装服务器。`index.html`是拆分源码入口。产品固定en-US英文，默认浅色、Normal Operation场景、3台设备、24小时历史；模拟会话初始为ready，数值在启动或步进后推进。文档和项目沟通使用中文。

1. Dashboard中切换设备，查看Hero健康环、三列六卡、32项说明、SOC/SOH与负载趋势、日期范围、事件及三类维护展望。
2. 顶部Simulation Tools管理会话。Create→Generate→Start/Pause/Resume/Step/Stop；可针对单台或全部设备应用七类场景。异常场景切换后步进2秒可观察数值规则，通信场景步进35秒可观察质量告警。
3. 点击告警详情→确认模拟告警。确认不会恢复故障；切换完整场景并推进新样本，触发独立恢复。
4. Reports中选择模板、设备、日期、IANA时区、格式和指标→Preview→Generate Report→Download。可使用Use Available Historical Date Range；部分日期没有数据时会标注缺口。
5. 工程→通知渠道可本地测试accepted、429、rejected、unknown，或启用当前会话的模拟事件订阅。unknown人工重试需确认重复风险；429使用虚拟时间等待30秒。
6. 切到Live Data后清除模拟显示缓存。没有提供真实适配时显示未接入，失败不会自动填入模拟数据。可从Simulation Tools选择会话返回。

## 实现与隔离

|文件|职责|
|---|---|
|messages.en-US.js / product-language.js|集中英文文案、固定locale、来源英文映射/回退、英文错误及通知正文、IANA时间显示|
|responsive.css / responsive.js|按内容宽度重排、Menu、完整表格卡片、触控取样、草稿/焦点保持、安全区与文件保存/分享入口|
|simulation-scenarios.js|七类场景、确定性seed生成器、资产/当前值/初始历史、纯数值规则门槛|
|simulation-service.js|本地SimulationRepository、controlRevision/dataRevision/generation、清理屏障、虚拟时间、告警/通知及会话记录|
|simulation-api.js|模拟管理操作的schema2.0类型边界、旧版本/未知字段拒绝、受限的读取/确认/操作状态接口|
|data-provider.js|live / simulation边界，sim命名空间与跨会话校验，快照/历史/设备/告警契约|
|simulation-ui.js|工程模拟面板、源模式标识及会话操作|
|app.js / dashboard.js / bootstrap.js|同一套业务视图与交互，不另建简化模拟Dashboard|
|report-engine.js|[start,end)统计、IANA日期边界、有效时间加权、质量、源峰值、事件截断与报表数据|
|reports-ui.js / exporters.js|任务/取消/下载，真实PDF、XLSX ZIP包和UTF-8 BOM CSV编码|
|notification-simulation-ui.js|独立的本地模拟投递界面，不调用Telegram|
|theme-init.js / CSS|默认浅色、按项目/用户保存偏好、同布局双主题|

相同seed、初始场景版本、保存的startAt和推进序列可重放。DataProvider的视图投影带context，包含sourceMode、sessionId、generationId、scenario、seed、virtualTime；业务引用以`sim:<sessionId>:<generationId>:`开头。管理界面经SimulationApi发送schema2.0请求；视图投影不等同于完整FIN线协议实现。每会话最多100设备、100万条指标历史；最多5会话/2运行。超限显式拒绝或暂停，不静默截断。生成仅在ready且initialized=false时执行。重置/删除先展示清理范围，建立resetting/deleting屏障；重置立即换generation，旧响应/报告任务失效，清理完回ready且initialized=false，须再次生成。删除保留墓碑。后台tick仅改dataRevision，管理命令改controlRevision；普通tick不抢占暂停版本。

会话数据保存于本浏览器localStorage；刷新时running恢复为paused。离开/隐藏页面暂停，不模拟跨页面后台运行。容量不足时明确提示当前仅内存保留。修订8使用`ups.simulation.v3.en-US`独立命名空间，不导入旧v1/v2中文会话，也不删除旧存储；生成器直接使用英文资源生成数据，不运行中文逐字符串翻译。报告文件仅保留当前页内存，刷新后需重新生成；24小时到期后下载拒绝。下载前重查会话代次、账号权限与会话ACL。simulation.manage包含read/ack/export；仅read不允许确认或导出，live权限不替代simulation权限。这些是本地语义，不是服务端安全边界。

阈值W75/C90/Hw5/Hc3、Q15/H2、阻抗变化30%/回差5%、N2仅为明确标注的模拟规则参数；不会回写正式工程配置。场景变更记录virtualEffectiveAt和eventSeq。运行时逐秒处理质量、日历、规则及历史，60秒单步与1/5/10倍推进按同一事件序列执行。评分、窗口仅用于模拟，不代表厂家或标准认证。R-01/02/03使用新样本、去抖与回差；R-05使用虚拟时钟过期/持续时间；模拟确认、恢复和普通事件独立。

## 导出与来源

- 历史统计：carry-in只承接到freshness、映射边界及截止时点；未来时段截断，全未来拒绝。历史告警只使用截止前发生的确认/恢复；REP-04另标当前评估时间。
- PDF：内嵌字体、英文单词换行、浅色分页、重复表头、页码；概览含趋势与质量，告警按类别区分，维护报告区分SOC/SOH/模拟评分和计划/预测。
- XLSX：说明、指标字典、数据质量与对应模板明细，冻结表头、筛选、数值类型、可排序日期；外部文本使用文字类型，不解释成公式。
- CSV：UTF-8 BOM、引号转义、质量/单位/来源/时区；公式前缀文本转义，数值负数保留。所有文件标Simulated Data。四模板及全部9种允许格式已重新生成和解析。
- 字体为[Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc)的子集，重命名UPSDemoSans；遵循随包提供的[SIL OFL](vendor/OFL-NotoSansSC.txt)。授权文本亦嵌入单文件。

## 构建与验证

```text
node build.cjs
node verify.cjs
node verify.cjs --single-file
python verify-files.py
```

`verify.cjs`无需npm依赖，运行34项行为/英文/响应式逻辑检查并将格式验证文件放到被Git忽略的`tmp/verified`。`verify-files.py`使用pypdf、pdfplumber和openpyxl重新打开9个文件、核对数值和类型、检查英文、字体及边界并渲染PDF。本轮证据及限制见ACCEPTANCE.md及RESPONSIVE-VALIDATION.md。历史版本验证独立存档，不混用。

## 手机、平板与桌面

在同一个入口打开。按实际内容宽度，小于640px单列、640～980px双列、大于980px三列；窄屏通过Menu进入全部页面。设备和告警表保留全部状态重排成卡片，其余宽表在有英文说明的独立区域滚动。点击Inspect Trend Samples，通过滑块、Previous Sample和Next Sample查看具体值、时区和质量，无需悬停。

表单、步骤、弹窗和安全区同步适配；尺寸变化仅更新显示区域，不重新连接、生成会话、确认或创建定时器。未提交工程草稿仅在当前页面内存保存，刷新后不承诺保留。浏览器缩放未禁用。

生成报告后点Download，再点Open / Save File使用浏览器的预览/保存；支持文件分享时可用Share File。系统取消不会显示“已保存”。两分钟后链接过期，重新点Download取得新链接；报告本身的权限、代次和24小时有效期继续检查。iOS/iPadOS系统实际文件保存仍待真机验证。

本轮浏览器工具的本地访问限制仍在，未绕过；没有页面截图或真实视口/触控/软键盘证据。RESPONSIVE-VALIDATION.md逐项列出待验矩阵，不把Node合成尺寸事件称为浏览器模拟通过。

## 英文来源边界

页面`lang`、模拟OP-01和本地会话固定`en-US`，不读取浏览器语言，不改变已选IANA时区；界面时间带时区/偏移，导出保留数值日期类型和Notes中的时区。ISO时间字段不改变原时点。

真实适配器须声明`language: "en-US"`，并在服务端保存原始来源证据。非英文资产名/告警描述可提供`englishDisplay.<field> = {language: "en-US", verified: true, text: "..."}`，以及`sourceLanguage`。只有经核对映射用于显示；缺映射时显示`Untranslated source description [稳定ID]`及英文工程待办，保留严重度、活动和确认状态。客户端不保留`raw*`/`original*`字段、不静默机译安全告警。拉丁文字的源语言不能单凭字符可靠判断，适配器必须如实提供sourceLanguage；这仍需真实后端集成验收。

本地通知记录带英文正文、Simulated Data、虚拟时点、事件类型和状态。live与simulation共用英文模板/来源回退规则；本地测试不访问Telegram，messageId始终为空。真实测试预览只提供模板，不声称已发送或已读。

## 产品后台尚未实现

当前工作区未发现本产品可核验的build.fan / FIN SDK后台骨架。此交付是静态前端与本地模拟服务，不是已安装、已编译或已验收的FIN POD。M-15后台持久化、服务端身份/权限、跨用户共享、后台调度、24小时无活动停止/7天清理、进程级崩溃恢复和平台容量验证尚未实施。localStorage恢复与后台事务恢复不是同一能力。

真实模式可由宿主提供`window.upsFleetAdapter`，只读预留getSession、listEquipment、getSnapshot、listAlarms、getHistory；目标FIN SDK接口仍待第14节版本门槛核验。完整schema2.0的FIN Snapshot/Entity/OP-15～22/31线协议与后端绑定、真实配置发布、接入验收、告警确认、报表服务和Telegram传输尚未实现。当前报表走本地ReportEngine/文件函数；OP-31页面保留暂停原因和恢复版本表单，按钮未接入，未声称持久闸门已生效。初始历史为确定性批量生成，统一初始历史与产品后台全事件调度仍待实施。没有连接现场、导入FIN对象、写点或外发消息。

先前浏览器本地文件策略阻止页面视觉核验，本轮未绕过。两主题实屏、1440/1366/390宽、200%缩放和键盘操作仍待实际浏览器验收，不能仅凭静态检查宣称完整FSD已经1:1验收。

# UPS Fleet Monitor 功能界面

依据当前FSD修订5，保留Dashboard、设备清单、告警、报表、工程配置、通知渠道及双主题界面。

## 打开

双击 `UPS-Fleet-Static.html`。这是所有资源内嵌的单文件入口，无CDN依赖。`index.html`为拆分源码入口。

## 当前行为

- 首次浅色；右上角切换浅色/深色，不重载页面。主题偏好按项目与当前用户身份隔离，本地存储失败时仍可当次切换。
- Dashboard保留Hero、健康环、三列六卡、卡内历史区、负载/电容轨道和全宽告警；缺少有效源值时显示空值、未知或待评估。
- 32项监控信息均提供定义、单位、资产位置、计算口径和依据要求。未取得来源、阈值或批准记录时不补值。
- 设备、告警、历史仅接收已授权的平台适配返回；当前没有配置平台适配。
- 四类报表模板保留范围、时区、格式和任务流程。报表生成、下载尚未接入服务，按钮不可用，不生成本地报告。
- 通知渠道保留目标、secretRef、订阅、静默时段及队列/投递视图。测试发送、启用、重试尚未接入服务，不执行外发或创建结果。
- 配置、验收、诊断和审计保持真实未接入状态，不在浏览器生成配置版本或执行记录。

## 适配接口

宿主可在页面脚本之前提供 `window.upsFleetAdapter`，只读启动接口如下：

|方法|请求|响应数据|
|---|---|---|
|getSession|无|permissions、actorId、projectId、timezone|
|listEquipment|pageSize、filter|items，元素为FSD EquipmentRow|
|getSnapshot|equipRef|FSD Snapshot schema 1.2|
|listAlarms|view、filter、pageSize|items，元素为FSD告警对象|
|getHistory|equipRef、objectRef、fields|series及分段buckets|

方法可以返回FSD的带data响应封装，也可返回对应data对象。平台调用、身份、CSRF、范围权限、质量时效和生命周期可靠性必须由真实适配实现；本目录不包含网络地址或凭据。

这里只读接口已预留并做基本身份/响应检查。写操作、完整服务契约和运行验收未实施，不能将静态页面视作已完成的FIN产品。

## 构建与检查

运行 `node build.cjs` 重新生成单文件。运行 `node verify.cjs` 检查无适配空态、组件标记、禁止数据回填、主题偏好及本地资源。检查不等于实屏或FIN验收。

浏览器本地文件策略先前阻止视觉核验，本轮未绕过；响应式尺寸、两主题实际视觉、键盘操作及FSD UI/NEW验收仍待实际浏览器或人工核对。

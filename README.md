# UPS Fleet Monitor

当前交付基线：PRD / FSD v0.1 修订9。用户已于2026-09-15确认本轮FSD、其他文档及DEMO评审通过；该确认不替代FIN生产集成、浏览器实屏或真机验收。

- [打开单文件 DEMO](doc/UI%20prototype/UPS-FSD-R4/UPS-Fleet-Static.html)：下载后用浏览器打开，产品界面与模拟数据为英文。
- [开发、构建与验证说明](doc/UI%20prototype/UPS-FSD-R4/README.md)
- [PRD](doc/planning/UPS-Fleet-FIN-POD-PRD-v0.1.md) / [FSD](doc/planning/UPS-Fleet-FIN-POD-FSD-v0.1.md) / [需求—功能—测试追溯矩阵](doc/planning/UPS-Fleet-Requirements-Traceability-Matrix-v0.1.md)
- [分支管理制度与台账](doc/planning/BRANCHING.md)：本仓库自2026-09-15起采用Git Flow；`main`为生产分支，`develop`为开发集成分支，分支创建、合并、删除由Team Leader统一分配。
- [本轮评审、清理与验证记录](doc/validation/DELIVERY-20260915.md)

`doc/planning/`保存当前规格、追溯矩阵及历史评审依据。`doc/UI prototype/AI-CES-IoT-UPS/`是原始设计参考（含原始ZIP）；`doc/UI prototype/UPS-FSD-R4/`是当前修订9实现，R4仅是保留的路径名。`doc/validation/`保存整理后的测试证据。

静态DEMO使用浏览器内模拟服务，并非已安装的FIN POD。真实FIN后端、安全权限、现场数据接入和Telegram传输等边界详见DEMO说明。测试输出生成在DEMO的`tmp/`，不提交缓存和依赖目录。

# FSD修订9 架构实施交付

- [设备对象Trio](equipment-objects.trio)：35个模板Rec（5资产+30候选点）。
- [业务对象Trio](business-objects.trio)：76个模板/原型Rec，含映射、规则、配置、审计、报表、通知与模拟模型。
- [模型目录与导入说明](model-catalog.md)：字段类型、主键、原子边界、实例化约束。
- [可编程接口实现清单](interface-implementation-list.md)：SF-01～24、OP-01～31及内部适配端口。
- [完整业务类型](contracts.ts) / [处理器接口](handlers.ts)：从已通过FSD提取的schema2.0类型。
- [整体架构图](architecture.svg) / [Mermaid源文件](architecture.mmd) / [架构说明](architecture.md)。

本次新增设计交付，不改已评审FSD或DEMO。Trio是工程模板Rec，运行实例必须经补齐、绑定、验证和发布；本次没有写入Folio或连接生产，未进行目标FIN编译/运行验收。

A2整改：[处置结果](review-disposition.md) · [持久化协议](persistence-design.md) · [公开契约差异提案](fsd-change-proposal.md) · [验证](VALIDATION.md)。

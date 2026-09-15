# 再核对发现与证据层级

## DP-F01：类型索引勘误

冻结B1的operation-ownership.json以方法名索引Contracts，但批准contracts.ts以OP编号为键，handlers.ts亦使用Handler<"OP-01">。影响31项、共62个requestType/responseType。新operation-execution.json逐项改为OP键，方法名和公共字段不变；OP-17保留BinaryDownload成功、Response<never>错误语义，不能把普通响应泛型当文件下载实现。

首轮探针只覆盖31请求索引；后续探针扩展为请求＋响应62索引并实际执行，当前check-contract-keys.cjs/result对应扩展范围。TypeScript5.9.3旧索引62错误，正确OP键零诊断。探针初次Windows路径分隔产生文件未找到、默认DOM库与Response重名；随后规范虚拟路径并显式使用ES2020库，未修改批准契约。前端集成须模块隔离避免全局Response污染。独立评审亦报告两组各31索引的相同结论。

## DP-F02：旧整包校验未通过

原validate-delivery.cjs首先在Approved public contract drift断言失败：生成字符串头及连接使用LF，而契约文件CRLF，不能声称字节一致。仅将CRLF转LF后的全文文本相等。原脚本未执行到下一条r9整文hash断言；新报告独立计算当前r10哈希，确实不同。原脚本/manifest不修改。baseline-recheck.json保留原错误；参考测试报告写入新目录，不覆盖冻结证据。

## 模板及参考逻辑

FIN Expert对两份Trio分别离线复核通过，目标版本适用性仍未验证。19项A2参考模型实跑通过，仅说明参考逻辑，不是Fantom实现或FIN事务证明。所有111个模板列在record-work-packages.json，设备品牌/协议/单位/周期等模板值仍待工程核验，不能直接生成生产设备。

## 候选SDK观察

开发只读观察本机FIN5.3.0.2761；Fantom1.0.78.3105、Java11.0.32.1；finBuild1.1.0含BuildFinArgs/BuildFinPod；haystack/axon3.1.5.1，folio/hx/skyarc/skyarcd3.1.5。Node24.19.0、pnpm11.19.0。版本输出命令退出码1，不视为构建通过。这些是开发任务报告的本机观察，不是最终目标确认；本任务未重复安装或连接现场。

## 全部资料的处理边界

PRD/FSD/RTM、接口/handlers/Trio/codec/持久化、B1.1路由类与装配、评审和中文阅读版均进入输入清单。历史r7/r8、原型、schema2.1候选作为背景和对照；实际可执行权威是批准的schema2.0契约及处置。自动生成的重复图像和机器报告不冒充新的批准证据。source-manifest.json记录逐文件哈希、类别和用途。

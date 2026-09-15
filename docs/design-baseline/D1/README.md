# D1 冻结设计输入

2026-09-15 依 Leader 的 DEV-01 指令，由 `C:/work/upsproject` 精确移交至本目录。
清单与计划分别见 `doc/architecture/development-plan/transfer-manifest.json` 和
`doc/architecture/development-plan/plan-freeze.json`。含冻结清单自身快照共85个文件，
源和目标逐文件SHA-256核验记录见 `../../development/DEV-01/baseline-transfer.json`。

这些文件作为只读输入，不在此修订或运行其生成器。`.gitattributes` 保留原始字节，
避免Git换行转换破坏清单哈希。此README是开发移交说明，不属于原清单。

批准边界为PRD r9、已批准schema2.0接口/Trio/B1.1与D1首包指令。
快照中的FSD r10全文、schema2.1候选与历史证据不因此获得实施批准。
DP-F01采用计划勘误的真实 `OP-*` 契约键；不修改公共schema或B1.1原件。
本次只实现 DEV-01 的最小单POD与 FT-01 新鲜度行为，其余内容为后续参考。

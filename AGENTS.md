# industrial-kg-multi-agent

## Git 工作流程

`main` 已啟用 branch protection，**不可直接 push 或 commit 至 main**。所有修改一律先開一個獨立的 git worktree，不可在目前 checkout 的工作目錄（尤其是 `main` 分支所在目錄）直接切 branch 修改：

- Claude Code：用 `EnterWorktree` 工具開新的獨立工作目錄與分支，完成後用 `ExitWorktree`（`keep` 留著或 `remove` 清掉）
- 其他工具（Cursor 等）／手動：`git worktree add ../<repo>-<branch-name> -b <branch-name>`

修改完成後一律透過 PR 合併，不加 `--no-verify` 跳過 hook，不直接 force push 到 `main`。

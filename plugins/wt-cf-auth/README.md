# wt-cf-auth

`/wt` で新しい worktree に移ったとき、実行元のディレクトリに効いている `cf` プロファイルを、その worktree に `cf auth activate` で紐付ける。`~/.omp/wt` は通常どの `cf auth activate` の範囲にも入らず `default` プロファイルになるため、その対策。

```sh
omp plugin install wt-cf-auth@ryosuz
```

## 注意点

- 実行元が `default` プロファイルなら何もしない。
- worktree を消しても `cf` の紐付けは残る（存在しないディレクトリへの紐付けで実害なし）。不要なら `cf auth deactivate <path>`。
- `/wt` 以外（PR チェックアウト、`git worktree add`、タスク分離）で作られた worktree は対象外。
- 子ディレクトリの紐付けは親より優先されるため、後で実行元側の紐付けを別プロファイルに変えても、紐付け済みの worktree は古いプロファイルのまま。

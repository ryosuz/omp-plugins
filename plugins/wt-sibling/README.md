# wt-sibling

`/wt-sibling [<branch>]`（別名 `/wts`）。組み込み `/wt` と同じく新しいブランチの worktree を作ってセッションを移すが、作成先を `~/.omp/wt` ではなくメインチェックアウトの隣にする。

```sh
omp plugin install wt-sibling@ryosuz
```

## 仕組み

入力の `/wts` を `/wt` に書き換え、`worktree.base` をメインチェックアウトの親ディレクトリに一時的に上書きしてから組み込み `/wt` に渡す。未コミット変更の持ち越し、clone、`worktree.onExit` などは組み込み `/wt` の挙動そのまま。上書きは次の入力かエージェントターン開始で解除する（設定ファイルには書かない）。

## 注意点

- 入力を書き換える方式なので、`/wts` はコマンド補完や `/help` に出ない。動作するのは TUI と RPC モードのみ。
- `OMP_WORKTREE_DIR` が設定されていると `worktree.base` より優先されるため使えない（エラーを表示して何もしない）。
- git 管理外のディレクトリではエラーを表示して何もしない。
- ディレクトリ名は組み込み `/wt` と同じ `<branch>-<hash>`。
- 隣に作った worktree は `omp worktree list` / `clear` の対象外。片付けは `git worktree remove` か `worktree.onExit`。

### `/wt` に反応する他の拡張との組み合わせ

omp の `input` フックは書き換え後のテキストを後続の拡張に渡す。`wt-sibling` より後に読み込まれた拡張には `/wts` が `/wt` として届くため、その拡張は通常の `/wt` と同じように反応する。前に読み込まれた拡張には `/wts` のまま届く。

- 読み込み順はインストール順（`~/.omp/plugins/omp-plugins.lock.json` の記載順。omp 18.16.0 時点）。

例: `wt-cf-auth@ryosuz`（`/wt` で作った worktree に実行元の cf プロファイルを `cf auth activate` する）

- `wt-sibling` を先に入れると `/wts` の worktree も紐付けられ、`wt-cf-auth` を先に入れると紐付けられない。
- 親ディレクトリに紐付けがあり、隣の worktree もその範囲内なら、使われるプロファイルは変わらない。`cf auth list` に重複エントリが増えるだけ。
- 子ディレクトリの紐付けは親より優先されるため、後で親の紐付けを別プロファイルに変えても、その worktree は古いプロファイルのまま固定される。
- リポジトリ自体に `cf auth activate` している場合は、隣の worktree がその範囲外になるので、この紐付けで同じプロファイルが引き継がれる。

# dev

開発ワークフロー用のスラッシュコマンド集。

```sh
omp plugin install dev@ryosuz
```

| コマンド | 内容 |
|---|---|
| `/dev:flow <task>` | 設計 → `implementer` で実装 → `reviewer` でレビュー → 修正（最大 3 回）→ 結果報告 |

コマンドは `commands/<name>.md` に置く。marketplace から入れたコマンド名には必ずプラグイン名が付き、`/dev:<name>` になる。

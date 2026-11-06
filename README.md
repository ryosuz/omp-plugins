# omp-plugins

自分用の omp プラグインの marketplace（marketplace 名: `ryosuz`）。拡張やスラッシュコマンドを用途ごとにプラグインに分け、必要なものだけインストールする。

## プラグイン一覧

| プラグイン | 内容 |
|---|---|
| [`wt-sibling`](plugins/wt-sibling/README.md) | `/wt-sibling [<branch>]`（別名 `/wts`）。組み込み `/wt` と同じだが、worktree を `~/.omp/wt` ではなくメインチェックアウトの隣に作る |
| [`wt-cf-auth`](plugins/wt-cf-auth/README.md) | `/wt` 実行時、実行元に効いている `cf` プロファイルを新しい worktree に `cf auth activate` する |
| [`dev`](plugins/dev/README.md) | 開発ワークフロー用スラッシュコマンド（`/dev:flow`） |

各プラグインの注意点はそれぞれの README を参照。

## インストール

```sh
# marketplace を追加（GitHub の owner/repo かローカルのクローンのパス）
omp plugin marketplace add <owner>/omp-plugins
omp plugin marketplace add <path-to-clone>

omp plugin discover ryosuz                    # 一覧
omp plugin install wt-sibling@ryosuz
omp plugin uninstall wt-sibling@ryosuz
omp plugin disable wt-sibling@ryosuz          # 入れたまま無効化
omp plugin enable wt-sibling@ryosuz
```

インストール・有効化の変更は omp の再起動後に反映される。

## 構成

```
.omp-plugin/marketplace.json      # カタログ
plugins/<name>/package.json       # 拡張プラグイン: name と omp.extensions
plugins/<name>/index.ts           # 拡張プラグイン: 拡張本体
plugins/<name>/commands/<cmd>.md  # コマンドプラグイン: /<name>:<cmd> になる
plugins/<name>/README.md          # プラグインごとの説明と注意点
```

## プラグインの追加・更新

追加（拡張）:

1. `plugins/<name>/index.ts` を作る（`export default function (pi: ExtensionAPI) { ... }`）
2. `plugins/<name>/package.json` を作る（`name` は他のプラグインと重複させない、`"omp": { "extensions": ["./index.ts"] }`）

追加（スラッシュコマンド）:

1. `plugins/<name>/commands/<cmd>.md` を作る（`package.json` は不要）。コマンド名は必ず `/<name>:<cmd>` になる

共通:

1. `.omp-plugin/marketplace.json` の `plugins` に `{ "name", "description", "version", "source": "./<name>" }` を追加
2. `omp plugin marketplace update ryosuz` → `omp plugin install <name>@ryosuz`

更新: インストールしたプラグインはキャッシュ（`~/.omp/plugins/cache/plugins/`）へのコピーなので、ソースを編集しただけでは反映されない。

- カタログの `version` を上げて `omp plugin marketplace update ryosuz` → `omp plugin upgrade`
- 同じバージョンのまま入れ直すなら `omp plugin upgrade <name>@ryosuz`（名前指定は常に再インストール）
- 編集しながら試すなら `omp plugin link plugins/<name>` でソースを直接読み込ませる。その間は marketplace 版を uninstall しておく（同じパッケージ名は共存できない）


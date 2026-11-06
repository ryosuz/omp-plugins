# omp-plugins

自分用の omp 拡張の marketplace（marketplace 名: `ryosuz`）。拡張ごとに 1 プラグインで、必要なものだけインストールする。

## プラグイン一覧

| プラグイン | 内容 |
|---|---|
| `wt-sibling` | `/wt-sibling [<branch>]`（別名 `/wts`）。組み込み `/wt` と同じだが、worktree を `~/.omp/wt` ではなくメインチェックアウトの隣に作る |
| `wt-cf-auth` | `/wt` 実行時、実行元に効いている `cf` プロファイルを新しい worktree に `cf auth activate` する |

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
.omp-plugin/marketplace.json   # カタログ
plugins/<name>/package.json    # name と omp.extensions
plugins/<name>/index.ts        # 拡張本体
```

## プラグインの追加・更新

追加:

1. `plugins/<name>/index.ts` を作る（`export default function (pi: ExtensionAPI) { ... }`）
2. `plugins/<name>/package.json` を作る（`name` は他のプラグインと重複させない、`"omp": { "extensions": ["./index.ts"] }`）
3. `.omp-plugin/marketplace.json` の `plugins` に `{ "name", "description", "version", "source": "./<name>" }` を追加
4. `omp plugin marketplace update ryosuz` → `omp plugin install <name>@ryosuz`

更新: インストールしたプラグインはキャッシュ（`~/.omp/plugins/cache/plugins/`）へのコピーなので、ソースを編集しただけでは反映されない。

- カタログの `version` を上げて `omp plugin marketplace update ryosuz` → `omp plugin upgrade`
- 同じバージョンのまま入れ直すなら `omp plugin upgrade <name>@ryosuz`（名前指定は常に再インストール）
- 編集しながら試すなら `omp plugin link plugins/<name>` でソースを直接読み込ませる。その間は marketplace 版を uninstall しておく（同じパッケージ名は共存できない）

## 注意点

### `wt-sibling` と `wt-cf-auth` を両方入れた場合

`wt-sibling` は入力の `/wts` を `/wt` に書き換えて組み込み `/wt` に渡す。omp の `input` フックは書き換え後のテキストを後続のプラグインに渡すため、`wt-cf-auth` が後に読み込まれていると `/wts` も `/wt` として扱われ、隣に作った worktree にも cf プロファイルが紐付けられる。

- 読み込み順はインストール順（`~/.omp/plugins/omp-plugins.lock.json` の記載順。omp 18.16.0 時点）。`wt-sibling` を先に入れると `/wts` の worktree も紐付けられ、`wt-cf-auth` を先に入れると紐付けられない。
- 親ディレクトリに紐付けがあり、隣の worktree もその範囲内なら、使われるプロファイルは変わらない。`cf auth list` に重複エントリが増えるだけ。
- 子ディレクトリの紐付けは親より優先されるため、後で親の紐付けを別プロファイルに変えても、その worktree は古いプロファイルのまま固定される。
- リポジトリ自体に `cf auth activate` している場合は、隣の worktree がその範囲外になるので、この紐付けで同じプロファイルが引き継がれる。

### `wt-cf-auth`

- worktree を消しても `cf` の紐付けは残る（存在しないディレクトリへの紐付けで実害なし）。不要なら `cf auth deactivate <path>`。
- 実行元が `default` プロファイルなら何もしない。
- `/wt` 以外（PR チェックアウト、`git worktree add`、タスク分離）で作られた worktree は対象外。

### `wt-sibling`

- 入力を書き換える方式なので、`/wts` はコマンド補完や `/help` に出ない。動作するのは TUI と RPC モードのみ。
- `worktree.base` を一時的に上書きして `/wt` に渡し、次の入力かエージェントターン開始で戻す。`OMP_WORKTREE_DIR` が設定されていると使えない。
- 隣に作った worktree は `omp worktree list` / `clear` の対象外。片付けは `git worktree remove` か `worktree.onExit`。

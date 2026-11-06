import * as path from "node:path";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { lookup } from "@oh-my-pi/pi-coding-agent/config/registry";

// `/wt-sibling [<branch>]` (alias `/wts`): built-in `/wt`, but the worktree is created next to the repository's
// main checkout instead of ~/.omp/wt. `/wt` places worktrees at `<worktree.base>/<branch>-<hash>`,
// so this rewrites the input to `/wt` with worktree.base overridden to the checkout's parent.
// The override lasts only until the next input or agent turn: worktree.base also places
// task-isolation copies and PR checkouts, and `omp worktree clear` deletes unrecognized
// directories under it, so it must never stay pointed at a directory holding real projects.
const COMMAND = /^\/(?:wt-sibling|wts)(?=\s|$)/;

/** Main checkout of the repository containing `cwd` (first entry of `git worktree list`). */
async function primaryCheckout(cwd: string): Promise<string | undefined> {
	const proc = Bun.spawn(["git", "-C", cwd, "worktree", "list", "--porcelain"], { stdout: "pipe", stderr: "ignore" });
	const [out, code] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
	const first = code === 0 ? out.split("\n", 1)[0] : "";
	return first.startsWith("worktree ") ? first.slice("worktree ".length) : undefined;
}

export default function (pi: ExtensionAPI): void {
	const base = lookup("worktree.base");
	if (!base) {
		pi.logger.warn("wt-sibling: worktree.base setting not found; /wt-sibling is unavailable");
		return;
	}

	let overridden = false;
	const release = (): void => {
		if (!overridden) return;
		overridden = false;
		base.clearOverride(pi.pi.settings);
	};

	pi.on("input", async (event, ctx) => {
		release();
		const text = (event.text ?? "").trimStart();
		if (!COMMAND.test(text)) return;
		if (process.env.OMP_WORKTREE_DIR) {
			ctx.ui.notify("OMP_WORKTREE_DIR is set and outranks worktree.base; /wt-sibling cannot place the worktree.", "error");
			return { handled: true };
		}
		const primary = await primaryCheckout(ctx.sessionManager.getCwd());
		if (!primary) {
			ctx.ui.notify("/wt-sibling: not inside a git repository.", "error");
			return { handled: true };
		}
		base.override(pi.pi.settings, path.dirname(primary));
		overridden = true;
		return { text: text.replace(COMMAND, "/wt") };
	});
	pi.on("before_agent_start", () => {
		release();
	});
	pi.on("session_shutdown", () => {
		release();
	});
}

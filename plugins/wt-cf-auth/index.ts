import * as path from "node:path";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

// `/wt` moves the session into a new worktree under ~/.omp/wt, outside every
// `cf auth activate` binding. Bind the new worktree to the cf profile that applied
// where `/wt` was run, so `cf` keeps using the same credentials there.

/** Profile cf uses in `dir`: the binding on `dir` or its nearest parent. */
async function cfProfileFor(dir: string): Promise<string | undefined> {
	const out = await new Response(Bun.spawn(["cf", "auth", "list"], { stdout: "pipe", stderr: "ignore" }).stdout).text();
	let best: { name: string; len: number } | undefined;
	for (const p of JSON.parse(out) as { name: string; boundDirectories?: string[] }[]) {
		for (const d of p.boundDirectories ?? []) {
			const inside = dir === d || dir.startsWith(d.endsWith(path.sep) ? d : d + path.sep);
			if (inside && d.length > (best?.len ?? -1)) best = { name: p.name, len: d.length };
		}
	}
	return best?.name;
}

export default function (pi: ExtensionAPI): void {
	pi.on("input", async (event, ctx) => {
		if (!/^\/(?:wt|worktree)(?:\s|$)/.test((event.text ?? "").trimStart())) return;
		const source = ctx.sessionManager.getCwd();
		const profile = await cfProfileFor(source).catch(() => undefined);
		if (!profile) return; // source uses the default profile; nothing to carry over

		// The worktree path is known only after `/wt` relocates the session.
		const deadline = Date.now() + 120_000;
		const poll = (): void => {
			const cwd = ctx.sessionManager.getCwd();
			if (cwd !== source) {
				Bun.spawn(["cf", "auth", "activate", "-q", profile, cwd], { stdout: "ignore", stderr: "ignore" });
			} else if (Date.now() < deadline) {
				setTimeout(poll, 500);
			}
		};
		setTimeout(poll, 500);
	});
}

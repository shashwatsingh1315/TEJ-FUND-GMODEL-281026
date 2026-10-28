"""Build the investor website using the current dashboard source tree.

Only dist/ is published. Refuse to publish when the checked-in dashboard and
its sources disagree: neither a stale output nor an unrecorded HTML edit wins.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = Path("workspace-2026-10-28")
DASHBOARD = WORKSPACE / "outputs/Tejas_Revenue_Dashboard_1041_Updated.html"


def build(root=ROOT):
    root = Path(root)
    with tempfile.TemporaryDirectory(prefix="tejas-site-") as tmp:
        generated = Path(tmp) / "index.html"
        subprocess.run(
            [sys.executable, str(root / WORKSPACE / "src/build.py"), str(generated)],
            check=True,
        )
        html = generated.read_bytes()
    if html != (root / DASHBOARD).read_bytes():
        raise RuntimeError(
            "Dashboard sources and the committed output differ. "
            "Reconcile any direct HTML edits, then run "
            "python3 workspace-2026-10-28/src/build.py and commit the source and output together. "
            "Nothing was published."
        )

    commit = os.environ.get("VERCEL_GIT_COMMIT_SHA")
    if not commit:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=root, capture_output=True, text=True
        )
        commit = result.stdout.strip() if result.returncode == 0 else None
    version = {
        "commit": commit,
        "dashboardSha256": hashlib.sha256(html).hexdigest(),
    }

    # Replace the entire static output so an old extra file cannot be published.
    # Refuse symlinks, including links to private source directories.
    dist = root / "dist"
    if dist.is_symlink():
        raise RuntimeError("dist must be a real output directory, not a symlink.")
    if dist.exists():
        import shutil
        shutil.rmtree(dist)
    dist.mkdir()
    (dist / "index.html").write_bytes(html)
    (dist / "version.json").write_text(json.dumps(version, indent=2) + "\n", encoding="utf-8")
    (dist / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    print(json.dumps({"status": "ready", "directory": "dist", **version}))
    return version


if __name__ == "__main__":
    try:
        build()
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

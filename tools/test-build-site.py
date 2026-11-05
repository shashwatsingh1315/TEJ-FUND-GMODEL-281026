"""Deployment regressions: source/output agreement and published file boundary."""
import importlib.util
from pathlib import Path
import shutil
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("build_site", Path(__file__).with_name("build-site.py"))
SITE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SITE)


class SiteBuildTest(unittest.TestCase):
    def test_private_dashboard_and_public_asset_boundary(self):
        with tempfile.TemporaryDirectory(prefix="tejas-publish-test-") as tmp:
            root = Path(tmp)
            shutil.copytree(SITE.ROOT / SITE.WORKSPACE / "src", root / SITE.WORKSPACE / "src")
            shutil.copytree(SITE.ROOT / "site-assets", root / "site-assets")
            expected = SITE.ROOT / SITE.DASHBOARD
            target = root / SITE.DASHBOARD
            target.parent.mkdir()
            shutil.copyfile(expected, target)
            (root / "dist").mkdir()
            (root / "dist/private-notes.txt").write_text("must not ship")
            version = SITE.build(root)
            self.assertEqual((root / ".private/dashboard.html").read_bytes(), expected.read_bytes())
            self.assertEqual(set(p.name for p in (root / "dist").iterdir()), {"robots.txt", "version.json", "tejas-preview.png", "tejas-icon.png"})
            self.assertFalse((root / "dist/index.html").exists())
            self.assertEqual(len(version["dashboardSha256"]), 64)

            # A hand edit to generated HTML must block publishing, preserving last output.
            target.write_bytes(target.read_bytes() + b"\n<!-- direct layout edit -->")
            with self.assertRaisesRegex(RuntimeError, "sources and the committed output differ"):
                SITE.build(root)
            self.assertEqual((root / ".private/dashboard.html").read_bytes(), expected.read_bytes())

            # A source edit without a rebuilt HTML must also block publishing.
            shutil.copyfile(expected, target)
            base = root / SITE.WORKSPACE / "src/base/dashboard-base.html"
            base.write_bytes(base.read_bytes() + b"\n<!-- source edit -->")
            with self.assertRaisesRegex(RuntimeError, "sources and the committed output differ"):
                SITE.build(root)

    def test_refuses_private_symlink(self):
        with tempfile.TemporaryDirectory(prefix="tejas-publish-test-") as tmp:
            root = Path(tmp)
            shutil.copytree(SITE.ROOT / SITE.WORKSPACE / "src", root / SITE.WORKSPACE / "src")
            shutil.copytree(SITE.ROOT / "site-assets", root / "site-assets")
            target = root / SITE.DASHBOARD
            target.parent.mkdir()
            shutil.copyfile(SITE.ROOT / SITE.DASHBOARD, target)
            (root / ".private").symlink_to(root / "site-assets", target_is_directory=True)
            with self.assertRaisesRegex(RuntimeError, r".private must be a real directory"):
                SITE.build(root)


if __name__ == "__main__":
    unittest.main()

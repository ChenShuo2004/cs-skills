import functools, http.server, json, subprocess, sys, tempfile, threading, unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/download_media.py"

class DownloadTest(unittest.TestCase):
    def test_download_reuse_and_failure_cleanup(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "color=size=64x64:rate=1", "-t", "1", str(root / "sample.mp4")], check=True)
            handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=directory)
            server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f"http://127.0.0.1:{server.server_port}"
            out = root / "downloads"
            def invoke(media, title="sample"):
                return subprocess.run([sys.executable, str(SCRIPT), "--media-url", base + media, "--source-url", base, "--title", title, "--video-id", "123", "--output-dir", str(out)], capture_output=True, text=True)
            try:
                first = invoke("/sample.mp4")
                self.assertEqual(first.returncode, 0, first.stderr)
                target = out / "sample-123.mp4"
                before = target.stat().st_mtime_ns
                record = json.loads(target.with_suffix(".source.json").read_text())
                self.assertNotIn("media_url", record)
                self.assertEqual(invoke("/missing.mp4").returncode, 0)
                self.assertEqual(before, target.stat().st_mtime_ns)
                self.assertNotEqual(invoke("/missing.mp4", "failure").returncode, 0)
                self.assertFalse((out / "failure-123.mp4").exists())
                (root / "invalid.mp4").write_text("not video")
                self.assertNotEqual(invoke("/invalid.mp4", "invalid").returncode, 0)
                self.assertEqual(list(out.glob("*.part")), [])
            finally:
                server.shutdown()
                server.server_close()

if __name__ == "__main__":
    unittest.main()

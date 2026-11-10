import contextlib
import csv
import io
import json
import runpy
import shutil
import struct
import sys
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

from PIL import Image, features


ROOT = Path(__file__).resolve().parent.parent


def blp_tile(encoding, color):
    # BLP2 header, sixteen mip offsets/sizes, BGRA palette, and one 4x4 mip.
    palette = bytearray(1024)
    if encoding == 1:
        palette[:4] = bytes((*reversed(color), 255))
        pixels = bytes(16)
    else:
        rgb565 = ((color[0] >> 3) << 11) | ((color[1] >> 2) << 5) | (color[2] >> 3)
        pixels = struct.pack("<HHI", rgb565, 0, 0)
    return (
        struct.pack("<4sIBBBBII", b"BLP2", 1, encoding, 0, 0, 1, 4, 4)
        + struct.pack("<16I", 1172, *([0] * 15))
        + struct.pack("<16I", len(pixels), *([0] * 15))
        + palette
        + pixels
    )


def csv_bytes(rows):
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue().encode("utf-8-sig")


class MapImportTest(unittest.TestCase):
    def setUp(self):
        self.root = ROOT / "tests" / (".map-import-fixture-" + uuid.uuid4().hex)
        self.root.mkdir()
        self.addCleanup(shutil.rmtree, self.root)
        (self.root / "scripts").mkdir()
        (self.root / "public" / "assets" / "maps").mkdir(parents=True)
        (self.root / "public" / "data").mkdir()
        self.script = self.root / "scripts" / "update-instance-maps.py"
        shutil.copyfile(ROOT / "scripts" / "update-instance-maps.py", self.script)
        self.manifest = self.root / "public" / "data" / "instance-maps.json"

    def test_blp_to_rgb_to_lossless_webp(self):
        self.assertTrue(features.check("webp"), "Pillow must include WebP support")
        for encoding in (1, 2):
            with self.subTest(encoding=encoding):
                self.check_import(encoding)

    def check_import(self, encoding):
        tables = {
            "JournalEncounter": [
                {"ID": 1564, "JournalInstanceID": 746, "UiMapID": 330,
                 "Map_0": 0.25, "Map_1": 0.75, "Name_lang": "Fixture boss", "OrderIndex": 0}
            ],
            "UiMap": [{"ID": 330, "Name_lang": "Fixture floor"}],
            "UiMapXMapArt": [{"ID": 1, "UiMapID": 330, "PhaseID": 0, "UiMapArtID": 42}],
            "UiMapArt": [{"ID": 42, "UiMapArtStyleID": 7}],
            "UiMapArtStyleLayer": [
                {"ID": 1, "UiMapArtStyleID": 7, "LayerIndex": 0, "LayerWidth": 8,
                 "LayerHeight": 4, "TileWidth": 4, "TileHeight": 4}
            ],
            "UiMapArtTile": [
                {"ID": 1, "UiMapArtID": 42, "LayerIndex": 0, "FileDataID": 101, "ColIndex": 0, "RowIndex": 0},
                {"ID": 2, "UiMapArtID": 42, "LayerIndex": 0, "FileDataID": 102, "ColIndex": 1, "RowIndex": 0},
            ],
        }
        responses = {
            "https://wago.tools/db2/" + name + "/csv?build=fixture": csv_bytes(rows)
            for name, rows in tables.items()
        }
        for file_id, color in ((101, (248, 0, 0)), (102, (0, 252, 0))):
            raw = blp_tile(encoding, color)
            with Image.open(io.BytesIO(raw)) as texture:
                self.assertEqual(texture.format, "BLP")
                self.assertEqual(texture.convert("RGB").getpixel((0, 0)), color)
            responses["https://wago.tools/api/casc/" + str(file_id) + "?version=fixture"] = raw

        previous = {
            "instances": {
                "999": {"name": {"en_US": "Unrelated instance"}, "floors": []},
                "746": {
                    "name": {"pt_BR": "Instância"},
                    "floors": [{"uiMapId": 330, "name": {"pt_BR": "Andar"}, "pins": [
                        {"encounterId": 1564, "name": {"pt_BR": "Chefe"}}
                    ]}],
                },
            }
        }
        self.manifest.write_text(json.dumps(previous), encoding="utf-8")

        def local_response(request, timeout):
            self.assertEqual(timeout, 45)
            return io.BytesIO(responses[request.full_url])

        output = io.StringIO()
        with patch.object(sys, "argv", [str(self.script), "--instance", "746", "--build", "fixture"]), \
                patch("urllib.request.urlopen", side_effect=local_response) as download, \
                contextlib.redirect_stdout(output):
            runpy.run_path(str(self.script), run_name="__main__")

        self.assertEqual(download.call_count, 8)
        self.assertIn("Imported 1 map(s), 1 encounter pins", output.getvalue())
        manifest = json.loads(self.manifest.read_text())
        self.assertEqual(manifest["instances"]["999"], previous["instances"]["999"])
        instance = manifest["instances"]["746"]
        self.assertEqual(instance["name"]["pt_BR"], "Instância")
        self.assertEqual(instance["source"]["requestedBuild"], "fixture")
        self.assertEqual(instance["source"]["provider"], "Wago.tools DB2/CASC")
        floor = instance["floors"][0]
        self.assertEqual((floor["width"], floor["height"]), (8, 4))
        self.assertEqual(floor["fileDataIds"], [101, 102])
        self.assertEqual(floor["name"]["pt_BR"], "Andar")
        self.assertEqual(floor["pins"][0]["name"], {"pt_BR": "Chefe", "en_US": "Fixture boss"})
        self.assertEqual((floor["pins"][0]["x"], floor["pins"][0]["y"]), (0.25, 0.75))
        self.assertEqual(floor["image"], "/assets/maps/uimap-330.webp")
        maps = self.root / "public" / "assets" / "maps"
        self.assertEqual([path.name for path in maps.iterdir()], ["uimap-330.webp"])
        with Image.open(maps / "uimap-330.webp") as result:
            self.assertEqual(result.format, "WEBP")
            self.assertEqual(result.mode, "RGB")
            self.assertEqual(result.size, (8, 4))
            expected_row = [(248, 0, 0)] * 4 + [(0, 252, 0)] * 4
            self.assertEqual(
                [result.getpixel((x, y)) for y in range(4) for x in range(8)],
                expected_row * 4,
            )


if __name__ == "__main__":
    unittest.main()

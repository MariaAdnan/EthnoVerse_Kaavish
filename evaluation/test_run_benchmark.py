from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

import numpy as np
from PIL import Image

from evaluation.run_benchmark import calculate_metrics, discover_images, split_images


class BenchmarkTests(unittest.TestCase):
    def test_split_is_deterministic_and_roughly_eighty_twenty(self) -> None:
        images = [Path(f"capture-{index:02}.png") for index in range(10)]
        first_train, first_test = split_images(images, seed=7)
        second_train, second_test = split_images(images, seed=7)

        self.assertEqual(first_train, second_train)
        self.assertEqual(first_test, second_test)
        self.assertEqual(len(first_train), 8)
        self.assertEqual(len(first_test), 2)
        self.assertFalse(set(first_train) & set(first_test))

    def test_identical_images_have_perfect_similarity(self) -> None:
        with TemporaryDirectory() as temporary_directory:
            image_path = Path(temporary_directory) / "sample.png"
            pixels = np.full((16, 16, 3), 127, dtype=np.uint8)
            Image.fromarray(pixels).save(image_path)

            metric = calculate_metrics(image_path, image_path)

            self.assertTrue(np.isinf(metric.psnr_db))
            self.assertAlmostEqual(metric.ssim, 1.0, places=6)

    def test_discover_images_ignores_non_images(self) -> None:
        with TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            Image.new("RGB", (8, 8)).save(directory / "b.jpg")
            Image.new("RGB", (8, 8)).save(directory / "a.png")
            (directory / "notes.txt").write_text("ignore me", encoding="utf-8")

            self.assertEqual(
                [path.name for path in discover_images(directory)],
                ["a.png", "b.jpg"],
            )


if __name__ == "__main__":
    unittest.main()

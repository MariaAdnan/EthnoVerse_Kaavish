import unittest
from pathlib import Path
from zipfile import ZipInfo

from pipeline_security import (
    MAX_COMPRESSION_RATIO,
    model_path,
    validate_object_name,
    validate_source_url,
    validate_uuid,
    validated_image_members,
)


class PipelineSecurityTests(unittest.TestCase):
    def test_accepts_normal_job_fields(self):
        self.assertEqual(validate_object_name("clay-vessel_01"), "clay-vessel_01")
        self.assertEqual(
            validate_uuid("2c0e586a-3685-4135-8107-b442cdd22d73", "Community"),
            "2c0e586a-3685-4135-8107-b442cdd22d73",
        )
        self.assertEqual(
            validate_source_url(
                "https://res.cloudinary.com/example/raw/upload/captures.zip",
                {"res.cloudinary.com"},
            ),
            "https://res.cloudinary.com/example/raw/upload/captures.zip",
        )

    def test_rejects_path_traversal_and_unapproved_sources(self):
        with self.assertRaises(ValueError):
            validate_object_name("../../other-model")
        with self.assertRaises(ValueError):
            validate_source_url("http://127.0.0.1/private.zip", {"res.cloudinary.com"})
        with self.assertRaises(ValueError):
            validate_source_url("https://example.com/captures.zip", {"res.cloudinary.com"})

    def test_model_path_stays_under_storage_root(self):
        root = Path("/mnt/ply_storage")
        self.assertEqual(
            model_path(root, "woven-stool"),
            root / "woven-stool" / "point_cloud.ply",
        )

    def test_zip_validation_rejects_duplicate_flattened_names(self):
        first = ZipInfo("a/frame.jpg")
        first.file_size = first.compress_size = 100
        second = ZipInfo("b/frame.jpg")
        second.file_size = second.compress_size = 100
        with self.assertRaises(ValueError):
            validated_image_members([first, second])

    def test_zip_validation_rejects_suspicious_compression(self):
        info = ZipInfo("frame.jpg")
        info.compress_size = 1
        info.file_size = MAX_COMPRESSION_RATIO + 1
        with self.assertRaises(ValueError):
            validated_image_members([info])


if __name__ == "__main__":
    unittest.main()

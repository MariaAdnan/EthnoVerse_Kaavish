# Runtime asset manifest

## Publication status

The project team has completed the publication review for the assets below, and
they are published on the live site as part of a non-commercial research
project. Item-level permission records (who granted permission, permitted uses
and any restrictions) are held by the project team rather than in this
repository. Follow `docs/PUBLICATION_CHECKLIST.md` for any asset added later.

## 3D tour assets

Loaded from the Cloudinary folder `ethnoverse/3d-tour`: `char_pai.glb`,
`desert-v1.glb`, `hut.glb`, `matka.spz`, `oak_trees.glb` and
`realistic_bush.glb` for the built-in Kolhi tour, plus `grass.glb`,
`rocky.glb` and `mountains.glb` as terrain options for other communities.
`bangles1 (1)-2.spz`, `bangles2-2.spz`, `box.spz` and `frame03.glb` are stored
in the same folder but not loaded by the current tour.

Served with the site from `public/3d-tour/assets/`:

- `outfit-2.spz`: the kameez scan, with 79 stray floater splats removed (they
  appeared as dark smudges in the sky). The original remains on Cloudinary.

Loaded from Supabase (`tour_objects` table and `tour-objects` storage bucket):
admin-placed objects, currently the bangles scan.

On phones and data-saving connections the tour runs in lite mode and skips
`oak_trees.glb` and `realistic_bush.glb`.

## Libraries

three.js 0.178.0 (MIT) and Spark 0.1.10 (MIT) are copied from `node_modules`
into `public/3d-tour/vendor/` by `scripts/vendor-3d-tour.mjs` at build time, so
the tour does not depend on third-party CDNs.

## Other images

The generic community placeholder and homepage hero is loaded from this
[Unsplash image](https://images.unsplash.com/photo-1677153224313-7b009d1b33e6)
under the Unsplash license.

# Contributing

Use Conventional Commits for new changes:

- `feat:` user-facing capability
- `fix:` bug fix
- `docs:` documentation only
- `refactor:` behavior-preserving code change
- `test:` automated test work
- `build:` dependencies or build configuration
- `ci:` continuous-integration configuration
- `chore:` repository maintenance

Keep the subject imperative and concise, for example:

```text
fix: validate media before upload
```

Before opening a pull request, run:

```bash
cd website
npm run check
```

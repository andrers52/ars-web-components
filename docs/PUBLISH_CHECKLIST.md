# Publish Checklist

Follow this checklist for every version release of ars-web-components.

## Code Quality

- [ ] All tests pass (`npm test`)
- [ ] Test coverage >= 80% for changed/new components (`npm run test:coverage`)
- [ ] Lint passes (`npm run lint`)
- [ ] TypeScript compiles with no errors (`npm run build`)
- [ ] No `console.log` / `console.warn` in production source (test files excepted)

## Documentation

- [ ] New/changed components have JSDoc header comments documenting attributes, properties, events, slots, and CSS variables
- [ ] `CHANGELOG.md` updated with entry under `[Unreleased]` following Keep a Changelog format
- [ ] `README.md` component inventory table updated if components were added/removed
- [ ] `docs/EMBEDDING.md` updated if mount/lifecycle behavior changed
- [ ] Per-component `README.md` created/updated in `src/components/ars-<name>/` if API changed

## Demos

- [ ] New components have a demo (dedicated page or section in a combined page per the demo strategy)
- [ ] Demo follows the template structure (header, info box, sections, theme toggle, event monitor, usage)
- [ ] Existing demos still work after changes (manual verification or e2e)
- [ ] Gallery index (`index.html`) links to all demo pages in Quick Access and Components Demo grids
- [ ] Theme toggle (light/dark adapter) works on all demo pages

## Release

- [ ] Version bumped in `package.json` following semver
- [ ] `CHANGELOG.md` date filled in for the release version
- [ ] Git tag created matching the version (`git tag v1.x.x`)
- [ ] `npm publish` from a clean working tree (`git status` shows no changes)

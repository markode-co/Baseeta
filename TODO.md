## TODO
- [x] Update package.json build script to remove `node_modules/.prisma` before running `prisma generate`.
- [ ] Rerun `npm run build` and verify Prisma generation no longer fails.
- [ ] If it still fails, identify remaining Prisma processes / locked files and apply further Windows-specific mitigations.

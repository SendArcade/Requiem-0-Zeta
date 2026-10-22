# Release checklist

Do not use `railway up`. Do not start a second Railway service. Production is the existing web service, built from `main`.

Before a push that should reach production:

1. `pnpm audit:identity` exits 0.
2. `pnpm --filter @ripbeys/web exec tsc -b --pretty false` exits 0.
3. Product vs part: the archive fetch uses `isProductOracleEligible` only.
4. A known product URL returns JSON, not the Vite shell. Example: `/api/product/prod-x-bx-34-complete-loose`.
5. `bx-002` still points at `prod-x-dran-dagger-4-60r-complete-loose`.
6. No seed, matcher, or Oracle math diff unless that was the task.
7. No `.env`, Railway token, or generated `apps/web/src/consumer/**/*.js` in the commit.
8. Docker build uses the frozen lockfile. `package.json` and `pnpm-lock.yaml` must match.

After deploy, open `/market` and one Bey page. The archive count is the live product-mark count. It is not 578, 26, or the model figure.

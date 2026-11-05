# Novu (Astropods build)

A fork of [novuhq/novu](https://github.com/novuhq/novu) that builds the self-hosted Community Edition images Astropods runs.

| | |
|---|---|
| Base | Novu `v3.18.0` |
| Change | api, worker, ws and dashboard run on `node:22.23.4-alpine3.23`, which fixes CVE-2026-111497 |
| Removed | Novu's enterprise packages and workers, docs, playground, the inbound-mail and webhook apps, agent evals, the client SDKs the images do not use (Next.js, React Native, chat adapter, agent toolkit, add-inbox, provider generator), and Novu's own CI, editor and community files |
| Images | `ghcr.io/astropods/novu/{api,worker,ws,dashboard}` |

## Build the images

Run the **Build self-hosted images** workflow from `main`. Set `push` to publish the images under the tag in `IMAGE_TAG`. Without it, the workflow only builds and checks them.

```bash
gh workflow run astropods-self-hosted-images.yml -R astropods/novu --ref main -f push=true
```

Each build fails if `node --version` is not `v22.23.4` or if an enterprise package is present. Features that only Novu's enterprise build provides (translations, billing, Clerk and Better Auth sign-in, AI generation) are off.

## License

MIT. See [LICENSE-MIT](LICENSE-MIT).

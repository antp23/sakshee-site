# Deployment Notes

This site has two modes:

- Tribute mode is the default public experience.
- Portfolio mode is a client-side hidden room. It is a sweet privacy curtain, not real authentication. Before treating portfolio content as private, put it behind server-side auth or deploy it separately.

## Before Going Live

1. Run `node scripts/audit-assets.mjs`.
2. Remove source-only files from deploy output, especially raw camera files, HEIC originals, zips, and duplicate photo batches.
3. Generate web-sized images for visible pages and albums. Keep originals outside the deployed static directory.
4. Run `node scripts/build-public.mjs` to create a `dist/` folder with only the assets referenced by `index.html`.
5. Start the CMS only when editing portfolio content. The tribute works without the CMS server.
6. If `PORTFOLIO_MODE_PUBLIC` becomes `true`, review the live page as a public professional portfolio before sharing.

## CMS

Local CMS server:

```sh
uvicorn cms.main:app --reload --port 8097
```

For editing, open `http://127.0.0.1:8097/` so the page and CMS API share the same server and uploaded files preview from `/photos/...`.

The deployed `dist/` site does not include the CMS. It should show the private room in preview mode and display CMS-offline messages in the editable tabs.

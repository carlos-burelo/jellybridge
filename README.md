<center>
<img src="icon.jpg" width="100" />

# JellyBridge

Download files from file hosting sites, detect content type, and deliver them to the right folder automatically — designed for CasaOS.

**Archives** (zip, rar, 7z) are extracted with optional password list support.  
**Video files** are moved directly to your destination folder.
</center>

## Features

- MediaFire downloads
- Automatic content detection (archive vs video)
- Multiple destination folders (Movies, Series, etc.)
- Real-time progress via SSE
- Archive extraction with password list
- Retry failed downloads without re-downloading (temp file preserved)
- Persistent logs with live viewer
- Directory browser for picking destination paths
- CasaOS dashboard integration

## Stack

Astro · React · Tailwind CSS · Bun · Docker

## Installation (CasaOS)

Import via docker-compose or paste the compose file in the CasaOS App Store custom install.

```bash
git clone <repo> /DATA/AppData/jellybridge
cd /DATA/AppData/jellybridge
docker compose up -d --build
```

Access at `http://<casaos-ip>:4321`

## Volumes

| Host path | Container path | Purpose |
|---|---|---|
| `/DATA/AppData/jellybridge` | `/app/data` | Settings and logs |
| `/mnt` | `/mnt` | Media storage (adjust to your setup) |

The `/mnt` mapping is an example. In Settings you can browse and select any path available inside the container.

## First-time setup

1. Open **Settings**
2. Add destination folders using the directory browser (e.g. `/mnt/disk/Movies`)
3. Add extraction passwords if your archives are password-protected
4. Save

## Development

```bash
bun install
bun run dev      # http://localhost:4321
bun run build
bun run preview
```

On Windows, the directory picker works against local drives. On Linux/Docker it works against the container filesystem.

## Adding a provider

1. Create `src/lib/providers/<name>.ts` exporting `async function resolve<Name>Url(url): Promise<{ directUrl, filename }>`
2. Add to `PROVIDERS` in `src/components/DownloadForm.tsx`
3. Add the resolver branch in `src/lib/pipeline.ts`

## License

MIT

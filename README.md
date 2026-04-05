# braille-bookstack

This repository is configured to run and deploy [BookStack](https://www.bookstackapp.com/) using Docker, with Railway deployment via `Dockerfile`.

## Stack

- BookStack container: `lscr.io/linuxserver/bookstack:latest`
- Database: MariaDB `11.4`
- Local orchestration: Docker Compose
- Deployment target: Railway

No host-level PHP, Composer, or MySQL installation is required.

## Local run

1. Copy `.env.example` to `.env` and set secure values.
2. Start services:

```bash
docker compose up -d
```

3. Open <http://localhost:6875>.

Default BookStack login on first install:

- Email: `admin@admin.com`
- Password: `password`

Change this immediately after first login.

## Required environment variables

Set these in `.env` (for local) and Railway variables (for production):

- `APP_URL` (for example `https://your-bookstack-domain.com`)
- `APP_KEY` (generate using the command below)
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

Optional:

- `PUID`, `PGID` (Linux host file ownership)
- `TZ`
- `QUEUE_CONNECTION` (`database` recommended)

Generate an app key:

```bash
docker run --rm --entrypoint /bin/bash lscr.io/linuxserver/bookstack:latest -lc 'appkey'
```

## Railway deployment

1. Create a Railway project from this repository.
2. Add a MariaDB service in Railway.
3. In the BookStack service variables, set:
   - `APP_URL`
   - `APP_KEY`
   - `DB_HOST` (Railway MariaDB host)
   - `DB_PORT` (usually `3306`)
   - `DB_DATABASE`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `PUID=1000`
   - `PGID=1000`
   - `TZ=Australia/Sydney`
   - `QUEUE_CONNECTION=database`
4. Deploy. Healthcheck uses `/status` as configured in `railway.toml`.

## Files

- `docker-compose.yml`: Local BookStack + MariaDB stack
- `Dockerfile`: Railway image definition
- `railway.toml`: Railway build/deploy settings
- `.github/workflows/ci.yml`: Docker build validation

## Notes on tool versions

Everything needed to run BookStack is contained in Docker images, so no host PHP tooling is required.
`mise.toml` is kept minimal for this reason.
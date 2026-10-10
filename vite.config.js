import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/* The host the content security policy in public/_headers is written around.
   The file is checked in and the project ref is not, so the ref cannot be
   written there: it is filled in below, at build, from the environment. */
const PLACEHOLDER = '<your-project-ref>.supabase.co'

/**
 * Put the real Supabase host into the shipped _headers file.
 *
 * The policy names the project by host, and a policy naming the wrong host is a
 * site that cannot reach its own database. The anon key is right, the URL is
 * right, and every call still dies in the browser as "Failed to fetch", because
 * a blocked request never becomes a response for the client to read. Signup is
 * where a visitor meets it first.
 *
 * This used to be a hand-edit — a line in the README saying to put the ref into
 * the two connect-src entries before deploying — and a hand-edit that only
 * fails after deploy is one that gets forgotten. It was forgotten, and the site
 * shipped a policy that blocked its own database. So the build writes it now,
 * from the same VITE_SUPABASE_URL the client is built with. The two cannot
 * disagree: whatever the app talks to is what the policy allows.
 */
function supabaseCsp(env) {
  let outDir = 'dist'
  let root = process.cwd()

  return {
    name: 'hzbd:supabase-csp',
    apply: 'build',

    configResolved(config) {
      outDir = config.build.outDir
      root = config.root
    },

    // The last hook of a build, so the public dir has certainly been copied.
    closeBundle() {
      const file = resolve(root, outDir, '_headers')
      if (!existsSync(file)) return

      const configured = env.VITE_SUPABASE_URL?.trim()
      let host = ''
      if (configured) {
        try {
          host = new URL(configured).host
        } catch {
          this.error(
            `VITE_SUPABASE_URL is not a URL: ${configured}\n` +
              'It should look like https://abcdefgh.supabase.co — the Project URL under ' +
              'Supabase, Project Settings, API.'
          )
        }
      }

      const source = readFileSync(file, 'utf8')
      const filled = source.replace(/^([ \t]*Content-Security-Policy:.*)$/gm, (line) =>
        fillCsp(line, host)
      )

      /* A literal `<your-project-ref>` is not a valid CSP host source. The
         browser drops it and keeps the rest of the directive, which is the
         silent version of the same failure — so refuse to ship one. */
      if (filled.includes(PLACEHOLDER)) {
        this.error(
          `${outDir}/_headers still names ${PLACEHOLDER} after the build, and the policy would ` +
            'block every call to Supabase. Check the Content-Security-Policy line in ' +
            'public/_headers.'
        )
      }

      writeFileSync(file, filled)

      if (!host) {
        this.warn(
          'VITE_SUPABASE_URL is not set, so the content security policy names no Supabase ' +
            'host. This build cannot sign anybody in. Set it and build again before deploying.'
        )
      }
    },
  }
}

/** One Content-Security-Policy line, with the placeholder resolved. */
function fillCsp(line, host) {
  if (!line.includes(PLACEHOLDER)) return line
  if (host) return line.split(PLACEHOLDER).join(host)

  /* Nothing configured: this build cannot reach Supabase at all, so the policy
     should not claim it can. Drop the two sources and leave 'self' — the
     indentation is what binds a header to its path rule, so keep it. */
  const indent = line.match(/^[ \t]*/)[0]
  const body = line
    .slice(indent.length)
    .split(`https://${PLACEHOLDER}`)
    .join('')
    .split(`wss://${PLACEHOLDER}`)
    .join('')
    .replace(/ {2,}/g, ' ')
    .replace(/ ;/g, ';')

  return indent + body
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /* An empty prefix rather than 'VITE_', so a value set in the deploy host's
     build environment is found as readily as one in .env.local. */
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), supabaseCsp(env)],
    server: {
      port: Number(process.env.PORT) || 5173,
    },
  }
})

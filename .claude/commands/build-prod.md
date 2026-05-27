Build the LexiPack client for production deployment.

Steps to perform in order:

1. Run `cd C:\Users\rober\Lexipack\client && npm run build` (PowerShell: `cd C:\Users\rober\Lexipack\client; npm run build 2>&1`) and show the full output.

2. If the build **failed** (exit code ≠ 0 or "error" in output):
   - Show the error clearly
   - Stop here and do NOT proceed

3. If the build **succeeded**:
   - Report the generated asset sizes from the output
   - Warn about any CSS warnings or large chunk warnings found in the output
   - Remind the user of the deployment steps from CLAUDE.md:
     ```
     1. Copy dist/ to the production server
     2. If server files changed: copy to C:\APPS\Lexipack\server\ → pm2 restart lexipack-api
     3. If package.json changed: run npm install before restart
     ```
   - Ask the user if they also changed any server-side files (server/ directory) that need to be deployed

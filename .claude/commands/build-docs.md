Build the LexiPack documentation site for production deployment.

Steps to perform in order:

1. Run `cd C:\Users\rober\LexiPack\docs; npm run build 2>&1` and show the full output.

2. If the build **failed** (exit code ≠ 0 or "error" in output):
   - Show the error clearly
   - Stop here and do NOT proceed

3. If the build **succeeded**:
   - Report the output folder (`.vitepress/dist`)
   - Warn about any warnings found in the output
   - Remind the user: copy `.vitepress/dist/` to the production web server

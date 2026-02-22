# Install & Prime

## Read
.env.sample (never read .env)
./app/server/.env.sample (never read .env)

## Read and Execute
.claude/commands/prime.md

## Run
- Remove the existing git remote: `git remote remove origin`
- Initialize a new git repository: `git init`
- Install FE and BE dependencies
- Run `./scripts/copy_dot_env.sh` to copy the .env file from the tac-2 directory. Note, the tac-2 codebase may not exists, proceed either way.
- Run `./scripts/reset_db.sh` to setup the database from the backup.db file
- On a background process, run `./scripts/start.sh` with 'nohup' or a 'subshell' to start the server so you don't get stuck

### Report
**Setup complete. Summary of what was done:**
- [bullet list of completed steps]

**Action required from you:**
- Fill out `.env` based on `.env.sample`
- [etc.]

**To start developing:** visit [URL from scripts/start.sh]
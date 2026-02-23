# Huntr CLI Roadmap

## Current Status (v1.0.0) ✅

### Completed Features
- ✅ Session-based auth (macOS Keychain with auto-refresh)
- ✅ Static token auth (env var, config file, CLI flag)
- ✅ Interactive token prompt
- ✅ All GET endpoints (read-only)
- ✅ Multiple output formats (table, JSON, CSV)
- ✅ List command filtering (--days, --types, --format)
- ✅ Shell completions (bash, zsh, .fish)
- ✅ NPM package ready to publish
- ✅ Cross-platform support (.env file for non-Mac)
- ✅ Comprehensive documentation

### API Endpoints Implemented
| Endpoint | Command | Status |
|----------|---------|--------|
| `GET /me` | `huntr me` | ✅ |
| `GET /boards` | `huntr boards list` | ✅ |
| `GET /boards/{id}` | `huntr boards get <id>` | ✅ |
| `GET /jobs` | `huntr jobs list <board-id>` | ✅ |
| `GET /jobs/{id}` | `huntr jobs get <board-id> <job-id>` | ✅ |
| `GET /activities` | `huntr activities list <board-id>` | ✅ |

---

## Near-Term Enhancements (v1.1.x)

### Testing & Quality
- [ ] Unit tests for API client
- [ ] Integration tests for CLI commands
- [ ] Test coverage report
- [ ] CI/CD pipeline (GitHub Actions)

### Data Export
- [ ] Export to Excel (.xlsx)
- [ ] Export to PDF report
- [ ] Email export results
- [ ] S3 upload capability

### Search & Filter Enhancements
- [ ] Full-text search in job titles/descriptions
- [ ] Filter by date range (--from, --to)
- [ ] Filter by job status
- [ ] Sort options (--sort, --order)

### User Experience
- [ ] Better error messages
- [ ] Progress bars for long operations
- [ ] Quiet mode (--silent)
- [ ] Verbose mode (--verbose)

---

## Future Features (v2.0.x)

### Data Visualization
- [ ] Dashboard with stats (web UI)
- [ ] Charts & analytics
- [ ] Heatmaps of application timeline
- [ ] Success rate analysis

### Webhooks & Notifications
- [ ] Slack integration
- [ ] Email notifications on new jobs
- [ ] Desktop notifications
- [ ] Custom webhook support

### Data Sync
- [ ] Automatic sync to local database
- [ ] Offline mode
- [ ] Conflict resolution for multi-device use

### Advanced Features (Requires API Support)
- [ ] Create/edit jobs from CLI
- [ ] Update job status
- [ ] Add notes to jobs
- [ ] Bulk operations

---

## Questions for Product Direction

These would require coordination with Huntr:

1. **Write API**: Does Huntr expose endpoints to create/edit jobs and activities?
2. **Real-time updates**: Would a webhook API be valuable?
3. **Data access**: Any restrictions on exporting/analyzing user data?
4. **Authentication**: Can service accounts / API tokens be generated instead of browser-based?

---

## Known Limitations

### Current Scope (By Design)
- **Read-only**: All operations are GET. No create/update/delete from CLI.
- **macOS session auth**: Keychain storage only on macOS (env vars work on all platforms)
- **Manual token renewal**: Session cookies rotate every few weeks
- **No real-time**: Pulls data on-demand, no WebSocket support

### To Address
- [ ] Windows/Linux better support (PowerShell, snap packages)
- [ ] Better error recovery (retry logic)
- [ ] Caching for repeated queries
- [ ] Rate limiting awareness

---

## Dependencies to Monitor

| Package | Current | Purpose | Risk |
|---------|---------|---------|------|
| commander | 14.0.3 | CLI framework | ✅ Well-maintained |
| axios | 1.13.5 | HTTP client | ✅ Very stable |
| keytar | 7.9.0 | Keychain access | ⚠️ Native binding, macOS only |
| dotenv | 17.3.1 | Env loading | ✅ Stable |
| @inquirer/prompts | 8.2.1 | Interactive CLI | ✅ Good |

---

## Release Strategy

### Semantic Versioning
- **1.0.x**: Bug fixes, documentation
- **1.1.x**: Minor features (export formats, filtering)
- **1.2.x**: UX improvements (better errors, progress bars)
- **2.0.x**: Major features (dashboards, webhooks, write API)

### Timeline Estimate
- v1.0.0: Feb 2026 (current)
- v1.1.0: March 2026 (testing + export)
- v1.2.0: April 2026 (UX improvements)
- v2.0.0: Q3 2026 (dashboards if write API exists)

---

## Getting Help

- **Issues**: GitHub issues for bugs
- **Feature requests**: GitHub discussions
- **Contribute**: See CONTRIBUTING.md

---

## Checklist for Next Maintainer

When handing off or updating:

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Update this ROADMAP.md
- [ ] Update completions if new commands added
- [ ] Test on macOS, Linux, Windows
- [ ] Verify npm publish works
- [ ] Create GitHub release
- [ ] Update README with new features

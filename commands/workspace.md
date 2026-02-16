---
description: View and manage your workspace - files, projects, and assets
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="workspace">Workspace overview</cmd>

<steps>
1. Read active profile from data/profiles/
2. Read active challenge and plan status
3. List recently modified files in data/
4. List assets from data/profiles/{profileId}/assets/ if exists
5. Show workspace summary with quick commands
</steps>

<output>
Active Profile, Challenge, Plan status
Recent files list
Asset count
Quick commands: /todo, /checkin, /schedule, /streak
</output>

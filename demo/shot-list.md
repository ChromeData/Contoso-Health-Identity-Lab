# Shot list: what Michael says on camera

This is the script for the camera takes of the walkthrough video. The chapter clips are silent and have captions, so you do not talk during them.

- 9 takes for the main intro (about 2 minutes 15 seconds)
- 7 takes, one for each part (15 to 20 seconds each)
- 1 take for the close (about 20 seconds)
- 2 short takes for the 90-second highlight cut

The times are for a speed of about 150 words each minute. Each fact in a line is in the lab's evidence or was read from the tenant on 2026-11-16.

## How to record

1. Record each take as a separate file. If you make a mistake, record only that take again.
2. Give each file the name in the "File" column. Put the files in `~/contoso-demo/camera/`.
3. Open the lab guide (`demo/recording/guide/index.html`) on the screen next to the camera.
4. Right-click the stop that the take is about. Your notes for that stop open at the right.
5. Read the line one time. Look at the camera. Say it in your own words.
6. Keep each take near its time. A take that is 5 seconds longer is not a problem.

You stay on camera for each take. For takes I-3 to I-8, the edit shows the lab guide at that stop while you talk.

## Main intro

| Take | File | On screen in the edit | Say | Time |
|---|---|---|---|---|
| I-1 | `intro-1` | You | Hi, I'm Michael. I'm an identity and privileged access engineer. I build labs for identity, admin access and cloud security. This is my biggest one. It runs the sign-ins and the access for Contoso Health, a made-up hospital with about five thousand staff. It runs in a real Microsoft Entra tenant, and all of it is code. | 0:24 |
| I-2 | `intro-2` | You | The lab proves four things. Access follows HR. Admin power is borrowed, not kept. Misuse gets caught. And an auditor can check all of it. | 0:10 |
| I-3 | `intro-3` | The top of the guide | This guide is the whole lab. Stops one to five show how I built it. Stops six to fifteen show it running, from a hire to a departure. | 0:11 |
| I-4 | `intro-4` | Stop 1, sign-ups | Stop one: the sign-ups. Every piece is a real account. Microsoft Entra ID is the center. It is the work badge that every other app trusts. Around it: OrangeHRM for HR, ServiceNow for the help desk, Azure, AWS and Okta. GitHub holds the code. | 0:18 |
| I-5 | `intro-5` | Stop 2, the pipeline | Stop two: the pipeline. The lab is code, and Terraform makes each real system match it. Every change is a pull request. GitHub runs a plan, the tests and two security scans. Then nothing changes until I approve it. | 0:16 |
| I-6 | `intro-6` | Stop 3, the directory | Stop three: the directory. Hospital PCs still sign in to Active Directory. Cloud Sync copies each account up to Entra. So one person has one sign-in, on the old PCs and in the cloud apps. | 0:14 |
| I-7 | `intro-7` | Stop 4, the people | Stop four: the people. The staff come from HR. Each IT admin also has a separate admin account, so an everyday sign-in never carries admin power. | 0:11 |
| I-8 | `intro-8` | Stop 5, the watchers | Stop five: the watchers. Microsoft Sentinel collects the logs and runs my alarm rules. Fifteen of them run there today. Splunk runs the same rules on the same logs, so the detections move with the hospital, whichever tool it owns. | 0:16 |
| I-9 | `intro-9` | You | Two numbers. When HR ended one nurse's job, Active Directory switched her account off in seven seconds, and Entra in less than three minutes. And ten of the twelve sign-in policies are enforced. Now each piece, working. | 0:15 |

## Part intros

Each take goes before the clips of its part.

| Take | File | Before chapters | Say | Time |
|---|---|---|---|---|
| P-1 | `part-1` | 1 to 6, identity lifecycle | Part one: the identity lifecycle. We follow Sam, a new hire. HR adds him, and nobody in IT types anything. You will see his account in two directories, his access from his job title, a nurse who asks for more, a job change, and the day he leaves. | 0:19 |
| P-2 | `part-2` | 7 and 8, sign-in security | Part two: sign-in security. A password alone must not open a hospital account. You will see the sign-in policies as code. Each one ran in report-only mode before it blocked anyone. Then the two emergency accounts, for the day a bad policy locks out every admin. | 0:19 |
| P-3 | `part-3` | 9 to 12, privileged access | Part three: privileged access. No admin holds admin rights all day. You will see an admin borrow a role for a few hours, the secrets in a vault, a recorded admin session, a hardened Active Directory, and the same rule for AWS and Azure. | 0:17 |
| P-4 | `part-4` | 13 to 15, governance and audit | Part four: governance and audit. Access must not collect through the years. You will see access reviews, access that expires, and combinations that one person cannot hold. Then the robot accounts, each with an owner. And the evidence, in a store that nobody can edit. | 0:18 |
| P-5 | `part-5` | 16 to 18, detect and respond | Part five: detect and respond. When an admin switches on a role, a rule that I wrote as code opens an incident. You will see it in Sentinel and in Splunk. Then a lockout that waits for a person to approve it, because a wrong lockout can stop a nurse at a bedside. | 0:20 |
| P-6 | `part-6` | 19 to 21, platform as code | Part six: the platform as code. Every change goes the same way: a file, a pull request, the checks, my approval, then the build. You will see one change go through, the scanners proven on a bad file, and the whole lab in VS Code and GitHub. | 0:18 |
| P-7 | `part-7` | 22 and 23, migrations | Part seven: migrations. Hospitals buy clinics, and old sign-in systems must go. You will see one app's move off AD FS. It is built and tested, and its cut-over has not run yet. Then a clinic's three apps in Okta, with the first one cut over to Entra. | 0:19 |

## Close

| Take | File | Say | Time |
|---|---|---|---|
| C-1 | `close` | That is the lab. I built it with an AI coding assistant, and the history says so. I set the goals, I made the design decisions, and I own each one. The code, the tests and the evidence are in the repo. Thanks for watching. | 0:18 |

## The 90-second highlight cut

This is a short version for LinkedIn and the top of the repo. It uses two new takes, take I-2, and four clips with their captions.

| Order | What | Source | Time |
|---|---|---|---|
| 1 | Hook, on camera | New take `hook` (below) | 0:10 |
| 2 | The four things | Take I-2 | 0:10 |
| 3 | The leaver: each system closes | Chapter 6 clip, part | 0:15 |
| 4 | Admin rights on a timer | Chapter 9 clip, part | 0:15 |
| 5 | The alarm on an emergency account | Chapter 8 clip, part | 0:12 |
| 6 | The approval before a change | Chapter 19 clip, part | 0:15 |
| 7 | End, on camera | New take `end` (below) | 0:08 |

| Take | File | Say | Time |
|---|---|---|---|
| H-1 | `hook` | I built the identity platform of a hospital as code, in a real Microsoft tenant. Here is what it does, in ninety seconds. | 0:09 |
| H-2 | `end` | The full walkthrough and all the code are in the repo. I'm Michael Williams. | 0:06 |

## After you record

1. Make sure that `~/contoso-demo/camera/` has 19 files: `intro-1` to `intro-9`, `part-1` to `part-7`, `close`, `hook` and `end`.
2. Tell the assistant that the takes are there.

The edit then puts the takes and the 23 clips in sequence, shows the lab guide during takes I-3 to I-8, and makes the highlight cut.

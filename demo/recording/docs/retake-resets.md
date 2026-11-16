# What each retake (T) resets

[Recording cockpit](../README.md) · page 12 of 14


| Piece | Reset |
|---|---|
| 1 The blueprints | It closes the pull request, deletes the branch on GitHub, and undoes the commit, so the change is back to uncommitted in your folder. **Once the pull request is merged, piece 1 can't be retaken.** It is live, and undoing it takes a revert. Record from piece 2 onwards, or revert it by hand first. In a rehearsal it starts a fresh throwaway branch. |
| 2 Hired | It runs `reset-demo-hire.sh 400104 --apply`: Sam leaves HR's list and his on-site account is deleted. It brings the HR folder back in line with GitHub. Then it waits (yellow light) until Cloud Sync has removed the old Sam from Entra, which takes about 20 minutes. Only then can he be hired again. |
| 3, 5, 7, 8, 10 | Nothing to undo. These pieces only show things. |
| 4 First-day doors | It closes Sam's sign-in window. |
| 6 The master key | It closes Ava's window. Ava's admin role stays on until it ends by itself (or deactivate it in My roles). |
| 9 Leaving | Leaving can't be undone by itself. It does the same reset as piece 2 and goes back to piece 2. |

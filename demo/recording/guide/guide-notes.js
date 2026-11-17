// Speaker notes for the lab guide (guide/index.html). They are hidden.
// To see a note: right-click a stop or a piece, or highlight text in it. Esc closes it.
// The clips never show them (the page has no notes when its address has ?video).
// Keys are the same targets that window.__mapFocus takes. Change the text here.
// Style: ASD-STE100 Simplified English, light. Short sentences, active voice.
window.GUIDE_NOTES = {
  // ---------------------------------------------------------------- setup 1
  'setup:1': [
    'These are the six platforms. I signed up for each one by hand.',
    'Entra is the center. Each other platform trusts the Entra sign-in.',
    'Each account is real: a free trial or a developer edition. AWS is pay as you go.',
    'Next: all the other work is code.',
  ],
  'setup:1.1': [
    'OrangeHRM is the HR system. HR adds, moves and removes employees there.',
    'ServiceNow is the IT help desk. Entra makes each person\'s account there.',
    'A nurse asks for access in ServiceNow. Her manager approves, and Entra gives the access.',
    'Next: the HR record goes to Active Directory, then to Entra.',
  ],
  'setup:1.2': [
    'Entra ID is the cloud directory. It is the sign-in that each app trusts.',
    'It holds the people, the groups, the sign-in rules and the admin roles.',
    'Cloud Sync copies each account up from Active Directory on DC01.',
    'Next: AWS, ServiceNow and Okta accept this sign-in.',
  ],
  'setup:1.3': [
    'Azure runs the server DC01, the evidence store and the log store.',
    'Key Vault holds the secrets.',
    'Bastion records an admin session. I make it for a capture, then delete it to save cost.',
    'Intune admin rights for the PC are built as a script. They are not set up yet.',
  ],
  'setup:1.4': [
    'Sentinel runs my alarm rules and opens incidents. Defender shows them.',
    'A person approves a lockout in Teams before the playbook acts.',
    'Splunk runs the same rules on the same records.',
  ],
  'setup:1.5': [
    'AWS trusts the Entra sign-in through IAM Identity Center. Entra makes each AWS user.',
    'An admin gets a server shell through Session Manager after a PIM activation. No SSH key, no open port.',
    'Okta is the sign-in of a clinic that the hospital bought.',
    'The first clinic app now trusts Entra (wave 1 of the move). The other two apps are next.',
  ],
  'setup:1.6': [
    'The lab is code: Terraform and scripts. I edit it in VS Code.',
    'Each change is a GitHub pull request. Tests and two scanners, Checkov and TruffleHog, run on it.',
    'I approve the change. Then GitHub Actions applies it.',
  ],
  // ---------------------------------------------------------------- setup 2
  'setup:2': [
    'Each change is code. It is tested, then a person approves it.',
    'More than 100 changes went through this path.',
    'An auditor can see each change and the person who approved it.',
    'To be plain: the domain controller scripts and 14 early applies ran outside this gate. The change record lists each one.',
  ],
  'setup:2.1': [
    'Each change starts as a pull request.',
    'It shows the change and its Terraform plan.',
    'Next: the checks run.',
  ],
  'setup:2.2': [
    'The checks run on each pull request.',
    'They are tests against a mock tenant and two security scans.',
    'An AI security review also runs. It gives advice only.',
    'They find a broken rule before a person looks.',
  ],
  'setup:2.3': [
    'This is the human gate.',
    'The pipeline opens an issue with the plan. A person types "approve".',
    'Only that word starts the apply.',
  ],
  'setup:2.4': [
    'The apply identity runs Terraform.',
    'Terraform makes the real tenant the same as the code.',
    'The pipeline saves the plan and the result as evidence.',
  ],
  // ---------------------------------------------------------------- setup 3
  'setup:3': [
    'Hospital PCs use Active Directory, the on-site sign-in system.',
    'Cloud Sync copies it to Entra.',
    'One sign-in then works on the old PCs and in the cloud apps.',
  ],
  'setup:3.1': [
    'DC01 is a Windows Server 2022 virtual machine in Azure.',
    'Terraform makes it. A script makes it a domain controller.',
    'It stops each night to save cost.',
  ],
  'setup:3.2': [
    'A tier is a trust zone for admin work.',
    'Tier 0 controls Active Directory. Tier 1 runs servers. Tier 2 is the help desk and the staff PCs.',
    'A deny-logon policy keeps Tier 0 accounts off the lower tiers.',
    'The lower tiers have no computers yet, so today the policy blocks nothing.',
  ],
  'setup:3.3': [
    'The new admins are in Protected Users. That group blocks weaker sign-in methods.',
    'Three older admins are not in it, because the remote path still needs NTLM.',
    'Windows LAPS changes the repair password of DC01 every 30 days.',
  ],
  'setup:3.4': [
    'PingCastle is a free scanner for Active Directory.',
    'The score was 58 before the hardening and 50 after. A lower score is better.',
    '35 checks passed, and normal users can still sign in.',
  ],
  'setup:3.5': [
    'This is the Microsoft agent on DC01. I installed it by hand.',
    'On a schedule, it copies the Workforce and Disabled folders up to Entra.',
    'It also carries a hash of each password, so one password works in both places.',
  ],
  'setup:3.6': [
    'This is the cloud side of the directory.',
    'The synced accounts arrive here.',
    'Here they get sign-in rules, groups and app access.',
  ],
  // ---------------------------------------------------------------- setup 4
  'setup:4': [
    'HR works in OrangeHRM. It stands in for the hospital\'s HR system.',
    'Each hire goes in automatically. No person makes an account by hand.',
    'Access follows HR.',
  ],
  'setup:4.1': [
    'HR hires a worker, changes a job, or ends a job here.',
    'HR gives the employee number. There is no password field.',
    'It stands in for a system such as Workday.',
  ],
  'setup:4.2': [
    'This is Microsoft\'s inbound provisioning app.',
    'A real HR system such as Workday uses the same door.',
    'A connector reads eight fields from OrangeHRM and sends each change to Active Directory.',
  ],
  'setup:4.3': [
    'These are the staff, synced up from Active Directory.',
    'Each person is in the correct department.',
    'In this lab, access by rule covers the nursing jobs.',
  ],
  'setup:4.4': [
    'Three IT staff have a second account for admin work. Its name starts with adm-.',
    'The daily account never holds admin rights.',
  ],
  // ---------------------------------------------------------------- setup 5
  'setup:5': [
    'A SIEM collects logs and runs alarm rules on them.',
    'Sentinel is the Microsoft SIEM. Splunk reads the same records.',
    'I wrote 24 alarm rules. 17 run in Sentinel today.',
    'Misuse is found with either tool.',
  ],
  'setup:5.1': [
    'Sentinel runs on the Azure log store. That store collects each sign-in and each change.',
    'The alarm rules are code, and they run live.',
    'Each new incident goes to Teams and opens a ServiceNow ticket.',
  ],
  'setup:5.2': [
    'Splunk is a second alarm system. It reads the same sign-in and change records.',
    'It runs the same rules, written again in the Splunk search language.',
    'This shows that the detections do not depend on one product.',
  ],
  // ------------------------------------------------------- 6 Source of truth
  'lab:6': [
    'HR adds the employee in OrangeHRM.',
    'In about two minutes, the account is in Active Directory.',
    'Entra gets it on the next sync. There is no ticket.',
  ],
  'tile:HR': [
    'OrangeHRM is the HR system. It stands in for Workday or SAP SuccessFactors.',
    'HR fills the job title, the department and the supervisor. There is no password field.',
    'A connector reads eight fields once a minute. It sends each change to Microsoft\'s HR provisioning API.',
    'Next: the agent on the Windows server makes the account in Active Directory.',
  ],
  'tile:AGENT': [
    'This is a small program on the Windows server.',
    'It gets each HR change and makes or updates the account in Active Directory.',
    'Next: Cloud Sync copies the account to Entra.',
  ],
  // ------------------------------------------------------------- 7 Directory
  'lab:7': [
    'One person has one sign-in, on-site and in the cloud.',
    'Correct a person one time, and the change goes to each system.',
  ],
  'tile:AD': [
    'Active Directory is the on-site sign-in system. Hospital PCs and older systems use it.',
    'Here it runs on one Windows server, DC01.',
    'The account of a leaver moves to the Disabled folder.',
  ],
  'tile:ADCS': [
    'This is the certificate service of the server.',
    'It gives DC01 a certificate, so other systems can connect to the directory with encryption.',
    'Status: built.',
  ],
  'tile:SYNC': [
    'Cloud Sync copies accounts from Active Directory up to Entra on a schedule.',
    'The top admin accounts stay out of the copy on purpose.',
    'Correct an account in Active Directory, not in Entra.',
  ],
  'tile:ENTRA': [
    'Entra is the cloud sign-in system.',
    'It holds your identity, your groups, your apps and your sign-in rules.',
    'It also decides who can become an admin.',
  ],
  'tile:ADTIER': [
    'Tiers 0, 1 and 2 are set on DC01, with a deny-logon policy.',
    'The new admins are in Protected Users. Windows LAPS changes the repair password.',
    'PingCastle score: 58 before, 50 after.',
  ],
  // -------------------------------------------------------- 8 Joiner & mover
  'lab:8': [
    'A nurse gets the nurse apps on day one.',
    'Extra access needs the manager\'s approval, and it expires.',
    'No wait on day one, and no access that collects through the years.',
  ],
  'tile:LCW': [
    'These are lifecycle workflows: one for the first day and one for the last day.',
    'The first-day workflow runs on the hire date. The manager gets a one-time pass for the new employee.',
    'The last-day workflow runs on demand. It disables the account, ends the sessions and removes the access.',
  ],
  'tile:DYNGRP': [
    'These groups fill themselves.',
    'A rule on the HR department makes the All-Nurses group.',
    'No person adds or removes a member by hand.',
  ],
  'tile:BIRTH': [
    'This is the standard access of a job.',
    'The department and the job title decide it.',
    'No request, no approver and no expiry, because it is the job.',
  ],
  'tile:AP': [
    'This is access that the job does not give.',
    'A person asks, a manager approves, and the access expires in six months.',
  ],
  'tile:SOD': [
    'Nine rules name the access that one person must not hold together.',
    'One rule is enforced in the tenant: nursing with pharmacy dispensing.',
    'The other rules cover packages that this lab does not build.',
  ],
  'tile:SNOWREQ': [
    'A nurse asks for app access in ServiceNow, with a reason and an end date.',
    'Her manager approves. ServiceNow then asks Entra, and Entra gives the access.',
    'Three live runs took from 2:27 to 3:33, from open to closed.',
    'Entra refuses a forbidden pair. That ticket goes to the IAM queue.',
    'The proof used a test app. Live grants need my approval of pull request 254.',
  ],
  // ------------------------------------------------------------------ 9 Apps
  'lab:9': [
    'ServiceNow is the IT help desk. AWS is the Amazon cloud. Okta is the sign-in of a clinic that the hospital bought.',
    'All three trust Entra.',
    'One switch stops a person in each app that trusts Entra.',
  ],
  'tile:SSO': [
    'This is the AWS sign-in, set to trust the hospital sign-in.',
    'Staff have no AWS password. Entra makes the AWS account on hire and disables it when the person leaves.',
    'Admins get AWS admin rights through PIM for some hours.',
    'It stands in for clinical apps, such as the health record.',
  ],
  'tile:SNOW': [
    'This is the IT help desk, a free developer instance.',
    'Staff sign in with the hospital sign-in.',
    'Entra makes each account from HR and disables it when the person leaves.',
  ],
  'tile:OKTA': [
    'A clinic that the hospital bought has its own sign-in system, Okta.',
    'Okta trusts Entra. Clinic staff use their own sign-in page, but the hospital rules apply.',
    'A test clinic user signed in through it.',
  ],
  'tile:OKTAMIG': [
    'The clinic has three apps in Okta. I move them to Entra one rule at a time.',
    'A script reads Okta and Entra and makes the tracker. Nobody types the status.',
    'The first app, Clinic Lab Results, is cut over to Entra. The cut-over was timed, and a rollback is ready.',
    'The other two apps are inventoried. They are in wave 2.',
  ],
  'tile:ADFS': [
    'AD FS is the older federation server. Here it runs on DC01 for this test only.',
    'It gave the test app all five claims in five real sign-ins.',
    'Companies move away from AD FS because of the Golden SAML attack.',
    'The Entra side and the cut-over are built. The cut-over has not run.',
  ],
  'tile:SSM': [
    'This is a shell on an AWS server with no SSH key and no open port.',
    'It works only during a PIM activation, and each command is logged.',
    'I removed the server after the test.',
  ],
  'tile:AZROLE': [
    'This role can start and stop the lab servers and read their logs.',
    'It cannot change the network or run commands.',
    'An admin activates it in PIM.',
  ],
  // -------------------------------------------------------- 10 Sign-in rules
  'lab:10': [
    'A password is not sufficient. Each person needs a second check.',
    'The IT admins have passkeys that resist phishing.',
    'A stolen password lets nobody in.',
  ],
  'tile:CABASE': [
    'These are the core sign-in rules.',
    'Each person proves identity with more than a password. Old sign-in methods are blocked.',
    'Each new rule starts in report-only mode. It logs, and it blocks nothing.',
  ],
  'tile:INTUNE': [
    'Admin portals open only from a managed laptop in good condition.',
    'This rule is in a pilot.',
  ],
  'tile:CARISK': [
    'If Microsoft rates the user as high risk, the user must give more proof and change the password.',
    'If the sign-in is risky, Entra blocks it.',
  ],
  'tile:CAPR': [
    'Passkeys are on for each person.',
    'Each admin account of the IT staff has one.',
    'To add a sign-in method, a person needs a one-time pass or a method that resists phishing.',
  ],
  'tile:CASESS': [
    'Admins sign in again every four hours on admin portals.',
    'A stronger check for the top admins is in report-only mode.',
    'A rule for shared PCs is in the code but off. This lab has no shared PCs.',
  ],
  'tile:BG': [
    'Two emergency Global Admin accounts are outside each rule.',
    'They let me correct a bad rule.',
    'Each has its own passkey. Each sign-in raises an alarm, and a drill proved it.',
  ],
  // ---------------------------------------------------- 11 Privileged access
  'lab:11': [
    'No admin keeps admin rights each day, in Entra or in AWS.',
    'An admin activates the rights for some hours, with a reason.',
    'A stolen admin account that holds nothing gets nothing.',
  ],
  'tile:PIM': [
    'PIM is Privileged Identity Management.',
    'An admin activates a role when it is necessary. The admin does not own it.',
    'The top roles need approval and stop after four hours.',
  ],
  'tile:HDAU': [
    'The help desk can reset only the staff accounts that came from HR.',
    'It cannot reset an admin account or an executive account.',
  ],
  'tile:KV': [
    'Azure Key Vault is the locked store for secrets.',
    'An app in Kubernetes reads one secret with no stored password.',
    'Key Vault refuses the next secret with a 403.',
  ],
  'tile:VAULT': [
    'Windows LAPS gives a computer a long random admin password.',
    'It changes the password on a schedule and stores it encrypted.',
    'On DC01, it changes the repair password every 30 days.',
  ],
  'tile:GUAC': [
    'Azure Bastion is a gateway to servers from the browser. The Premium tier records each admin session.',
    'On 7 November, an admin could not open DC01 before she activated PIM.',
    'A second admin played the recording.',
    'I make Bastion for a capture, then delete it. It costs about 45 cents an hour.',
  ],
  'tile:HA': [
    'Intune Endpoint Privilege Management lets a user run one approved app as admin for 24 hours.',
    'The user is not an admin.',
    'Status: built as a script. It is not set up.',
  ],
  'tile:DYN': [
    'Terraform read a password from Key Vault in two ways.',
    'The usual read left the password in three files.',
    'The ephemeral read left it in none.',
  ],
  'tile:CONJUR': [
    'The pipeline signs in with a short-lived token.',
    'It reads its few private settings from Key Vault.',
    'Key Vault logs each read.',
  ],
  'tile:K8S': [
    'An app in Kubernetes reads one secret from Key Vault with no stored password.',
    'Key Vault refuses the secret next to it with a 403.',
    'It stands in for AKS with Entra Workload ID.',
  ],
  // ----------------------------------------------------- 12 Detect & respond
  'lab:12': [
    'Sentinel watches each sign-in and each change. Splunk watches the same records.',
    'The rules are code.',
    'Misuse is found quickly with either tool.',
  ],
  'tile:LA': [
    'This is the log store and the alarm rules.',
    'Sign-in logs and server logs arrive here.',
    'A rule in code raises an alert on a suspicious pattern.',
  ],
  'tile:PB': [
    'Each new incident from my rules goes to the Teams channel of the security team.',
    'It also opens a ServiceNow ticket. No person does this step.',
  ],
  'tile:CONTAIN': [
    'A high identity alert starts the playbook.',
    'A person approves in Teams. Only then does the playbook end the sessions and disable the account.',
    'It never acts on the emergency accounts.',
    'A wrong lockout of a clinician is a patient-safety incident.',
  ],
  'tile:FEED': [
    'The old alarm used vault check-outs.',
    'The new alarm is a logon to DC01 that is not from Bastion, or that has no PIM activation.',
    'Status: designed only.',
  ],
  'tile:SPLUNK': [
    'Splunk is a second alarm system with the same detection rules.',
    'Each rule fired on a replay of test attacks. The failed sign-in alarm fired on live events.',
    'The rules do not depend on one product.',
  ],
  // ---------------------------------------- 13 Leaver + non-human identities
  'lab:13': [
    'HR marks Dana as a leaver, and each system closes.',
    'On-site took 7 seconds. The cloud took 3 minutes. AWS took 9 minutes.',
    'No access after the last day.',
  ],
  'tile:LEAVER': [
    'HR marks the person as a leaver.',
    'A script disables the account, ends the live sessions and removes the app access.',
    'The script times each step.',
  ],
  'tile:NHI': [
    'These are the identities that apps use to connect to other apps.',
    'Each one has an accountable owner. Two named admins own the everyday apps.',
    'The top identities answer to the role of the platform owner.',
    'An inventory examines each one.',
  ],
  'tile:SNOWQ': [
    'The IAM Operations queue in ServiceNow holds the work that automation cannot complete.',
    'Examples: a refused forbidden pair, and a lost-phone ticket for the help desk.',
    'A leaver task removes the extra access with one button.',
    'Live grants and removals need my approval of pull request 254.',
  ],
  // ---------------------------------------------------------------- 14 Proof
  'lab:14': [
    'The evidence goes to a store that nobody can edit.',
    'An auditor can examine it. My word is not necessary.',
  ],
  'tile:REVIEW': [
    'These are regular checks of who still needs access.',
    'Admin access gets a review each quarter. So do clinic accounts with no use for 90 days.',
    'Requested clinical access stops after six months.',
  ],
  'tile:MID': [
    'This is the same review in a tool that is not from Microsoft.',
    'It ran on the mock HR users. Each decision has the name of its reviewer.',
    'Status: ran in the test harness, not in the tenant.',
  ],
  'tile:EVID': [
    'One command collects the proof: exports and logs.',
    'Each file gets a fingerprint, so a change shows.',
    'Each file maps to a SOX or HIPAA control.',
  ],
  'tile:WORM': [
    'The evidence container is write-once.',
    'In the lab, the lock stays in its trial setting, so I can remove the lab.',
    'A hospital locks it permanently.',
  ],
  'tile:KPI': [
    'I took scorecards before and after the build.',
    'Staff under an enforced second check went from none to all.',
    'The Microsoft security score is in the same scorecard.',
  ],
  'tile:DRIFT': [
    'Each night, a read-only check compares the live setup with the code.',
    'If there is a difference, it opens an issue.',
  ],
  'tile:OPMODEL': [
    'This says who decides what, which meeting occurs when, and what goes to the CISO and the board.',
    'Status: designed only.',
  ],
  // ------------------------------------------------------------- 15 Delivery
  'delivery': [
    'All of it ships as reviewed code.',
    'The apply signs in with a one-time token. No password is stored.',
    'Four checks keep the code honest: the scanner self-test, the Kubernetes role checker, the built-but-off check, and Key Vault for the pipeline settings.',
  ],
};

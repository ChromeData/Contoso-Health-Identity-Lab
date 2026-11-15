// The stops and pieces of the Contoso lab guide (guide/index.html).
// Setup stops 1 to 5, lab stops 6 to 14, delivery 15. Change the text here.
window.GUIDE = {
 "setup": [
  {
   "n": 1,
   "title": "Sign-ups",
   "goal": "Six head pieces, signed up by hand",
   "tiles": [
    {
     "num": "1.1",
     "name": "OrangeHRM → ServiceNow",
     "what": "HR hires; everything after is automatic",
     "how": "By hand"
    },
    {
     "num": "1.2",
     "name": "Microsoft Entra ID",
     "what": "The master list of people and logins",
     "how": "By hand"
    },
    {
     "num": "1.3",
     "name": "Azure and Intune",
     "what": "The cloud and the managed PC",
     "how": "By hand"
    },
    {
     "num": "1.4",
     "name": "Sentinel, Defender + Splunk",
     "what": "The alarm system",
     "how": "By hand"
    },
    {
     "num": "1.5",
     "name": "AWS and Okta",
     "what": "The outside doors that trust Entra",
     "how": "By hand"
    },
    {
     "num": "1.6",
     "name": "GitHub, Terraform + VS Code",
     "what": "The lab, written as code",
     "how": "By hand"
    }
   ]
  },
  {
   "n": 2,
   "title": "The pipeline",
   "goal": "More than 100 reviewed changes",
   "tiles": [
    {
     "num": "2.1",
     "name": "Pull request",
     "what": "A change, its plan and an AI review",
     "how": "As code"
    },
    {
     "num": "2.2",
     "name": "Checks",
     "what": "Automatic, on every change",
     "how": "As code"
    },
    {
     "num": "2.3",
     "name": "Approve",
     "what": "A person types it",
     "how": "By hand"
    },
    {
     "num": "2.4",
     "name": "Terraform apply",
     "what": "Makes the tenant match",
     "how": "As code"
    }
   ]
  },
  {
   "n": 3,
   "title": "The directory",
   "goal": "DC01 + Cloud Sync",
   "tiles": [
    {
     "num": "3.1",
     "name": "DC01",
     "what": "Active Directory: where hospital PCs log in",
     "how": "As code"
    },
    {
     "num": "3.2",
     "name": "Admin tiers",
     "what": "Tier 0 · 1 · 2, a deny-logon policy",
     "how": "As code"
    },
    {
     "num": "3.3",
     "name": "Protected Users + LAPS",
     "what": "New admins; repair password rotates",
     "how": "As code"
    },
    {
     "num": "3.4",
     "name": "PingCastle",
     "what": "58 before → 50 after",
     "how": "As code"
    },
    {
     "num": "3.5",
     "name": "Cloud Sync agent",
     "what": "One light agent: copies AD up, and carries HR's hires in",
     "how": "By hand"
    },
    {
     "num": "3.6",
     "name": "Entra ID",
     "what": "The cloud directory",
     "how": "As code"
    }
   ]
  },
  {
   "n": 4,
   "title": "The people",
   "goal": "13 staff, 3 admins",
   "tiles": [
    {
     "num": "4.1",
     "name": "OrangeHRM",
     "what": "The open-source HR system",
     "how": "By hand"
    },
    {
     "num": "4.2",
     "name": "HR front door",
     "what": "Inbound provisioning app",
     "how": "As code"
    },
    {
     "num": "4.3",
     "name": "People in Entra",
     "what": "Synced up from AD",
     "how": "As code"
    },
    {
     "num": "4.4",
     "name": "Admin accounts",
     "what": "3 separate logins",
     "how": "As code"
    }
   ]
  },
  {
   "n": 5,
   "title": "The watchers",
   "goal": "Sentinel and Splunk",
   "tiles": [
    {
     "num": "5.1",
     "name": "Microsoft Sentinel",
     "what": "The alarm system, in Azure",
     "how": "As code"
    },
    {
     "num": "5.2",
     "name": "Splunk",
     "what": "Watches the same records",
     "how": "As code"
    }
   ]
  }
 ],
 "lab": [
  {
   "n": 6,
   "id": "source",
   "title": "Source of truth",
   "goal": "HR owns who works here",
   "purpose": "Everything starts with HR, the official list of who works here. In the lab, OrangeHRM, a real open-source HR system, plays the hospital's HR system: HR adds the employee, fills the Job tab and sets the manager.",
   "tiles": [
    {
     "id": "HR",
     "num": "6.1",
     "name": "OrangeHRM",
     "what": "OrangeHRM, the open-source HR system (5.9), running on the presenter's Mac, plays the hospital's HR system.",
     "status": "RAN · tenant",
     "standin": "Workday or SAP SuccessFactors"
    },
    {
     "id": "AGENT",
     "num": "6.2",
     "name": "HR to AD agent",
     "what": "A small program on the Windows server that picks up each HR change and creates or updates the account in Active Directory.",
     "status": "RAN · tenant",
     "standin": null
    }
   ]
  },
  {
   "n": 7,
   "id": "directory",
   "title": "Directory",
   "goal": "AD is the master, Entra is the hub",
   "purpose": "Two directories kept in step. Active Directory on the Windows server is what the hospital's PCs and older systems check logins against.",
   "tiles": [
    {
     "id": "AD",
     "num": "7.1",
     "name": "Active Directory",
     "what": "Active Directory: the on-site login system that hospital PCs and older systems check against.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "ADCS",
     "num": "7.2",
     "name": "Certificates (AD CS)",
     "what": "The server's certificate service. It issues DC01 a certificate so other systems, like the password vault, can talk to the directory over an encrypted connection.",
     "status": "BUILT",
     "standin": null
    },
    {
     "id": "SYNC",
     "num": "7.3",
     "name": "Cloud Sync (AD to Entra)",
     "what": "Copies accounts from the on-site directory up to Entra on a schedule. The most powerful admin accounts are kept out of the copy on purpose.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "ENTRA",
     "num": "7.4",
     "name": "Entra (cloud login)",
     "what": "The cloud login system. It holds who you are, which groups you are in, which apps you may open, how you must prove it is you, and who may become an admin.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "ADTIER",
     "num": "7.5",
     "name": "Admin tiers + LAPS",
     "what": "Tier 0, 1 and 2 on DC01; a deny-logon policy ready for the first server; Protected Users for the new admins; Windows LAPS rotates the repair password.",
     "status": "RAN · tenant",
     "standin": null
    }
   ]
  },
  {
   "n": 8,
   "id": "joiner",
   "title": "Joiner & mover",
   "goal": "Access follows HR",
   "purpose": "What a new hire gets on day one, and how extras are requested. Standard access comes from the job: a nurse gets nurse systems automatically.",
   "tiles": [
    {
     "id": "LCW",
     "num": "8.1",
     "name": "First-day, last-day tasks",
     "what": "First-day and last-day checklists. The first-day one runs on its own on the hire date, and the manager gets a one-time pass to hand the new hire.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "DYNGRP",
     "num": "8.2",
     "name": "Self-filling groups",
     "what": "Groups that fill themselves. All-Nurses is built from a rule on the HR department, so nobody adds or removes members by hand.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "BIRTH",
     "num": "8.3",
     "name": "Standard access by job",
     "what": "The standard access a job comes with. Department plus title decides it.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "AP",
     "num": "8.4",
     "name": "Requested extras",
     "what": "Extras beyond the job. Someone requests, a manager approves, it expires in six months.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "SOD",
     "num": "8.5",
     "name": "Blocked combinations",
     "what": "Combinations one person must never hold, written as nine rules. One is enforced in the tenant today: nursing and pharmacy dispensing can't be held together.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "SNOWREQ",
     "num": "8.6",
     "name": "Ask in ServiceNow",
     "what": "A nurse asks for app access in ServiceNow (Sofia, ICU float cover, with a reason and an end date).",
     "status": "RAN · tenant",
     "standin": null
    }
   ]
  },
  {
   "n": 9,
   "id": "apps",
   "title": "Apps",
   "goal": "One front desk",
   "purpose": "The places staff actually go after they sign in. AWS: Amazon's cloud, where hospitals run their own apps.",
   "tiles": [
    {
     "id": "SSO",
     "num": "9.1",
     "name": "AWS login door",
     "what": "AWS's own login door, set to trust the hospital login. Staff sign in with their hospital account and have no separate AWS password.",
     "status": "RAN · tenant",
     "standin": "clinical apps, such as the health record"
    },
    {
     "id": "SNOW",
     "num": "9.2",
     "name": "Help desk (ServiceNow)",
     "what": "The IT help desk, a free developer copy. Staff sign in with their hospital login, and Entra creates their account there from HR and switches it off when they leave.",
     "status": "RAN · tenant",
     "standin": "production ServiceNow (here a developer instance)"
    },
    {
     "id": "OKTA",
     "num": "9.3",
     "name": "Partner clinic (Okta)",
     "what": "A partner clinic the hospital bought, which already has its own login system.",
     "status": "RAN · tenant",
     "standin": "the clinic's enterprise Okta (here Integrator Free)"
    },
    {
     "id": "OKTAMIG",
     "num": "9.4",
     "name": "Okta apps to Entra",
     "what": "The clinic's three Okta apps, moved to Entra rule by rule. The estate and the before sign-in ran (24 s); the cut-over and rollback are built, not run.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "ADFS",
     "num": "9.5",
     "name": "App off AD FS",
     "what": "AD FS on DC01 (this exercise only) gave the test app all five claims in five real sign-ins.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "SSM",
     "num": "9.6",
     "name": "Server shell (Session Manager)",
     "what": "A shell on an AWS server with no SSH key and no open port, only during a PIM activation; every command logged.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "AZROLE",
     "num": "9.7",
     "name": "Azure VM operator role",
     "what": "Start, stop and read logs on the lab servers; cannot change the network or run commands.",
     "status": "RAN · tenant",
     "standin": null
    }
   ]
  },
  {
   "n": 10,
   "id": "signin",
   "title": "Sign-in rules",
   "goal": "No lockout",
   "purpose": "The checks at the door, every time someone signs in. Where you are, what device, how risky this looks, and whether you proved it is you with more than a password.",
   "tiles": [
    {
     "id": "CABASE",
     "num": "10.1",
     "name": "Core sign-in rules",
     "what": "The core sign-in rules: everyone proves it is them with more than a password, and old insecure sign-in methods are blocked.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "INTUNE",
     "num": "10.2",
     "name": "Healthy-device rule",
     "what": "Admin portals only open from a managed, healthy laptop. In a pilot here.",
     "status": "RAN · tenant",
     "standin": "the corporate laptop (here an Azure VM)"
    },
    {
     "id": "CARISK",
     "num": "10.3",
     "name": "Risky sign-in rules",
     "what": "If Microsoft rates the user as high risk: extra proof and a password change.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "CAPR",
     "num": "10.4",
     "name": "Passkeys",
     "what": "Passkeys are switched on for everyone, and each IT staff member's separate admin login has one.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "CASESS",
     "num": "10.5",
     "name": "Session time limits",
     "what": "Admins sign in again every four hours on admin portals. A step-up for the most powerful admins is in its watching stage, like every new rule.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "BG",
     "num": "10.6",
     "name": "Emergency accounts",
     "what": "Two emergency Global Admin accounts that sit outside every rule, so a bad rule can always be undone.",
     "status": "RAN · tenant",
     "standin": null
    }
   ]
  },
  {
   "n": 11,
   "id": "privileged",
   "title": "Privileged access",
   "goal": "No standing privilege, either plane",
   "purpose": "No admin keeps power day to day. Admins borrow it through PIM, say why, get it for a few hours, and it switches off again.",
   "tiles": [
    {
     "id": "PIM",
     "num": "11.1",
     "name": "Timed admin rights (PIM)",
     "what": "Admin rights are something you switch on, not something you own. The most powerful ones need approval and last four hours.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "HDAU",
     "num": "11.2",
     "name": "Help-desk limits",
     "what": "Help-desk staff can reset only staff accounts that came from HR, and never an admin's or an executive's.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "KV",
     "num": "11.3",
     "name": "Secrets vault",
     "what": "Azure Key Vault: the locked store for secrets. An app in Kubernetes reads one with no stored password and is refused the next (403).",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "VAULT",
     "num": "11.4",
     "name": "Windows LAPS",
     "what": "Windows LAPS gives a computer a long random admin password, changes it on a schedule and stores it encrypted.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "GUAC",
     "num": "11.5",
     "name": "Recorded sessions (Bastion)",
     "what": "Azure Bastion: a gateway into servers from the browser. With Premium it records each admin session for replay.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "HA",
     "num": "11.6",
     "name": "Intune EPM",
     "what": "Intune Endpoint Privilege Management: a user runs one approved app as admin, for 24 hours, without being an admin.",
     "status": "BUILT",
     "standin": null
    },
    {
     "id": "DYN",
     "num": "11.7",
     "name": "Leak test (ephemeral read)",
     "what": "Terraform read a password from Key Vault two ways. The usual read left it in three of its files; the ephemeral read, used and never kept, in none.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "CONJUR",
     "num": "11.8",
     "name": "Pipeline secrets (Key Vault)",
     "what": "The pipeline signs in with a short-lived token and reads its few private settings from Key Vault; every read is logged.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "K8S",
     "num": "11.9",
     "name": "Container secrets (Key Vault)",
     "what": "An app in Kubernetes reads one secret from Key Vault with no stored password, and is refused the secret next to it (403).",
     "status": "RAN · tenant",
     "standin": "AKS with Entra Workload ID"
    }
   ]
  },
  {
   "n": 12,
   "id": "detect",
   "title": "Detect & respond",
   "goal": "Contained in minutes",
   "purpose": "The alarm system. Sign-in and change records flow into one place, and rules written as code spot trouble such as a sign-in from a blocked country.",
   "tiles": [
    {
     "id": "LA",
     "num": "12.1",
     "name": "Alarm system (Sentinel)",
     "what": "The log store plus the alarm rules. Sign-in and server logs land here, and rules written as code raise an alert on suspicious patterns.",
     "status": "RAN · tenant",
     "standin": "production Sentinel (here a trial) and Defender for Identity's detections"
    },
    {
     "id": "PB",
     "num": "12.2",
     "name": "Alert to Teams + ticket",
     "what": "Each new incident from the lab's own rules is posted to the security team's Teams channel and opened as a ServiceNow ticket, automatically.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "CONTAIN",
     "num": "12.3",
     "name": "Lockout with approval",
     "what": "High identity alerts start it on their own. A person approves in Teams; only then are sessions cut and the account disabled or flagged.",
     "status": "RAN · tenant",
     "standin": "Defender for Identity's AD disable (a script)"
    },
    {
     "id": "FEED",
     "num": "12.4",
     "name": "DC logon alarm (rework)",
     "what": "The old alarm used vault check-outs. Its replacement, a DC logon that is not from Bastion or has no PIM activation, is designed only.",
     "status": "DESIGNED",
     "standin": null
    },
    {
     "id": "SPLUNK",
     "num": "12.5",
     "name": "Second alarm system",
     "what": "A second alarm system running the very same detection rules, to show they aren't tied to one product.",
     "status": "RAN · tenant",
     "standin": null
    }
   ]
  },
  {
   "n": 13,
   "id": "leaver",
   "title": "Leaver + non-human identities",
   "goal": "No way back in, timed",
   "purpose": "When someone leaves, HR flips one field and everything closes: account off, sessions cut, app access gone, each step timed. Any robot account left without an owner is flagged by the inventory.",
   "tiles": [
    {
     "id": "LEAVER",
     "num": "13.1",
     "name": "Leaver shutdown",
     "what": "HR marks the person as left. A script then disables the account, cuts live sessions and removes app access, timing each step.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "NHI",
     "num": "13.2",
     "name": "Robot accounts",
     "what": "Robot accounts: the identities apps use to talk to each other.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "SNOWQ",
     "num": "13.3",
     "name": "IAM queue + leaver",
     "what": "The IAM Operations queue in ServiceNow holds what automation cannot finish: the forbidden-pair refusal, with Entra's reason, and a lost-phone sign-in ticket for the help desk.",
     "status": "RAN · tenant",
     "standin": null
    }
   ]
  },
  {
   "n": 14,
   "id": "proof",
   "title": "Proof",
   "goal": "Proof on demand, measured",
   "purpose": "Showing an auditor it works, on demand. Regular reviews of who has what, an evidence binder where every page is fingerprinted and stored where nobody can edit it, and a nightly check that nothing has drifted from the approved setup.",
   "tiles": [
    {
     "id": "REVIEW",
     "num": "14.1",
     "name": "Who-has-what reviews",
     "what": "Regular checks of who still needs what. Admin access is reviewed every quarter, and so are the clinic's accounts nobody has used for 90 days.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "MID",
     "num": "14.2",
     "name": "Reviews beyond Entra",
     "what": "The same review run in a non-Microsoft tool over the mock HR users, each decision recorded as its reviewer.",
     "status": "RAN · harness",
     "standin": "SailPoint IdentityNow or Saviynt"
    },
    {
     "id": "EVID",
     "num": "14.3",
     "name": "Evidence binder",
     "what": "One command collects the proof: exports and logs, each fingerprinted so tampering would show, filed against the SOX and HIPAA controls they satisfy.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "WORM",
     "num": "14.4",
     "name": "Write-once store (trial lock)",
     "what": "The evidence container is set to write-once. In the lab its lock stays in the trial (unlocked) setting so the lab can be torn down; a hospital locks it for good.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "KPI",
     "num": "14.5",
     "name": "Scorecards, before and after",
     "what": "Scorecards taken before and after the build, so improvement is measured, not claimed: staff under an enforced second-check rule went from none to all.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "DRIFT",
     "num": "14.6",
     "name": "Nightly drift check",
     "what": "A nightly read-only check: read the live setup, compare it to the approved one in code, and open an issue if anything differs.",
     "status": "RAN · tenant",
     "standin": null
    },
    {
     "id": "OPMODEL",
     "num": "14.7",
     "name": "Who decides what",
     "what": "Who decides what, which meeting happens when, the service levels, and what gets reported to the CISO and the board.",
     "status": "DESIGNED",
     "standin": null
    }
   ]
  }
 ],
 "delivery": {
  "n": 15,
  "title": "Delivery",
  "goal": "Reviewed change, no stored key",
  "purpose": "Every change is code, reviewed like a building permit, and applied with a one-time pass instead of a stored password. Four checks keep the code honest.",
  "steps": [
   "Pull request checks",
   "Reviewer gate",
   "OIDC sign-in",
   "Terraform apply",
   "Scanner self-test (fail on bad, pass on clean)",
   "Kubernetes role checker",
   "Built, switched off (policy, audit trail, 2 alarms)",
   "Pipeline settings from Key Vault, every read logged"
  ]
 }
};

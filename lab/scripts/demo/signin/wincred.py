"""wincred.py - the lab's secret store on Windows (Windows Credential Manager).

The Mac keeps each lab secret as a login Keychain item (service + account).
On Windows the same secret is a generic credential named
    contoso-lab:<service>:<account>
(the names the transfer tool writes). This file is the Windows stand-in for
the three `security` calls the sign-in tools make. Standard library only.

    python -I wincred.py read   SERVICE [ACCOUNT]    the secret on STDOUT
    python -I wincred.py write  SERVICE ACCOUNT      the secret on STDIN
    python -I wincred.py delete SERVICE [ACCOUNT]

Exit 44 = no such item (the same code `security` gives), so "not there" and
"could not read" stay different answers. A secret is never an argument and
never goes to STDERR. One credential holds at most 2560 bytes: a longer
secret is stored in parts.
"""
import ctypes
import ctypes.wintypes as wt
import sys

TARGET = "contoso-lab:%s:%s"
NOT_FOUND = 44
ERROR_NOT_FOUND = 1168


class CREDENTIAL(ctypes.Structure):
    _fields_ = [("Flags", wt.DWORD), ("Type", wt.DWORD), ("TargetName", wt.LPWSTR), ("Comment", wt.LPWSTR),
                ("LastWritten", wt.FILETIME), ("CredentialBlobSize", wt.DWORD), ("CredentialBlob", ctypes.POINTER(ctypes.c_ubyte)),
                ("Persist", wt.DWORD), ("AttributeCount", wt.DWORD), ("Attributes", ctypes.c_void_p),
                ("TargetAlias", wt.LPWSTR), ("UserName", wt.LPWSTR)]


def api():
    a = ctypes.WinDLL("advapi32", use_last_error=True)
    a.CredWriteW.argtypes = [ctypes.POINTER(CREDENTIAL), wt.DWORD]
    a.CredWriteW.restype = wt.BOOL
    a.CredReadW.argtypes = [wt.LPCWSTR, wt.DWORD, wt.DWORD, ctypes.POINTER(ctypes.POINTER(CREDENTIAL))]
    a.CredReadW.restype = wt.BOOL
    a.CredDeleteW.argtypes = [wt.LPCWSTR, wt.DWORD, wt.DWORD]
    a.CredDeleteW.restype = wt.BOOL
    a.CredEnumerateW.argtypes = [wt.LPCWSTR, wt.DWORD, ctypes.POINTER(wt.DWORD), ctypes.POINTER(ctypes.POINTER(ctypes.POINTER(CREDENTIAL)))]
    a.CredEnumerateW.restype = wt.BOOL
    a.CredFree.argtypes = [ctypes.c_void_p]
    return a


A = api()


def fail(what):
    sys.stderr.write("wincred: %s (Windows error %d)\n" % (what, ctypes.get_last_error()))
    sys.exit(1)


def targets(service, account):
    """The credential names for this service: one when the account is given, else every account's."""
    if account:
        return [TARGET % (service, account)]
    n, arr = wt.DWORD(), ctypes.POINTER(ctypes.POINTER(CREDENTIAL))()
    if not A.CredEnumerateW(TARGET % (service, "*"), 0, ctypes.byref(n), ctypes.byref(arr)):
        if ctypes.get_last_error() == ERROR_NOT_FOUND:
            return []
        fail("could not list the items of %s" % service)
    try:
        names = [arr[i].contents.TargetName for i in range(n.value)]
    finally:
        A.CredFree(arr)
    return sorted(t for t in names if ":part" not in t[len(TARGET % (service, "")):])


def blob(target):
    p = ctypes.POINTER(CREDENTIAL)()
    if not A.CredReadW(target, 1, 0, ctypes.byref(p)):
        if ctypes.get_last_error() == ERROR_NOT_FOUND:
            return None
        fail("could not read an item")
    try:
        return bytes(p.contents.CredentialBlob[:p.contents.CredentialBlobSize])
    finally:
        A.CredFree(p)


def read(service, account):
    found = targets(service, account)
    v = blob(found[0]) if found else None
    if v is None:
        sys.exit(NOT_FOUND)
    if v.startswith(b"@parts:"):
        v = b"".join(blob("%s:part%d" % (found[0], k)) or b"" for k in range(int(v[7:])))
    sys.stdout.buffer.write(v)


def put(target, account, data):
    buf = (ctypes.c_ubyte * len(data)).from_buffer_copy(data)
    c = CREDENTIAL(Type=1, TargetName=target, CredentialBlobSize=len(data), CredentialBlob=buf, Persist=2,
                   UserName=account or "contoso-lab", Comment="Contoso Health lab secret")
    if not A.CredWriteW(ctypes.byref(c), 0):
        fail("could not write an item")


def parts_of(target):
    v = blob(target)
    return int(v[7:]) if v is not None and v.startswith(b"@parts:") else 0


def write(service, account):
    data = sys.stdin.buffer.read()
    if data.endswith(b"\n"):
        data = data[:-1]
    if not data:
        sys.stderr.write("wincred: no secret on STDIN\n")
        sys.exit(1)
    target = TARGET % (service, account)
    old = parts_of(target)
    chunks = [data[i:i + 2400] for i in range(0, len(data), 2400)] if len(data) > 2560 else []
    for k, chunk in enumerate(chunks):
        put("%s:part%d" % (target, k), account, chunk)
    put(target, account, b"@parts:%d" % len(chunks) if chunks else data)
    for k in range(len(chunks), old):                     # parts a shorter secret no longer uses
        A.CredDeleteW("%s:part%d" % (target, k), 1, 0)


def delete(service, account):
    found = targets(service, account)
    if not found:
        sys.exit(NOT_FOUND)
    for target in found:
        for k in range(parts_of(target)):
            A.CredDeleteW("%s:part%d" % (target, k), 1, 0)
        if not A.CredDeleteW(target, 1, 0) and ctypes.get_last_error() != ERROR_NOT_FOUND:
            fail("could not delete an item")


def main(argv):
    if len(argv) < 3 or argv[1] not in ("read", "write", "delete") or (argv[1] == "write" and len(argv) < 4):
        sys.stderr.write(__doc__)
        sys.exit(2)
    service, account = argv[2], argv[3] if len(argv) > 3 else ""
    {"read": read, "write": write, "delete": delete}[argv[1]](service, account)


if __name__ == "__main__":
    main(sys.argv)

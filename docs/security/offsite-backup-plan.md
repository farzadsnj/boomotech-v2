# Encrypted off-site backup plan

Date: 11 October 2026
Status: planning only. Same-host backups are not complete disaster recovery. **OWNER APPROVAL REQUIRED** before data is copied to any new destination.

The existing nightly process creates a PostgreSQL custom-format dump and approved configuration archive, validates them, restricts them to root mode `0600`, and rotates 7 daily, 4 weekly and 3 monthly copies. It does not encrypt a separate off-site copy.

| Option | Typical cost | Security model | Restore complexity | Credential custody |
|---|---|---|---|---|
| Encrypted object storage with versioning/immutability | Low recurring storage and egress | Client-side encryption before upload; dedicated write-only upload identity; object lock protects against host compromise | Download, verify checksum, decrypt in protected directory, run existing restore test | Encryption key in an offline/password-manager backed owner process; storage credential separate from server admin |
| Encrypted second server | Higher fixed monthly cost | Encrypted transfer to a restricted backup account, network allowlist and separate administrative credential | Moderate; server availability and patching must also be maintained | Separate SSH/storage credential and encryption key; no reuse of production host keys |
| Encrypted offline removable storage | Device purchase and operator time | Offline media limits online compromise; encryption required; physical custody becomes critical | Highest manual effort and slowest recovery | Owner-held recovery key, two documented custodians, secure physical storage |

Recommended first option: client-side encrypted object storage in an Australian region where commercially and operationally suitable, with versioning/immutability, a monthly restore rehearsal and a second offline copy of the encryption recovery material. Provider, region, budget, retention, key custody, deletion propagation and recovery objectives must be approved first.

## Acceptance test

1. create the normal backup without exposing environment values;
2. encrypt it locally with an owner-controlled key and verify a checksum;
3. upload with a credential that cannot read or delete existing backups where provider support permits;
4. retrieve a selected copy into an isolated host;
5. verify checksum and decrypt under restricted permissions;
6. run `restore-boomotech.sh` into its generated test database;
7. record time-to-restore and securely remove the test copy;
8. repeat monthly and after database upgrades.

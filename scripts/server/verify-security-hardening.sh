#!/usr/bin/env bash
set -uo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
printf 'Verifying the applied BoomoTech hardening baseline.\n'
printf 'Warnings require operator review; critical findings block verification.\n\n'
exec "$script_dir/security-audit.sh"

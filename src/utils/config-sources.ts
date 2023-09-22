export function stripCommit(version: string): string {
  if (version === 'latest') {
    return version
  }

  // If the version contains commit ==> hash remove it
  return version.replace('-stateful', '').replace(/-[0-9a-fA-F]{8}$/, '')
}

export const GROUP_PERMISSIONS = {
  kookploeg: { bills: true, contracts: false, kassa: false },
  vzw: { bills: true, contracts: true, kassa: false },
  leiding: { bills: true, contracts: true, kassa: true },
} as const;

export function canCreateContract(post: string | null | undefined): boolean {
  if (!post) return false;
  return GROUP_PERMISSIONS[post as keyof typeof GROUP_PERMISSIONS]?.contracts ?? false;
}

export function canCreateKassa(post: string | null | undefined): boolean {
  if (!post) return false;
  return GROUP_PERMISSIONS[post as keyof typeof GROUP_PERMISSIONS]?.kassa ?? false;
}

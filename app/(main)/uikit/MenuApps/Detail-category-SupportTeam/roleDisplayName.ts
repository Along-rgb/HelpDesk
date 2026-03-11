/**
 * แปลงชื่อ role (จาก API) เป็นລາວ ສຳລັບສະແດງຜົນໃນ Tab ທີມສະໜັບສະໜູນ / ວິຊາການ / ສະຖານະ / ພະນັກງານ
 * role 1 (SuperAdmin) = ແບບເດີມ, role 2 (Admin) = ແອດມິນ, role 3 (Staff) = ຊ່າງ/ວິຊາການ, role 4 (User) = ຜູ້ໃຊ້ງານ
 */
export function getRoleDisplayNameLao(
  roleId: number | string | null | undefined,
  roleName: string | null | undefined
): string {
  const id = roleId != null ? Number(roleId) : null;
  const name = (roleName ?? '').trim();
  const nameLower = name.toLowerCase();
  if (id === 2 || nameLower === 'admin') return 'ແອດມິນ';
  if (id === 3 || nameLower === 'staff') return 'ຊ່າງ/ວິຊາການ';
  if (id === 4 || nameLower === 'user') return 'ຜູ້ໃຊ້ງານ';
  if (id === 1 || nameLower === 'superadmin') return name || 'SuperAdmin';
  return name || '-';
}

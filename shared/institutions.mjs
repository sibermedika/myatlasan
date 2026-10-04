export const GENERAL = 'General';
export const DEFAULT_INSTITUTIONS = [GENERAL, 'Universitas Indonesia', 'Universitas Gadjah Mada', 'Institut Teknologi Bandung'];
export function institutionName(value) {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g,' ') : '';
  const key = name.toLowerCase();
  if (!key || ['general','institusi mandiri','koleksi mandiri / terbuka','kurikulum paai','kurikulum paai / konsorsium','fakultas kedokteran (institusi mandiri)'].includes(key)) return GENERAL;
  if (['ui','universitas indonesia','universitas indonesia (fk ui)'].includes(key)) return 'Universitas Indonesia';
  if (['ugm','universitas gadjah mada','universitas gadjah mada (fk-kmk ugm)'].includes(key)) return 'Universitas Gadjah Mada';
  if (['itb','institut teknologi bandung'].includes(key)) return 'Institut Teknologi Bandung';
  return name;
}
export const generalAdmin = user => !!user && ['ADMIN','SUPERADMIN'].includes(user.role) && institutionName(user.institution) === GENERAL;
export const institutionAdmin = user => !!user && user.role === 'ADMIN_INSTITUSI' && institutionName(user.institution) !== GENERAL;
export const sameInstitution = (a,b) => institutionName(a?.institution).toLowerCase() === institutionName(b?.institution).toLowerCase();
export const editOrgan = (user,organ) => !!user && (generalAdmin(user) || (institutionAdmin(user) && sameInstitution(user,organ)) || (user.role === 'DOSEN' && organ.ownerId === user.id && sameInstitution(user,organ)));
export const readOrgan = (user,organ) => generalAdmin(user) || ((institutionName(organ.institution) === GENERAL || (!!user && sameInstitution(user,organ))) && (organ.status === 'draft' ? editOrgan(user,organ) : (!!user && user.role !== 'GUEST') || organ.isFree));

// Site-level data (one instance). Public links only: no phone, no email.
export const profile = {
  firstName: 'Łukasz',
  lastName: 'Datkowski',
  hybrid: ['Frontend developer', 'UX designer', 'Design systems'],
  statement: 'I design interfaces with type and build them with code. I work where frontend, UX, and design systems meet.',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/lukasz-datkowski/' },
    { label: 'GitHub', href: 'https://github.com/usqr' },
  ],
  languages: [
    { name: 'Polish', level: 'Native' },
    { name: 'English', level: 'C2' },
  ],
} as const;

export const fullName = `${profile.firstName} ${profile.lastName}`;

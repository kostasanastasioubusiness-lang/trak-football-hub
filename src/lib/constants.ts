export const EUROPEAN_COUNTRIES = [
  "Albania", "Andorra", "Armenia", "Austria", "Azerbaijan", "Belarus", "Belgium",
  "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
  "Denmark", "England", "Estonia", "Finland", "France", "Georgia", "Germany",
  "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kazakhstan", "Kosovo",
  "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova",
  "Monaco", "Montenegro", "Netherlands", "North Macedonia", "Northern Ireland",
  "Norway", "Poland", "Portugal", "Romania", "Russia", "San Marino", "Scotland",
  "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Turkey",
  "Ukraine", "Wales"
];

export const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Attacker"] as const;
export const AGE_GROUPS = ["U13", "U14", "U15", "U16", "U17", "U18", "U19+"] as const;
export const COACH_ROLES = ["Head Coach", "Assistant Coach", "Academy Coach", "Fitness Coach"] as const;

export const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
export const YEARS = Array.from({ length: 20 }, (_, i) => String(new Date().getFullYear() - 10 - i));

import { SocialCategory } from '@/types/study';

export interface EligibilityResult {
  isValidDob: boolean;
  ageYears: number;
  ageMonths: number;
  ageFormatted: string;
  ageOnCutoffYears: number;
  ageOnCutoffMonths: number;
  cutoffDateStr: string;
  isEligible: boolean;
  status: 'eligible' | 'underage' | 'overage' | 'invalid';
  message: string;
  maxAge: number;
  attemptsAllowed: string;
  category: SocialCategory;
}

export function getMaxAgeForCategory(category: SocialCategory): number {
  switch (category) {
    case 'OBC':
      return 35;
    case 'SC':
    case 'ST':
      return 37;
    case 'General':
    case 'EWS':
    default:
      return 32;
  }
}

export function getMaxAttemptsForCategory(category: SocialCategory): string {
  switch (category) {
    case 'OBC':
      return '9 Attempts';
    case 'SC':
    case 'ST':
      return 'Unlimited (till age limit)';
    case 'General':
    case 'EWS':
    default:
      return '6 Attempts';
  }
}

/**
 * Calculates current age and UPSC CSE eligibility as of August 1st of the target examination year.
 */
export function calculateUpscEligibility(
  dobStr?: string,
  targetYear: number = 2027,
  category: SocialCategory = 'General'
): EligibilityResult {
  const maxAge = getMaxAgeForCategory(category);
  const attemptsAllowed = getMaxAttemptsForCategory(category);
  const cutoffDateStr = `01 Aug ${targetYear}`;

  if (!dobStr || !/^\d{4}-\d{2}-\d{2}$/.test(dobStr.trim())) {
    return {
      isValidDob: false,
      ageYears: 0,
      ageMonths: 0,
      ageFormatted: 'Not set',
      ageOnCutoffYears: 0,
      ageOnCutoffMonths: 0,
      cutoffDateStr,
      isEligible: true,
      status: 'invalid',
      message: 'Enter DOB (YYYY-MM-DD) to verify UPSC age eligibility',
      maxAge,
      attemptsAllowed,
      category,
    };
  }

  const [yearStr, monthStr, dayStr] = dobStr.split('-');
  const birthYear = parseInt(yearStr, 10);
  const birthMonth = parseInt(monthStr, 10) - 1; // 0-indexed
  const birthDay = parseInt(dayStr, 10);

  const birthDate = new Date(birthYear, birthMonth, birthDay);
  if (isNaN(birthDate.getTime())) {
    return {
      isValidDob: false,
      ageYears: 0,
      ageMonths: 0,
      ageFormatted: 'Invalid date',
      ageOnCutoffYears: 0,
      ageOnCutoffMonths: 0,
      cutoffDateStr,
      isEligible: false,
      status: 'invalid',
      message: 'Invalid Date of Birth format',
      maxAge,
      attemptsAllowed,
      category,
    };
  }

  // Current age
  const now = new Date();
  let ageYears = now.getFullYear() - birthYear;
  let ageMonths = now.getMonth() - birthMonth;
  if (now.getDate() < birthDay) {
    ageMonths -= 1;
  }
  if (ageMonths < 0) {
    ageYears -= 1;
    ageMonths += 12;
  }

  // Age on cutoff date: August 1st of targetYear
  let ageOnCutoffYears = targetYear - birthYear;
  let ageOnCutoffMonths = 7 - birthMonth;
  if (1 < birthDay) {
    ageOnCutoffMonths -= 1;
  }
  if (ageOnCutoffMonths < 0) {
    ageOnCutoffYears -= 1;
    ageOnCutoffMonths += 12;
  }

  const ageFormatted = `${ageYears} yrs, ${ageMonths} mos`;

  // UPSC Rule: Minimum 21 years, Maximum (32 General/EWS, 35 OBC, 37 SC/ST) on Aug 1
  if (ageOnCutoffYears < 21) {
    return {
      isValidDob: true,
      ageYears,
      ageMonths,
      ageFormatted,
      ageOnCutoffYears,
      ageOnCutoffMonths,
      cutoffDateStr,
      isEligible: false,
      status: 'underage',
      message: `Underage for CSE ${targetYear}: Must be at least 21 on Aug 1, ${targetYear} (will be ${ageOnCutoffYears} yrs)`,
      maxAge,
      attemptsAllowed,
      category,
    };
  }

  if (ageOnCutoffYears > maxAge || (ageOnCutoffYears === maxAge && ageOnCutoffMonths > 0)) {
    return {
      isValidDob: true,
      ageYears,
      ageMonths,
      ageFormatted,
      ageOnCutoffYears,
      ageOnCutoffMonths,
      cutoffDateStr,
      isEligible: false,
      status: 'overage',
      message: `Age limit (${maxAge} yrs for ${category}) exceeded on Aug 1, ${targetYear} (will be ${ageOnCutoffYears} yrs)`,
      maxAge,
      attemptsAllowed,
      category,
    };
  }

  return {
    isValidDob: true,
    ageYears,
    ageMonths,
    ageFormatted,
    ageOnCutoffYears,
    ageOnCutoffMonths,
    cutoffDateStr,
    isEligible: true,
    status: 'eligible',
    message: `Eligible for UPSC CSE ${targetYear} (${attemptsAllowed})`,
    maxAge,
    attemptsAllowed,
    category,
  };
}

import { z } from 'zod';

// Global Zod Parse Error Instrumentation for easier debugging in the browser console
try {
  const originalParse = z.ZodType.prototype.parse;
  z.ZodType.prototype.parse = function(this: any, data: any, ...args: any[]) {
    try {
      return originalParse.call(this, data, ...args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod Validation Failed on schema:", this._def, "with data:", data, "errors:", error.format());
      }
      throw error;
    }
  };
} catch (err) {
  console.error("Failed to override Zod parse prototype", err);
}

function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase().replace('-', '').replace('_', '');
  });
}

function camelizeKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => camelizeKeys(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toCamelCase(key)]: camelizeKeys(obj[key]),
      }),
      {},
    );
  }
  return obj;
}

export function mapApiResponse(data: any, url: string): any {
  if (!data) return data;

  // 1. Convert snake_case to camelCase first to make it easier to map
  let camelized = camelizeKeys(data);

  // 2. Map paginated response wrapper if it's a list response
  if (camelized && (camelized.items !== undefined || camelized.size !== undefined)) {
    const items = camelized.items || [];
    const total = camelized.total || 0;
    const page = camelized.page || 1;
    const pageSize = camelized.size || camelized.pageSize || 20;
    const totalPages = Math.ceil(total / pageSize);
    camelized = {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  // 3. Apply entity/path-specific mappings
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl.includes('/personnel/officers')) {
    if (Array.isArray(camelized.data)) {
      camelized.data = camelized.data.map(mapOfficerItem);
    } else {
      camelized = mapOfficerItem(camelized);
    }
  } else if (normalizedUrl.includes('/personnel/persons')) {
    if (Array.isArray(camelized.data)) {
      camelized.data = camelized.data.map(mapPersonItem);
    } else {
      camelized = mapPersonItem(camelized);
    }
  } else if (normalizedUrl.includes('/personnel/suspects')) {
    if (Array.isArray(camelized.data)) {
      camelized.data = camelized.data.map(mapSuspectItem);
    } else {
      camelized = mapSuspectItem(camelized);
    }
  } else if (normalizedUrl.includes('/cases')) {
    // Only apply case mapping to /cases (list) and /cases/{id} (detail) endpoints.
    // Sub-resources like /cases/{id}/officers, /cases/{id}/timeline, /cases/{id}/summary
    // should NOT be mapped through mapCaseItem.
    const isCasesEndpoint = /\/cases(?:\/[a-f0-9-]+)?(?:\?|$)/.test(normalizedUrl)
    if (isCasesEndpoint) {
      if (Array.isArray(camelized.data)) {
        camelized.data = camelized.data.map(mapCaseItem);
      } else {
        camelized = mapCaseItem(camelized);
      }
    }
  } else if (normalizedUrl.includes('/departments')) {
    if (Array.isArray(camelized.data)) {
      camelized.data = camelized.data.map(mapDepartmentItem);
    } else {
      camelized = mapDepartmentItem(camelized);
    }
  } else if (normalizedUrl.includes('/arrests')) {
    if (Array.isArray(camelized.data)) {
      camelized.data = camelized.data.map(mapArrestItem);
    } else {
      camelized = mapArrestItem(camelized);
    }
  } else if (normalizedUrl.includes('/evidence')) {
    if (Array.isArray(camelized.data)) {
      camelized.data = camelized.data.map(mapEvidenceItem);
    } else {
      camelized = mapEvidenceItem(camelized);
    }
  } else if (normalizedUrl.includes('/interrogations')) {
    if (Array.isArray(camelized.data)) {
      camelized.data = camelized.data.map(mapInterrogationItem);
    } else {
      camelized = mapInterrogationItem(camelized);
    }
  } else if (normalizedUrl.includes('/charges')) {
    if (Array.isArray(camelized.data)) {
      camelized.data = camelized.data.map(mapChargeItem);
    } else {
      camelized = mapChargeItem(camelized);
    }
  } else if (normalizedUrl.includes('/court-cases')) {
    if (Array.isArray(camelized.data)) {
      camelized.data = camelized.data.map(mapCourtCaseItem);
    } else {
      camelized = mapCourtCaseItem(camelized);
    }
  }

  return camelized;
}

function mapOfficerItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const firstName = raw.person?.firstName || raw.firstName || '';
  const lastName = raw.person?.lastName || raw.lastName || '';
  const email = raw.person?.email || raw.email || (firstName && lastName ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ccms.gov` : '');
  
  const roleName = raw.role?.roleName || raw.role || 'INVESTIGATOR';
  let role = String(roleName).toUpperCase().replace(/-/g, '_');
  if (role === 'DEPARTMENT_HEAD') role = 'DEPT_HEAD';
  const validRoles = ['INVESTIGATOR', 'FORENSIC', 'LEGAL_OFFICER', 'DEPT_HEAD', 'ADMIN', 'SUPERADMIN'];
  if (!validRoles.includes(role)) {
    role = 'INVESTIGATOR';
  }

  let status = 'ACTIVE';
  if (raw.isActive === false || raw.status === 'INACTIVE') {
    status = 'INACTIVE';
  }

  return {
    ...raw,
    id: String(raw.officerId || raw.id || ''),
    badgeNumber: raw.badgeNumber || '',
    firstName,
    lastName,
    email,
    role,
    status,
    departmentId: raw.departmentId ? String(raw.departmentId) : '',
    departmentName: raw.department?.name || raw.departmentName || 'Unassigned',
    lastActivityAt: raw.lastLoginAt || raw.lastActivityAt || null,
    createdAt: raw.createdAt || '',
    phone: raw.person?.phone || raw.phone || null,
    activeCaseCount: raw.activeCaseCount || 0,
    totalCaseCount: raw.totalCaseCount || 0,
  };
}

function mapPersonItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const natId = raw.nationalId || '';
  const masked = natId ? `${natId.slice(0, 3)}***${natId.slice(-2)}` : null;
  
  let gender: string | null = null;
  if (raw.gender) {
    const rawGender = String(raw.gender).toUpperCase();
    gender = rawGender === 'MALE' ? 'MALE' : (rawGender === 'FEMALE' ? 'FEMALE' : 'OTHER');
  }

  const validPersonRoles = ['SUSPECT', 'VICTIM', 'WITNESS'];
  const roles = (raw.roles || [])
    .map((r: any) => String(r).toUpperCase().replace(/-/g, '_'))
    .filter((r: string) => validPersonRoles.includes(r));
  if (roles.length === 0) {
    if (raw.isSuspect) roles.push('SUSPECT');
    if (raw.isVictim) roles.push('VICTIM');
    if (raw.isWitness) roles.push('WITNESS');
  }

  // construct PII
  const pii = raw.pii || {
    nationalId: raw.nationalId || null,
    dateOfBirth: raw.dob || raw.dateOfBirth || null,
    phone: raw.phone || null,
  };

  return {
    ...raw,
    id: String(raw.personId || raw.id || ''),
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    nationalIdMasked: raw.nationalIdMasked || masked,
    gender,
    roles,
    riskLevel: raw.riskLevel ? String(raw.riskLevel).toUpperCase() : null,
    isProtectedWitness: raw.isProtectedWitness || false,
    createdAt: raw.createdAt || '',
    pii,
    address: raw.address || null,
    photoUrl: raw.photoUrl || null,
    suspectProfile: raw.suspectProfile || null,
    victimProfile: raw.victimProfile || null,
    witnessProfile: raw.witnessProfile || null,
  };
}

function mapSuspectItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const personMapped = mapPersonItem(raw.person || raw);
  return {
    ...raw,
    id: String(raw.suspectId || raw.id || ''),
    suspectId: String(raw.suspectId || raw.id || ''),
    riskLevel: raw.riskLevel ? String(raw.riskLevel).toUpperCase() : null,
    criminalRecord: raw.criminalRecord || null,
    activeCaseCount: raw.activeCaseCount || 0,
    activeChargeCount: raw.activeChargeCount || 0,
    createdAt: raw.createdAt || '',
    person: personMapped,
  };
}

function mapCaseItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const rawStatus = raw.status?.statusName || raw.status || 'OPEN';
  let status = String(rawStatus).toUpperCase().replace(/\s+/g, '_');
  const validStatuses = ['OPEN', 'UNDER_INVESTIGATION', 'REFERRED_TO_COURT', 'CLOSED', 'ARCHIVED'];
  if (!validStatuses.includes(status)) {
    status = 'OPEN';
  }

  const crimeTypeName = raw.crimeType?.name || raw.crimeTypeName || 'General';
  const crimeTypeId = raw.crimeType?.crimeTypeId || raw.crimeTypeId || '1';

  return {
    ...raw,
    id: String(raw.caseId || raw.id || ''),
    caseNumber: raw.caseNumber || '',
    title: raw.title || '',
    status,
    crimeType: {
      id: String(crimeTypeId),
      name: crimeTypeName,
      code: String(crimeTypeName).toUpperCase().replace(/\s+/g, '_'),
    },
    department: {
      id: String(raw.department?.departmentId || raw.department?.id || '1'),
      name: raw.department?.name || 'Homicide',
    },
    leadOfficer: raw.leadOfficer ? {
      id: String(raw.leadOfficer.officerId || raw.leadOfficer.id || '1'),
      badgeNumber: raw.leadOfficer.badgeNumber || '',
      firstName: raw.leadOfficer.firstName || '',
      lastName: raw.leadOfficer.lastName || '',
    } : {
      id: '1',
      badgeNumber: 'SUP-001',
      firstName: 'System',
      lastName: 'Admin',
    },
    incidentDate: raw.openedAt || raw.incidentDate || new Date().toISOString(),
    reportedDate: raw.openedAt || raw.reportedDate || new Date().toISOString(),
    evidenceCount: raw.evidenceCount || 0,
    arrestCount: raw.arrestCount || 0,
    lastActivityAt: raw.openedAt || raw.lastActivityAt || new Date().toISOString(),
    description: raw.description || '',
    location: raw.location ? {
      id: String(raw.location.locationId || raw.location.id || '1'),
      name: raw.location.name || 'HQ',
      address: raw.location.address || '',
    } : {
      id: '1',
      name: 'Main Office',
      address: '',
    },
    chargeCount: raw.chargeCount || 0,
    memberCount: raw.memberCount || 0,
    closedDate: raw.closedAt || null,
    createdAt: raw.createdAt || raw.openedAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.openedAt || new Date().toISOString(),
  };
}

function mapDepartmentItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const headOfficer = raw.departmentHead || raw.headOfficer ? {
    id: String(raw.departmentHead?.officerId || raw.headOfficer?.id || '1'),
    badgeNumber: raw.departmentHead?.badgeNumber || raw.headOfficer?.badgeNumber || '',
    firstName: raw.departmentHead?.firstName || raw.headOfficer?.firstName || '',
    lastName: raw.departmentHead?.lastName || raw.headOfficer?.lastName || '',
    email: `${(raw.departmentHead?.firstName || raw.headOfficer?.firstName || '').toLowerCase()}@ccms.gov`,
    phone: null,
  } : null;

  return {
    ...raw,
    id: String(raw.departmentId || raw.id || ''),
    name: raw.name || '',
    code: raw.code || (raw.name ? raw.name.toUpperCase().substring(0, 3) : null),
    location: {
      id: String(raw.locationId || raw.location?.id || '1'),
      name: raw.location?.name || 'HQ',
      region: raw.location?.region || 'Addis Ababa',
    },
    headOfficer,
    officerCount: raw.officerCount || 0,
    activeCaseCount: raw.activeCaseCount || 0,
    createdAt: raw.createdAt || '',
  };
}

function mapArrestItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  return {
    ...raw,
    id: String(raw.arrestId || raw.id || ''),
    arrestNumber: raw.bookingNumber || raw.arrestNumber || '',
    caseId: String(raw.caseId || ''),
    arrestedPerson: raw.suspect ? {
      id: String(raw.suspect.suspectId || raw.suspect.id || '1'),
      firstName: raw.suspect.firstName || '',
      lastName: raw.suspect.lastName || '',
      nationalId: 'SUS-001',
    } : { id: '1', firstName: 'Unknown', lastName: 'Suspect', nationalId: 'SUS-001' },
    arrestingOfficer: raw.arrestingOfficer ? {
      id: String(raw.arrestingOfficer.officerId || raw.arrestingOfficer.id || '1'),
      badgeNumber: raw.arrestingOfficer.badgeNumber || '',
      firstName: raw.arrestingOfficer.firstName || '',
      lastName: raw.arrestingOfficer.lastName || '',
      departmentName: 'Homicide',
    } : { id: '1', badgeNumber: 'SUP-001', firstName: 'System', lastName: 'Admin', departmentName: 'Homicide' },
    arrestDate: raw.date || raw.arrestDate || '',
    location: raw.location?.name || raw.location || 'Unknown',
    detentionStatus: raw.releasedAt ? 'RELEASED' : 'DETAINED',
    bailStatus: raw.bailAmount ? 'SET' : 'NONE',
    bailAmount: raw.bailAmount ? Number(raw.bailAmount) : null,
    warrantNumber: null,
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
    chargesAtArrest: raw.chargesAtArrest || [],
    notes: raw.notes || null,
    courtAppearanceDate: raw.courtAppearanceDate || null,
  };
}

function mapEvidenceItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  return {
    ...raw,
    id: String(raw.evidenceId || raw.id || ''),
    evidenceNumber: raw.evidenceTag || raw.evidenceNumber || '',
    caseId: String(raw.caseId || ''),
    evidenceType: String(raw.evidenceType?.name || raw.evidenceType || 'PHYSICAL').toUpperCase(),
    description: raw.description || raw.name || '',
    collectedBy: raw.collectedByOfficer ? {
      id: String(raw.collectedByOfficer.officerId || raw.collectedByOfficer.id || '1'),
      badgeNumber: raw.collectedByOfficer.badgeNumber || '',
      firstName: raw.collectedByOfficer.firstName || '',
      lastName: raw.collectedByOfficer.lastName || '',
      departmentName: 'Homicide',
    } : { id: '1', badgeNumber: 'SUP-001', firstName: 'System', lastName: 'Admin', departmentName: 'Homicide' },
    collectedAt: raw.collectedAt || '',
    storageLocation: raw.storageLocationId ? String(raw.storageLocationId) : (raw.storageLocation || 'Locker'),
    custodyStatus: raw.custodyStatus || 'INTAKE',
    hasMedia: raw.hasMedia || false,
    mediaUrl: raw.mediaUrl || null,
    thumbnailUrl: raw.thumbnailUrl || null,
    createdAt: raw.createdAt || '',
    notes: raw.notes || null,
    custodyChain: raw.custodyChain || { events: [], gaps: [], isIntact: true },
    forensicReport: raw.forensicReport || null,
    vehicleDetails: raw.vehicleDetails || null,
    weaponDetails: raw.weaponDetails || null,
  };
}

function mapInterrogationItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  return {
    ...raw,
    id: String(raw.interrogationId || raw.id || ''),
    caseId: String(raw.caseId || ''),
    caseNumber: 'CASE-' + raw.caseId,
    suspectId: String(raw.suspectId || ''),
    suspectName: raw.suspectName || 'Unknown suspect',
    interrogatorId: String(raw.officerId || ''),
    interrogatorName: raw.officerName || 'Unknown officer',
    date: raw.date || '',
    status: 'COMPLETED',
    createdAt: raw.createdAt || '',
  };
}

function mapChargeItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  return {
    ...raw,
    id: String(raw.chargeId || raw.id || ''),
    courtCaseId: raw.courtCaseId ? String(raw.courtCaseId) : '',
    caseId: String(raw.caseId || ''),
    suspect: raw.suspect ? {
      id: String(raw.suspect.suspectId || raw.suspect.id || '1'),
      firstName: raw.suspect.firstName || '',
      lastName: raw.suspect.lastName || '',
    } : { id: '1', firstName: 'John', lastName: 'Doe' },
    crimeType: raw.crimeType ? {
      id: String(raw.crimeType.crimeTypeId || raw.crimeType.id || '1'),
      name: raw.crimeType.name || '',
    } : { id: '1', name: 'General' },
    status: String(raw.chargeStatus || raw.status || 'PENDING').toUpperCase(),
    filedAt: raw.filedAt || raw.createdAt || '',
    updatedAt: raw.updatedAt || raw.createdAt || '',
    hasSentence: raw.sentence !== null && raw.sentence !== undefined,
  };
}

function mapCourtCaseItem(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;
  const charges = Array.isArray(raw.charges) ? raw.charges.map(mapChargeItem) : [];
  return {
    ...raw,
    id: String(raw.courtCaseId || raw.id || ''),
    courtCaseNumber: raw.courtReference || '',
    investigationCaseId: String(raw.caseId || ''),
    investigationCaseTitle: 'Case #' + raw.caseId,
    court: raw.courtName || '',
    status: String(raw.status || 'PENDING').toUpperCase(),
    outcome: raw.verdict ? String(raw.verdict).toUpperCase() : null,
    filedAt: raw.createdAt || '',
    nextHearingDate: raw.hearingDate || null,
    chargeCount: charges.length,
    updatedAt: raw.updatedAt || '',
    hearingDates: [],
    presidingJudge: raw.judgeName || null,
    prosecutor: raw.prosecutorName || null,
    defenceCounsel: null,
    notes: raw.verdictNotes || null,
    charges,
  };
}

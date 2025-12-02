import type { ModuleManifest } from '@appdistillery/core/modules';

export const agencyManifest: ModuleManifest = {
  id: 'agency',
  name: 'AppDistillery Agency',
  version: '0.1.0',
  description: 'AI-powered consultancy intake, scoping, and proposals',
  routes: [
    { path: '/agency', label: 'Pipeline', icon: 'Briefcase' },
    { path: '/agency/intake', label: 'New Lead', icon: 'UserPlus' },
    { path: '/agency/briefs', label: 'Briefs', icon: 'FileText' },
    { path: '/agency/proposals', label: 'Proposals', icon: 'FileSignature' },
  ],
  usageActions: [
    'agency:scope:generate',
    'agency:proposal:draft',
  ],
};

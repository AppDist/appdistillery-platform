import type { ModuleManifest } from '@appdistillery/core/modules';

export const agencyManifest: ModuleManifest = {
  id: 'agency',
  name: 'AppDistillery Agency',
  version: '0.1.0',
  description: 'AI-powered consultancy intake, scoping, and proposals',
  routes: {
    root: '/agency',
    pages: [
      { path: '/agency', title: 'Pipeline', icon: 'Briefcase' },
      { path: '/agency/intake', title: 'New Lead', icon: 'UserPlus' },
      { path: '/agency/briefs', title: 'Briefs', icon: 'FileText' },
      { path: '/agency/proposals', title: 'Proposals', icon: 'FileSignature' },
    ],
  },
  usage: {
    actions: [
      { key: 'agency:scope:generate', unitCost: 50, description: 'AI analysis of client brief' },
      { key: 'agency:proposal:draft', unitCost: 100, description: 'AI-generated proposal' },
    ],
  },
};

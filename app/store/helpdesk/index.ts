/**
 * Helpdesk global store — business logic & API state.
 * Use in uikit for pure UI; initial state: arrays = [], objects = {}.
 */

export { useHelpdeskStatusStore } from './helpdeskStatusStore';
export type { HelpdeskStatusItem, AssigneeStatus } from './helpdeskStatusStore';
export { useSupportTeamStore } from './supportTeamStore';
export { useBuildingStore } from './buildingStore';
export type { BuildingTabIndex } from './buildingStore';
export { useIssueStore } from './issueStore';
export { useLocationStore } from './locationStore';
export type { LocationState } from './locationStore';
export { useReportStore } from './reportStore';
export type { ReportFilter } from './reportStore';
export * from './types';

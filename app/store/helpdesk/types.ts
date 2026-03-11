/**
 * Centralized types for Helpdesk stores.
 * Re-exports from uikit where possible to avoid duplication.
 */

export type {
  SupportTeamData,
  CreateSupportTeamPayload,
  HeadCategoryData,
  HeadCategorySelectItem,
  CreateHeadCategoryPayload,
  UpdateHeadCategoryPayload,
  DivisionOption,
  RoleSelectItem,
  UserRoleData,
  CreateUserRolePayload,
  UpdateUserRolePayload,
  AdminAssignUser,
  BuildingData,
  CreateBuildingPayload,
  CategoryData,
  CreateCategoryPayload,
  IssueData,
  CreateIssuePayload,
  IconItemData,
  CategoryIconSelectItem,
  CreateIconPayload,
  SubMenuItem,
  MenuItem,
  OptionItem,
  SupportTeamTechnicalRow,
} from '@/app/(main)/uikit/MenuApps/types';

export { BuildingTabs, IssueTabs, SupportTeamTabs } from '@/app/(main)/uikit/MenuApps/types';

/** Location — ใช้ใน locationStore (GET /locations) */
export interface LocationData {
  id: number;
  name: string;
  code?: string;
  type?: string;
  parentId?: number;
  parentName?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Response item from GET /api/categorys/selectcategory
 * Used for Group Problem (category) selection flow.
 */
export interface CategorySelectItem {
  id: number;
  title: string;
  description: string;
  /** Icon file id — resolve to URL via categoryicons/selectcategoryicon */
  catIconId?: number;
  /** Icon path/filename — use getCategoryIconProxyUrl if present */
  catIcon?: string;
}

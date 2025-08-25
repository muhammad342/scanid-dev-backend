export interface PaginationFilters {
  page?: number;
  limit?: number;
  search?: string | undefined;
}

export interface TagFilters extends PaginationFilters {
  systemEditionId?: string | undefined;
  companyId?: string | undefined;
  type?: 'document' | 'note' | 'certificate' | undefined;
  isActive?: boolean | undefined;
}

export interface CreateTagData {
  systemEditionId: string;
  companyId?: string;
  name: string;
  color?: string;
  type: 'document' | 'note' | 'certificate';
  isActive?: boolean;
  sortOrder?: number;
  createdBy?: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface TagOrderUpdate {
  id: string;
  sortOrder: number;
}

export interface TagMergeData {
  sourceTagIds: string[];
  targetTagId?: string;
  newTagName?: string;
} 
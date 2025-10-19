// src/types/index.ts

export interface Customer {
  customerID: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  projectCount?: number;
}

export interface CreateCustomerDto {
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface Comment {
  commentID: number;
  projectID: number;
  projectName?: string;
  message: string;
  authorName: string;
  authorType: 'Admin' | 'Customer';
  createdAt: string;
}

export interface CreateCommentDto {
  projectID: number;
  message: string;
  authorName?: string;
}

export interface Project {
  projectID: number;
  projectName: string;
  customerName: string;
  customerID: number;
  trackingNumber: string;
  status: string;
  progress: number;
  description?: string;
  startDate: string;
  endDate: string;
  isArchived: boolean;
  daysUntilDeadline?: number;
  phases?: ProjectPhase[];
}

export interface CreateProjectDto {
  projectName: string;
  customerID: number;
  status: string;
  progress: number;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface ProjectPhase {
  phaseID: number;
  projectID: number;
  phaseName: string;
  description?: string;
  status: string;
  phaseOrder: number;
  startedAt?: string;
  completedAt?: string;
}

export interface CreatePhaseDto {
  projectID: number;
  phaseName: string;
  description?: string;
  status: string;
  phaseOrder: number;
}

export interface Admin {
  adminID: number;
  name: string;
  email: string;
  role: 'Owner' | 'Admin';  // ✨ Updated
  projectAccess: string;
  status: string;
  lastLogin?: string;
  assignedProjectIDs?: number[];  // ✨ New
}

export interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
  role: 'Owner' | 'Admin';  // ✨ Updated
  projectAccess: string;
  assignedProjectIDs?: number[];  // ✨ New
}

export interface UpdateAdminDto {
  name: string;
  email: string;
  role: 'Owner' | 'Admin';  // ✨ Updated
  projectAccess: string;
  status: string;
  assignedProjectIDs?: number[];  // ✨ New
}

export interface LoginResponseDto {
  token: string;
  admin: Admin;
}

export interface DashboardStats {
  activeProjects: number;
  totalCustomers: number;
  completedProjects: number;
  totalComments: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

// src/types/index.ts - Add these interfaces

export interface NotificationSubscription {
  subscriptionID: number;
  projectID: number;
  projectName?: string;
  email: string;
  subscriberType: 'Customer' | 'Admin';
  isActive: boolean;
  createdAt: string;
}

export interface CreateSubscriptionDto {
  projectID: number;
  email: string;
}

export interface ToggleSubscriptionDto {
  projectID: number;
  email: string;
}
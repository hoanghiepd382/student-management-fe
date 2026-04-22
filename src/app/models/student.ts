export interface Student {
  id?: number;
  name: string;
  email: string;
  studentCode: string;
  address: string;
  className?: string;
  enrollmentYear?: number;
  dob: string;
  avatar?: string;
  gender?: string;
  major?: {
    id: number;
    majorCode?: string;
    majorName?: string;
  } | null;
}

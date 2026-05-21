export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type Urgency = 'critical' | 'urgent' | 'normal';
export type RequestStatus = 'open' | 'fulfilled' | 'cancelled';
export type ResponseStatus = 'pending' | 'accepted' | 'declined';
export type RankName = 'Volunteer' | 'Helper' | 'Protector' | 'Guardian' | 'Champion' | 'Legend';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  blood_type: BloodType;
  city: string;
  lat?: number;
  lng?: number;
  avatar_b64?: string;
  is_donor: number;
  is_available: number;
  is_admin: number;
  donations_count: number;
  lives_saved: number;
  rank: RankName;
  last_donation_at?: string;
  joined_at: string;
}

export interface BloodRequest {
  id: string;
  requester_id: string;
  requester_name?: string;
  patient_name: string;
  blood_type: BloodType;
  units_needed: number;
  hospital: string;
  city: string;
  lat?: number;
  lng?: number;
  urgency: Urgency;
  message?: string;
  status: RequestStatus;
  created_at: string;
  fulfilled_at?: string;
  responses_count?: number;
}

export interface Donation {
  id: string;
  donor_id: string;
  donor_name?: string;
  request_id?: string;
  units: number;
  hospital: string;
  donated_at: string;
  verified: number;
}

export interface RequestResponse {
  id: string;
  request_id: string;
  donor_id: string;
  donor_name?: string;
  donor_blood_type?: string;
  donor_phone?: string;
  donor_avatar?: string;
  status: ResponseStatus;
  message?: string;
  responded_at: string;
}

export interface Message {
  id: string;
  from_id: string;
  to_id: string;
  from_name?: string;
  to_name?: string;
  body: string;
  read: number;
  sent_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: number;
  created_at: string;
}

export interface RankInfo {
  name: RankName;
  min: number;
  color: string;
  icon: string;
  description: string;
}

export const RANKS: RankInfo[] = [
  { name: 'Volunteer', min: 0, color: '#6B7280', icon: '🩸', description: 'Just getting started' },
  { name: 'Helper', min: 1, color: '#3B82F6', icon: '💉', description: '1+ donations' },
  { name: 'Protector', min: 3, color: '#8B5CF6', icon: '🛡️', description: '3+ donations' },
  { name: 'Guardian', min: 6, color: '#F59E0B', icon: '⭐', description: '6+ donations' },
  { name: 'Champion', min: 10, color: '#EF4444', icon: '🏆', description: '10+ donations' },
  { name: 'Legend', min: 20, color: '#DC2626', icon: '👑', description: '20+ donations — a true hero' },
];

export const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const COMPATIBLE_DONORS: Record<BloodType, BloodType[]> = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],
};

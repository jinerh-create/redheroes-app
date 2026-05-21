import type { User, BloodRequest, Donation, RequestResponse, Message, Notification } from './types';

export type DB = { prepare(q: string): D1PreparedStatement };

export async function getUserById(db: DB, id: string): Promise<User | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
}

export async function getUserByPhone(db: DB, phone: string): Promise<User | null> {
  return db.prepare('SELECT * FROM users WHERE phone = ?').bind(phone).first<User>();
}

export async function createUser(db: DB, user: Omit<User, 'donations_count' | 'lives_saved' | 'rank' | 'is_admin'> & { password_hash: string }): Promise<void> {
  await db.prepare(
    'INSERT INTO users (id,name,phone,email,password_hash,blood_type,city,lat,lng,is_donor,is_available,is_admin,donations_count,lives_saved,rank,joined_at) VALUES (?,?,?,?,?,?,?,?,?,1,1,0,0,0,"Volunteer",?)'
  ).bind(user.id, user.name, user.phone, user.email ?? null, user.password_hash, user.blood_type, user.city, user.lat ?? null, user.lng ?? null, user.joined_at).run();
}

export async function updateUserAvatar(db: DB, id: string, avatar_b64: string): Promise<void> {
  await db.prepare('UPDATE users SET avatar_b64 = ? WHERE id = ?').bind(avatar_b64, id).run();
}

export async function setUserAvailability(db: DB, id: string, available: number): Promise<void> {
  await db.prepare('UPDATE users SET is_available = ? WHERE id = ?').bind(available, id).run();
}

export async function getLeaderboard(db: DB, limit = 50): Promise<User[]> {
  const r = await db.prepare('SELECT * FROM users WHERE is_donor = 1 ORDER BY donations_count DESC LIMIT ?').bind(limit).all<User>();
  return r.results;
}

export async function getDonorsByBloodType(db: DB, blood_type: string): Promise<User[]> {
  const r = await db.prepare('SELECT * FROM users WHERE is_donor=1 AND is_available=1 AND blood_type=? ORDER BY donations_count DESC').bind(blood_type).all<User>();
  return r.results;
}

export async function getAllDonors(db: DB): Promise<User[]> {
  const r = await db.prepare('SELECT * FROM users WHERE is_donor=1 AND is_available=1 ORDER BY donations_count DESC').all<User>();
  return r.results;
}

export async function getOpenRequests(db: DB, limit = 50): Promise<BloodRequest[]> {
  const r = await db.prepare(
    `SELECT br.*, u.name as requester_name,
     (SELECT COUNT(*) FROM request_responses rr WHERE rr.request_id = br.id) as responses_count
     FROM blood_requests br JOIN users u ON u.id = br.requester_id
     WHERE br.status = 'open' ORDER BY br.urgency DESC, br.created_at DESC LIMIT ?`
  ).bind(limit).all<BloodRequest>();
  return r.results;
}

export async function getRequestById(db: DB, id: string): Promise<BloodRequest | null> {
  return db.prepare(
    `SELECT br.*, u.name as requester_name FROM blood_requests br JOIN users u ON u.id = br.requester_id WHERE br.id = ?`
  ).bind(id).first<BloodRequest>();
}

export async function createRequest(db: DB, req: Omit<BloodRequest, 'status' | 'fulfilled_at' | 'requester_name' | 'responses_count'>): Promise<void> {
  await db.prepare(
    'INSERT INTO blood_requests (id,requester_id,patient_name,blood_type,units_needed,hospital,city,lat,lng,urgency,message,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).bind(req.id, req.requester_id, req.patient_name, req.blood_type, req.units_needed, req.hospital, req.city, req.lat ?? null, req.lng ?? null, req.urgency, req.message ?? null, 'open', req.created_at).run();
}

export async function fulfillRequest(db: DB, id: string): Promise<void> {
  await db.prepare("UPDATE blood_requests SET status='fulfilled', fulfilled_at=? WHERE id=?").bind(new Date().toISOString(), id).run();
}

export async function getRequestResponses(db: DB, request_id: string): Promise<RequestResponse[]> {
  const r = await db.prepare(
    `SELECT rr.*, u.name as donor_name, u.blood_type as donor_blood_type, u.phone as donor_phone, u.avatar_b64 as donor_avatar
     FROM request_responses rr JOIN users u ON u.id = rr.donor_id WHERE rr.request_id = ?`
  ).bind(request_id).all<RequestResponse>();
  return r.results;
}

export async function createResponse(db: DB, resp: Omit<RequestResponse, 'donor_name' | 'donor_blood_type' | 'donor_phone' | 'donor_avatar'>): Promise<void> {
  await db.prepare(
    'INSERT OR IGNORE INTO request_responses (id,request_id,donor_id,status,message,responded_at) VALUES (?,?,?,?,?,?)'
  ).bind(resp.id, resp.request_id, resp.donor_id, resp.status, resp.message ?? null, resp.responded_at).run();
}

export async function recordDonation(db: DB, d: Donation): Promise<void> {
  await db.prepare(
    'INSERT INTO donations (id,donor_id,request_id,units,hospital,donated_at,verified) VALUES (?,?,?,?,?,?,?)'
  ).bind(d.id, d.donor_id, d.request_id ?? null, d.units, d.hospital, d.donated_at, d.verified).run();
  await db.prepare(
    "UPDATE users SET donations_count = donations_count + ?, lives_saved = lives_saved + ?, last_donation_at = ? WHERE id = ?"
  ).bind(d.units, d.units, d.donated_at, d.donor_id).run();
  await updateRank(db, d.donor_id);
}

async function updateRank(db: DB, userId: string): Promise<void> {
  const user = await db.prepare('SELECT donations_count FROM users WHERE id=?').bind(userId).first<{ donations_count: number }>();
  if (!user) return;
  const ranks = ['Volunteer', 'Helper', 'Protector', 'Guardian', 'Champion', 'Legend'];
  const mins = [0, 1, 3, 6, 10, 20];
  let rank = 'Volunteer';
  for (let i = 0; i < mins.length; i++) {
    if (user.donations_count >= mins[i]) rank = ranks[i];
  }
  await db.prepare('UPDATE users SET rank=? WHERE id=?').bind(rank, userId).run();
}

export async function getConversation(db: DB, userA: string, userB: string): Promise<Message[]> {
  const r = await db.prepare(
    `SELECT m.*, uf.name as from_name, ut.name as to_name FROM messages m
     JOIN users uf ON uf.id = m.from_id JOIN users ut ON ut.id = m.to_id
     WHERE (m.from_id=? AND m.to_id=?) OR (m.from_id=? AND m.to_id=?)
     ORDER BY m.sent_at ASC`
  ).bind(userA, userB, userB, userA).all<Message>();
  return r.results;
}

export async function sendMessage(db: DB, msg: Message): Promise<void> {
  await db.prepare(
    'INSERT INTO messages (id,from_id,to_id,body,read,sent_at) VALUES (?,?,?,?,0,?)'
  ).bind(msg.id, msg.from_id, msg.to_id, msg.body, msg.sent_at).run();
}

export async function markMessagesRead(db: DB, from_id: string, to_id: string): Promise<void> {
  await db.prepare('UPDATE messages SET read=1 WHERE from_id=? AND to_id=?').bind(from_id, to_id).run();
}

export async function getConversationList(db: DB, userId: string): Promise<any[]> {
  const r = await db.prepare(
    `SELECT DISTINCT
       CASE WHEN m.from_id=? THEN m.to_id ELSE m.from_id END as other_id,
       u.name as other_name, u.avatar_b64, u.blood_type,
       m.body as last_msg, m.sent_at as last_time,
       SUM(CASE WHEN m.to_id=? AND m.read=0 THEN 1 ELSE 0 END) as unread
     FROM messages m
     JOIN users u ON u.id = CASE WHEN m.from_id=? THEN m.to_id ELSE m.from_id END
     WHERE m.from_id=? OR m.to_id=?
     GROUP BY other_id ORDER BY last_time DESC`
  ).bind(userId, userId, userId, userId, userId).all();
  return r.results as any[];
}

export async function getNotifications(db: DB, userId: string): Promise<Notification[]> {
  const r = await db.prepare(
    'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50'
  ).bind(userId).all<Notification>();
  return r.results;
}

export async function createNotification(db: DB, n: Notification): Promise<void> {
  await db.prepare(
    'INSERT INTO notifications (id,user_id,type,title,body,link,read,created_at) VALUES (?,?,?,?,?,?,0,?)'
  ).bind(n.id, n.user_id, n.type, n.title, n.body, n.link ?? null, n.created_at).run();
}

export async function markNotifRead(db: DB, id: string): Promise<void> {
  await db.prepare('UPDATE notifications SET read=1 WHERE id=?').bind(id).run();
}

export async function getAdminStats(db: DB): Promise<any> {
  const [users, requests, donations] = await Promise.all([
    db.prepare('SELECT COUNT(*) as total, SUM(is_donor) as donors, SUM(donations_count) as total_donations FROM users').first(),
    db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) as open FROM blood_requests").first(),
    db.prepare('SELECT COUNT(*) as total FROM donations').first(),
  ]);
  return { users, requests, donations };
}

export async function getAllUsers(db: DB): Promise<User[]> {
  const r = await db.prepare('SELECT * FROM users ORDER BY joined_at DESC').all<User>();
  return r.results;
}

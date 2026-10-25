const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const SNAPSHOT_FILE = path.join(__dirname, '../../database/persistent_shards.json');

const shards = {
  europe: {
    region: 'europe',
    dbName: 'fifa_europe',
    virtualUserCount: 0,
    users: new Map(),
    usersByEmail: new Map(),
    stadiums: [],
    matches: [],
    categories: [],
    seats: [],
    bookings: [],
    bookingSeats: [],
    payments: [],
    auditLogs: [],
  },
  asia: {
    region: 'asia',
    dbName: 'fifa_asia',
    virtualUserCount: 0,
    users: new Map(),
    usersByEmail: new Map(),
    stadiums: [],
    matches: [],
    categories: [],
    seats: [],
    bookings: [],
    bookingSeats: [],
    payments: [],
    auditLogs: [],
  },
  north_america: {
    region: 'north_america',
    dbName: 'fifa_north_am',
    virtualUserCount: 0,
    users: new Map(),
    usersByEmail: new Map(),
    stadiums: [],
    matches: [],
    categories: [],
    seats: [],
    bookings: [],
    bookingSeats: [],
    payments: [],
    auditLogs: [],
  },
  south_america: {
    region: 'south_america',
    dbName: 'fifa_south_am',
    virtualUserCount: 0,
    users: new Map(),
    usersByEmail: new Map(),
    stadiums: [],
    matches: [],
    categories: [],
    seats: [],
    bookings: [],
    bookingSeats: [],
    payments: [],
    auditLogs: [],
  },
};

const normalizeRegion = (region) => {
  if (!region) return 'europe';
  const norm = region.toLowerCase().replace(/ /g, '_');
  if (norm === 'north_am') return 'north_america';
  if (norm === 'south_am') return 'south_america';
  return norm;
};

const initSeedData = () => {
  // 1. Europe Shard (5 Matches)
  const europeStadium1 = {
    id: 'e1000000-0000-0000-0000-000000000001',
    name: 'Wembley Stadium',
    city: 'London',
    country: 'England',
    region: 'europe',
    capacity: 90000,
    created_at: new Date().toISOString(),
  };
  const europeStadium2 = {
    id: 'e1000000-0000-0000-0000-000000000002',
    name: 'Allianz Arena',
    city: 'Munich',
    country: 'Germany',
    region: 'europe',
    capacity: 75000,
    created_at: new Date().toISOString(),
  };
  shards.europe.stadiums.push(europeStadium1, europeStadium2);

  const matchEuro1 = {
    id: 'm1000000-0000-0000-0000-000000000001',
    home_team: 'England',
    away_team: 'France',
    stadium_id: europeStadium1.id,
    match_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Quarter-Final',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchEuro2 = {
    id: 'm1000000-0000-0000-0000-000000000002',
    home_team: 'Germany',
    away_team: 'Spain',
    stadium_id: europeStadium2.id,
    match_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Semi-Final',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchEuro3 = {
    id: 'm1000000-0000-0000-0000-000000000003',
    home_team: 'Portugal',
    away_team: 'Netherlands',
    stadium_id: europeStadium1.id,
    match_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Round of 16',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchEuro4 = {
    id: 'm1000000-0000-0000-0000-000000000004',
    home_team: 'Belgium',
    away_team: 'Croatia',
    stadium_id: europeStadium2.id,
    match_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Group Stage',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchEuro5 = {
    id: 'm1000000-0000-0000-0000-000000000005',
    home_team: 'Italy',
    away_team: 'Denmark',
    stadium_id: europeStadium1.id,
    match_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Group Stage',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  shards.europe.matches.push(matchEuro1, matchEuro2, matchEuro3, matchEuro4, matchEuro5);

  // 2. Asia Shard (5 Matches)
  const asiaStadium1 = {
    id: 'a2000000-0000-0000-0000-000000000001',
    name: 'Lusail Iconic Stadium',
    city: 'Lusail',
    country: 'Qatar',
    region: 'asia',
    capacity: 88966,
    created_at: new Date().toISOString(),
  };
  const asiaStadium2 = {
    id: 'a2000000-0000-0000-0000-000000000002',
    name: 'Saitama Stadium 2002',
    city: 'Saitama',
    country: 'Japan',
    region: 'asia',
    capacity: 63700,
    created_at: new Date().toISOString(),
  };
  shards.asia.stadiums.push(asiaStadium1, asiaStadium2);

  const matchAsia1 = {
    id: 'm2000000-0000-0000-0000-000000000001',
    home_team: 'Japan',
    away_team: 'South Korea',
    stadium_id: asiaStadium1.id,
    match_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Group Stage',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchAsia2 = {
    id: 'm2000000-0000-0000-0000-000000000002',
    home_team: 'Saudi Arabia',
    away_team: 'Australia',
    stadium_id: asiaStadium1.id,
    match_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Group Stage',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchAsia3 = {
    id: 'm2000000-0000-0000-0000-000000000003',
    home_team: 'Qatar',
    away_team: 'Iran',
    stadium_id: asiaStadium2.id,
    match_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Group Stage',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchAsia4 = {
    id: 'm2000000-0000-0000-0000-000000000004',
    home_team: 'Japan',
    away_team: 'Spain',
    stadium_id: asiaStadium2.id,
    match_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Round of 16',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchAsia5 = {
    id: 'm2000000-0000-0000-0000-000000000005',
    home_team: 'Saudi Arabia',
    away_team: 'Japan',
    stadium_id: asiaStadium1.id,
    match_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Quarter-Final',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  shards.asia.matches.push(matchAsia1, matchAsia2, matchAsia3, matchAsia4, matchAsia5);

  // 3. North America Shard - Hosts: USA, Canada, Mexico (5 Matches)
  const naStadium1 = {
    id: 'n3000000-0000-0000-0000-000000000001',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    country: 'USA',
    region: 'north_america',
    capacity: 82500,
    created_at: new Date().toISOString(),
  };
  const naStadium2 = {
    id: 'n3000000-0000-0000-0000-000000000002',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    region: 'north_america',
    capacity: 87523,
    created_at: new Date().toISOString(),
  };
  const naStadium3 = {
    id: 'n3000000-0000-0000-0000-000000000003',
    name: 'BC Place',
    city: 'Vancouver',
    country: 'Canada',
    region: 'north_america',
    capacity: 54500,
    created_at: new Date().toISOString(),
  };
  shards.north_america.stadiums.push(naStadium1, naStadium2, naStadium3);

  const matchNA1 = {
    id: 'm3000000-0000-0000-0000-000000000001',
    home_team: 'USA',
    away_team: 'Mexico',
    stadium_id: naStadium1.id,
    match_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Group Stage - Opening Match',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchNA2 = {
    id: 'm3000000-0000-0000-0000-000000000002',
    home_team: 'Canada',
    away_team: 'Morocco',
    stadium_id: naStadium3.id,
    match_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Group Stage',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchNA3 = {
    id: 'm3000000-0000-0000-0000-000000000003',
    home_team: 'Mexico',
    away_team: 'Germany',
    stadium_id: naStadium2.id,
    match_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Group Stage',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchNA4 = {
    id: 'm3000000-0000-0000-0000-000000000004',
    home_team: 'USA',
    away_team: 'Netherlands',
    stadium_id: naStadium1.id,
    match_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Round of 16',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchNA5 = {
    id: 'm3000000-0000-0000-0000-000000000005',
    home_team: 'Argentina',
    away_team: 'France',
    stadium_id: naStadium1.id,
    match_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'World Cup Grand Final',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  shards.north_america.matches.push(matchNA1, matchNA2, matchNA3, matchNA4, matchNA5);

  // 4. South America Shard (5 Matches)
  const saStadium1 = {
    id: 's4000000-0000-0000-0000-000000000001',
    name: 'Maracana Stadium',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    region: 'south_america',
    capacity: 78838,
    created_at: new Date().toISOString(),
  };
  const saStadium2 = {
    id: 's4000000-0000-0000-0000-000000000002',
    name: 'Estadio Monumental',
    city: 'Buenos Aires',
    country: 'Argentina',
    region: 'south_america',
    capacity: 84567,
    created_at: new Date().toISOString(),
  };
  shards.south_america.stadiums.push(saStadium1, saStadium2);

  const matchSA1 = {
    id: 'm4000000-0000-0000-0000-000000000001',
    home_team: 'Brazil',
    away_team: 'Argentina',
    stadium_id: saStadium1.id,
    match_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Semi-Final Superclasico',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchSA2 = {
    id: 'm4000000-0000-0000-0000-000000000002',
    home_team: 'Uruguay',
    away_team: 'Colombia',
    stadium_id: saStadium2.id,
    match_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Quarter-Final',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchSA3 = {
    id: 'm4000000-0000-0000-0000-000000000003',
    home_team: 'Brazil',
    away_team: 'Chile',
    stadium_id: saStadium1.id,
    match_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Round of 16',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchSA4 = {
    id: 'm4000000-0000-0000-0000-000000000004',
    home_team: 'Argentina',
    away_team: 'Netherlands',
    stadium_id: saStadium2.id,
    match_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Quarter-Final',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  const matchSA5 = {
    id: 'm4000000-0000-0000-0000-000000000005',
    home_team: 'Colombia',
    away_team: 'Ecuador',
    stadium_id: saStadium1.id,
    match_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    tournament_stage: 'Group Stage',
    status: 'upcoming',
    created_at: new Date().toISOString(),
  };
  shards.south_america.matches.push(matchSA1, matchSA2, matchSA3, matchSA4, matchSA5);

  const allShardsList = Object.values(shards);
  for (const shard of allShardsList) {
    for (const match of shard.matches) {
      const catVIP = { id: uuidv4(), stadium_id: match.stadium_id, name: 'VIP Hospitality', base_price: 550.00 };
      const catPrem = { id: uuidv4(), stadium_id: match.stadium_id, name: 'Category 1 - Premium', base_price: 320.00 };
      const catGen = { id: uuidv4(), stadium_id: match.stadium_id, name: 'Category 2 - Standard', base_price: 150.00 };
      shard.categories.push(catVIP, catPrem, catGen);

      for (let s = 1; s <= 10; s++) {
        shard.seats.push({
          id: uuidv4(),
          match_id: match.id,
          category_id: catVIP.id,
          seat_number: `V-${s}`,
          row_number: '1',
          section: 'VIP',
          price: 550.00,
          status: 'available',
          created_at: new Date().toISOString(),
        });
      }
      for (let s = 1; s <= 15; s++) {
        shard.seats.push({
          id: uuidv4(),
          match_id: match.id,
          category_id: catPrem.id,
          seat_number: `P1-${s}`,
          row_number: '5',
          section: 'PREMIUM',
          price: 320.00,
          status: 'available',
          created_at: new Date().toISOString(),
        });
      }
      for (let s = 1; s <= 25; s++) {
        shard.seats.push({
          id: uuidv4(),
          match_id: match.id,
          category_id: catGen.id,
          seat_number: `G1-${s}`,
          row_number: '12',
          section: 'STANDARD',
          price: 150.00,
          status: 'available',
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  const adminId = 'a0000000-0000-0000-0000-000000000000';
  const hashedAdminPass = bcrypt.hashSync('Admin@Fifa2026!', 10);
  const adminUser = {
    id: adminId,
    full_name: 'FIFA Administrator',
    email: 'admin@fifa.com',
    password: hashedAdminPass,
    phone: '+41227918500',
    nationality: 'Switzerland',
    passport_number: 'CH-99201844',
    billing_address: {
      street: 'FIFA-Strasse 20',
      city: 'Zurich',
      postal_code: '8044',
      country: 'Switzerland',
    },
    payment_methods: [
      {
        id: 'pm-1',
        type: 'Visa Corporate',
        cardholder: 'FIFA Administrator',
        last4: '4242',
        expiry: '08/28',
        bank_name: 'UBS Switzerland AG',
        iban: 'CH93 0000 **** **** 8901',
        is_default: true,
      },
    ],
    preferences: {
      email_notifications: true,
      sms_alerts: true,
      two_factor_auth: true,
      currency: 'USD',
      seat_preference: 'VIP Hospitality',
    },
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  shards.europe.users.set(adminId, adminUser);
  shards.europe.usersByEmail.set('admin@fifa.com', adminId);

  const fanId = 'f0000000-0000-0000-0000-000000000001';
  const hashedFanPass = bcrypt.hashSync('Champion2026!', 10);
  const fanUser = {
    id: fanId,
    full_name: 'Lionel Messi',
    email: 'messi@fifa.com',
    password: hashedFanPass,
    phone: '+5491122334455',
    nationality: 'Argentina',
    passport_number: 'AR-10202610',
    billing_address: {
      street: 'Av. del Libertador 4200',
      city: 'Buenos Aires',
      postal_code: 'C1425',
      country: 'Argentina',
    },
    payment_methods: [
      {
        id: 'pm-2',
        type: 'MasterCard World Elite',
        cardholder: 'Lionel Messi',
        last4: '1010',
        expiry: '12/27',
        bank_name: 'Banco Santander Rio',
        iban: 'AR29 0072 **** **** 1010',
        is_default: true,
      },
    ],
    preferences: {
      email_notifications: true,
      sms_alerts: true,
      two_factor_auth: false,
      currency: 'USD',
      seat_preference: 'VIP Hospitality',
    },
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  shards.south_america.users.set(fanId, fanUser);
  shards.south_america.usersByEmail.set('messi@fifa.com', fanId);
};

const saveSnapshot = () => {
  try {
    const dir = path.dirname(SNAPSHOT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const serialized = {};
    for (const [region, shard] of Object.entries(shards)) {
      const realUsers = [];
      for (const u of shard.users.values()) {
        if (!u.email?.endsWith('@fifafan.org')) {
          realUsers.push(u);
        }
      }
      serialized[region] = {
        users: realUsers,
        bookings: shard.bookings,
        bookingSeats: shard.bookingSeats,
        payments: shard.payments,
        seats: shard.seats,
      };
    }
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(serialized, null, 2), 'utf8');
  } catch (err) {}
};

const loadSnapshot = () => {
  try {
    if (!fs.existsSync(SNAPSHOT_FILE)) return;
    const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
    const data = JSON.parse(raw);
    for (const [region, saved] of Object.entries(data)) {
      const shard = shards[region];
      if (!shard) continue;
      if (Array.isArray(saved.users)) {
        for (const u of saved.users) {
          shard.users.set(u.id, u);
          shard.usersByEmail.set(u.email.toLowerCase(), u.id);
        }
      }
      if (Array.isArray(saved.bookings)) shard.bookings = saved.bookings;
      if (Array.isArray(saved.bookingSeats)) shard.bookingSeats = saved.bookingSeats;
      if (Array.isArray(saved.payments)) shard.payments = saved.payments;
      if (Array.isArray(saved.seats) && saved.seats.length > 0) {
        const savedStatusMap = new Map(saved.seats.map((s) => [s.id, s.status]));
        shard.seats.forEach((seat) => {
          if (savedStatusMap.has(seat.id)) {
            seat.status = savedStatusMap.get(seat.id);
          }
        });
      }
    }
  } catch (err) {}
};

initSeedData();
loadSnapshot();

const executeSql = async (regionName, queryText, values = []) => {
  const normRegion = normalizeRegion(regionName);
  const shard = shards[normRegion];
  if (!shard) {
    throw new Error(`Region "${regionName}" not found.`);
  }

  const query = queryText.trim().replace(/\s+/g, ' ');

  if (query.match(/SELECT \* FROM users WHERE email = \$1/i)) {
    const email = (values[0] || '').toLowerCase().trim();
    const userId = shard.usersByEmail.get(email);
    if (userId) {
      const user = shard.users.get(userId);
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (query.match(/INSERT INTO users/i)) {
    const [full_name, email, password, phone, role] = values;
    const cleanEmail = email.toLowerCase().trim();

    if (shard.usersByEmail.has(cleanEmail)) {
      const err = new Error('duplicate key value violates unique constraint "users_email_key"');
      err.code = '23505';
      throw err;
    }

    const newUser = {
      id: uuidv4(),
      full_name,
      email: cleanEmail,
      password,
      phone: phone || null,
      role: role || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    shard.users.set(newUser.id, newUser);
    shard.usersByEmail.set(cleanEmail, newUser.id);
    saveSnapshot();

    return {
      rows: [{
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        created_at: newUser.created_at,
      }],
      rowCount: 1,
    };
  }

  if (query.match(/SELECT .+ FROM users WHERE id = \$1/i)) {
    const id = values[0];
    const user = shard.users.get(id);
    if (user) {
      if (query.match(/SELECT password FROM users/i)) {
        return { rows: [{ password: user.password }], rowCount: 1 };
      }
      const { password, ...safeUser } = user;
      return { rows: [safeUser], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (query.match(/UPDATE users SET/i)) {
    const id = values[0];
    const user = shard.users.get(id);
    if (!user) return { rows: [], rowCount: 0 };

    if (query.match(/SET password = \$2/i)) {
      user.password = values[1];
      user.updated_at = new Date().toISOString();
      saveSnapshot();
      return { rowCount: 1 };
    }

    const [, full_name, phone, nationality, passport_number, billing_address, payment_methods, preferences] = values;
    if (full_name !== undefined) user.full_name = full_name;
    if (phone !== undefined) user.phone = phone;
    if (nationality !== undefined) user.nationality = nationality;
    if (passport_number !== undefined) user.passport_number = passport_number;
    if (billing_address !== undefined) user.billing_address = billing_address;
    if (payment_methods !== undefined) user.payment_methods = payment_methods;
    if (preferences !== undefined) user.preferences = preferences;
    user.updated_at = new Date().toISOString();
    saveSnapshot();

    const { password, ...safeUser } = user;
    return { rows: [safeUser], rowCount: 1 };
  }

  if (query.match(/SELECT \* FROM stadiums/i)) {
    if (query.match(/WHERE id = \$1/i)) {
      const id = values[0];
      const match = shard.stadiums.find((s) => s.id === id);
      return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
    }
    return { rows: [...shard.stadiums], rowCount: shard.stadiums.length };
  }

  if (query.match(/FROM matches m/i)) {
    let rows = shard.matches.map((m) => {
      const st = shard.stadiums.find((s) => s.id === m.stadium_id) || {};
      return {
        ...m,
        stadium_name: st.name || 'FIFA Stadium',
        stadium_city: st.city || 'Unknown',
        capacity: st.capacity || 80000,
      };
    });

    if (query.match(/WHERE m\.id = \$1/i)) {
      const id = values[0];
      rows = rows.filter((m) => m.id === id);
    } else if (query.match(/WHERE m\.status = \$1/i)) {
      const status = values[0];
      rows = rows.filter((m) => m.status === status);
    } else if (query.match(/ILIKE \$1/i)) {
      const pat = (values[0] || '').replace(/%/g, '').toLowerCase();
      rows = rows.filter(
        (m) =>
          m.home_team.toLowerCase().includes(pat) ||
          m.away_team.toLowerCase().includes(pat) ||
          m.stadium_name.toLowerCase().includes(pat)
      );
    }

    return { rows, rowCount: rows.length };
  }

  if (query.match(/FROM seats s/i) && query.match(/WHERE s\.match_id = \$1/i)) {
    const matchId = values[0];
    const seats = shard.seats
      .filter((s) => s.match_id === matchId)
      .map((s) => {
        const cat = shard.categories.find((c) => c.id === s.category_id);
        return {
          id: s.id,
          seat_number: s.seat_number,
          row_number: s.row_number,
          section: s.section,
          price: s.price,
          status: s.status,
          category_name: cat ? cat.name : 'Standard',
        };
      });

    return { rows: seats, rowCount: seats.length };
  }

  if (query.match(/FROM seats/i) && query.match(/WHERE id = ANY/i)) {
    const seatIds = Array.isArray(values[0]) ? values[0] : [values[0]];
    const availableOnly = query.includes("status = 'available'");

    const matching = shard.seats.filter((s) => {
      if (!seatIds.includes(s.id)) return false;
      if (availableOnly && s.status !== 'available') return false;
      return true;
    });

    return { rows: matching, rowCount: matching.length };
  }

  if (query.match(/UPDATE seats SET status = 'booked'/i)) {
    const seatIds = Array.isArray(values[0]) ? values[0] : [values[0]];
    let count = 0;
    for (const seat of shard.seats) {
      if (seatIds.includes(seat.id)) {
        seat.status = 'booked';
        count++;
      }
    }
    return { rowCount: count };
  }

  if (query.match(/INSERT INTO bookings/i)) {
    const [userId, matchId, totalAmount] = values;
    const booking = {
      id: uuidv4(),
      user_id: userId,
      match_id: matchId,
      total_amount: Number(totalAmount),
      status: 'confirmed',
      booked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    shard.bookings.push(booking);
    return { rows: [{ id: booking.id }], rowCount: 1 };
  }

  if (query.match(/INSERT INTO booking_seats/i)) {
    const [bookingId, seatId] = values;
    const entry = { id: uuidv4(), booking_id: bookingId, seat_id: seatId };
    shard.bookingSeats.push(entry);
    return { rowCount: 1 };
  }

  if (query.match(/INSERT INTO payments/i)) {
    const [bookingId, amount, transactionId, paymentMethod] = values;
    const payment = {
      id: uuidv4(),
      booking_id: bookingId,
      amount: Number(amount),
      payment_status: 'success',
      transaction_id: transactionId,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    shard.payments.push(payment);
    saveSnapshot();
    return { rowCount: 1 };
  }

  if (query.match(/FROM bookings b/i) && query.match(/JOIN matches m/i)) {
    const userId = values[0];
    const userBookings = shard.bookings
      .filter((b) => b.user_id === userId)
      .map((b) => {
        const match = shard.matches.find((m) => m.id === b.match_id) || {};
        const stadium = shard.stadiums.find((s) => s.id === match.stadium_id) || {};
        const bookingSeats = shard.bookingSeats.filter((bs) => bs.booking_id === b.id);
        const seatDetails = bookingSeats.map((bs) => {
          const seat = shard.seats.find((s) => s.id === bs.seat_id) || {};
          return { seat_number: seat.seat_number || 'N/A', price: seat.price || 0 };
        });

        return {
          booking_id: b.id,
          total_amount: b.total_amount,
          booking_status: b.status,
          booked_at: b.booked_at,
          home_team: match.home_team || 'TBD',
          away_team: match.away_team || 'TBD',
          match_date: match.match_date || new Date().toISOString(),
          stadium_name: stadium.name || 'FIFA Arena',
          seats: seatDetails,
        };
      });

    return { rows: userBookings, rowCount: userBookings.length };
  }

  if (query.match(/SELECT \* FROM bookings WHERE id = \$1 AND user_id = \$2/i)) {
    const [bookingId, userId] = values;
    const booking = shard.bookings.find((b) => b.id === bookingId && b.user_id === userId);
    return { rows: booking ? [booking] : [], rowCount: booking ? 1 : 0 };
  }

  if (query.match(/UPDATE bookings SET status = 'cancelled'/i)) {
    const [bookingId] = values;
    const booking = shard.bookings.find((b) => b.id === bookingId);
    if (!booking) return { rowCount: 0 };
    booking.status = 'cancelled';
    booking.updated_at = new Date().toISOString();

    const linkedSeatIds = shard.bookingSeats
      .filter((bs) => bs.booking_id === bookingId)
      .map((bs) => bs.seat_id);

    for (const seat of shard.seats) {
      if (linkedSeatIds.includes(seat.id)) {
        seat.status = 'available';
      }
    }

    const payment = shard.payments.find((p) => p.booking_id === bookingId);
    if (payment) {
      payment.payment_status = 'refunded';
    }

    saveSnapshot();
    return { rows: [booking], rowCount: 1 };
  }

  if (query.match(/SUM\(total_amount\)/i)) {
    const revenue = shard.bookings
      .filter((b) => b.status === 'confirmed')
      .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    const totalBookings = shard.bookings.filter((b) => b.status === 'confirmed').length;
    return { rows: [{ revenue, total_bookings: totalBookings }], rowCount: 1 };
  }

  if (query.match(/SELECT COUNT\(id\) AS seats_booked/i)) {
    const bookedCount = shard.seats.filter((s) => s.status === 'booked').length;
    return { rows: [{ seats_booked: bookedCount }], rowCount: 1 };
  }

  if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(query.toUpperCase())) {
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
};

const getShardMetrics = () => {
  const metrics = {};
  for (const [region, shard] of Object.entries(shards)) {
    metrics[region] = {
      dbName: shard.dbName,
      totalUsers: shard.users.size + (shard.virtualUserCount || 0),
      indexedUsersInMemory: shard.users.size,
      totalStadiums: shard.stadiums.length,
      totalMatches: shard.matches.length,
      totalSeats: shard.seats.length,
      totalBookings: shard.bookings.length,
      totalPayments: shard.payments.length,
    };
  }
  return metrics;
};

const MAX_IN_MEMORY_RECORDS_PER_SHARD = 25000;

const batchInsertFakeUsers = (region, usersList) => {
  const normRegion = normalizeRegion(region);
  const shard = shards[normRegion];
  if (!shard) return 0;

  let inserted = 0;
  for (let i = 0; i < usersList.length; i++) {
    const u = usersList[i];
    if (shard.users.size < MAX_IN_MEMORY_RECORDS_PER_SHARD) {
      shard.users.set(u.id, u);
      shard.usersByEmail.set(u.email, u.id);
    } else {
      shard.virtualUserCount = (shard.virtualUserCount || 0) + 1;
    }
    inserted++;
  }
  return inserted;
};

const streamPartitionedTraffic = (totalCount) => {
  const regions = ['europe', 'asia', 'north_america', 'south_america'];
  const perShard = Math.floor(totalCount / 4);
  const remainder = totalCount % 4;

  regions.forEach((r, idx) => {
    const addCount = perShard + (idx < remainder ? 1 : 0);
    shards[r].virtualUserCount = (shards[r].virtualUserCount || 0) + addCount;
  });

  return totalCount;
};

module.exports = {
  shards,
  executeSql,
  normalizeRegion,
  getShardMetrics,
  batchInsertFakeUsers,
  streamPartitionedTraffic,
};

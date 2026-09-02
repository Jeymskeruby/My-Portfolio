/**
 * mock-seed-data.js
 * ------------------------------------------------------------------
 * Starting dataset for the iServe portfolio demo. Loaded BEFORE
 * mock-firebase.js so window.__ISERVE_SEED__ is available the first
 * time the mock database initializes (or after a reset).
 *
 * All names, emails, and organizations below are fictional demo data.
 * ------------------------------------------------------------------
 */
window.__ISERVE_SEED__ = function (Timestamp) {
  const now = Date.now();
  const days = (n) => new Timestamp(now + n * 24 * 60 * 60 * 1000);

  // ---- fixed demo IDs so cross-references stay stable ----
  const VOL1 = 'user_demo_juan';
  const VOL2 = 'user_demo_maria';
  const VOL3 = 'user_demo_carlos';
  const ORG1 = 'org_demo_greenearth';   // approved organizer
  const ORG2 = 'org_demo_readforward';  // approved organizer
  const ORG3 = 'org_demo_pending';      // pending approval organizer (for admin demo)
  const ADMIN1 = 'admin_demo_main';

  const EV1 = 'event_demo_coastal_cleanup';
  const EV2 = 'event_demo_book_drive';
  const EV3 = 'event_demo_tree_planting';
  const EV4 = 'event_demo_feeding_program';
  const EV5 = 'event_demo_pending_review';

  return {
    // ---------------- auth accounts ----------------
    // password for every demo account: "demo1234"
    __authUsers: {
      [VOL1]: { uid: VOL1, email: 'juan.delacruz@example.com', password: 'demo1234', emailVerified: true, displayName: null },
      [VOL2]: { uid: VOL2, email: 'maria.santos@example.com', password: 'demo1234', emailVerified: true, displayName: null },
      [VOL3]: { uid: VOL3, email: 'carlos.reyes@example.com', password: 'demo1234', emailVerified: true, displayName: null },
      [ORG1]: { uid: ORG1, email: 'contact@greenearth.demo', password: 'demo1234', emailVerified: true, displayName: 'pending_organizer' },
      [ORG2]: { uid: ORG2, email: 'hello@readforward.demo', password: 'demo1234', emailVerified: true, displayName: 'pending_organizer' },
      [ORG3]: { uid: ORG3, email: 'info@newpaws.demo', password: 'demo1234', emailVerified: true, displayName: 'pending_organizer' },
      [ADMIN1]: { uid: ADMIN1, email: 'admin@admin.iserve.demo', password: 'demo1234', emailVerified: true, displayName: null },
    },

    // ---------------- volunteers ----------------
    users: {
      [VOL1]: {
        firstName: 'Juan', lastName: 'Dela Cruz', username: 'juandelacruz', email: 'juan.delacruz@example.com',
        emailVerified: true, isAdmin: false, profileComplete: true, status: 'active',
        skills: ['Teaching', 'First Aid', 'Event Coordination'],
        bio: 'BS Education student who loves volunteering on weekends.',
        availability: { day: 'Weekends', time: 'Morning (6AM-12PM)' }, createdAt: days(-40)
      },
      [VOL2]: {
        firstName: 'Maria', lastName: 'Santos', username: 'mariasantos', email: 'maria.santos@example.com',
        emailVerified: true, isAdmin: false, profileComplete: true, status: 'active',
        skills: ['Gardening', 'Environmental Awareness', 'Photography'],
        bio: 'Environmental science major, into tree planting and coastal cleanups.',
        availability: { day: 'Both', time: 'Flexible' }, createdAt: days(-30)
      },
      [VOL3]: {
        firstName: 'Carlos', lastName: 'Reyes', username: 'carlosreyes', email: 'carlos.reyes@example.com',
        emailVerified: true, isAdmin: false, profileComplete: true, status: 'active',
        skills: ['Cooking', 'Logistics', 'Driving'],
        bio: 'Enjoys community feeding programs and logistics support.',
        availability: { day: 'Weekdays', time: 'Evening (6PM-10PM)' }, createdAt: days(-20)
      }
    },

    // ---------------- organizers ----------------
    organizers: {
      [ORG1]: {
        uid: ORG1, organizationName: 'GreenEarth Volunteers', organizationType: 'Non-Profit',
        registrationNumber: 'DEMO-REG-1001', website: 'https://greenearth.demo',
        contactPerson: 'Andrea Lim', position: 'Volunteer Coordinator',
        officialEmail: 'contact@greenearth.demo', authEmail: 'contact@greenearth.demo',
        contactNumber: '0917-000-1111', username: 'greenearth', password: 'demo1234',
        status: 'approved', authDisabled: false, documentStatus: 'verified',
        loginAttempts: 0, lastLoginAttempt: null, lastLogin: null,
        createdAt: days(-60), updatedAt: days(-55), registrationDate: '2026-06-10'
      },
      [ORG2]: {
        uid: ORG2, organizationName: 'Read Forward Foundation', organizationType: 'Non-Profit',
        registrationNumber: 'DEMO-REG-1002', website: 'https://readforward.demo',
        contactPerson: 'Ben Tolentino', position: 'Program Director',
        officialEmail: 'hello@readforward.demo', authEmail: 'hello@readforward.demo',
        contactNumber: '0917-000-2222', username: 'readforward', password: 'demo1234',
        status: 'approved', authDisabled: false, documentStatus: 'verified',
        loginAttempts: 0, lastLoginAttempt: null, lastLogin: null,
        createdAt: days(-50), updatedAt: days(-45), registrationDate: '2026-06-20'
      },
      [ORG3]: {
        uid: ORG3, organizationName: 'New Paws Animal Rescue', organizationType: 'Community Group',
        registrationNumber: 'DEMO-REG-1003', website: 'https://newpaws.demo',
        contactPerson: 'Trisha Gomez', position: 'Founder',
        officialEmail: 'info@newpaws.demo', authEmail: 'info@newpaws.demo',
        contactNumber: '0917-000-3333', username: 'newpaws', password: 'demo1234',
        status: 'pending', authDisabled: false, documentStatus: 'will_request',
        loginAttempts: 0, lastLoginAttempt: null, lastLogin: null,
        createdAt: days(-2), updatedAt: days(-2), registrationDate: '2026-08-06'
      }
    },

    // ---------------- admins ----------------
    admins: {
      [ADMIN1]: { uid: ADMIN1, email: 'admin@admin.iserve.demo', role: 'super_admin', createdAt: days(-90) }
    },

    // ---------------- events ----------------
    events: {
      [EV1]: {
        name: 'Coastal Cleanup Drive', description: 'Join us for a morning of shoreline cleanup and waste segregation to protect marine life along the bay.',
        category: 'Environment', location: 'Manila Bay Baywalk',
        startTime: days(6), endTime: days(6),
        requiredSkills: ['Environmental Awareness', 'Logistics'],
        maxVolunteers: 30, currentVolunteers: 1,
        organizerId: ORG1, organizerName: 'GreenEarth Volunteers',
        status: 'approved', createdAt: days(-20), updatedAt: days(-20), isDeleted: false
      },
      [EV2]: {
        name: 'Community Book Drive', description: 'Help sort and distribute donated books to public elementary schools in need of reading materials.',
        category: 'Education', location: 'Read Forward Community Hub, Quezon City',
        startTime: days(10), endTime: days(10),
        requiredSkills: ['Teaching', 'Event Coordination'],
        maxVolunteers: 20, currentVolunteers: 1,
        organizerId: ORG2, organizerName: 'Read Forward Foundation',
        status: 'approved', createdAt: days(-15), updatedAt: days(-15), isDeleted: false
      },
      [EV3]: {
        name: 'Urban Tree Planting', description: 'Plant native tree seedlings along the riverbank as part of our reforestation program.',
        category: 'Environment', location: 'Marikina Riverbanks Park',
        startTime: days(-5), endTime: days(-5),
        requiredSkills: ['Gardening', 'Environmental Awareness'],
        maxVolunteers: 25, currentVolunteers: 3,
        organizerId: ORG1, organizerName: 'GreenEarth Volunteers',
        status: 'completed', createdAt: days(-25), updatedAt: days(-5), isDeleted: false
      },
      [EV4]: {
        name: 'Weekend Feeding Program', description: 'Prepare and distribute meals for families in an underserved barangay community.',
        category: 'Community Service', location: 'Barangay Hall, Pasig City',
        startTime: days(3), endTime: days(3),
        requiredSkills: ['Cooking', 'Logistics', 'Driving'],
        maxVolunteers: 15, currentVolunteers: 1,
        organizerId: ORG2, organizerName: 'Read Forward Foundation',
        status: 'approved', createdAt: days(-8), updatedAt: days(-8), isDeleted: false
      },
      [EV5]: {
        name: 'Animal Shelter Adoption Fair', description: 'Assist with set-up and animal handling during our monthly adoption fair.',
        category: 'Animal Welfare', location: 'New Paws Shelter, Antipolo',
        startTime: days(14), endTime: days(14),
        requiredSkills: ['Event Coordination'],
        maxVolunteers: 12, currentVolunteers: 0,
        organizerId: ORG3, organizerName: 'New Paws Animal Rescue',
        status: 'pending', createdAt: days(-1), updatedAt: days(-1), isDeleted: false
      }
    },

    // ---------------- confirmed participants ----------------
    // status is 'approved' for every active/historical registration — the
    // dashboards read `where('status','==','approved')` / `in ['registered',
    // 'active','approved']`, and "completed" is derived from the event's
    // endTime, not stored here. organizerId mirrors the linked event so the
    // organizer dashboard's volunteer count can filter by it.
    eventParticipants: {
      'part_demo_1': { userId: VOL2, eventId: EV1, organizerId: ORG1, status: 'approved', joinedAt: days(-4) },
      'part_demo_2': { userId: VOL1, eventId: EV2, organizerId: ORG2, status: 'approved', joinedAt: days(-3) },
      'part_demo_3': { userId: VOL2, eventId: EV3, organizerId: ORG1, status: 'approved', joinedAt: days(-24) },
      'part_demo_4': { userId: VOL3, eventId: EV4, organizerId: ORG2, status: 'approved', joinedAt: days(-2) },
      // Juan + Carlos also attended the (now completed) tree planting — gives
      // the demo volunteer login a populated "Completed Events" tab.
      'part_demo_5': { userId: VOL1, eventId: EV3, organizerId: ORG1, status: 'approved', joinedAt: days(-24) },
      'part_demo_6': { userId: VOL3, eventId: EV3, organizerId: ORG1, status: 'approved', joinedAt: days(-24) }
    },

    // ---------------- pending join requests (for organizer/admin demo) ----------------
    joinRequests: {
      'jr_demo_1': {
        userId: VOL3, eventId: EV1, organizerId: ORG1, status: 'pending',
        userName: 'Carlos Reyes', userFirstName: 'Carlos', userLastName: 'Reyes',
        userEmail: 'carlos.reyes@example.com', userSkills: ['Cooking', 'Logistics', 'Driving'],
        eventName: 'Coastal Cleanup Drive', organizerName: 'GreenEarth Volunteers', requestedAt: days(-1)
      },
      'jr_demo_2': {
        userId: VOL1, eventId: EV4, organizerId: ORG2, status: 'pending',
        userName: 'Juan Dela Cruz', userFirstName: 'Juan', userLastName: 'Dela Cruz',
        userEmail: 'juan.delacruz@example.com', userSkills: ['Teaching', 'First Aid', 'Event Coordination'],
        eventName: 'Weekend Feeding Program', organizerName: 'Read Forward Foundation', requestedAt: days(-1)
      },
      'jr_demo_3': {
        userId: VOL2, eventId: EV2, organizerId: ORG2, status: 'approved',
        userName: 'Maria Santos', userFirstName: 'Maria', userLastName: 'Santos',
        userEmail: 'maria.santos@example.com', userSkills: ['Gardening', 'Environmental Awareness', 'Photography'],
        eventName: 'Community Book Drive', organizerName: 'Read Forward Foundation', requestedAt: days(-6)
      }
    },

    // ---------------- notifications ----------------
    adminNotifications: {
      'an_demo_1': { type: 'new_organizer', title: 'New organizer registration', message: 'New Paws Animal Rescue registered and is awaiting approval.', read: false, createdAt: days(-2) },
      'an_demo_2': { type: 'new_event', title: 'Event pending review', message: 'New Paws Animal Rescue submitted a new event for review.', read: false, createdAt: days(-1) },
      'an_demo_3': { type: 'new_volunteer', title: 'New volunteer', message: 'Carlos Reyes joined iServe.', read: true, createdAt: days(-20) }
    },
    volunteerNotifications: {
      'vn_demo_1': { userId: VOL1, type: 'application_sent', title: 'Request submitted', message: 'Your request to join "Weekend Feeding Program" is pending organizer approval.', read: false, createdAt: days(-2) },
      'vn_demo_2': { userId: VOL2, type: 'request_approved', title: 'Request approved', message: 'You are registered for "Coastal Cleanup Drive".', read: true, createdAt: days(-4) }
    },
    organizerNotifications: {
      'on_demo_1': { organizerId: ORG1, type: 'new_join_request', title: 'New join request', message: 'Carlos Reyes requested to join "Coastal Cleanup Drive".', read: false, createdAt: days(-1) },
      'on_demo_2': { organizerId: ORG2, type: 'new_join_request', title: 'New join request', message: 'Juan Dela Cruz requested to join "Weekend Feeding Program".', read: false, createdAt: days(-1) }
    }
  };
};

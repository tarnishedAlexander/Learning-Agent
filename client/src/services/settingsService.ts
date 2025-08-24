export type UserSettings = {
  profile: {
    fullName: string;
    role: "Student" | "Professor";
    headline?: string;
    avatarUrl?: string;
  };
  account: { email: string; username: string };
  notifications: {
    emailAnnouncements: boolean;
    emailReminders: boolean;
    pushMentions: boolean;
    pushGrades: boolean;
  };
  preferences: {
    theme: "system" | "light" | "dark";
    language: "en" | "es";
    timezone: string;
    dateFormat: string;
  };
};

export async function getSettings(): Promise<UserSettings> {
  // Replace with: const res = await fetch('/api/settings'); return res.json();
  await sleep(300);
  return {
    profile: {
      fullName: "Nora Watson",
      role: "Professor",
      headline: "Sales Manager",
      avatarUrl: "https://i.pravatar.cc/128?img=5",
    },
    account: {
      email: "nora@example.com",
      username: "nora",
    },
    notifications: {
      emailAnnouncements: true,
      emailReminders: true,
      pushMentions: true,
      pushGrades: false,
    },
    preferences: {
      theme: "system",
      language: "en",
      timezone: "America/La_Paz",
      dateFormat: "DD/MM/YYYY",
    },
  };
}

export async function updateProfile(payload: {
  fullName: string;
  headline?: string;
  role: string;
  avatarBase64?: string;
}) {
  await sleep(300);
  return true;
}

export async function updateAccount(payload: {
  email: string;
  username: string;
}) {
  await sleep(300);
  return true;
}

export async function updatePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  await sleep(300);
  return true;
}

export async function updateNotifications(payload: { [k: string]: boolean }) {
  await sleep(300);
  return true;
}

export async function updatePreferences(payload: {
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
}) {
  await sleep(300);
  return true;
}

export async function deleteAccount() {
  await sleep(300);
  return true;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

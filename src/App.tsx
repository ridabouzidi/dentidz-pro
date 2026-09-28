import React, { useState, useMemo } from "react";
import {
  Shield,
  User,
  Calendar,
  MapPin,
  Mail,
  Globe,
  MessageCircle,
  LogOut,
  Plus,
  Check,
  X,
  Clock,
  Phone,
  Stethoscope,
  BarChart3,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Bell,
  BellRing,
  Send,
  History,
  FileText,
  Smartphone,
  Settings2,
  Bot,
  Zap,
  MessageSquare,
  Reply,
  Headset,
} from "lucide-react";

type SubStatus = "active" | "expired" | "blocked";
type BookingStatus = "pending" | "confirmed" | "done" | "cancelled";
type ReminderChannel = "whatsapp" | "sms";
type ReminderStatus = "sent" | "pending";

interface BotReply {
  id: string;
  label: string;
  keywords: string[];
  response: string;
}
interface BotConfig {
  enabled: boolean;
  welcomeMessage: string;
  replies: BotReply[];
  fallbackMessage: string;
}
interface ChatMsg {
  id: number;
  from: "user" | "bot";
  text: string;
  time: string;
}
interface BotInboxItem {
  id: number;
  dentistCode: string;
  patientName: string;
  phone: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  autoReplied: boolean;
}

interface Subscription {
  id: number;
  doctorName: string;
  code: string;
  expiry: Date;
  status: SubStatus;
}

interface DoctorProfile {
  name: string;
  address: string;
  email: string;
  website: string;
  whatsapp: string;
  services: string[];
  city?: string;
}

interface Booking {
  id: number;
  dentistCode: string;
  patientName: string;
  phone: string;
  date: string;
  time: string;
  service: string;
  status: BookingStatus;
}

interface ReminderLog {
  id: number;
  bookingId: number;
  dentistCode: string;
  patientName: string;
  phone: string;
  date: string;
  time: string;
  channel: ReminderChannel;
  message: string;
  sentAt: string;
  status: ReminderStatus;
  templateType: "24h" | "2h" | "manual";
}

const SERVICES_DEFAULT = [
  "تنظيف الأسنان - Détartrage",
  "حشو الأسنان - Obturation",
  "تقويم الأسنان - Orthodontie",
  "تبييض الأسنان - Blanchiment",
  "زراعة الأسنان - Implant",
  "قلع الأسنان - Extraction",
];

const getTodayStr = () => new Date().toISOString().split("T")[0];
const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};
const getDayAfterStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
};

const initialSubs: Subscription[] = [
  {
    id: 1,
    doctorName: "Dr. Amine - Skikda",
    code: "DENT-2026-SKIKDA",
    expiry: new Date(new Date().setMonth(new Date().getMonth() + 10)),
    status: "active",
  },
  {
    id: 2,
    doctorName: "Dr. Sara - Alger Centre",
    code: "DENT-2026-DEMO",
    expiry: new Date(new Date().setMonth(new Date().getMonth() + 8)),
    status: "active",
  },
  {
    id: 3,
    doctorName: "Dr. Yacine - Oran",
    code: "DENT-2025-EXPR",
    expiry: new Date(new Date().setMonth(new Date().getMonth() - 2)),
    status: "expired",
  },
];

const initialProfiles: Record<string, DoctorProfile> = {
  "DENT-2026-SKIKDA": {
    name: "Dr. Amine Benali",
    address: "حي 20 أوت، سكيكدة - بالقرب من المستشفى، الطابق 2",
    email: "amine.benali@dentidz.dz",
    website: "www.dr-amine-skikda.dz",
    whatsapp: "213555123456",
    services: SERVICES_DEFAULT.slice(0, 5),
    city: "سكيكدة",
  },
  "DENT-2026-DEMO": {
    name: "Dr. Sara Mansouri",
    address: "شارع ديدوش مراد، الجزائر العاصمة",
    email: "sara.m@dentidz.dz",
    website: "www.dr-sara.dz",
    whatsapp: "213666987654",
    services: SERVICES_DEFAULT,
    city: "الجزائر",
  },
  "DENT-2025-EXPR": {
    name: "Dr. Yacine",
    address: "وهران - السانيا",
    email: "yacine@dentidz.dz",
    website: "www.dryacine.dz",
    whatsapp: "213770112233",
    services: SERVICES_DEFAULT.slice(0, 3),
    city: "وهران",
  },
};

// dynamic bookings to show reminder logic working with tomorrow
const _today = getTodayStr();
const _tomorrow = getTomorrowStr();
const _dayAfter = getDayAfterStr();

const initialBookings: Booking[] = [
  {
    id: 1,
    dentistCode: "DENT-2026-SKIKDA",
    patientName: "محمد لمين",
    phone: "0550 12 34 56",
    date: _tomorrow,
    time: "09:30",
    service: "تنظيف الأسنان - Détartrage",
    status: "confirmed",
  },
  {
    id: 2,
    dentistCode: "DENT-2026-SKIKDA",
    patientName: "فاطمة زهرة",
    phone: "0661 98 76 54",
    date: _tomorrow,
    time: "11:00",
    service: "حشو الأسنان - Obturation",
    status: "confirmed",
  },
  {
    id: 3,
    dentistCode: "DENT-2026-SKIKDA",
    patientName: "Karim B.",
    phone: "0770 22 33 44",
    date: _today,
    time: "15:00",
    service: "تبييض الأسنان - Blanchiment",
    status: "confirmed",
  },
  {
    id: 4,
    dentistCode: "DENT-2026-DEMO",
    patientName: "Leila A.",
    phone: "0555 66 77 88",
    date: _tomorrow,
    time: "10:00",
    service: "تقويم الأسنان - Orthodontie",
    status: "pending",
  },
  {
    id: 5,
    dentistCode: "DENT-2026-SKIKDA",
    patientName: "سليم حمدي",
    phone: "0555 11 22 33",
    date: _dayAfter,
    time: "16:30",
    service: "زراعة الأسنان - Implant",
    status: "confirmed",
  },
];

const DEFAULT_TEMPLATES = {
  t24: "مرحبا [اسم المريض]، نذكرك بموعدك غدا عند الدكتور [الاسم] على الساعة [الوقت] في [العنوان] 🦷✨",
  t2: "مرحبا [اسم المريض]، موعدك اليوم عند الدكتور [الاسم] على الساعة [الوقت]. ننتظرك في [العنوان] - لا تتأخر 😊",
  tManual: "مرحبا [اسم المريض]، نذكرك بموعدك عند الدكتور [الاسم] يوم [التاريخ] على الساعة [الوقت] في [العنوان]",
};

const DEFAULT_BOT_REPLIES: BotReply[] = [
  {
    id: "1",
    label: "حجز موعد - Réserver RDV",
    keywords: ["1", "موعد", "حجز", "rdv", "booking", "reserver"],
    response: "لحجز موعد جديد 📅، أرسل:\n• اسمك الكامل\n• التاريخ المطلوب\n• الخدمة\n\nأو احجز مباشرة عبر منصتنا: dentidz.dz\nسنؤكد لك الموعد خلال دقائق ⏰",
  },
  {
    id: "2",
    label: "العنوان - Adresse",
    keywords: ["2", "عنوان", "موقع", "أين", "adresse", "map", "localisation"],
    response: "📍 عنوان العيادة: [العنوان]\n\n⏰ مواعيد العمل: السبت - الخميس\n08:30 - 12:00 | 14:00 - 17:30\n\n📞 واتساب: [واتساب]\nhttps://maps.google.com/?q=[العنوان]",
  },
  {
    id: "3",
    label: "الخدمات والأسعار - Services & Prix",
    keywords: ["3", "خدمات", "أسعار", "سعر", "service", "prix", "tarif"],
    response: "🦷 خدماتنا:\n• تنظيف الأسنان - 3000 DA\n• حشو الأسنان - 4000 DA\n• تبييض - 15000 DA\n• تقويم - ابتداء من 40000 DA\n• زراعة - ابتداء من 50000 DA\n\nأرسل رقم 1 للحجز 🦷",
  },
  {
    id: "4",
    label: "تحدث مع الطبيب - Parler au dentiste",
    keywords: ["4", "طبيب", "تواصل", "اتصال", "docteur", "parler", "humain"],
    response: "سيتم تحويلك للطبيب 👨‍⚕️ [الاسم]\nعادة نرد خلال 15 دقيقة ⏱️\n\nفي الحالات المستعجلة اتصل: [واتساب]\nشكرا لثقتك 🙏",
  },
];

const DEFAULT_BOT_CONFIG: BotConfig = {
  enabled: true,
  welcomeMessage: "مرحبا 👋 أهلا بك في عيادة [الاسم] 🦷\n\nبماذا نستطيع أن نخدمك؟\n\n1️⃣ حجز موعد جديد\n2️⃣ معرفة عنوان العيادة\n3️⃣ الخدمات والأسعار\n4️⃣ التحدث مع الطبيب مباشرة\n\nأرسل رقم الخدمة (1-4) أو اكتب سؤالك 💬",
  replies: DEFAULT_BOT_REPLIES,
  fallbackMessage: "لم أفهم طلبك 🤔\n\nبماذا نستطيع أن نخدمك؟\n1️⃣ حجز موعد\n2️⃣ العنوان\n3️⃣ الخدمات\n4️⃣ التحدث مع الطبيب\n\nأرسل رقما من 1 إلى 4",
};

const initialReminderHistory: ReminderLog[] = [
  {
    id: 101,
    bookingId: 3,
    dentistCode: "DENT-2026-SKIKDA",
    patientName: "Karim B.",
    phone: "0770 22 33 44",
    date: _today,
    time: "15:00",
    channel: "whatsapp",
    message: `مرحبا Karim B.، موعدك اليوم عند الدكتور Dr. Amine Benali على الساعة 15:00. ننتظرك في حي 20 أوت، سكيكدة`,
    sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "sent",
    templateType: "2h",
  },
];

export default function App() {
  // SECURITY FIX: Default is patient (public marketplace), admin is hidden behind /owner-secure-bba-2026 + secret code
  const getInitialView = (): "patient" | "dentist" | "admin" | "admin-login" => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes("owner-secure-bba-2026") || hash.includes("owner-secure-bba-2026")) {
        return "admin-login";
      }
    }
    return "patient";
  };
  const [view, setView] = useState<"patient" | "dentist" | "admin" | "admin-login">(getInitialView());
  const [ownerAuthenticated, setOwnerAuthenticated] = useState(false);
  const [ownerSecretInput, setOwnerSecretInput] = useState("");
  const [ownerLoginError, setOwnerLoginError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubs);
  const [profiles, setProfiles] = useState<Record<string, DoctorProfile>>(initialProfiles);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  // Reminder system state
  const [reminderEnabled, setReminderEnabled] = useState<Record<string, boolean>>({
    "DENT-2026-SKIKDA": true,
    "DENT-2026-DEMO": true,
    "DENT-2025-EXPR": false,
  });
  const [reminderTemplates, setReminderTemplates] = useState(DEFAULT_TEMPLATES);
  const [reminderHistory, setReminderHistory] = useState<ReminderLog[]>(initialReminderHistory);
  const [smsSimulateToast, setSmsSimulateToast] = useState<string | null>(null);
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const [renewedIds, setRenewedIds] = useState<number[]>([]);
  const [botApplied, setBotApplied] = useState(false);
  // WhatsApp Bot system state
  const [botConfigs, setBotConfigs] = useState<Record<string, BotConfig>>({
    "DENT-2026-SKIKDA": { ...DEFAULT_BOT_CONFIG, replies: [...DEFAULT_BOT_REPLIES] },
    "DENT-2026-DEMO": { ...DEFAULT_BOT_CONFIG, replies: [...DEFAULT_BOT_REPLIES] },
    "DENT-2025-EXPR": { ...DEFAULT_BOT_CONFIG, enabled: false, replies: [...DEFAULT_BOT_REPLIES] },
  });
  const [botDefaultConfig, setBotDefaultConfig] = useState<BotConfig>({ ...DEFAULT_BOT_CONFIG, replies: [...DEFAULT_BOT_REPLIES] });
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { id: 1, from: "user", text: "السلام عليكم", time: "10:02" },
    { id: 2, from: "bot", text: "", time: "10:02" }, // will be filled dynamically
  ]);
  const [chatInput, setChatInput] = useState("");
  const [botInbox] = useState<BotInboxItem[]>([
    { id: 1, dentistCode: "DENT-2026-SKIKDA", patientName: "أمينة", phone: "0550123456", lastMessage: "بماذا نستطيع أن نخدمك؟", time: "منذ دقيقة", unread: true, autoReplied: true },
    { id: 2, dentistCode: "DENT-2026-SKIKDA", patientName: "يوسف", phone: "0661987654", lastMessage: "أريد حجز موعد غدا", time: "منذ 5 دق", unread: false, autoReplied: true },
    { id: 3, dentistCode: "DENT-2026-SKIKDA", patientName: "Karim", phone: "0770223344", lastMessage: "كم سعر التنظيف؟", time: "منذ ساعة", unread: false, autoReplied: true },
  ]);

  // Admin - Owner full form
  const CITIES = ["عنابة", "سكيكدة", "قسنطينة", "الجزائر", "وهران"];
  const [ownerForm, setOwnerForm] = useState({
    name: "",
    address: "",
    email: "",
    website: "",
    whatsapp: "",
    city: "سكيكدة",
  });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<{ code: string; profile: DoctorProfile } | null>(null);
  const [copiedLogin, setCopiedLogin] = useState(false);

  // Dentist Auth
  const [codeInput, setCodeInput] = useState("");
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [dentistTab, setDentistTab] = useState<"profile" | "bookings" | "calendar" | "reminders" | "bot">("bookings");

  // Patient
  const [selectedDentistCode, setSelectedDentistCode] = useState("DENT-2026-SKIKDA");
  const [patientForm, setPatientForm] = useState({
    patientName: "",
    phone: "",
    service: SERVICES_DEFAULT[0],
    date: "",
    time: "",
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const activeSubs = useMemo(
    () => subscriptions.filter((s) => s.status === "active" && s.expiry > new Date()),
    [subscriptions]
  );

  const currentSub = useMemo(
    () => subscriptions.find((s) => s.code === currentCode),
    [currentCode, subscriptions]
  );

  const currentProfile = currentCode ? profiles[currentCode] : null;
  const selectedProfile = profiles[selectedDentistCode];
  const selectedSub = subscriptions.find((s) => s.code === selectedDentistCode);

  const isExpired = (expiry: Date) => expiry < new Date();

  // Helpers for reminders
  const cleanPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return "213" + digits.slice(1);
    if (digits.startsWith("213")) return digits;
    if (digits.length === 10) return "213" + digits.slice(1);
    return digits;
  };

  const buildMessage = (template: string, booking: Booking, profile: DoctorProfile) => {
    return template
      .replace(/\[اسم المريض\]/g, booking.patientName)
      .replace(/\[الاسم\]/g, profile.name)
      .replace(/\[الوقت\]/g, booking.time)
      .replace(/\[العنوان\]/g, profile.address || "العيادة")
      .replace(/\[التاريخ\]/g, booking.date);
  };

  const buildBotMessage = (template: string, profile: DoctorProfile) => {
    return template
      .replace(/\[الاسم\]/g, profile.name)
      .replace(/\[العنوان\]/g, profile.address || "العيادة")
      .replace(/\[واتساب\]/g, profile.whatsapp || "واتساب العيادة");
  };

  const getBotResponse = (userText: string, config: BotConfig, profile: DoctorProfile): string => {
    const lower = userText.toLowerCase().trim();
    // exact number 1-4
    if (["1", "2", "3", "4"].includes(lower)) {
      const found = config.replies.find((r) => r.id === lower);
      if (found) return buildBotMessage(found.response, profile);
    }
    // keyword matching
    for (const reply of config.replies) {
      for (const kw of reply.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          return buildBotMessage(reply.response, profile);
        }
      }
    }
    // greeting triggers welcome
    const greetings = ["سلام", "مرحبا", "bonjour", "salam", "hi", "hello", "cc"];
    if (greetings.some((g) => lower.includes(g))) {
      return buildBotMessage(config.welcomeMessage, profile);
    }
    return buildBotMessage(config.fallbackMessage, profile);
  };

  const getBookingReminderStatus = (bookingId: number) => {
    const log = reminderHistory.find((r) => r.bookingId === bookingId && r.status === "sent");
    if (log) return "sent" as const;
    // check if booking date is tomorrow or today and not done/cancelled
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return "none" as const;
    if (b.status === "cancelled" || b.status === "done") return "none" as const;
    const today = getTodayStr();
    const tomorrow = getTomorrowStr();
    if (b.date === today || b.date === tomorrow) return "pending" as const;
    return "none" as const;
  };

  const sendReminder = (booking: Booking, channel: ReminderChannel, templateType: "24h" | "2h" | "manual" = "manual") => {
    const profile = profiles[booking.dentistCode];
    if (!profile) return;
    let template = reminderTemplates.tManual;
    if (templateType === "24h") template = reminderTemplates.t24;
    if (templateType === "2h") template = reminderTemplates.t2;
    if (booking.date === getTomorrowStr() && templateType === "manual") template = reminderTemplates.t24;
    if (booking.date === getTodayStr() && templateType === "manual") template = reminderTemplates.t2;

    const message = buildMessage(template, booking, profile);
    const newLog: ReminderLog = {
      id: Date.now(),
      bookingId: booking.id,
      dentistCode: booking.dentistCode,
      patientName: booking.patientName,
      phone: booking.phone,
      date: booking.date,
      time: booking.time,
      channel,
      message,
      sentAt: new Date().toISOString(),
      status: "sent",
      templateType,
    };
    setReminderHistory((prev) => [newLog, ...prev]);

    if (channel === "whatsapp") {
      const waNumber = cleanPhone(booking.phone);
      const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
      window.open(waLink, "_blank");
    } else {
      setSmsSimulateToast(`تم إرسال SMS محاكى إلى ${booking.patientName} على ${booking.phone} - "${message.slice(0, 60)}..."`);
      setTimeout(() => setSmsSimulateToast(null), 4000);
    }
  };

  const handleBotSend = () => {
    if (!chatInput.trim() || !currentCode) return;
    const profile = profiles[currentCode];
    const config = botConfigs[currentCode];
    if (!config || !profile) return;
    const userMsg: ChatMsg = { id: Date.now(), from: "user", text: chatInput, time: new Date().toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" }) };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setTimeout(() => {
      const botText = getBotResponse(userMsg.text, config, profile);
      const botMsg: ChatMsg = { id: Date.now() + 1, from: "bot", text: botText, time: new Date().toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" }) };
      setChatMessages((prev) => [...prev, botMsg]);
    }, 700);
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let rand = "";
    for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    return `DENT-2026-${rand}`;
  };

  const handleCreateDoctor = () => {
    if (!ownerForm.name.trim()) return;
    const code = generateRandomCode();
    const newSub: Subscription = {
      id: Date.now(),
      doctorName: ownerForm.city ? `${ownerForm.name} - ${ownerForm.city}` : ownerForm.name,
      code,
      expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      status: "active",
    };
    const newProfile: DoctorProfile = {
      name: ownerForm.name.trim(),
      address: ownerForm.address.trim(),
      email: ownerForm.email.trim(),
      website: ownerForm.website.trim(),
      whatsapp: ownerForm.whatsapp.trim(),
      services: SERVICES_DEFAULT.slice(0, 4),
      city: ownerForm.city,
    };
    setSubscriptions([newSub, ...subscriptions]);
    setProfiles({
      ...profiles,
      [code]: newProfile,
    });
    setReminderEnabled((prev) => ({ ...prev, [code]: true }));
    setBotConfigs((prev) => ({ ...prev, [code]: { ...DEFAULT_BOT_CONFIG, replies: [...DEFAULT_BOT_REPLIES] } }));
    setGeneratedCode(code);
    setLastCreated({ code, profile: newProfile });
    setOwnerForm({ name: "", address: "", email: "", website: "", whatsapp: "", city: "سكيكدة" });
    setAdminToast(`تم انشاء حساب ${newProfile.name} بنجاح - الكود: ${code}`);
    setTimeout(()=> setAdminToast(null), 4000);
  };

  const copyLoginInfo = async () => {
    if (!lastCreated) return;
    const { code, profile } = lastCreated;
    const text = `مرحبا دكتور ${profile.name}\nتم انشاء حسابك في DentiDz Pro\n\nكود الدخول: ${code}\nالعيادة: ${profile.address} - ${profile.city || ""}\nالايميل: ${profile.email}\nالموقع: ${profile.website}\nواتساب: ${profile.whatsapp}\n\nرابط الدخول: dentidz.dz - دخول الطبيب - ادخل الكود\nالاشتراك فعال سنة كاملة.\n`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLogin(true);
      setAdminToast("تم نسخ معلومات الدخول - جاهزة للارسال للطبيب");
      setTimeout(()=> { setCopiedLogin(false); setAdminToast(null); }, 3000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedLogin(true);
      setAdminToast("تم نسخ معلومات الدخول");
      setTimeout(()=> { setCopiedLogin(false); setAdminToast(null); }, 3000);
    }
  };

  const handleLogin = () => {
    setLoginError(null);
    const sub = subscriptions.find((s) => s.code === codeInput.trim().toUpperCase());
    if (!sub) {
      setLoginError("كود غير صحيح - Code invalide");
      return;
    }
    if (sub.status === "blocked") {
      setLoginError("تم حظر هذا الحساب - Compte bloqué");
      return;
    }
    if (isExpired(sub.expiry) || sub.status === "expired") {
      setLoginError("انتهت صلاحية الاشتراك - Abonnement expiré. تواصل مع المالك Rida للتجديد");
      return;
    }
    setCurrentCode(sub.code);
    setCodeInput("");
    // init chat with welcome message for that dentist
    setTimeout(() => {
      const p = profiles[sub.code];
      const cfg = botConfigs[sub.code];
      if (p && cfg) {
        const welcome = buildBotMessage(cfg.welcomeMessage, p);
        setChatMessages([
          { id: 1, from: "user", text: "السلام عليكم", time: "10:02" },
          { id: 2, from: "bot", text: welcome, time: "10:02" },
        ]);
      }
    }, 100);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientForm.patientName || !patientForm.phone || !patientForm.date || !patientForm.time) return;
    const newBooking: Booking = {
      id: Date.now(),
      dentistCode: selectedDentistCode,
      patientName: patientForm.patientName,
      phone: patientForm.phone,
      date: patientForm.date,
      time: patientForm.time,
      service: patientForm.service,
      status: "pending",
    };
    setBookings([newBooking, ...bookings]);
    setBookingSuccess(true);
    setPatientForm({ patientName: "", phone: "", service: selectedProfile.services[0] || SERVICES_DEFAULT[0], date: "", time: "" });
    setTimeout(() => setBookingSuccess(false), 4000);
  };

  const updateBookingStatus = (id: number, status: BookingStatus) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const toggleSubStatus = (id: number) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (s.status === "blocked") return { ...s, status: "active" as SubStatus };
        if (s.status === "active") return { ...s, status: "blocked" as SubStatus };
        return s;
      })
    );
  };

  const renewSub = (id: number) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), status: "active" as SubStatus }
          : s
      )
    );
    setRenewedIds((prev)=> [...prev, id]);
    setTimeout(()=> setRenewedIds((prev)=> prev.filter(x=>x!==id)), 2500);
    setAdminToast("تم تجديد الاشتراك لمدة سنة • Abonnement renouvelé 12 mois");
    setTimeout(()=>setAdminToast(null),3500);
  };

  const bookingsForCurrent = bookings.filter((b) => b.dentistCode === currentCode);
  const bookingsForSelected = bookings.filter((b) => b.dentistCode === selectedDentistCode);

  // Pending reminders for current dentist (today + tomorrow)
  const pendingRemindersForCurrent = useMemo(() => {
    if (!currentCode) return [];
    const today = getTodayStr();
    const tomorrow = getTomorrowStr();
    return bookings
      .filter((b) => b.dentistCode === currentCode && (b.date === today || b.date === tomorrow) && b.status !== "cancelled" && b.status !== "done")
      .filter((b) => !reminderHistory.some((r) => r.bookingId === b.id && r.status === "sent"))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [bookings, currentCode, reminderHistory]);

  const historyForCurrent = useMemo(() => {
    if (!currentCode) return [];
    return reminderHistory.filter((r) => r.dentistCode === currentCode);
  }, [reminderHistory, currentCode]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f0f9ff] text-slate-800 font-[system-ui,Tajawal,sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        *{font-family:'Tajawal', system-ui, sans-serif}
      `}</style>

      {/* Toasts */}
      {smsSimulateToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs max-w-[90vw] flex gap-2 items-start">
          <Smartphone className="w-4 h-4 mt-0.5 shrink-0 text-emerald-300" />
          <span>{smsSimulateToast}</span>
        </div>
      )}
      {adminToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-[#0e7490] text-white px-4 py-3 rounded-2xl shadow-xl text-xs max-w-[90vw] flex gap-2 items-center">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{adminToast}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-cyan-100">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-[68px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0e7490] flex items-center justify-center text-white shadow-lg shadow-cyan-900/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-[17px] tracking-tight text-[#0e7490] leading-none">DentiDz Pro</div>
              <div className="text-[11px] text-slate-500 -mt-0.5">Plateforme SaaS pour dentistes • الجزائر</div>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-full">
            <button
              onClick={() => setView("patient")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                view === "patient" ? "bg-white shadow text-[#0e7490]" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              واجهة المريض
            </button>
            <button
              onClick={() => setView("dentist")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                view === "dentist" ? "bg-white shadow text-[#0e7490]" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              دخول الطبيب
            </button>
            {ownerAuthenticated && (
              <button
                onClick={() => setView("admin")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  view === "admin" ? "bg-[#0e7490] shadow text-white" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                لوحة المالك
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-1 bg-slate-100 p-1 rounded-full">
            <button
              onClick={() => setView("patient")}
              className={`w-8 h-8 rounded-full grid place-items-center ${view === "patient" ? "bg-white shadow text-[#0e7490]" : "text-slate-500"}`}
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("dentist")}
              className={`w-8 h-8 rounded-full grid place-items-center ${view === "dentist" ? "bg-white shadow text-[#0e7490]" : "text-slate-500"}`}
            >
              <Stethoscope className="w-4 h-4" />
            </button>
            {ownerAuthenticated && (
              <button
                onClick={() => setView("admin")}
                className={`w-8 h-8 rounded-full grid place-items-center ${view === "admin" ? "bg-[#0e7490] text-white" : "text-slate-500"}`}
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* OWNER SECRET LOGIN - /owner-secure-bba-2026 - anonymous, no name */}
        {view === "admin-login" && (
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="w-full max-w-[400px] bg-white rounded-[24px] p-8 border border-slate-100 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-5">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-[22px] font-extrabold text-center">دخول المالك</h1>
              <p className="text-xs text-slate-500 text-center mt-1">Accès propriétaire • رابط سري</p>
              <p className="text-[11px] text-slate-400 text-center mt-2 font-mono">/owner-secure-bba-2026</p>
              
              <div className="mt-6">
                <label className="text-xs font-bold">كلمة السر السرية</label>
                <input
                  type="password"
                  value={ownerSecretInput}
                  onChange={(e)=>{setOwnerSecretInput(e.target.value); setOwnerLoginError(null);}}
                  onKeyDown={(e)=>{ if(e.key==="Enter"){ 
                    if(ownerSecretInput==="ridazemoura"){ setOwnerAuthenticated(true); setView("admin"); setOwnerSecretInput(""); }
                    else{ setOwnerLoginError("كلمة السر خاطئة • Code incorrect"); }
                  }}}
                  placeholder="اكتب الكود السري..."
                  className="mt-2 w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:outline-none text-sm"
                />
                {ownerLoginError && <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 flex gap-1.5"><AlertCircle className="w-4 h-4"/>{ownerLoginError}</div>}
                <button
                  onClick={()=>{
                    if(ownerSecretInput==="ridazemoura"){ setOwnerAuthenticated(true); setView("admin"); setOwnerSecretInput(""); }
                    else{ setOwnerLoginError("كلمة السر خاطئة • Code incorrect"); }
                  }}
                  className="mt-4 w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-black transition flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4"/> دخول
                </button>
                <button onClick={()=>setView("patient")} className="mt-3 w-full text-[11px] text-slate-500 hover:text-slate-700">← رجوع للصفحة الرئيسية</button>
                <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                  <b>تنبيه أمني:</b> هذا الرابط مخفي وما فيهش اسمك. فقط انت تعرف كلمة السر
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN VIEW - PROTECTED */}
        {view === "admin" && !ownerAuthenticated && (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto text-slate-300 mb-3"/>
              <p className="text-sm text-slate-600">يجب تسجيل الدخول كمالك أولا</p>
              <button onClick={()=>setView("admin-login")} className="mt-3 px-4 py-2 rounded-full bg-slate-900 text-white text-xs">دخول المالك</button>
            </div>
          </div>
        )}
        {view === "admin" && ownerAuthenticated && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-[28px] font-extrabold text-slate-900 flex items-center gap-2">
                  <Shield className="w-7 h-7 text-[#0e7490]" />
                  لوحة تحكم المالك
                </h1>
                <p className="text-slate-500 text-sm mt-1">مرحبا Rida • إدارة الاشتراكات السنوية • Gestion des abonnements</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">● النظام شغال</span>
                <span className="px-3 py-1.5 rounded-full bg-white border">الأكواد التجريبية: DENT-2026-DEMO / SKIKDA</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-slate-500">إجمالي الأطباء</div>
                    <div className="text-3xl font-extrabold mt-1">{subscriptions.length}</div>
                    <div className="text-xs text-slate-400 mt-1">Total dentistes</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 grid place-items-center text-[#0e7490]">
                    <User className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0e7490] w-[75%]" />
                </div>
              </div>
              <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-slate-500">النشطون حاليا</div>
                    <div className="text-3xl font-extrabold mt-1 text-emerald-600">{activeSubs.length}</div>
                    <div className="text-xs text-slate-400 mt-1">Actifs • اشتراك ساري</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 grid place-items-center text-emerald-600">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex gap-1">
                  {subscriptions.map((s, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${s.status === "active" && !isExpired(s.expiry) ? "bg-emerald-500" : "bg-slate-200"}`} />
                  ))}
                </div>
              </div>
              <div className="bg-[#0e7490] rounded-[20px] p-5 shadow-lg shadow-cyan-900/20 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-cyan-100">المداخيل السنوية</div>
                    <div className="text-3xl font-extrabold mt-1">{activeSubs.length * 12000} DA</div>
                    <div className="text-xs text-cyan-200 mt-1">Revenu estimé • 12,000 DA / cabinet / an</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-cyan-100 bg-white/10 rounded-full px-3 py-1.5 inline-block">SaaS Model • دفع سنوي</div>
              </div>
            </div>

            {/* Reminder Templates - NEW for Admin */}
            <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-bold flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-[#0e7490]" />
                  قوالب التذكير العامة - Templates de rappel
                </h3>
                <span className="text-[11px] bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full">يتطبق على كل الأطباء • Global</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">استخدم المتغيرات: [اسم المريض] [الاسم] [الوقت] [العنوان] [التاريخ]</p>
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border bg-slate-50/60 p-4">
                  <div className="text-xs font-bold flex items-center gap-1.5"><BellRing className="w-4 h-4 text-[#0e7490]"/> تذكير 24 ساعة - Rappel 24h</div>
                  <textarea
                    value={reminderTemplates.t24}
                    onChange={(e) => setReminderTemplates({ ...reminderTemplates, t24: e.target.value })}
                    className="mt-3 w-full min-h-[110px] p-3 rounded-xl border border-slate-200 bg-white text-xs leading-5 focus:border-[#0e7490] focus:outline-none"
                  />
                  <div className="mt-2 text-[11px] text-slate-500">يُرسل عندما يكون الموعد غدا • سيظهر في قائمة التذكير كـ ⏰ pending</div>
                </div>
                <div className="rounded-2xl border bg-slate-50/60 p-4">
                  <div className="text-xs font-bold flex items-center gap-1.5"><Bell className="w-4 h-4 text-amber-600"/> تذكير ساعتين - Rappel 2h</div>
                  <textarea
                    value={reminderTemplates.t2}
                    onChange={(e) => setReminderTemplates({ ...reminderTemplates, t2: e.target.value })}
                    className="mt-3 w-full min-h-[110px] p-3 rounded-xl border border-slate-200 bg-white text-xs leading-5 focus:border-[#0e7490] focus:outline-none"
                  />
                  <div className="mt-2 text-[11px] text-slate-500">يُرسل يوم الموعد • rappel le jour J</div>
                </div>
                <div className="rounded-2xl border bg-slate-50/60 p-4">
                  <div className="text-xs font-bold flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-600"/> قالب يدوي - Message manuel</div>
                  <textarea
                    value={reminderTemplates.tManual}
                    onChange={(e) => setReminderTemplates({ ...reminderTemplates, tManual: e.target.value })}
                    className="mt-3 w-full min-h-[110px] p-3 rounded-xl border border-slate-200 bg-white text-xs leading-5 focus:border-[#0e7490] focus:outline-none"
                  />
                  <div className="mt-2 text-[11px] text-slate-500">يُستخدم عند الإرسال الفوري من جدول الحجوزات</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="text-[11px] bg-cyan-50 border border-cyan-100 text-cyan-800 px-3 py-2 rounded-xl flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> يتم حفظ القوالب محليا • Local state • يطبق فورا على رابط واتساب</div>
                <div className="text-[11px] bg-white border px-3 py-2 rounded-xl">مثال رابط: https://wa.me/[number]?text=[message]</div>
              </div>
            </div>

            {/* Bot Templates Global */}
            <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-bold flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#0e7490]" />
                  الرد الآلي للواتساب - Modèle Bot WhatsApp Global
                </h3>
                <span className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1"><Zap className="w-3 h-3"/> بماذا نستطيع أن نخدمك؟ • Auto-reply</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">الرسالة الافتراضية التي تظهر عند أول تواصل • متغيرات: [الاسم] [العنوان] [واتساب]</p>
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border bg-slate-50/60 p-4">
                    <div className="text-xs font-bold">رسالة الترحيب - Message d'accueil (بماذا نستطيع أن نخدمك؟)</div>
                    <textarea
                      value={botDefaultConfig.welcomeMessage}
                      onChange={(e) => setBotDefaultConfig({ ...botDefaultConfig, welcomeMessage: e.target.value })}
                      className="mt-3 w-full min-h-[140px] p-3 rounded-xl border border-slate-200 bg-white text-xs leading-6 focus:border-[#0e7490] focus:outline-none whitespace-pre-wrap"
                    />
                  </div>
                  <div className="rounded-2xl border bg-slate-50/60 p-4">
                    <div className="text-xs font-bold">رسالة عدم الفهم - Fallback</div>
                    <textarea
                      value={botDefaultConfig.fallbackMessage}
                      onChange={(e) => setBotDefaultConfig({ ...botDefaultConfig, fallbackMessage: e.target.value })}
                      className="mt-3 w-full min-h-[90px] p-3 rounded-xl border border-slate-200 bg-white text-xs leading-5 focus:border-[#0e7490] focus:outline-none"
                    />
                    <button onClick={()=>{
                      // apply default to all dentists
                      const newConfigs: Record<string, BotConfig> = {};
                      Object.keys(botConfigs).forEach(k=>{
                        newConfigs[k] = { ...botDefaultConfig, replies: [...botDefaultConfig.replies], enabled: botConfigs[k].enabled };
                      });
                      setBotConfigs(newConfigs);
                      setAdminToast("تم تطبيق قوالب البوت على كل العيادات ✅ • Modèles appliqués à tous les cabinets");
                      setTimeout(()=>setAdminToast(null),3500);
                      setBotApplied(true);
                      setTimeout(()=>setBotApplied(false),2500);
                    }} onMouseDown={(e)=>{(e.currentTarget as HTMLButtonElement).textContent="تم التطبيق ✅";}} className="mt-3 h-9 px-4 rounded-full bg-[#0e7490] text-white text-xs font-bold">{botApplied ? "تم التطبيق ✅" : "تطبيق على كل العيادات • Appliquer à tous"}</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {botDefaultConfig.replies.map((rep)=>(
                    <div key={rep.id} className="rounded-2xl border bg-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{rep.id}. {rep.label}</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{rep.keywords.slice(0,3).join(", ")}</span>
                      </div>
                      <textarea value={rep.response} onChange={(e)=>{
                        const newReplies = botDefaultConfig.replies.map(r=> r.id===rep.id ? {...r, response:e.target.value} : r);
                        setBotDefaultConfig({...botDefaultConfig, replies:newReplies});
                      }} className="mt-2 w-full min-h-[80px] p-2.5 rounded-xl border bg-slate-50 text-[11px] leading-5 focus:bg-white focus:border-[#0e7490] outline-none"/>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* NEW BIG OWNER FORM - إضافة طبيب جديد */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 border-2 border-[#0e7490]/10 shadow-[0_12px_40px_-12px_rgba(14,116,144,0.25)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0e7490] text-white grid place-items-center shadow-lg">
                    <User className="w-6 h-6"/>
                  </div>
                  <div>
                    <h2 className="text-[20px] font-extrabold leading-tight">إضافة طبيب جديد - أنت تعمر معلوماته</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Ajouter un dentiste • تملى انت كل البيانات ويتولد الكود تلقائيا</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 font-medium">Rida Owner Only</span>
                  <span className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">DENT-2026-XXXX auto</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> اسم الطبيب / العيادة *</label>
                  <input
                    value={ownerForm.name}
                    onChange={(e)=> setOwnerForm({...ownerForm, name: e.target.value})}
                    placeholder="مثال: Dr. Amine Benali - عيادة النور لطب الأسنان"
                    className="mt-2 w-full h-[48px] px-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> العنوان الكامل *</label>
                  <input
                    value={ownerForm.address}
                    onChange={(e)=> setOwnerForm({...ownerForm, address: e.target.value})}
                    placeholder="مثال: حي 20 أوت، سكيكدة - بالقرب من المستشفى، الطابق 2"
                    className="mt-2 w-full h-[48px] px-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5"/> الإيميل - Email</label>
                  <input
                    dir="ltr"
                    value={ownerForm.email}
                    onChange={(e)=> setOwnerForm({...ownerForm, email: e.target.value})}
                    placeholder="dr@example.dz"
                    className="mt-2 w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5"/> العنوان الإلكتروني - Site web</label>
                  <input
                    dir="ltr"
                    value={ownerForm.website}
                    onChange={(e)=> setOwnerForm({...ownerForm, website: e.target.value})}
                    placeholder="www.dr-amine.dz"
                    className="mt-2 w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> رقم الواتساب *</label>
                  <input
                    dir="ltr"
                    value={ownerForm.whatsapp}
                    onChange={(e)=> setOwnerForm({...ownerForm, whatsapp: e.target.value})}
                    placeholder="213555123456"
                    className="mt-2 w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> المدينة - Ville</label>
                  <select
                    value={ownerForm.city}
                    onChange={(e)=> setOwnerForm({...ownerForm, city: e.target.value})}
                    className="mt-2 w-full h-[48px] px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm"
                  >
                    {CITIES.map(c=> <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 mt-2">
                  <button
                    onClick={handleCreateDoctor}
                    disabled={!ownerForm.name.trim() || !ownerForm.address.trim()}
                    className="w-full h-[56px] rounded-xl bg-[#0e7490] text-white font-extrabold text-[15px] disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-cyan-800 transition shadow-lg shadow-cyan-900/20"
                  >
                    <Key className="w-5 h-5"/>
                    إنشاء حساب الطبيب + توليد كود الاشتراك
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">سيتم ملء ملف الطبيب تلقائيا بهذه المعلومات • Le profil sera pre-rempli, modifiable par le dentiste</p>
                </div>
              </div>

              {lastCreated && (
                <div className="mt-6 p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 animate-[pulse_0.6s_ease]">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600"/>
                        <span className="text-sm font-extrabold text-emerald-800">تم إنشاء الحساب بنجاح • Compte cree</span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white rounded-xl p-3 border">
                          <div className="text-[10px] text-slate-500">اسم الطبيب</div>
                          <div className="font-bold text-sm">{lastCreated.profile.name}</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border">
                          <div className="text-[10px] text-slate-500">كود الدخول - Code d'activation</div>
                          <div dir="ltr" className="font-mono font-extrabold text-[15px] tracking-wider text-[#0e7490]">{lastCreated.code}</div>
                          <div className="text-[10px] text-emerald-600 mt-1">صلاحية سنة • Validite 12 mois</div>
                        </div>
                        <div className="md:col-span-2 bg-white rounded-xl p-3 border text-[11px] leading-5">
                          <div className="font-bold text-xs mb-1">معاينة معلومات الدخول التي سترسل للطبيب:</div>
                          <div>مرحبا دكتور {lastCreated.profile.name} - تم انشاء حسابك في DentiDz Pro</div>
                          <div dir="ltr">Code: {lastCreated.code} | {lastCreated.profile.address} - {lastCreated.profile.city}</div>
                          <div dir="ltr">{lastCreated.profile.email} | {lastCreated.profile.website} | {lastCreated.profile.whatsapp}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={copyLoginInfo}
                        className={`h-12 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${copiedLogin ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-black"}`}
                      >
                        {copiedLogin ? <Check className="w-4 h-4"/> : <MessageCircle className="w-4 h-4"/>}
                        {copiedLogin ? "تم النسخ" : "نسخ معلومات الدخول للإرسال للطبيب"}
                      </button>
                      <a
                        href={`https://wa.me/${lastCreated.profile.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(`مرحبا دكتور ${lastCreated.profile.name} - تم انشاء حسابك في DentiDz Pro - كود الدخول: ${lastCreated.code}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 px-5 rounded-xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#128C7E]"
                      >
                        <Send className="w-4 h-4"/>
                        ارسال عبر واتساب
                      </a>
                      <button onClick={()=> setLastCreated(null)} className="h-9 px-4 rounded-xl bg-white border text-xs">اخفاء</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-slate-500">إجمالي الأطباء</div>
                    <div className="text-3xl font-extrabold mt-1">{subscriptions.length}</div>
                    <div className="text-xs text-slate-400 mt-1">Total dentistes</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 grid place-items-center text-[#0e7490]">
                    <User className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0e7490] w-[75%]" />
                </div>
              </div>
              <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-slate-500">النشطون حاليا</div>
                    <div className="text-3xl font-extrabold mt-1 text-emerald-600">{activeSubs.length}</div>
                    <div className="text-xs text-slate-400 mt-1">Actifs • اشتراك ساري</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 grid place-items-center text-emerald-600">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex gap-1">
                  {subscriptions.map((s, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${s.status === "active" && !isExpired(s.expiry) ? "bg-emerald-500" : "bg-slate-200"}`} />
                  ))}
                </div>
              </div>
              <div className="bg-[#0e7490] rounded-[20px] p-5 shadow-lg shadow-cyan-900/20 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-cyan-100">المداخيل السنوية</div>
                    <div className="text-3xl font-extrabold mt-1">{activeSubs.length * 12000} DA</div>
                    <div className="text-xs text-cyan-200 mt-1">Revenu estimé • 12,000 DA / cabinet / an</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-cyan-100 bg-white/10 rounded-full px-3 py-1.5 inline-block">SaaS Model • دفع سنوي</div>
              </div>
            </div>

            {/* Reminder Templates - NEW for Admin */}
            <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-bold flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-[#0e7490]" />
                  قوالب التذكير العامة - Templates de rappel
                </h3>
                <span className="text-[11px] bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full">يتطبق على كل الأطباء • Global</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">استخدم المتغيرات: [اسم المريض] [الاسم] [الوقت] [العنوان] [التاريخ]</p>
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border bg-slate-50/60 p-4">
                  <div className="text-xs font-bold flex items-center gap-1.5"><BellRing className="w-4 h-4 text-[#0e7490]"/> تذكير 24 ساعة - Rappel 24h</div>
                  <textarea
                    value={reminderTemplates.t24}
                    onChange={(e) => setReminderTemplates({ ...reminderTemplates, t24: e.target.value })}
                    className="mt-3 w-full min-h-[110px] p-3 rounded-xl border border-slate-200 bg-white text-xs leading-5 focus:border-[#0e7490] focus:outline-none"
                  />
                  <div className="mt-2 text-[11px] text-slate-500">يُرسل عندما يكون الموعد غدا • سيظهر في قائمة التذكير كـ ⏰ pending</div>
                </div>
                <div className="rounded-2xl border bg-slate-50/60 p-4">
                  <div className="text-xs font-bold flex items-center gap-1.5"><Bell className="w-4 h-4 text-amber-600"/> تذكير ساعتين - Rappel 2h</div>
                  <textarea
                    value={reminderTemplates.t2}
                    onChange={(e) => setReminderTemplates({ ...reminderTemplates, t2: e.target.value })}
                    className="mt-3 w-full min-h-[110px] p-3 rounded-xl border border-slate-200 bg-white text-xs leading-5 focus:border-[#0e7490] focus:outline-none"
                  />
                  <div className="mt-2 text-[11px] text-slate-500">يُرسل يوم الموعد • rappel le jour J</div>
                </div>
                <div className="rounded-2xl border bg-slate-50/60 p-4">
                  <div className="text-xs font-bold flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-600"/> قالب يدوي - Message manuel</div>
                  <textarea
                    value={reminderTemplates.tManual}
                    onChange={(e) => setReminderTemplates({ ...reminderTemplates, tManual: e.target.value })}
                    className="mt-3 w-full min-h-[110px] p-3 rounded-xl border border-slate-200 bg-white text-xs leading-5 focus:border-[#0e7490] focus:outline-none"
                  />
                  <div className="mt-2 text-[11px] text-slate-500">يُستخدم عند الإرسال الفوري من جدول الحجوزات</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="text-[11px] bg-cyan-50 border border-cyan-100 text-cyan-800 px-3 py-2 rounded-xl flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> يتم حفظ القوالب محليا • Local state • يطبق فورا على رابط واتساب</div>
                <div className="text-[11px] bg-white border px-3 py-2 rounded-xl">مثال رابط: https://wa.me/[number]?text=[message]</div>
              </div>
            </div>

            {/* Bot Templates Global */}
            <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-bold flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#0e7490]" />
                  الرد الآلي للواتساب - Modèle Bot WhatsApp Global
                </h3>
                <span className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1"><Zap className="w-3 h-3"/> بماذا نستطيع أن نخدمك؟ • Auto-reply</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">الرسالة الافتراضية التي تظهر عند أول تواصل • متغيرات: [الاسم] [العنوان] [واتساب]</p>
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl border bg-slate-50/60 p-4">
                    <div className="text-xs font-bold">رسالة الترحيب - Message d'accueil (بماذا نستطيع أن نخدمك؟)</div>
                    <textarea
                      value={botDefaultConfig.welcomeMessage}
                      onChange={(e) => setBotDefaultConfig({ ...botDefaultConfig, welcomeMessage: e.target.value })}
                      className="mt-3 w-full min-h-[140px] p-3 rounded-xl border border-slate-200 bg-white text-xs leading-6 focus:border-[#0e7490] focus:outline-none whitespace-pre-wrap"
                    />
                  </div>
                  <div className="rounded-2xl border bg-slate-50/60 p-4">
                    <div className="text-xs font-bold">رسالة عدم الفهم - Fallback</div>
                    <textarea
                      value={botDefaultConfig.fallbackMessage}
                      onChange={(e) => setBotDefaultConfig({ ...botDefaultConfig, fallbackMessage: e.target.value })}
                      className="mt-3 w-full min-h-[90px] p-3 rounded-xl border border-slate-200 bg-white text-xs leading-5 focus:border-[#0e7490] focus:outline-none"
                    />
                    <button onClick={()=>{
                      const newConfigs: Record<string, BotConfig> = {};
                      Object.keys(botConfigs).forEach(k=>{
                        newConfigs[k] = { ...botDefaultConfig, replies: [...botDefaultConfig.replies], enabled: botConfigs[k].enabled };
                      });
                      setBotConfigs(newConfigs);
                      setAdminToast("تم تطبيق قوالب البوت على كل العيادات • Modèles appliqués à tous les cabinets");
                      setTimeout(()=>setAdminToast(null),3500);
                      setBotApplied(true);
                      setTimeout(()=>setBotApplied(false),2500);
                    }} className="mt-3 h-9 px-4 rounded-full bg-[#0e7490] text-white text-xs font-bold">{botApplied ? "تم التطبيق ✓" : "تطبيق على كل العيادات • Appliquer à tous"}</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {botDefaultConfig.replies.map((rep)=>(
                    <div key={rep.id} className="rounded-2xl border bg-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{rep.id}. {rep.label}</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{rep.keywords.slice(0,3).join(", ")}</span>
                      </div>
                      <textarea value={rep.response} onChange={(e)=>{
                        const newReplies = botDefaultConfig.replies.map(r=> r.id===rep.id ? {...r, response:e.target.value} : r);
                        setBotDefaultConfig({...botDefaultConfig, replies:newReplies});
                      }} className="mt-2 w-full min-h-[80px] p-2.5 rounded-xl border bg-slate-50 text-[11px] leading-5 focus:bg-white focus:border-[#0e7490] outline-none"/>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subscriptions Table full width */}
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between">
                <h3 className="font-bold">قائمة الاشتراكات - كل الأطباء الذين أنشأتهم</h3>
                <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full">{subscriptions.length} طبيب</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] text-slate-500">
                    <tr>
                      <th className="text-right p-3 font-medium">الطبيب</th>
                      <th className="text-right p-3 font-medium">المدينة</th>
                      <th className="text-right p-3 font-medium">الكود</th>
                      <th className="text-right p-3 font-medium">الانتهاء</th>
                      <th className="text-right p-3 font-medium">الحالة</th>
                      <th className="text-right p-3 font-medium">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s) => {
                      const expired = isExpired(s.expiry);
                      const prof = profiles[s.code];
                      const statusLabel =
                        s.status === "blocked" ? "محظور" : expired || s.status === "expired" ? "منتهي" : "نشط";
                      return (
                        <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="p-3 font-medium">
                            <div className="font-bold">{s.doctorName}</div>
                            <div className="text-[11px] text-slate-500">{prof?.email || ""}</div>
                          </td>
                          <td className="p-3 text-xs">{prof?.city || "-"}</td>
                          <td className="p-3" dir="ltr">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{s.code}</span>
                          </td>
                          <td className="p-3 text-xs">{s.expiry.toLocaleDateString("fr-DZ")}</td>
                          <td className="p-3">
                            <span
                              className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${
                                s.status === "blocked"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : expired || s.status === "expired"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => renewSub(s.id)}
                                className={`h-7 px-3 rounded-full border text-xs hover:bg-slate-50 transition ${renewedIds.includes(s.id) ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white"}`}
                              >
                                {renewedIds.includes(s.id) ? "تم" : "تجديد"}
                              </button>
                              <button
                                onClick={() => toggleSubStatus(s.id)}
                                className={`h-7 px-3 rounded-full text-xs border ${
                                  s.status === "blocked" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white"
                                }`}
                              >
                                {s.status === "blocked" ? "إلغاء الحظر" : "حظر"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DENTIST VIEW */}
        {view === "dentist" && (
          <div>
            {!currentCode ? (
              <div className="max-w-[440px] mx-auto mt-8 md:mt-16">
                <div className="bg-white rounded-[24px] p-8 shadow-[0_20px_60px_-20px_rgba(14,116,144,0.25)] border border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-[#0e7490] grid place-items-center text-white mx-auto shadow-lg">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h1 className="text-center text-[22px] font-extrabold mt-5">دخول الأطباء</h1>
                  <p className="text-center text-xs text-slate-500 mt-1">Espace dentiste • أدخل كود التفعيل السنوي</p>

                  <div className="mt-7 space-y-3">
                    <label className="text-xs font-medium">كود الاشتراك - Code d'activation</label>
                    <input
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      placeholder="DENT-2026-XXXX"
                      dir="ltr"
                      className="w-full h-[52px] rounded-xl border-2 border-slate-200 focus:border-[#0e7490] focus:outline-none px-4 font-mono tracking-widest text-center text-[15px] bg-slate-50 focus:bg-white"
                    />
                    {loginError && (
                      <div className="flex gap-2 items-start p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}
                    <button
                      onClick={handleLogin}
                      className="w-full h-[52px] rounded-xl bg-[#0e7490] text-white font-bold hover:bg-cyan-800 transition flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      دخول - Connexion
                    </button>
                    <div className="pt-2 border-t border-dashed mt-4">
                      <div className="text-[11px] text-slate-500 text-center">أكواد تجريبية للاختبار:</div>
                      <div className="flex justify-center gap-2 mt-2">
                        <span dir="ltr" className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-lg">
                          DENT-2026-DEMO
                        </span>
                        <span dir="ltr" className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-lg">
                          DENT-2026-SKIKDA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Dentist Header */}
                <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-50 text-[#0e7490] grid place-items-center font-extrabold">
                      {currentProfile?.name.charAt(0) || "D"}
                    </div>
                    <div>
                      <div className="font-bold text-[16px]">{currentProfile?.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                        <span dir="ltr" className="font-mono bg-slate-100 px-2 py-0.5 rounded-lg">
                          {currentCode}
                        </span>
                        <span className="text-emerald-600">● اشتراك نشط حتى {currentSub?.expiry.toLocaleDateString("fr-DZ")}</span>
                        {reminderEnabled[currentCode] && (
                          <span className="bg-[#0e7490] text-white px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1"><BellRing className="w-3 h-3"/>تذكير تلقائي مفعل</span>
                        )}
                        {botConfigs[currentCode!]?.enabled && (
                          <span className="bg-[#25D366] text-white px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1"><Bot className="w-3 h-3"/>بوت واتساب مفعل</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex bg-slate-100 p-1 rounded-full">
                      <button
                        onClick={() => setDentistTab("bookings")}
                        className={`px-4 py-2 rounded-full text-xs font-medium ${dentistTab === "bookings" ? "bg-white shadow text-[#0e7490]" : "text-slate-500"}`}
                      >
                        الحجوزات
                      </button>
                      <button
                        onClick={() => setDentistTab("reminders")}
                        className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1 ${dentistTab === "reminders" ? "bg-[#0e7490] shadow text-white" : "text-slate-500"}`}
                      >
                        <Bell className="w-3.5 h-3.5"/>التذكير
                        {pendingRemindersForCurrent.length>0 && <span className="bg-amber-400 text-slate-900 w-4 h-4 rounded-full grid place-items-center text-[10px] font-bold">{pendingRemindersForCurrent.length}</span>}
                      </button>
                      <button
                        onClick={() => setDentistTab("bot")}
                        className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1 ${dentistTab === "bot" ? "bg-[#25D366] shadow text-white" : "text-slate-500"}`}
                      >
                        <Bot className="w-3.5 h-3.5"/>الرد الآلي
                      </button>
                      <button
                        onClick={() => setDentistTab("calendar")}
                        className={`px-4 py-2 rounded-full text-xs font-medium ${dentistTab === "calendar" ? "bg-white shadow text-[#0e7490]" : "text-slate-500"}`}
                      >
                        التقويم
                      </button>
                      <button
                        onClick={() => setDentistTab("profile")}
                        className={`px-4 py-2 rounded-full text-xs font-medium ${dentistTab === "profile" ? "bg-white shadow text-[#0e7490]" : "text-slate-500"}`}
                      >
                        الملف الشخصي
                      </button>
                    </div>
                    <button
                      onClick={() => setCurrentCode(null)}
                      className="h-9 px-3 rounded-full bg-slate-100 text-xs flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      خروج
                    </button>
                  </div>
                </div>

                {/* Mobile sub tabs */}
                <div className="md:hidden flex bg-white p-1 rounded-full border shadow-sm w-fit overflow-x-auto">
                  <button
                    onClick={() => setDentistTab("bookings")}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${dentistTab === "bookings" ? "bg-[#0e7490] text-white" : "text-slate-600"}`}
                  >
                    الحجوزات
                  </button>
                  <button
                    onClick={() => setDentistTab("reminders")}
                    className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap ${dentistTab === "reminders" ? "bg-[#0e7490] text-white" : "text-slate-600"}`}
                  >
                    <Bell className="w-3.5 h-3.5"/>التذكير {pendingRemindersForCurrent.length>0 && `(${pendingRemindersForCurrent.length})`}
                  </button>
                  <button
                    onClick={() => setDentistTab("bot")}
                    className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap ${dentistTab === "bot" ? "bg-[#25D366] text-white" : "text-slate-600"}`}
                  >
                    <Bot className="w-3.5 h-3.5"/>البوت
                  </button>
                  <button
                    onClick={() => setDentistTab("calendar")}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${dentistTab === "calendar" ? "bg-[#0e7490] text-white" : "text-slate-600"}`}
                  >
                    التقويم
                  </button>
                  <button
                    onClick={() => setDentistTab("profile")}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${dentistTab === "profile" ? "bg-[#0e7490] text-white" : "text-slate-600"}`}
                  >
                    الملف
                  </button>
                </div>

                {/* Tabs Content */}
                {dentistTab === "profile" && currentProfile && (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                    <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
                      <h3 className="font-bold">معلومات العيادة - Informations cabinet</h3>
                      <p className="text-xs text-slate-500 mt-1">هذه المعلومات تظهر للمرضى في صفحة الحجز</p>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium">اسم الطبيب - Nom du docteur</label>
                          <input
                            value={currentProfile.name}
                            onChange={(e) => setProfiles({ ...profiles, [currentCode]: { ...currentProfile, name: e.target.value } })}
                            className="mt-1 w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium">العنوان - Adresse (avec map)</label>
                          <input
                            value={currentProfile.address}
                            onChange={(e) => setProfiles({ ...profiles, [currentCode]: { ...currentProfile, address: e.target.value } })}
                            className="mt-1 w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm"
                          />
                          <div className="mt-2 h-[140px] rounded-xl bg-[#f0f9ff] border border-cyan-100 grid place-items-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0z' fill='none'/%3E%3Cpath d='M0 10h20M10 0v20' stroke='%230e7490'/%3E%3C/svg%3E")`}}/>
                            <div className="text-center">
                              <MapPin className="w-6 h-6 text-[#0e7490] mx-auto" />
                              <div className="text-xs text-slate-600 mt-1">Map placeholder • خريطة العيادة</div>
                              <div className="text-[11px] text-slate-400 mt-1">{currentProfile.address || "أدخل العنوان"}</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium">الإيميل - Email</label>
                          <input
                            value={currentProfile.email}
                            onChange={(e) => setProfiles({ ...profiles, [currentCode]: { ...currentProfile, email: e.target.value } })}
                            className="mt-1 w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">الموقع الإلكتروني - Site web</label>
                          <input
                            value={currentProfile.website}
                            onChange={(e) => setProfiles({ ...profiles, [currentCode]: { ...currentProfile, website: e.target.value } })}
                            className="mt-1 w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm"
                            placeholder="www.example.dz"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium">رقم الواتساب - WhatsApp (avec bouton)</label>
                          <div className="mt-1 flex gap-2">
                            <input
                              value={currentProfile.whatsapp}
                              onChange={(e) => setProfiles({ ...profiles, [currentCode]: { ...currentProfile, whatsapp: e.target.value } })}
                              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0e7490] outline-none text-sm"
                              placeholder="213XXXXXXXXX"
                              dir="ltr"
                            />
                            <a
                              href={`https://wa.me/${currentProfile.whatsapp}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-11 px-4 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#128C7E] transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </a>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium">الخدمات - Services proposés</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {currentProfile.services.map((s, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-100 text-xs flex items-center gap-1.5">
                                {s}
                                <button
                                  onClick={() => {
                                    const newServices = currentProfile.services.filter((_, idx) => idx !== i);
                                    setProfiles({ ...profiles, [currentCode]: { ...currentProfile, services: newServices } });
                                  }}
                                  className="w-4 h-4 rounded-full bg-white grid place-items-center"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {SERVICES_DEFAULT.filter((s) => !currentProfile.services.includes(s)).map((s) => (
                              <button
                                key={s}
                                onClick={() =>
                                  setProfiles({ ...profiles, [currentCode]: { ...currentProfile, services: [...currentProfile.services, s] } })
                                }
                                className="px-3 py-1 rounded-full bg-white border text-[11px] hover:bg-slate-50"
                              >
                                + {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0e7490] rounded-[20px] p-6 text-white shadow-lg shadow-cyan-900/20 h-fit">
                      <h4 className="font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        معاينة بطاقة الطبيب
                      </h4>
                      <p className="text-xs text-cyan-100 mt-1">Aperçu carte patient</p>
                      <div className="mt-4 bg-white rounded-2xl p-4 text-slate-800">
                        <div className="font-bold">{currentProfile.name}</div>
                        <div className="text-xs text-slate-500 mt-1 flex gap-1 items-start">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          {currentProfile.address || "العنوان غير محدد"}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 rounded-xl p-2.5 flex gap-2 items-center">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <div className="text-[11px] truncate">{currentProfile.email || "email"}</div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2.5 flex gap-2 items-center">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <div className="text-[11px] truncate">{currentProfile.website || "site web"}</div>
                          </div>
                        </div>
                        <a
                          href={`https://wa.me/${currentProfile.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 w-full h-10 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4" />
                          تواصل عبر واتساب
                        </a>
                      </div>
                      <div className="mt-4 text-[11px] text-cyan-100 bg-white/10 rounded-xl p-3">
                        💡 نصيحة: كلما كانت معلوماتك كاملة، زادت ثقة المرضى وحجوزاتهم.
                      </div>
                    </div>
                  </div>
                )}

                {dentistTab === "bookings" && (
                  <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b">
                      <div>
                        <h3 className="font-bold flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#0e7490]" />
                          إدارة الحجوزات - Gestion des RDV
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">{bookingsForCurrent.length} حجز • {bookingsForCurrent.filter(b=>b.status==="pending").length} في الانتظار • {pendingRemindersForCurrent.length} تذكير ⏰</p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">pending {bookingsForCurrent.filter(b=>b.status==="pending").length}</span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">confirmé {bookingsForCurrent.filter(b=>b.status==="confirmed").length}</span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center gap-1"><BellRing className="w-3 h-3"/> {reminderHistory.filter(r=>r.dentistCode===currentCode).length} تذكير مرسل</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-[11px] text-slate-500">
                          <tr>
                            <th className="text-right p-3">المريض</th>
                            <th className="text-right p-3">الهاتف</th>
                            <th className="text-right p-3">التاريخ</th>
                            <th className="text-right p-3">الخدمة</th>
                            <th className="text-right p-3">الحالة</th>
                            <th className="text-right p-3">التذكير</th>
                            <th className="text-right p-3">إجراء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookingsForCurrent.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-10 text-center text-slate-400 text-sm">لا يوجد حجوزات بعد • Aucun RDV</td>
                            </tr>
                          )}
                          {bookingsForCurrent.map((b) => {
                            const remStatus = getBookingReminderStatus(b.id);
                            const hasSent = reminderHistory.some(r=>r.bookingId===b.id);
                            return (
                            <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="p-3 font-medium">{b.patientName}</td>
                              <td className="p-3" dir="ltr">{b.phone}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1 text-xs">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {b.date}
                                  <Clock className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                  {b.time}
                                </div>
                              </td>
                              <td className="p-3 text-xs">{b.service}</td>
                              <td className="p-3">
                                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${
                                  b.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : b.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : b.status === "done" ? "bg-slate-100 text-slate-600 border-slate-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                                }`}>
                                  {b.status === "pending" ? "انتظار" : b.status === "confirmed" ? "مؤكد" : b.status === "done" ? "تم" : "ملغى"}
                                </span>
                              </td>
                              <td className="p-3">
                                {remStatus === "sent" ? (
                                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1 w-fit">✅ تم الإرسال</span>
                                ) : remStatus === "pending" ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-1">⏰ في الانتظار</span>
                                    <button onClick={()=>sendReminder(b,"whatsapp")} className="w-7 h-7 rounded-full bg-[#25D366] text-white grid place-items-center hover:bg-[#128C7E]" title="إرسال الآن"><Send className="w-3.5 h-3.5"/></button>
                                  </div>
                                ) : hasSent ? (
                                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">✅ تم</span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">-</span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  {b.status === "pending" && (
                                    <>
                                      <button onClick={()=>updateBookingStatus(b.id,"confirmed")} className="h-7 px-2.5 rounded-full bg-[#0e7490] text-white text-[11px] flex items-center gap-1"><Check className="w-3 h-3"/>تأكيد</button>
                                      <button onClick={()=>updateBookingStatus(b.id,"cancelled")} className="h-7 px-2.5 rounded-full bg-white border text-[11px]">إلغاء</button>
                                    </>
                                  )}
                                  {b.status === "confirmed" && (
                                    <button onClick={()=>updateBookingStatus(b.id,"done")} className="h-7 px-2.5 rounded-full bg-slate-900 text-white text-[11px]">تمت الزيارة</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {dentistTab === "reminders" && (
                  <div className="space-y-6">
                    {/* Toggle */}
                    <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex gap-3">
                        <div className={`w-12 h-12 rounded-xl grid place-items-center ${reminderEnabled[currentCode!] ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                          <BellRing className="w-6 h-6"/>
                        </div>
                        <div>
                          <div className="font-bold text-sm flex items-center gap-2">التذكير التلقائي - Rappel automatique
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${reminderEnabled[currentCode!] ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>{reminderEnabled[currentCode!] ? "مفعل" : "متوقف"}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">إرسال تلقائي قبل 24 ساعة + قبل ساعتين • Envoi 24h + 2h avant RDV</div>
                          <div className="mt-2 flex gap-2">
                            <span className="text-[11px] px-2 py-1 rounded-full bg-cyan-50 border border-cyan-100">24h: {reminderTemplates.t24.slice(0,28)}...</span>
                            <span className="text-[11px] px-2 py-1 rounded-full bg-amber-50 border border-amber-100">2h: {reminderTemplates.t2.slice(0,28)}...</span>
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={!!reminderEnabled[currentCode!]} onChange={(e)=>setReminderEnabled({...reminderEnabled, [currentCode!]: e.target.checked})} className="sr-only peer"/>
                        <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-20px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:right-[4px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#0e7490]"></div>
                      </label>
                    </div>

                    {/* Pending List */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                      <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-[#0e7490]"/> تذكيرات اليوم - À envoyer aujourd'hui</h3>
                          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full">{pendingRemindersForCurrent.length} في الانتظار</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">المواعيد التي موعدها غدا أو اليوم ولم يتم تذكيرها بعد • RDV de demain/aujourd'hui non notifiés</p>
                        <div className="mt-5 space-y-3 max-h-[520px] overflow-auto pr-1">
                          {pendingRemindersForCurrent.length===0 && (
                            <div className="py-16 text-center">
                              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center mx-auto"><CheckCircle2 className="w-7 h-7"/></div>
                              <div className="text-sm font-bold mt-3">لا يوجد تذكيرات الآن</div>
                              <div className="text-xs text-slate-500 mt-1">كل المرضى تم تذكيرهم • Aucun rappel en attente</div>
                            </div>
                          )}
                          {pendingRemindersForCurrent.map(b=>{
                            const profile = profiles[b.dentistCode];
                            const isTomorrow = b.date === getTomorrowStr();
                            const msgPreview = buildMessage(isTomorrow ? reminderTemplates.t24 : reminderTemplates.t2, b, profile);
                            return (
                              <div key={b.id} className="rounded-2xl border bg-[#f8fdff] p-4 hover:bg-white hover:shadow-sm transition">
                                <div className="flex justify-between gap-3">
                                  <div>
                                    <div className="font-bold text-sm flex items-center gap-2">{b.patientName} <span className={`text-[10px] px-2 py-0.5 rounded-full ${isTomorrow ? "bg-cyan-50 border border-cyan-200 text-cyan-700" : "bg-amber-50 border border-amber-200 text-amber-700"}`}>{isTomorrow ? "24h قبل" : "اليوم - 2h"}</span></div>
                                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-2"><Clock className="w-3.5 h-3.5"/> {b.date} • {b.time} • {b.service.split("-")[0]}</div>
                                    <div className="text-[11px] text-slate-500 mt-1" dir="ltr">{b.phone}</div>
                                  </div>
                                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 h-fit">⏰ في الانتظار</span>
                                </div>
                                <div className="mt-3 p-2.5 rounded-xl bg-white border text-[11px] text-slate-600 leading-5">
                                  <span className="font-bold text-slate-800">معاينة الرسالة:</span> {msgPreview}
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button onClick={()=>sendReminder(b,"whatsapp", isTomorrow ? "24h" : "2h")} className="h-10 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#128C7E] transition"><MessageCircle className="w-4 h-4"/> إرسال واتساب</button>
                                  <button onClick={()=>sendReminder(b,"sms", isTomorrow ? "24h" : "2h")} className="h-10 rounded-xl bg-white border text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50"><Smartphone className="w-4 h-4"/> إرسال SMS (محاكى)</button>
                                </div>
                                <div className="mt-2 text-[10px] text-slate-400">رابط: https://wa.me/{cleanPhone(b.phone)}?text=...</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-[#0e7490] to-cyan-700 rounded-[20px] p-5 text-white shadow-lg">
                          <h4 className="font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5"/> إحصائيات التذكير</h4>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-white/10 rounded-xl p-3">
                              <div className="text-[11px] text-cyan-100">في الانتظار</div>
                              <div className="text-2xl font-extrabold mt-1">{pendingRemindersForCurrent.length}</div>
                              <div className="text-[10px] text-cyan-200">pending</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3">
                              <div className="text-[11px] text-cyan-100">تم الإرسال</div>
                              <div className="text-2xl font-extrabold mt-1">{historyForCurrent.filter(h=>h.status==="sent").length}</div>
                              <div className="text-[10px] text-cyan-200">sent</div>
                            </div>
                          </div>
                          <div className="mt-4 text-[11px] bg-white/10 rounded-xl p-3 leading-5">
                            <div className="font-bold">كيف يعمل؟</div>
                            <div className="text-cyan-100 mt-1">• عندما يكون تاريخ الموعد هو غدا، يظهر التذكير كـ ⏰ pending</div>
                            <div className="text-cyan-100">• زر واتساب يفتح wa.me مع رسالة جاهزة: مرحبا [اسم المريض]، نذكرك بموعدك غدا...</div>
                            <div className="text-cyan-100">• SMS هو محاكاة فقط - يظهر toast + يُسجل في السجل</div>
                          </div>
                        </div>

                        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5">
                          <h4 className="font-bold text-sm flex items-center gap-2"><History className="w-4 h-4"/> سجل التذكيرات - Historique</h4>
                          <div className="mt-4 space-y-2 max-h-[380px] overflow-auto pr-1">
                            {historyForCurrent.length===0 && <div className="text-xs text-slate-400 text-center py-8">لا يوجد سجل بعد</div>}
                            {historyForCurrent.map(log=>(
                              <div key={log.id} className="rounded-xl border bg-slate-50 p-3">
                                <div className="flex justify-between gap-2">
                                  <div className="text-xs font-bold">{log.patientName}</div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${log.channel==="whatsapp" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}>{log.channel}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">{log.date} • {log.time} • {new Date(log.sentAt).toLocaleTimeString("fr-DZ", {hour:"2-digit", minute:"2-digit"})}</div>
                                <div className="mt-2 text-[11px] bg-white rounded-lg p-2 border leading-4 line-clamp-2">{log.message}</div>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">✅ تم الإرسال</span>
                                  <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 border">{log.templateType}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dentistTab === "bot" && currentCode && (
                  <div className="space-y-6">
                    {/* Bot toggle */}
                    <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex gap-3">
                        <div className={`w-12 h-12 rounded-xl grid place-items-center ${botConfigs[currentCode]?.enabled ? "bg-[#dcfce7] text-[#16a34a]" : "bg-slate-100 text-slate-400"}`}>
                          <Bot className="w-6 h-6"/>
                        </div>
                        <div>
                          <div className="font-bold text-sm flex items-center gap-2">الرد الآلي واتساب - Bot WhatsApp Auto-Reply
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${botConfigs[currentCode]?.enabled ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>{botConfigs[currentCode]?.enabled ? "مفعل - Actif" : "متوقف"}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">يرد تلقائيا بـ "بماذا نستطيع أن نخدمك؟" عند أول رسالة • Réponse automatique instantanée</div>
                          <div className="mt-2 flex gap-2 flex-wrap">
                            <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center gap-1"><Zap className="w-3 h-3"/> 1. حجز</span>
                            <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-800">2. العنوان</span>
                            <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-800">3. الخدمات</span>
                            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 border">4. طبيب</span>
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={!!botConfigs[currentCode]?.enabled} onChange={(e)=>{
                          setBotConfigs({...botConfigs, [currentCode]: {...botConfigs[currentCode], enabled:e.target.checked}});
                        }} className="sr-only peer"/>
                        <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-20px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:right-[4px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#25D366]"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_380px] gap-6">
                      {/* Config */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5">
                          <h3 className="font-bold text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#0e7490]"/> رسالة الترحيب - بماذا نستطيع أن نخدمك؟</h3>
                          <textarea
                            value={botConfigs[currentCode]?.welcomeMessage || ""}
                            onChange={(e)=>{
                              setBotConfigs({...botConfigs, [currentCode]: {...botConfigs[currentCode], welcomeMessage:e.target.value}});
                            }}
                            className="mt-3 w-full min-h-[140px] p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#25D366] outline-none text-xs leading-6"
                          />
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {botConfigs[currentCode]?.replies.map((rep)=>(
                              <div key={rep.id} className="rounded-xl border bg-slate-50/60 p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold">{rep.id}. {rep.label}</span>
                                  <span className="text-[10px] bg-white border px-2 py-0.5 rounded-full">{rep.keywords[0]}</span>
                                </div>
                                <input value={rep.keywords.join(", ")} onChange={(e)=>{
                                  const newKw = e.target.value.split(",").map(s=>s.trim()).filter(Boolean);
                                  setBotConfigs({...botConfigs, [currentCode]: {...botConfigs[currentCode], replies: botConfigs[currentCode].replies.map(r=> r.id===rep.id ? {...r, keywords:newKw} : r)}});
                                }} className="mt-2 w-full h-8 px-3 rounded-lg border bg-white text-[11px] outline-none" placeholder="كلمات مفتاحية مفصولة بفاصلة"/>
                                <textarea value={rep.response} onChange={(e)=>{
                                  setBotConfigs({...botConfigs, [currentCode]: {...botConfigs[currentCode], replies: botConfigs[currentCode].replies.map(r=> r.id===rep.id ? {...r, response:e.target.value} : r)}});
                                }} className="mt-2 w-full min-h-[90px] p-2.5 rounded-xl border bg-white text-[11px] leading-5 outline-none focus:border-[#25D366]"/>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 rounded-xl border bg-amber-50/50 p-3">
                            <div className="text-xs font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4 text-amber-600"/> رسالة عدم الفهم - Fallback</div>
                            <textarea value={botConfigs[currentCode]?.fallbackMessage} onChange={(e)=>setBotConfigs({...botConfigs, [currentCode]: {...botConfigs[currentCode], fallbackMessage:e.target.value}})} className="mt-2 w-full min-h-[80px] p-3 rounded-xl border bg-white text-xs leading-5 outline-none focus:border-[#25D366]"/>
                          </div>
                        </div>

                        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5">
                          <h4 className="font-bold text-sm flex items-center gap-2"><History className="w-4 h-4"/> الوارد الذكي - Boîte de réception (محاكاة)</h4>
                          <p className="text-xs text-slate-500 mt-1">محادثات تم الرد عليها تلقائيا • Messages avec auto-reply</p>
                          <div className="mt-4 space-y-2">
                            {botInbox.filter(b=>b.dentistCode===currentCode).map(item=>(
                              <div key={item.id} className="flex gap-3 p-3 rounded-xl border hover:bg-slate-50">
                                <div className="w-10 h-10 rounded-full bg-[#dcfce7] text-[#16a34a] grid place-items-center font-bold text-sm">{item.patientName.charAt(0)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold">{item.patientName}</span>
                                    <span className="text-[10px] text-slate-400">{item.time}</span>
                                    {item.autoReplied && <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Bot className="w-3 h-3"/>رد آلي</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">{item.lastMessage}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5" dir="ltr">{item.phone}</div>
                                </div>
                                {item.unread && <span className="w-2 h-2 bg-[#25D366] rounded-full mt-2"/>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Phone preview */}
                      <div className="space-y-4">
                        <div className="bg-[#111b21] rounded-[28px] p-3 shadow-xl border border-slate-800 mx-auto max-w-[360px]">
                          <div className="bg-[#efeae2] rounded-[20px] overflow-hidden flex flex-col h-[560px]">
                            {/* WA header */}
                            <div className="h-[56px] bg-[#f0f2f5] flex items-center gap-3 px-3 border-b">
                              <div className="w-8 h-8 rounded-full bg-cyan-100 grid place-items-center text-[#0e7490] font-bold">{currentProfile?.name.charAt(0)}</div>
                              <div className="flex-1">
                                <div className="text-xs font-bold leading-none">{currentProfile?.name}</div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"/> متصل الآن • بوت فعال {botConfigs[currentCode]?.enabled ? "✅" : "❌"}</div>
                              </div>
                              <Phone className="w-4 h-4 text-slate-500"/>
                            </div>
                            {/* Chat */}
                            <div className="flex-1 overflow-auto p-3 space-y-2 bg-[radial-gradient(#d1d7db_1px,transparent_1px)] bg-[size:20px_20px] bg-[#efeae2]">
                              {chatMessages.map(m=>(
                                <div key={m.id} className={`flex ${m.from==="user" ? "justify-end" : "justify-start"}`}>
                                  <div className={`max-w-[78%] rounded-[14px] px-3 py-2 text-[12px] leading-5 whitespace-pre-wrap shadow-sm ${m.from==="user" ? "bg-[#d9fdd3] rounded-br-none" : "bg-white rounded-bl-none"}`}>
                                    {m.text || (currentProfile && botConfigs[currentCode] ? buildBotMessage(botConfigs[currentCode].welcomeMessage, currentProfile) : "")}
                                    <div className="text-[9px] text-slate-400 mt-1 text-left">{m.time} {m.from==="bot" && "✓✓"}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Input */}
                            <div className="h-[56px] bg-[#f0f2f5] flex items-center gap-2 px-2">
                              <button className="w-9 h-9 rounded-full bg-white grid place-items-center"><Plus className="w-4 h-4 text-slate-500"/></button>
                              <input value={chatInput} onChange={(e)=>setChatInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter") handleBotSend(); }} placeholder="اكتب رسالة..." className="flex-1 h-9 px-4 rounded-full bg-white border text-xs outline-none"/>
                              <button onClick={handleBotSend} className="w-9 h-9 rounded-full bg-[#25D366] text-white grid place-items-center hover:bg-[#128C7E]"><Send className="w-4 h-4"/></button>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-4">
                          <div className="text-xs font-bold flex items-center gap-1.5"><Headset className="w-4 h-4"/> كيف يعمل الرد الآلي؟</div>
                          <div className="mt-2 text-[11px] leading-5 text-slate-600 space-y-1">
                            <div>• عند أول رسالة من المريض، يرد البوت فورا: <b>بماذا نستطيع أن نخدمك؟</b></div>
                            <div>• يتعرف على الأرقام 1-4 والكلمات: موعد، عنوان، خدمات، طبيب</div>
                            <div>• يمكن للمريض كتابة "سلام" ليظهر الترحيب مرة أخرى</div>
                            <div>• إذا لم يفهم، يرسل رسالة fallback مع القائمة</div>
                            <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">✅ محاكاة محلية - Local simulation • في الإنتاج يربط بـ WhatsApp Business API أو wa.me مع webhook</div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button onClick={()=>{ setChatMessages([{id:Date.now(), from:"user", text:"السلام عليكم", time:"الآن"}, {id:Date.now()+1, from:"bot", text: currentProfile && botConfigs[currentCode] ? buildBotMessage(botConfigs[currentCode].welcomeMessage, currentProfile) : "", time:"الآن"}]); }} className="h-8 px-3 rounded-full bg-slate-100 text-xs">إعادة تعيين المحادثة</button>
                            <button onClick={()=> setChatInput("1")} className="h-8 px-3 rounded-full bg-[#dcfce7] text-[#16a34a] text-xs border border-emerald-200">جرب: 1</button>
                            <button onClick={()=> setChatInput("ما هو عنوانكم؟")} className="h-8 px-3 rounded-full bg-cyan-50 text-cyan-700 text-xs border border-cyan-100">جرب: العنوان</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dentistTab === "calendar" && (
                  <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-6">
                    <h3 className="font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-[#0e7490]"/> التقويم المبسط - Vue calendrier</h3>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Array.from(new Set(bookingsForCurrent.map(b=>b.date))).sort().map(date => (
                        <div key={date} className="rounded-2xl border bg-slate-50/60 p-4">
                          <div className="font-bold text-sm flex items-center gap-2"><Calendar className="w-4 h-4"/>{date} {date===getTomorrowStr() && <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">غدا • تذكير ⏰</span>}</div>
                          <div className="mt-3 space-y-2">
                            {bookingsForCurrent.filter(b=>b.date===date).sort((a,b)=>a.time.localeCompare(b.time)).map(b=>{
                              const rs = getBookingReminderStatus(b.id);
                              return (
                              <div key={b.id} className="bg-white rounded-xl p-3 border flex justify-between items-center">
                                <div>
                                  <div className="text-xs font-bold">{b.time} • {b.patientName}</div>
                                  <div className="text-[11px] text-slate-500">{b.service.split("-")[0]}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {rs==="sent" && <span className="text-[10px]">✅</span>}
                                  {rs==="pending" && <span className="text-[10px]">⏰</span>}
                                  <span className={`w-2 h-2 rounded-full ${b.status==="confirmed"?"bg-emerald-500":b.status==="pending"?"bg-amber-500":"bg-slate-300"}`}/>
                                </div>
                              </div>
                            )})}
                          </div>
                        </div>
                      ))}
                      {bookingsForCurrent.length===0 && <div className="text-sm text-slate-400 col-span-3 text-center py-10">لا يوجد مواعيد • Calendrier vide</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PATIENT VIEW - BORDJ LOCAL ONLY */}
        {view === "patient" && (
          <div className="space-y-6">
            {/* Hero Local */}
            <div className="bg-gradient-to-br from-[#0e7490] to-cyan-600 rounded-[28px] p-6 md:p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute w-[300px] h-[300px] rounded-full bg-white blur-3xl -top-20 -left-20"></div>
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] bg-white/20 px-3 py-1 rounded-full border border-white/20">📍 برج بوعريريج فقط - Local</span>
                  <span className="text-[11px] bg-emerald-400/20 px-3 py-1 rounded-full border border-emerald-300/30">● مفتوح الآن</span>
                </div>
                <h1 className="text-[26px] md:text-[34px] font-extrabold leading-tight">أطباء الأسنان في برج بوعريريج 🦷</h1>
                <p className="text-cyan-100 text-sm mt-2 max-w-[600px]">حوس على طبيبك القريب ليك، وشوف خدماتو، واحجز موعدك في دقيقة بلا ما تتنقل</p>
                
                <div className="mt-6 bg-white rounded-[16px] p-3 flex flex-col md:flex-row gap-3 shadow-xl max-w-[700px]">
                  <div className="flex-[1.5] flex items-center gap-2 bg-slate-50 rounded-xl px-3 h-12 border">
                    <Search className="w-5 h-5 text-slate-400 shrink-0"/>
                    <input value={patientSearch} onChange={(e)=>setPatientSearch(e.target.value)} placeholder="حوس على طبيب، خدمة، عنوان..." className="flex-1 bg-transparent outline-none text-sm text-slate-800"/>
                  </div>
                  <div className="text-[11px] bg-slate-900 text-white px-5 h-12 rounded-xl grid place-items-center font-bold">
                    {activeSubs.filter(sub=>{
                      const p = profiles[sub.code];
                      if(!p) return false;
                      if(patientSearch){
                        const q = patientSearch.toLowerCase();
                        return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.services.join(" ").toLowerCase().includes(q);
                      }
                      return true;
                    }).length} طبيب في برج
                  </div>
                </div>
              </div>
            </div>

            {/* Doctors Grid - Bordj Only */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSubs.filter(sub=>{
                const p = profiles[sub.code];
                if(!p) return false;
                if(patientSearch){
                  const q = patientSearch.toLowerCase();
                  return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.services.join(" ").toLowerCase().includes(q);
                }
                return true;
              }).map(sub=>{
                const p = profiles[sub.code];
                const isBookingOpen = showBookingFor===sub.code;
                return (
                  <div key={sub.code} className="bg-white rounded-[22px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition group">
                    <div className="p-5">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0e7490] to-cyan-500 grid place-items-center text-white font-extrabold text-lg shrink-0">{p.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-[15px] leading-tight truncate">{p.name}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">● متوفر</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3"/>برج بوعريريج</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 flex gap-1"><MapPin className="w-3 h-3 mt-0.5 shrink-0"/>{p.address}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1">
                        {p.services.slice(0,3).map(s=> <span key={s} className="text-[10px] px-2 py-1 rounded-full bg-slate-50 border text-slate-600">{s.split("-")[0].trim()}</span>)}
                        {p.services.length>3 && <span className="text-[10px] px-2 py-1 rounded-full bg-slate-900 text-white">+{p.services.length-3}</span>}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <a href={`https://wa.me/${p.whatsapp}`} target="_blank" className="h-10 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#16a34a] text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#25D366] hover:text-white transition"><MessageCircle className="w-4 h-4"/> واتساب</a>
                        <button onClick={()=>{ setSelectedDentistCode(sub.code); setShowBookingFor(isBookingOpen ? null : sub.code); setPatientForm(f=>({...f, service: p.services[0]})); }} className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${isBookingOpen ? "bg-slate-900 text-white" : "bg-[#0e7490] text-white hover:bg-cyan-800"}`}><Calendar className="w-4 h-4"/>{isBookingOpen ? "إغلاق" : "احجز موعد"}</button>
                      </div>
                    </div>
                    {isBookingOpen && (
                      <div className="border-t bg-[#f8fdff] p-5 animate-in">
                        {bookingSuccess && selectedDentistCode===sub.code && (
                          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0"/><div><div className="text-xs font-bold text-emerald-800">تم الحجز!</div><div className="text-[11px] text-emerald-700">سيتواصل معك الطبيب</div></div>
                          </div>
                        )}
                        <form onSubmit={(e)=>{ e.preventDefault(); handleBookingSubmit(e); }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2"><label className="text-[11px] font-bold">اسمك الكامل *</label><input required value={patientForm.patientName} onChange={e=>setPatientForm({...patientForm, patientName:e.target.value})} placeholder="محمد لمين" className="mt-1 w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none focus:border-[#0e7490]"/></div>
                          <div><label className="text-[11px] font-bold">الهاتف *</label><input required dir="ltr" value={patientForm.phone} onChange={e=>setPatientForm({...patientForm, phone:e.target.value})} placeholder="0550 00 00 00" className="mt-1 w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none focus:border-[#0e7490]"/></div>
                          <div><label className="text-[11px] font-bold">الخدمة</label><select value={patientForm.service} onChange={e=>setPatientForm({...patientForm, service:e.target.value})} className="mt-1 w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none"><>{p.services.map(s=><option key={s} value={s}>{s}</option>)}</></select></div>
                          <div><label className="text-[11px] font-bold">التاريخ *</label><input required type="date" value={patientForm.date} onChange={e=>setPatientForm({...patientForm, date:e.target.value})} className="mt-1 w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none"/></div>
                          <div><label className="text-[11px] font-bold">الوقت *</label><input required type="time" value={patientForm.time} onChange={e=>setPatientForm({...patientForm, time:e.target.value})} className="mt-1 w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none"/></div>
                          <div className="md:col-span-2 mt-1"><button type="submit" className="w-full h-12 rounded-xl bg-[#0e7490] text-white font-bold text-sm flex items-center justify-center gap-2"><Calendar className="w-4 h-4"/>تأكيد الحجز</button></div>
                        </form>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {activeSubs.filter(sub=>{ const p=profiles[sub.code]; if(!p) return false; if(patientSearch){ const q=patientSearch.toLowerCase(); return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q); } return true; }).length===0 && (
              <div className="bg-white rounded-[20px] border border-dashed p-10 text-center">
                <Search className="w-10 h-10 mx-auto text-slate-300 mb-3"/>
                <div className="font-bold">ما لقيناش طبيب بهاد الاسم</div>
                <div className="text-xs text-slate-500 mt-1">جرب تكتب حاجة أخرى - كل الأطباء من برج بوعريريج برك</div>
                <button onClick={()=>{setPatientSearch("");}} className="mt-4 px-4 py-2 rounded-full bg-slate-900 text-white text-xs">مسح البحث</button>
              </div>
            )}

            <div className="bg-slate-900 rounded-[20px] p-5 text-white flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center"><MapPin className="w-5 h-5"/></div>
                <div>
                  <div className="text-sm font-bold">DentiDz • برج بوعريريج فقط</div>
                  <div className="text-[11px] text-slate-300">منصة محلية 100% • كل الأطباء من برج بوعريريج</div>
                </div>
              </div>
              <div className="text-[10px] bg-white/10 px-3 py-1.5 rounded-full">© 2026 Rida - Bordj Bou Arreridj</div>
            </div>
          </div>
        )}

            </main>

      <footer className="mt-10 border-t border-slate-200 bg-white/60">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>Built as SaaS prototype • DentiDz Pro • Owner: Rida • Made for dentistes algériens</div>
          <div className="flex gap-3">
            <span>🔒 بيانات محلية - Local state only</span>
            <span>•</span>
            <span dir="ltr">support@dentidz.dz</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

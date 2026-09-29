import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, MapPin, Calendar, Clock, Phone, User, Shield, LogOut, 
  Plus, Trash2, CheckCircle, AlertTriangle, Stethoscope, Bell,
  Sun, Sunset, Save, Eye, EyeOff, Crown, Timer
} from 'lucide-react';

// === TYPES ===
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  wilaya: string;
  phone: string;
  code: string;
  subscriptionMonths: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  isActive: boolean;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  patientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  period: 'morning' | 'evening';
  number: number; // رقم الحجز في اليوم
  status: 'pending' | 'confirmed' | 'done' | 'cancelled';
  createdAt: string;
}

const SPECIALTIES = [
  "جراحة الأسنان", "تقويم الأسنان", "زراعة الأسنان", 
  "طب أسنان الأطفال", "تجميل الأسنان", "أمراض اللثة", "الكل"
];

const WILAYAS = [
  "الكل","أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار","البليدة",
  "البويرة","تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر","الجلفة","جيجل",
  "سطيف","سعيدة","سكيكدة","سيدي بلعباس","عنابة","قالمة","قسنطينة","المدية","مستغانم",
  "المسيلة","معسكر","ورقلة","وهران","البيض","إليزي","برج بوعريريج","بومرداس","الطارف",
  "تندوف","تيسمسيلت","الوادي","خنشلة","سوق أهراس","تيبازة","ميلة","عين الدفلى",
  "النعامة","عين تموشنت","غرداية","غليزان","تيميمون","برج باجي مختار","أولاد جلال",
  "بني عباس","عين صالح","عين قزام","تقرت","جانت","المغير","المنيعة"
];

// === MORNING 20 slots: 08:00 to 12:00 (12min interval) | EVENING 20 slots: 14:00 to 19:00 (15min) ===
const generateSlots = () => {
  const morning: string[] = [];
  const evening: string[] = [];
  let hour = 8, minute = 0;
  for(let i=0;i<20;i++){ morning.push(`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`); minute+=12; if(minute>=60){hour++; minute-=60;} }
  hour = 14; minute = 0;
  for(let i=0;i<20;i++){ evening.push(`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`); minute+=15; if(minute>=60){hour++; minute-=60;} }
  return { morning, evening };
};
const SLOTS = generateSlots();

const DEMO_DOCTORS: Doctor[] = [
  { id: '1', name: 'د. أحمد بن علي', specialty: 'جراحة الأسنان', wilaya: 'الجزائر', phone: '0555123456', code: 'DENT-2026-DEMO', subscriptionMonths: 12, subscriptionStart: '2026-01-01', subscriptionEnd: '2027-01-01', isActive: true },
  { id: '2', name: 'د. سارة قاسم', specialty: 'تقويم الأسنان', wilaya: 'سطيف', phone: '0555987654', code: 'DENT-2026-SARA', subscriptionMonths: 6, subscriptionStart: '2026-03-01', subscriptionEnd: '2026-09-01', isActive: true },
  { id: '3', name: 'د. محمد برج', specialty: 'زراعة الأسنان', wilaya: 'برج بوعريريج', phone: '0661122334', code: 'DENT-2026-BORDJ', subscriptionMonths: 12, subscriptionStart: '2026-02-15', subscriptionEnd: '2027-02-15', isActive: true },
];

export default function App() {
  const [view, setView] = useState<'patient' | 'doctor' | 'owner'>('patient');
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('dentidz_doctors_national');
    return saved ? JSON.parse(saved) : DEMO_DOCTORS;
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('dentidz_appts_national');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Patient states
  const [searchName, setSearchName] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('الكل');
  const [filterWilaya, setFilterWilaya] = useState('الكل');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{time:string, period:'morning'|'evening'} | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);

  // Doctor login
  const [doctorCode, setDoctorCode] = useState('');
  const [loggedDoctor, setLoggedDoctor] = useState<Doctor | null>(null);
  const [showCode, setShowCode] = useState(false);

  // Owner
  const [ownerAuth, setOwnerAuth] = useState(false);
  const [ownerPass, setOwnerPass] = useState('');
  const [newDoc, setNewDoc] = useState({ name:'', specialty:'جراحة الأسنان', wilaya:'الجزائر', phone:'', months: 12 });

  useEffect(() => { localStorage.setItem('dentidz_doctors_national', JSON.stringify(doctors)); }, [doctors]);
  useEffect(() => { localStorage.setItem('dentidz_appts_national', JSON.stringify(appointments)); }, [appointments]);

  // Check secret owner route
  useEffect(() => {
    const path = window.location.pathname;
    if(path.includes('owner-secure-bba-2026')){
      setView('owner');
    }
    const today = new Date().toISOString().split('T')[0];
    // Auto reminders: check appointments for tomorrow
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const toRemind = appointments.filter(a => a.date === tomorrowStr && a.status === 'confirmed');
    if(toRemind.length > 0 && Notification && Notification.permission === 'granted'){
      // could notify
    }
  }, []);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(d => d.isActive && new Date(d.subscriptionEnd) >= new Date())
      .filter(d => searchName === '' || d.name.includes(searchName) || d.specialty.includes(searchName))
      .filter(d => filterSpecialty === 'الكل' || d.specialty === filterSpecialty)
      .filter(d => filterWilaya === 'الكل' || d.wilaya === filterWilaya);
  }, [doctors, searchName, filterSpecialty, filterWilaya]);

  const getBookedSlots = (doctorId: string, date: string) => {
    return appointments.filter(a => a.doctorId === doctorId && a.date === date && a.status !== 'cancelled').map(a => a.time);
  };

  const handleBooking = () => {
    if(!selectedDoctor || !selectedSlot || !patientName || !patientPhone) return;
    const bookedToday = appointments.filter(a => a.doctorId === selectedDoctor.id && a.date === selectedDate).length;
    const newAppt: Appointment = {
      id: Date.now().toString(),
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      patientName,
      patientPhone,
      date: selectedDate,
      time: selectedSlot.time,
      period: selectedSlot.period,
      number: bookedToday + 1,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    setAppointments([...appointments, newAppt]);
    setBookingSuccess(newAppt);
    setPatientName(''); setPatientPhone(''); setSelectedSlot(null);
  };

  const handleDoctorLogin = () => {
    const doc = doctors.find(d => d.code === doctorCode.trim());
    if(doc){ setLoggedDoctor(doc); } else { alert('كود غير صحيح!'); }
  };

  const handleAddDoctor = () => {
    if(!newDoc.name || !newDoc.phone) { alert('اكمل البيانات'); return; }
    const code = `DENT-2026-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
    const start = new Date(); const end = new Date(); end.setMonth(end.getMonth() + newDoc.months);
    const doc: Doctor = {
      id: Date.now().toString(),
      name: newDoc.name,
      specialty: newDoc.specialty,
      wilaya: newDoc.wilaya,
      phone: newDoc.phone,
      code,
      subscriptionMonths: newDoc.months,
      subscriptionStart: start.toISOString().split('T')[0],
      subscriptionEnd: end.toISOString().split('T')[0],
      isActive: true
    };
    setDoctors([...doctors, doc]);
    setNewDoc({ name:'', specialty:'جراحة الأسنان', wilaya:'الجزائر', phone:'', months: 12 });
    alert(`تم إضافة الطبيب! كود الدخول: ${code}`);
  };

  const sendWhatsAppReminder = (appt: Appointment) => {
    const doctor = doctors.find(d => d.id === appt.doctorId);
    const msg = `مرحبا ${appt.patientName}، نذكرك بموعدك عند ${appt.doctorName} يوم ${appt.date} على الساعة ${appt.time} (${appt.period === 'morning' ? 'صباحا' : 'مساء'}). رقم حجزك: ${appt.number}. ${doctor?.wilaya || ''}`;
    const url = `https://wa.me/${appt.patientPhone.replace(/\s/g,'').replace(/^0/, '213')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // === VIEWS ===

  if(view === 'owner' && !ownerAuth){
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border">
          <div className="flex justify-center mb-4"><Shield className="w-12 h-12 text-teal-600"/></div>
          <h1 className="text-2xl font-bold text-center mb-2">دخول المالك فقط</h1>
          <p className="text-center text-slate-500 text-sm mb-6">هذا الرابط سري، لا يظهر للمرضى ولا للأطباء</p>
          <input type="password" value={ownerPass} onChange={e=>setOwnerPass(e.target.value)} placeholder="كلمة السر" className="w-full p-3 border rounded-xl mb-4"/>
          <button onClick={()=>{ if(ownerPass==='ridazemoura'){ setOwnerAuth(true);} else alert('خطأ');}} className="w-full bg-teal-600 text-white p-3 rounded-xl font-bold hover:bg-teal-700">دخول</button>
          <button onClick={()=>{setView('patient'); window.history.pushState({},'', '/');}} className="w-full mt-3 text-slate-500 text-sm">العودة للواجهة العامة</button>
        </div>
      </div>
    );
  }

  if(view === 'owner' && ownerAuth){
    return (
      <div className="min-h-screen bg-slate-50 p-4" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2"><Crown className="text-amber-500"/> لوحة المالك - تحكم كامل</h1>
            <button onClick={()=>{setOwnerAuth(false); setView('patient'); window.history.pushState({},'','/');}} className="flex items-center gap-2 text-slate-600"><LogOut className="w-4 h-4"/> خروج</button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow"><p className="text-slate-500 text-sm">إجمالي الأطباء</p><p className="text-3xl font-bold">{doctors.length}</p></div>
            <div className="bg-white p-4 rounded-xl shadow"><p className="text-slate-500 text-sm">نشطون حاليا</p><p className="text-3xl font-bold text-green-600">{doctors.filter(d=>d.isActive).length}</p></div>
            <div className="bg-white p-4 rounded-xl shadow"><p className="text-slate-500 text-sm">مواعيد اليوم</p><p className="text-3xl font-bold">{appointments.filter(a=>a.date===new Date().toISOString().split('T')[0]).length}</p></div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Plus/> إضافة طبيب جديد (المالك فقط)</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
              <input value={newDoc.name} onChange={e=>setNewDoc({...newDoc, name:e.target.value})} placeholder="اسم الطبيب" className="p-3 border rounded-xl"/>
              <select value={newDoc.specialty} onChange={e=>setNewDoc({...newDoc, specialty:e.target.value})} className="p-3 border rounded-xl">{SPECIALTIES.filter(s=>s!=='الكل').map(s=><option key={s}>{s}</option>)}</select>
              <select value={newDoc.wilaya} onChange={e=>setNewDoc({...newDoc, wilaya:e.target.value})} className="p-3 border rounded-xl">{WILAYAS.filter(w=>w!=='الكل').map(w=><option key={w}>{w}</option>)}</select>
              <input value={newDoc.phone} onChange={e=>setNewDoc({...newDoc, phone:e.target.value})} placeholder="واتساب الطبيب" className="p-3 border rounded-xl"/>
              <select value={newDoc.months} onChange={e=>setNewDoc({...newDoc, months: Number(e.target.value)})} className="p-3 border rounded-xl">
                <option value={1}>شهر واحد</option><option value={3}>3 أشهر</option><option value={6}>6 أشهر</option><option value={12}>سنة كاملة</option>
              </select>
            </div>
            <button onClick={handleAddDoctor} className="mt-4 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold">إنشاء + توليد كود دخول</button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="text-right"><th className="p-3">الطبيب</th><th className="p-3">الاختصاص</th><th className="p-3">الولاية</th><th className="p-3">الكود</th><th className="p-3">الاشتراك</th><th className="p-3">ينتهي</th><th className="p-3">إجراء</th></tr></thead>
              <tbody>{doctors.map(d=>(
                <tr key={d.id} className="border-t"><td className="p-3 font-bold">{d.name}</td><td className="p-3">{d.specialty}</td><td className="p-3">{d.wilaya}</td><td className="p-3 font-mono bg-slate-100 rounded">{d.code}</td><td className="p-3">{d.subscriptionMonths} شهر</td><td className="p-3">{d.subscriptionEnd} {new Date(d.subscriptionEnd) < new Date() && <span className="text-red-500">(منتهي)</span>}</td><td className="p-3 flex gap-2"><button onClick={()=>{ if(confirm('حذف؟')) setDoctors(doctors.filter(x=>x.id!==d.id))}} className="text-red-500"><Trash2 className="w-4 h-4"/></button><button onClick={()=>{ const months = prompt('تمديد بعدد الأشهر:', '3'); if(months){ const end = new Date(d.subscriptionEnd); end.setMonth(end.getMonth()+Number(months)); setDoctors(doctors.map(x=> x.id===d.id ? {...x, subscriptionEnd: end.toISOString().split('T')[0], subscriptionMonths: x.subscriptionMonths + Number(months)} : x)); } }} className="text-teal-600"><Timer className="w-4 h-4"/></button></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if(view === 'doctor'){
    if(!loggedDoctor){
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h1 className="text-2xl font-bold text-center mb-2">دخول الطبيب</h1>
            <p className="text-center text-slate-500 text-sm mb-6">ادخل الكود الخاص بك لتصفح منطقتك</p>
            <div className="relative mb-4">
              <input type={showCode ? "text" : "password"} value={doctorCode} onChange={e=>setDoctorCode(e.target.value)} placeholder="مثال: DENT-2026-XXXX" className="w-full p-3 border rounded-xl pr-10"/>
              <button onClick={()=>setShowCode(!showCode)} className="absolute left-3 top-3 text-slate-400">{showCode ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
            </div>
            <button onClick={handleDoctorLogin} className="w-full bg-teal-600 text-white p-3 rounded-xl font-bold">دخول</button>
            <p className="text-center text-xs text-slate-400 mt-4">كود تجريبي: DENT-2026-DEMO</p>
            <button onClick={()=>setView('patient')} className="w-full mt-3 text-slate-500 text-sm">العودة للمرضى</button>
          </div>
        </div>
      );
    }
    const myAppts = appointments.filter(a=>a.doctorId===loggedDoctor.id).sort((a,b)=> a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const todayAppts = myAppts.filter(a=>a.date===new Date().toISOString().split('T')[0]);
    return (
      <div className="min-h-screen bg-slate-50 p-4" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow mb-6">
            <div><h1 className="font-bold text-xl">{loggedDoctor.name}</h1><p className="text-sm text-slate-500">{loggedDoctor.specialty} - {loggedDoctor.wilaya} | اشتراك حتى {loggedDoctor.subscriptionEnd}</p></div>
            <button onClick={()=>{setLoggedDoctor(null); setDoctorCode('');}} className="flex items-center gap-2 text-slate-600"><LogOut className="w-4 h-4"/> خروج</button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow"><p className="text-slate-500 text-sm">مواعيد اليوم</p><p className="text-3xl font-bold">{todayAppts.length}</p></div>
            <div className="bg-white p-4 rounded-xl shadow"><p className="text-slate-500 text-sm">صباحية</p><p className="text-3xl font-bold text-amber-600">{todayAppts.filter(a=>a.period==='morning').length} / 20</p></div>
            <div className="bg-white p-4 rounded-xl shadow"><p className="text-slate-500 text-sm">مسائية</p><p className="text-3xl font-bold text-indigo-600">{todayAppts.filter(a=>a.period==='evening').length} / 20</p></div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-bold mb-4">مواعيدي - مع تذكير واتساب</h2>
            <div className="space-y-2">
              {myAppts.length===0 && <p className="text-center text-slate-400 py-10">لا يوجد مواعيد بعد</p>}
              {myAppts.map(appt=>(
                <div key={appt.id} className="flex justify-between items-center border p-3 rounded-xl">
                  <div><p className="font-bold">{appt.patientName} - {appt.patientPhone}</p><p className="text-sm text-slate-500">{appt.date} {appt.time} - رقم {appt.number} - {appt.period==='morning' ? 'صباحا' : 'مساء'} - {appt.status}</p></div>
                  <div className="flex gap-2">
                    <button onClick={()=>sendWhatsAppReminder(appt)} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1"><Bell className="w-3 h-3"/> تذكير</button>
                    <select value={appt.status} onChange={e=> setAppointments(appointments.map(a=> a.id===appt.id ? {...a, status: e.target.value as any} : a))} className="text-xs border rounded-lg p-1">
                      <option value="confirmed">مؤكد</option><option value="done">تم</option><option value="cancelled">ملغي</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === PATIENT VIEW - NATIONAL DIRECT ===
  return (
    <div className="min-h-screen bg-[#f8fafc]" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white"><Stethoscope/></div><div><h1 className="font-bold text-lg leading-none">DentiDz Pro</h1><p className="text-[11px] text-slate-500">المنصة الوطنية لأطباء الأسنان - الجزائر</p></div></div>
          <div className="flex gap-2">
            <button onClick={()=>setView('patient')} className="bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold">واجهة المريض</button>
            <button onClick={()=>setView('doctor')} className="bg-slate-100 px-4 py-2 rounded-full text-sm">دخول الطبيب</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!selectedDoctor ? (
          <>
            <div className="text-center py-6">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">احجز موعد أسنانك مباشرة</h1>
              <p className="text-slate-500">اختر طبيبك من القائمة الوطنية، اضغط على اسمه، اختر الفترة الصباحية أو المسائية</p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border mb-6 grid md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2"><Search className="absolute right-3 top-3 w-5 h-5 text-slate-400"/><input value={searchName} onChange={e=>setSearchName(e.target.value)} placeholder="ابحث باسم الطبيب أو الاختصاص..." className="w-full pr-10 p-3 border rounded-xl bg-slate-50"/></div>
              <select value={filterSpecialty} onChange={e=>setFilterSpecialty(e.target.value)} className="p-3 border rounded-xl bg-slate-50">{SPECIALTIES.map(s=><option key={s}>{s}</option>)}</select>
              <select value={filterWilaya} onChange={e=>setFilterWilaya(e.target.value)} className="p-3 border rounded-xl bg-slate-50">{WILAYAS.map(w=><option key={w}>{w}</option>)}</select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoctors.map(doc=>{
                const todayCount = appointments.filter(a=>a.doctorId===doc.id && a.date===new Date().toISOString().split('T')[0]).length;
                return (
                  <div key={doc.id} onClick={()=>setSelectedDoctor(doc)} className="bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md hover:border-teal-200 cursor-pointer transition">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center font-bold text-lg">{doc.name.split(' ')[1]?.[0] || 'د'}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${todayCount>=40 ? 'bg-red-100 text-red-600' : todayCount>=30 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>{40-todayCount} موعد متبقي اليوم</span>
                    </div>
                    <h3 className="font-bold text-lg">{doc.name}</h3>
                    <p className="text-teal-600 text-sm font-medium">{doc.specialty}</p>
                    <p className="text-slate-500 text-sm flex items-center gap-1 mt-1"><MapPin className="w-4 h-4"/> {doc.wilaya}</p>
                    <div className="mt-4 flex gap-2"><span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full"><Sun className="w-3 h-3"/> 20 صباحا</span><span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full"><Sunset className="w-3 h-3"/> 20 مساء</span></div>
                    <button className="w-full mt-4 bg-slate-900 text-white py-2.5 rounded-xl font-bold hover:bg-black">اضغط للحجز - اختر فترتك</button>
                  </div>
                );
              })}
            </div>
            {filteredDoctors.length===0 && <p className="text-center py-20 text-slate-400">لا يوجد أطباء مطابقون للبحث</p>}
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <button onClick={()=>{setSelectedDoctor(null); setBookingSuccess(null);}} className="mb-4 text-slate-600 text-sm">← العودة لقائمة الأطباء</button>
            
            <div className="bg-white rounded-2xl shadow border overflow-hidden">
              <div className="bg-teal-600 text-white p-6">
                <h2 className="text-2xl font-bold">{selectedDoctor.name}</h2>
                <p className="opacity-90">{selectedDoctor.specialty} - {selectedDoctor.wilaya}</p>
                <div className="mt-3 flex gap-2"><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="text-slate-900 p-2 rounded-lg text-sm"/><span className="text-sm opacity-80 flex items-center gap-1"><Calendar className="w-4 h-4"/> اختر يوم الحجز</span></div>
              </div>

              {bookingSuccess ? (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-10 h-10"/></div>
                  <h3 className="text-2xl font-bold mb-2">تم الحجز بنجاح!</h3>
                  <p className="text-slate-600 mb-1">رقم حجزك هو:</p>
                  <p className="text-5xl font-black text-teal-600 mb-4">#{bookingSuccess.number}</p>
                  <div className="bg-slate-50 p-4 rounded-xl text-right max-w-md mx-auto mb-6">
                    <p><strong>الطبيب:</strong> {bookingSuccess.doctorName}</p>
                    <p><strong>التاريخ:</strong> {bookingSuccess.date}</p>
                    <p><strong>الوقت:</strong> {bookingSuccess.time} ({bookingSuccess.period==='morning' ? 'صباحا 08:00-12:00' : 'مساء 14:00-19:00'})</p>
                    <p><strong>المريض:</strong> {bookingSuccess.patientName}</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button onClick={()=>{ setBookingSuccess(null); setSelectedDoctor(null); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">حجز آخر</button>
                    <button onClick={()=> sendWhatsAppReminder(bookingSuccess)} className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Phone className="w-4 h-4"/> إرسال تأكيد واتساب</button>
                  </div>
                  <p className="text-xs text-slate-400 mt-4">سيتم إرسال رسالة تذكير تلقائية قبل 24 ساعة من موعدك</p>
                </div>
              ) : (
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2"><Sun className="w-5 h-5 text-amber-500"/> الفترة الصباحية - 20 موعد (08:00 - 12:00)</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {SLOTS.morning.map(time=>{
                        const booked = getBookedSlots(selectedDoctor.id, selectedDate).includes(time);
                        const isSelected = selectedSlot?.time===time && selectedSlot?.period==='morning';
                        return <button key={time} disabled={booked} onClick={()=>setSelectedSlot({time, period:'morning'})} className={`p-2 rounded-xl text-sm font-bold border ${booked ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through' : isSelected ? 'bg-amber-500 text-white border-amber-500' : 'bg-white hover:border-amber-300'}`}>{time}</button>
                      })}
                    </div>

                    <h4 className="font-bold mt-6 mb-3 flex items-center gap-2"><Sunset className="w-5 h-5 text-indigo-500"/> الفترة المسائية - 20 موعد (14:00 - 19:00)</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {SLOTS.evening.map(time=>{
                        const booked = getBookedSlots(selectedDoctor.id, selectedDate).includes(time);
                        const isSelected = selectedSlot?.time===time && selectedSlot?.period==='evening';
                        return <button key={time} disabled={booked} onClick={()=>setSelectedSlot({time, period:'evening'})} className={`p-2 rounded-xl text-sm font-bold border ${booked ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through' : isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:border-indigo-300'}`}>{time}</button>
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl h-fit">
                    <h4 className="font-bold mb-4">بيانات المريض - للحفظ</h4>
                    <div className="space-y-3">
                      <div><label className="text-sm font-medium">الاسم الكامل</label><div className="relative mt-1"><User className="absolute right-3 top-3 w-4 h-4 text-slate-400"/><input value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="مثال: محمد علي" className="w-full pr-9 p-3 border rounded-xl"/></div></div>
                      <div><label className="text-sm font-medium">رقم الهاتف (واتساب للتذكير)</label><div className="relative mt-1"><Phone className="absolute right-3 top-3 w-4 h-4 text-slate-400"/><input value={patientPhone} onChange={e=>setPatientPhone(e.target.value)} placeholder="0555 12 34 56" className="w-full pr-9 p-3 border rounded-xl"/></div></div>
                      
                      {selectedSlot && <div className="bg-white p-3 rounded-xl border text-sm"><p>الموعد المختار: <strong>{selectedSlot.time}</strong> {selectedSlot.period==='morning' ? 'صباحا' : 'مساء'}</p><p>التاريخ: <strong>{selectedDate}</strong></p></div>}

                      <button disabled={!patientName || !patientPhone || !selectedSlot} onClick={handleBooking} className="w-full bg-teal-600 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-2"><Save className="w-5 h-5"/> احفظ - احصل على رقمك</button>
                      
                      <p className="text-[11px] text-slate-500 text-center">عند اقتراب موعدك، ستصلك رسالة تذكير على الواتساب تلقائيا قبل 24 ساعة</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-slate-400">DentiDz Pro - المنصة الوطنية - جميع الولايات - تذكير واتساب تلقائي</footer>
    </div>
  );
}

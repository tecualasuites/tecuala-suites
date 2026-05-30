import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  Check,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Home,
  Languages,
  Lock,
  MessageCircle,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  Users
} from "lucide-react";
import "./styles.css";

const WHATSAPP_NUMBER = "523891052106";
const ADMIN_PIN = "2468";
const BUSINESS_EMAIL = "tecualasuites@icloud.com";
const BUSINESS_ADDRESS =
  "Luis Donaldo Colosio Murrieta Nte. 389 A, entre Ninos Heroes Oriente, Vicente Guerrero, 63450 Tecuala, Nay., Mexico";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS_ADDRESS)}`;
const MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(BUSINESS_ADDRESS)}&output=embed`;
// Replace this file with a real outside/street photo when ready.
const LOCATION_PHOTO = "/images/location-reference.svg";

const STORAGE_KEYS = {
  language: "tecuala_language",
  apartments: "tecuala_apartments",
  bookings: "tecuala_bookings",
  notes: "tecuala_owner_notes"
};

const defaultApartments = [
  {
    id: "two-bedroom-1",
    name: { en: "Suite A", es: "Suite A" },
    type: { en: "2 bedrooms, 4 beds", es: "2 recamaras, 4 camas" },
    totalUnits: 1,
    price: "$1,500 MXN",
    discountPrice: "",
    capacity: 7,
    bathrooms: 1,
    laundryRooms: 1,
    hidden: false,
    // Change this file in public/images when the real Two Bedroom Suite 1 photo is ready.
    image: "/images/apt-5.svg"
  },
  {
    id: "two-bedroom-2",
    name: { en: "Suite B", es: "Suite B" },
    type: { en: "2 bedrooms, 4 beds", es: "2 recamaras, 4 camas" },
    totalUnits: 1,
    price: "$1,500 MXN",
    discountPrice: "",
    capacity: 7,
    bathrooms: 1,
    laundryRooms: 1,
    hidden: false,
    // Change this file in public/images when the real Two Bedroom Suite 2 photo is ready.
    image: "/images/apt-6.svg"
  },
  {
    id: "one-bedroom-1",
    name: { en: "Suite C", es: "Suite C" },
    type: { en: "1 bedroom, 2 beds", es: "1 recamara, 2 camas" },
    totalUnits: 1,
    price: "$900 MXN",
    discountPrice: "",
    capacity: 4,
    bathrooms: 1,
    laundryRooms: 1,
    hidden: false,
    // Change this file in public/images when the real One Bedroom Suite 1 photo is ready.
    image: "/images/apt-1.svg"
  },
  {
    id: "one-bedroom-2",
    name: { en: "Suite D", es: "Suite D" },
    type: { en: "1 bedroom, 2 beds", es: "1 recamara, 2 camas" },
    totalUnits: 1,
    price: "$900 MXN",
    discountPrice: "",
    capacity: 4,
    bathrooms: 1,
    laundryRooms: 1,
    hidden: false,
    // Change this file in public/images when the real One Bedroom Suite 2 photo is ready.
    image: "/images/apt-2.svg"
  },
  {
    id: "one-bedroom-3",
    name: { en: "Suite E", es: "Suite E" },
    type: { en: "1 bedroom, 2 beds", es: "1 recamara, 2 camas" },
    totalUnits: 1,
    price: "$900 MXN",
    discountPrice: "",
    capacity: 4,
    bathrooms: 1,
    laundryRooms: 1,
    hidden: false,
    // Change this file in public/images when the real One Bedroom Suite 3 photo is ready.
    image: "/images/apt-3.svg"
  },
  {
    id: "one-bedroom-4",
    name: { en: "Suite F", es: "Suite F" },
    type: { en: "1 bedroom, 2 beds", es: "1 recamara, 2 camas" },
    totalUnits: 1,
    price: "$900 MXN",
    discountPrice: "",
    capacity: 4,
    bathrooms: 1,
    laundryRooms: 1,
    hidden: false,
    // Change this file in public/images when the real One Bedroom Suite 4 photo is ready.
    image: "/images/apt-4.svg"
  }
];

const emptyBooking = {
  apartmentId: defaultApartments[0].id,
  checkIn: "",
  checkOut: "",
  units: 1,
  source: "WhatsApp",
  guestName: "",
  deposit: "",
  status: "Pending"
};

const t = {
  businessName: { en: "Tecuala Suites", es: "Tecuala Suites" },
  domain: { en: "www.tecualasuites.com.mx", es: "www.tecualasuites.com.mx" },
  phone: { en: "WhatsApp", es: "WhatsApp" },
  install: { en: "Install", es: "Instalar" },
  admin: { en: "Admin", es: "Admin" },
  welcomeTitle: { en: "Welcome to Tecuala Suites", es: "Bienvenido a Tecuala Suites" },
  welcomeText: {
    en: "Comfortable furnished suites in Tecuala designed for short or extended stays. Enjoy spacious apartment-style accommodations with kitchens, air conditioning in every bedroom, Wi-Fi, a washer area, and everything you need to feel at home.",
    es: "Suites comodas y amuebladas en Tecuala, disenadas para estancias cortas o largas. Disfruta espacios amplios estilo departamento con cocina, aire acondicionado en cada recamara, Wi-Fi, area de lavado y todo lo necesario para sentirte en casa."
  },
  locationTitle: { en: "Location", es: "Ubicacion" },
  locationText: {
    en: "Find us in Tecuala, Nayarit.",
    es: "Encuentranos en Tecuala, Nayarit."
  },
  openMaps: { en: "Open in Google Maps", es: "Abrir en Google Maps" },
  locationPhoto: { en: "Street reference photo", es: "Foto de referencia" },
  searchTitle: { en: "Find a stay", es: "Buscar estancia" },
  checkIn: { en: "Check-in", es: "Entrada" },
  checkOut: { en: "Check-out", es: "Salida" },
  guests: { en: "Guests", es: "Huespedes" },
  apartments: { en: "Suites", es: "Suites" },
  from: { en: "From", es: "Desde" },
  perNight: { en: "per night", es: "por noche" },
  stayTotal: { en: "Estimated total", es: "Total estimado" },
  nights: { en: "nights", es: "noches" },
  selectDatesForTotal: { en: "Select dates to calculate total.", es: "Selecciona fechas para calcular el total." },
  capacity: { en: "Capacity", es: "Capacidad" },
  bathrooms: { en: "Bathrooms", es: "Banos" },
  laundryRooms: { en: "Washer area", es: "Area de lavado" },
  totalUnits: { en: "Total units", es: "Unidades totales" },
  available: { en: "Available", es: "Disponible" },
  limited: { en: "Limited availability", es: "Disponibilidad limitada" },
  fullyBooked: { en: "Fully booked", es: "Lleno" },
  checkAvailability: { en: "Check Availability", es: "Ver disponibilidad" },
  bookWhatsapp: { en: "Book via WhatsApp", es: "Reservar por WhatsApp" },
  availabilityOverview: { en: "Availability overview", es: "Resumen de disponibilidad" },
  apartment: { en: "Suite", es: "Suite" },
  booked: { en: "Booked", es: "Reservado" },
  adminPanel: { en: "Admin panel", es: "Panel admin" },
  backToSite: { en: "Back to site", es: "Volver al sitio" },
  enterPin: { en: "Enter PIN", es: "Ingresar PIN" },
  unlock: { en: "Unlock", es: "Abrir" },
  wrongPin: { en: "Incorrect PIN", es: "PIN incorrecto" },
  bookingForm: { en: "Manual booking", es: "Reserva manual" },
  unitsToBlock: { en: "Units to block", es: "Unidades a bloquear" },
  source: { en: "Booking source", es: "Origen de reserva" },
  guestName: { en: "Guest name", es: "Nombre del huesped" },
  deposit: { en: "Deposit", es: "Deposito" },
  status: { en: "Status", es: "Estado" },
  priceSettings: { en: "Suite prices", es: "Precios de suites" },
  regularPrice: { en: "Regular price", es: "Precio regular" },
  discountPrice: { en: "Discount price", es: "Precio con descuento" },
  discountHelp: {
    en: "Leave discount blank to show only the regular price.",
    es: "Deja el descuento vacio para mostrar solo el precio regular."
  },
  publicListing: { en: "Public listing", es: "Listado publico" },
  visible: { en: "Visible", es: "Visible" },
  hidden: { en: "Hidden", es: "Oculta" },
  hideSuite: { en: "Hide suite", es: "Ocultar suite" },
  showSuite: { en: "Show suite", es: "Mostrar suite" },
  saveBooking: { en: "Save Booking", es: "Guardar reserva" },
  updateBooking: { en: "Update Booking", es: "Actualizar reserva" },
  resetForm: { en: "Reset Form", es: "Limpiar formulario" },
  bookingList: { en: "Booking list", es: "Lista de reservas" },
  dates: { en: "Dates", es: "Fechas" },
  units: { en: "Units", es: "Unidades" },
  edit: { en: "Edit", es: "Editar" },
  delete: { en: "Delete", es: "Eliminar" },
  noBookings: { en: "No bookings yet.", es: "Todavia no hay reservas." },
  ownerNotes: { en: "Owner notes", es: "Notas del propietario" },
  saveNotes: { en: "Save notes", es: "Guardar notas" },
  exportCsv: { en: "Export bookings to CSV", es: "Exportar reservas a CSV" },
  noBookingsToExport: { en: "There are no bookings to export.", es: "No hay reservas para exportar." },
  exportedCsv: { en: "CSV exported.", es: "CSV exportado." },
  saved: { en: "Saved", es: "Guardado" },
  overbooked: {
    en: "Not enough units available for those dates.",
    es: "No hay suficientes unidades disponibles para esas fechas."
  },
  invalidDates: { en: "Check-out must be after check-in.", es: "La salida debe ser despues de la entrada." },
  pastDate: { en: "Dates cannot be in the past.", es: "Las fechas no pueden ser anteriores a hoy." },
  invalidUnits: { en: "Units must be at least 1.", es: "Las unidades deben ser minimo 1." },
  requiredFields: { en: "Please complete dates and guest name.", es: "Completa fechas y nombre del huesped." },
  availabilityFor: { en: "Availability for selected dates", es: "Disponibilidad para fechas seleccionadas" },
  selectDates: { en: "Select dates to check exact availability.", es: "Selecciona fechas para revisar disponibilidad exacta." },
  close: { en: "Close", es: "Cerrar" }
};

const sources = [
  { value: "WhatsApp", label: { en: "WhatsApp", es: "WhatsApp" } },
  { value: "Facebook", label: { en: "Facebook", es: "Facebook" } },
  { value: "Phone", label: { en: "Phone", es: "Telefono" } },
  { value: "Walk-in", label: { en: "Walk-in", es: "En persona" } },
  { value: "Other", label: { en: "Other", es: "Otro" } },
  { value: "Maintenance", label: { en: "Maintenance", es: "Mantenimiento" } },
  { value: "Owner Block", label: { en: "Owner Block", es: "Bloqueo propietario" } }
];
const statuses = [
  { value: "Pending", label: { en: "Pending", es: "Pendiente" } },
  { value: "Confirmed", label: { en: "Confirmed", es: "Confirmada" } },
  { value: "Paid", label: { en: "Paid", es: "Pagada" } }
];

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getInitialApartments() {
  const storedApartments = readStorage(STORAGE_KEYS.apartments, null);
  if (!Array.isArray(storedApartments)) return defaultApartments;

  return defaultApartments.map((defaultApartment) => {
    const storedApartment = storedApartments.find((apartment) => apartment.id === defaultApartment.id);
    return {
      ...defaultApartment,
      price: storedApartment?.price || defaultApartment.price,
      discountPrice: storedApartment?.discountPrice || defaultApartment.discountPrice,
      capacity: defaultApartment.capacity,
      bathrooms: storedApartment?.bathrooms || defaultApartment.bathrooms,
      laundryRooms: storedApartment?.laundryRooms || defaultApartment.laundryRooms,
      hidden: Boolean(storedApartment?.hidden),
      image: storedApartment?.image || defaultApartment.image,
      totalUnits: defaultApartment.totalUnits
    };
  });
}

function getSuiteName(apartment, language) {
  if (!apartment) return "";
  if (typeof apartment.name === "string") return apartment.name;
  return apartment.name?.[language] || apartment.name?.en || "";
}

function getSuiteType(apartment, language) {
  if (!apartment) return "";
  if (typeof apartment.type === "string") return apartment.type;
  return apartment.type?.[language] || apartment.type?.en || "";
}

function getNightCount(checkIn, checkOut) {
  if (!isValidDateRange(checkIn, checkOut)) return 0;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end - start) / millisecondsPerDay);
}

function parsePriceAmount(price) {
  const normalized = String(price || "").replace(/,/g, "");
  const match = normalized.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatMxn(amount) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(amount);
}

function getActivePrice(apartment) {
  const display = apartment.discountPrice?.trim() || apartment.price;
  return {
    display,
    amount: parsePriceAmount(display)
  };
}

function datesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function isValidDateRange(checkIn, checkOut) {
  return Boolean(checkIn && checkOut && checkIn < checkOut);
}

function getBookedUnits(apartmentId, checkIn, checkOut, bookings, ignoreId = null) {
  if (!isValidDateRange(checkIn, checkOut)) return 0;
  return bookings
    .filter((booking) => booking.id !== ignoreId)
    .filter((booking) => booking.apartmentId === apartmentId)
    .filter((booking) => datesOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut))
    .reduce((sum, booking) => sum + Number(booking.units || 0), 0);
}

function toCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEYS.language) || "es");
  const [apartments, setApartments] = useState(getInitialApartments);
  const [bookings, setBookings] = useState(() => readStorage(STORAGE_KEYS.bookings, []));
  const [notes, setNotes] = useState(() => localStorage.getItem(STORAGE_KEYS.notes) || "");
  const [savedNotes, setSavedNotes] = useState(false);
  const [search, setSearch] = useState({ checkIn: "", checkOut: "", guests: 2 });
  const isAdminPage = window.location.pathname === "/admin";
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [form, setForm] = useState(emptyBooking);
  const [editingId, setEditingId] = useState(null);
  const [formMessage, setFormMessage] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);
  const tr = (key) => t[key]?.[language] || key;
  const today = todayString();
  const nights = getNightCount(search.checkIn, search.checkOut);
  const visibleApartments = useMemo(() => apartments.filter((apartment) => !apartment.hidden), [apartments]);

  useEffect(() => writeStorage(STORAGE_KEYS.apartments, apartments), [apartments]);
  useEffect(() => writeStorage(STORAGE_KEYS.bookings, bookings), [bookings]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.language, language), [language]);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      return;
    }

    navigator.serviceWorker.getRegistrations?.().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    window.caches?.keys().then((keys) => {
      keys
        .filter((key) => key.startsWith("tecuala-suites"))
        .forEach((key) => window.caches.delete(key));
    });
  }, []);

  const exactSearch = isValidDateRange(search.checkIn, search.checkOut);

  const availabilityRows = useMemo(
    () =>
      visibleApartments.map((apartment) => {
        const booked = exactSearch
          ? getBookedUnits(apartment.id, search.checkIn, search.checkOut, bookings)
          : 0;
        const available = Math.max(apartment.totalUnits - booked, 0);
        return { ...apartment, booked, available };
      }),
    [visibleApartments, bookings, exactSearch, search.checkIn, search.checkOut]
  );

  function todayString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function nextWeekString() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }

  function statusFor(apartment) {
    const row = availabilityRows.find((item) => item.id === apartment.id);
    if (!row || row.available <= 0) return { label: tr("fullyBooked"), className: "status full" };
    if (row.available < apartment.totalUnits) return { label: tr("limited"), className: "status limited" };
    return { label: tr("available"), className: "status open" };
  }

  function whatsappUrl(apartment) {
    const suiteName = getSuiteName(apartment, language);
    const activePrice = getActivePrice(apartment);
    const total = nights && activePrice.amount ? formatMxn(activePrice.amount * nights) : "";
    const message =
      language === "es"
        ? `Hola, quiero reservar ${suiteName} del ${search.checkIn || "fecha de entrada"} al ${search.checkOut || "fecha de salida"} para ${search.guests || 1} huespedes.${total ? ` Total estimado: ${total} por ${nights} noches.` : ""}`
        : `Hi, I want to book ${suiteName} from ${search.checkIn || "check-in"} to ${search.checkOut || "check-out"} for ${search.guests || 1} guests.${total ? ` Estimated total: ${total} for ${nights} nights.` : ""}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function unlockAdmin(event) {
    event.preventDefault();
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      setPinError("");
      setPin("");
    } else {
      setPinError(tr("wrongPin"));
    }
  }

  function resetForm() {
    setForm(emptyBooking);
    setEditingId(null);
    setFormMessage("");
  }

  function saveBooking(event) {
    event.preventDefault();
    setFormMessage("");
    if (!form.guestName.trim() || !form.checkIn || !form.checkOut) {
      setFormMessage(tr("requiredFields"));
      return;
    }
    if (!isValidDateRange(form.checkIn, form.checkOut)) {
      setFormMessage(tr("invalidDates"));
      return;
    }
    if (form.checkIn < today) {
      setFormMessage(tr("pastDate"));
      return;
    }

    const apartment = apartments.find((item) => item.id === form.apartmentId);
    const booked = getBookedUnits(form.apartmentId, form.checkIn, form.checkOut, bookings, editingId);
    const requestedUnits = Number(form.units);
    if (!Number.isFinite(requestedUnits) || requestedUnits < 1) {
      setFormMessage(tr("invalidUnits"));
      return;
    }
    if (booked + requestedUnits > apartment.totalUnits) {
      setFormMessage(tr("overbooked"));
      return;
    }

    const nextBooking = {
      ...form,
      id: editingId || createId(),
      units: requestedUnits,
      deposit: form.deposit.trim()
    };

    setBookings((current) =>
      editingId
        ? current.map((booking) => (booking.id === editingId ? nextBooking : booking))
        : [nextBooking, ...current]
    );
    resetForm();
  }

  function editBooking(booking) {
    setForm({ ...booking });
    setEditingId(booking.id);
    setUnlocked(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteBooking(id) {
    setBookings((current) => current.filter((booking) => booking.id !== id));
    if (editingId === id) resetForm();
  }

  function exportCsv() {
    setExportMessage("");
    if (!bookings.length) {
      setExportMessage(tr("noBookingsToExport"));
      return;
    }

    const headers = ["id", "apartment", "guestName", "checkIn", "checkOut", "units", "source", "deposit", "status"];
    const rows = bookings.map((booking) => {
      const apartment = apartments.find((item) => item.id === booking.apartmentId);
      return [
        booking.id,
        getSuiteName(apartment, language) || booking.apartmentId,
        booking.guestName,
        booking.checkIn,
        booking.checkOut,
        booking.units,
        booking.source,
        booking.deposit,
        booking.status
      ];
    });
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tecuala-bookings-${todayString()}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportMessage(tr("exportedCsv"));
  }

  function saveNotes() {
    localStorage.setItem(STORAGE_KEYS.notes, notes);
    setSavedNotes(true);
    window.setTimeout(() => setSavedNotes(false), 1600);
  }

  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function updateApartmentPrice(apartmentId, field, value) {
    setApartments((current) =>
      current.map((apartment) => (apartment.id === apartmentId ? { ...apartment, [field]: value } : apartment))
    );
  }

  function toggleApartmentVisibility(apartmentId) {
    setApartments((current) =>
      current.map((apartment) => (apartment.id === apartmentId ? { ...apartment, hidden: !apartment.hidden } : apartment))
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src="/images/tecuala-logo.png" alt="Tecuala Suites" />
          <div>
            <h1>{tr("businessName")}</h1>
            <a href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>
          </div>
        </div>
        <div className="header-actions">
          {installPrompt && (
            <button className="icon-button text-button" onClick={installApp}>
              <Download size={17} /> {tr("install")}
            </button>
          )}
          <button className="lang-toggle" onClick={() => setLanguage(language === "en" ? "es" : "en")}>
            <Languages size={17} /> {language.toUpperCase()}
          </button>
        </div>
      </header>

      <main>
        {!isAdminPage && (
          <>
            <section className="welcome-panel">
              <h2>{tr("welcomeTitle")}</h2>
              <p>{tr("welcomeText")}</p>
            </section>

            <section className="search-panel">
          <div className="section-title">
            <Search size={20} />
            <h2>{tr("searchTitle")}</h2>
          </div>
          <div className="search-grid">
            <label>
              {tr("checkIn")}
              <input
                type="date"
                min={today}
                value={search.checkIn}
                onChange={(e) => setSearch({ ...search, checkIn: e.target.value })}
              />
            </label>
            <label>
              {tr("checkOut")}
              <input
                type="date"
                min={search.checkIn || today}
                value={search.checkOut}
                onChange={(e) => setSearch({ ...search, checkOut: e.target.value })}
              />
            </label>
            <label>
              {tr("guests")}
              <input
                type="number"
                min="1"
                value={search.guests}
                onChange={(e) => setSearch({ ...search, guests: e.target.value })}
              />
            </label>
          </div>
            </section>

            <section>
          <div className="section-title">
            <Home size={20} />
            <h2>{tr("apartments")}</h2>
          </div>
          <div className="apartment-list">
            {visibleApartments.map((apartment) => {
              const status = statusFor(apartment);
              return (
                <article className="apartment-card" key={apartment.id}>
                  <ApartmentImage apartment={apartment} language={language} />
                  <div className="card-body">
                    <div className="card-heading">
                      <div>
                        <h3>{getSuiteName(apartment, language)}</h3>
                        <p>{getSuiteType(apartment, language)}</p>
                      </div>
                      <span className={status.className}>{status.label}</span>
                    </div>
                    <div className="facts">
                      <PriceDisplay apartment={apartment} tr={tr} nights={nights} />
                      <span>{tr("bathrooms")}: {apartment.bathrooms}</span>
                      <span>{tr("laundryRooms")}: {apartment.laundryRooms}</span>
                    </div>
                    <div className="button-row">
                      <a className="secondary-button" href="#availability">
                        <CalendarDays size={18} /> {tr("checkAvailability")}
                      </a>
                      <a className="primary-button" href={whatsappUrl(apartment)}>
                        <MessageCircle size={18} /> {tr("bookWhatsapp")}
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
            </section>

            <section id="availability" className="panel">
          <div className="section-title split">
            <div>
              <h2>{tr("availabilityOverview")}</h2>
              <p>{exactSearch ? tr("availabilityFor") : tr("selectDates")}</p>
            </div>
          </div>
          <div className="availability-list">
            {availabilityRows.map((row) => (
              <div className="availability-row" key={row.id}>
                <div>
                  <strong>{getSuiteName(row, language)}</strong>
                  <span>{tr("totalUnits")}: {row.totalUnits}</span>
                </div>
                <div><span>{tr("booked")}</span><strong>{row.booked}</strong></div>
                <div><span>{tr("available")}</span><strong>{row.available}</strong></div>
              </div>
            ))}
          </div>
            </section>
          </>
        )}

        {isAdminPage && (
          <section className="admin-shell">
            <div className="panel">
              <div className="section-title split">
                <div className="admin-title">
                  <Lock size={20} />
                  <h2>{tr("adminPanel")}</h2>
                </div>
                <a className="secondary-button compact" href="/">
                  {tr("backToSite")}
                </a>
              </div>
              {!unlocked ? (
                <form className="pin-form" onSubmit={unlockAdmin}>
                  <label>
                    {tr("enterPin")}
                    <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" type="password" />
                  </label>
                  {pinError && <p className="error">{pinError}</p>}
                  <button className="primary-button" type="submit"><Lock size={18} /> {tr("unlock")}</button>
                </form>
              ) : (
                <>
                  <section className="pricing-section">
                    <div className="section-title split">
                      <div>
                        <h2>{tr("priceSettings")}</h2>
                        <p>{tr("discountHelp")}</p>
                      </div>
                    </div>
                    <div className="pricing-list">
                      {apartments.map((apartment) => (
                        <article className={apartment.hidden ? "pricing-card is-hidden" : "pricing-card"} key={apartment.id}>
                          <div className="pricing-card-heading">
                            <div>
                              <h3>{getSuiteName(apartment, language)}</h3>
                              <span>{tr("publicListing")}: {apartment.hidden ? tr("hidden") : tr("visible")}</span>
                            </div>
                            <button
                              className="secondary-button compact"
                              type="button"
                              onClick={() => toggleApartmentVisibility(apartment.id)}
                            >
                              {apartment.hidden ? <Eye size={17} /> : <EyeOff size={17} />}
                              {apartment.hidden ? tr("showSuite") : tr("hideSuite")}
                            </button>
                          </div>
                          <div className="form-grid">
                            <label>
                              {tr("regularPrice")}
                              <input
                                value={apartment.price}
                                onChange={(event) => updateApartmentPrice(apartment.id, "price", event.target.value)}
                                placeholder="$900 MXN"
                              />
                            </label>
                            <label>
                              {tr("discountPrice")}
                              <input
                                value={apartment.discountPrice || ""}
                                onChange={(event) => updateApartmentPrice(apartment.id, "discountPrice", event.target.value)}
                                placeholder="$750 MXN"
                              />
                            </label>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <form className="booking-form" onSubmit={saveBooking}>
                    <h3>{tr("bookingForm")}</h3>
                    <label>
                      {tr("apartment")}
                      <select value={form.apartmentId} onChange={(e) => setForm({ ...form, apartmentId: e.target.value })}>
                        {apartments.map((apartment) => (
                          <option key={apartment.id} value={apartment.id}>{getSuiteName(apartment, language)}</option>
                        ))}
                      </select>
                    </label>
                    <div className="form-grid">
                      <label>
                        {tr("checkIn")}
                        <input
                          type="date"
                          min={today}
                          value={form.checkIn}
                          onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                        />
                      </label>
                      <label>
                        {tr("checkOut")}
                        <input
                          type="date"
                          min={form.checkIn || today}
                          value={form.checkOut}
                          onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                        />
                      </label>
                    </div>
                    <div className="form-grid">
                      <label>{tr("unitsToBlock")}<input type="number" min="1" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} /></label>
                      <label>
                        {tr("source")}
                        <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                          {sources.map((source) => (
                            <option key={source.value} value={source.value}>{source.label[language]}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>{tr("guestName")}<input value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} /></label>
                    <div className="form-grid">
                      <label>{tr("deposit")}<input value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} /></label>
                      <label>
                        {tr("status")}
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                          {statuses.map((status) => (
                            <option key={status.value} value={status.value}>{status.label[language]}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {formMessage && <p className="error">{formMessage}</p>}
                    <div className="button-row">
                      <button className="primary-button" type="submit">
                        <Save size={18} /> {editingId ? tr("updateBooking") : tr("saveBooking")}
                      </button>
                      <button className="secondary-button" type="button" onClick={resetForm}>
                        <RefreshCcw size={18} /> {tr("resetForm")}
                      </button>
                    </div>
                  </form>

                  <section className="booking-list-section">
                    <div className="section-title split">
                      <h2>{tr("bookingList")}</h2>
                      <button className="secondary-button compact" type="button" onClick={exportCsv}>
                        <Download size={17} /> {tr("exportCsv")}
                      </button>
                    </div>
                    {exportMessage && <p className="notice">{exportMessage}</p>}
                    <BookingList
                      bookings={bookings}
                      apartments={apartments}
                      tr={tr}
                      language={language}
                      onEdit={editBooking}
                      onDelete={deleteBooking}
                    />
                  </section>

                  <section className="notes-section">
                    <div className="section-title"><Edit3 size={20} /><h2>{tr("ownerNotes")}</h2></div>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="6" />
                    <button className="primary-button" onClick={saveNotes}><Check size={18} /> {savedNotes ? tr("saved") : tr("saveNotes")}</button>
                  </section>
                </>
              )}
            </div>
          </section>
        )}

        {!isAdminPage && (
          <section className="location-panel">
          <div className="section-title split">
            <div>
              <h2>{tr("locationTitle")}</h2>
              <p>{tr("locationText")}</p>
            </div>
          </div>
          <address>{BUSINESS_ADDRESS}</address>
          <div className="map-frame">
            <iframe
              title="Tecuala Suites Google Map"
              src={MAPS_EMBED_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <figure className="location-photo">
            <img src={LOCATION_PHOTO} alt={tr("locationPhoto")} loading="lazy" />
            <figcaption>{tr("locationPhoto")}</figcaption>
          </figure>
          <a className="secondary-button map-button" href={`mailto:${BUSINESS_EMAIL}`}>
            {BUSINESS_EMAIL}
          </a>
          <a className="secondary-button map-button" href={MAPS_URL}>
            {tr("openMaps")}
          </a>
          </section>
        )}
      </main>

      <a className="whatsapp-float" href={`https://wa.me/${WHATSAPP_NUMBER}`} aria-label={tr("bookWhatsapp")}>
        <MessageCircle size={26} />
      </a>
    </div>
  );
}

function ApartmentImage({ apartment, language }) {
  const [failed, setFailed] = useState(false);
  const suiteName = getSuiteName(apartment, language);

  return (
    <div className="photo-frame">
      {!failed && apartment.image ? (
        <img src={apartment.image} alt={suiteName} onError={() => setFailed(true)} />
      ) : (
        <div className="photo-fallback">
          <Home size={28} />
          <span>{suiteName}</span>
        </div>
      )}
    </div>
  );
}

function PriceDisplay({ apartment, tr, nights }) {
  const discount = apartment.discountPrice?.trim();
  const activePrice = getActivePrice(apartment);
  const total = nights && activePrice.amount ? activePrice.amount * nights : 0;

  if (discount) {
    return (
      <span className="price-block">
        <span className="price-display">
          {tr("from")}
          <span className="old-price">{apartment.price}</span>
          <strong className="sale-price">{discount}</strong>
          <span>{tr("perNight")}</span>
        </span>
        {total ? (
          <strong className="total-price">{tr("stayTotal")}: {formatMxn(total)} / {nights} {tr("nights")}</strong>
        ) : (
          <span className="date-hint">{tr("selectDatesForTotal")}</span>
        )}
      </span>
    );
  }

  return (
    <span className="price-block">
      <span className="price-display">
        {tr("from")} <strong>{apartment.price}</strong> <span>{tr("perNight")}</span>
      </span>
      {total ? (
        <strong className="total-price">{tr("stayTotal")}: {formatMxn(total)} / {nights} {tr("nights")}</strong>
      ) : (
        <span className="date-hint">{tr("selectDatesForTotal")}</span>
      )}
    </span>
  );
}

function BookingList({ bookings, apartments, tr, language, onEdit, onDelete }) {
  if (!bookings.length) return <p className="empty">{tr("noBookings")}</p>;
  return (
    <div className="booking-list">
      {bookings.map((booking) => {
        const apartment = apartments.find((item) => item.id === booking.apartmentId);
        const sourceLabel = sources.find((source) => source.value === booking.source)?.label[language] || booking.source;
        const statusLabel = statuses.find((status) => status.value === booking.status)?.label[language] || booking.status;
        return (
          <article className="booking-card" key={booking.id}>
            <div>
              <h3>{getSuiteName(apartment, language) || booking.apartmentId}</h3>
              <p>{booking.guestName}</p>
              <p>{booking.checkIn} - {booking.checkOut}</p>
            </div>
            <div className="booking-meta">
              <span>{tr("source")}: {sourceLabel}</span>
              <span>{tr("status")}: {statusLabel}</span>
              <span>{tr("units")}: {booking.units}</span>
            </div>
            <div className="booking-actions">
              <button className="icon-action" onClick={() => onEdit(booking)} aria-label={tr("edit")}><Edit3 size={18} /></button>
              <button className="icon-action danger" onClick={() => onDelete(booking.id)} aria-label={tr("delete")}><Trash2 size={18} /></button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

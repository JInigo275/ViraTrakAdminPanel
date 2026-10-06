import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Search, Plus, Trash2, X, Check, BarChart2, Contact, Edit3, ChevronDown, Camera } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";
import { useApp, Driver, genDriverId } from "../context/AppContext";
import { formatName, formatPhone, formatLocalPhoneDisplay, formatPlate, validateName, validatePhone, validatePlate } from "../../utils/validation";



// ============================================================
// Helpers and form components
// ============================================================

interface DriversPageProps {
  onViewDetail?: (driverId: string) => void;
}

function Modal({ title, onClose, children, width }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  const { dark } = useTheme();
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: dark ? "#1F2937" : "#fff", borderRadius: 14, width: "100%", maxWidth: width ?? 460, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${dark ? "#374151" : "#F3F4F6"}` }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: dark ? "#F9FAFB" : "#111827" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: dark ? "#6B7280" : "#9CA3AF", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function FloatField({ label, value, onChange, type = "text", maxLength, placeholder, disabled = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; maxLength?: number; placeholder?: string; disabled?: boolean }) {
  const [focused, setFocused] = useState(false);
  const { dark } = useTheme();
  const lifted = focused || value.length > 0;
  return (
    <div style={{ position: "relative" }}>
      <input type={type} value={value} maxLength={maxLength} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: lifted ? "22px 14px 8px" : "15px 14px", fontSize: 15, color: disabled ? (dark ? "#6B7280" : "#9CA3AF") : dark ? "#F9FAFB" : "#111827", background: disabled ? (dark ? "#374151" : "#F3F4F6") : dark ? "#374151" : "#fff", border: `1.5px solid ${focused ? "#1D6AE5" : dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 10, outline: "none", boxSizing: "border-box", transition: "all 0.18s", fontFamily: "Inter, sans-serif", cursor: disabled ? "not-allowed" : "text" }} />
      <label style={{ position: "absolute", left: 14, top: lifted ? 8 : "50%", transform: lifted ? "none" : "translateY(-50%)", fontSize: lifted ? 12 : 15, fontWeight: lifted ? 500 : 400, color: focused ? "#1D6AE5" : dark ? "#6B7280" : "#9CA3AF", pointerEvents: "none", transition: "all 0.18s ease", fontFamily: "Inter, sans-serif" }}>{label}</label>
    </div>
  );
}

function ReceiptModal({ driver, onClose }: { driver: Driver; onClose: () => void }) {
  const { dark } = useTheme();
  const now = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const rowBg = dark ? "#374151" : "#F8F9FA";
  const fullName = `${driver.firstName} ${driver.lastName}`;

  return (
    <Modal title="Driver Added" onClose={onClose} width={380}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: `2px dashed ${dark ? "#374151" : "#E5E7EB"}`, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Check size={22} color="#10B981" />
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: textMain }}>Driver Registered</div>
          <div style={{ fontSize: 13, color: textSub, marginTop: 2 }}>{now}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {[["Full Name", fullName], ["Driver ID", driver.id], ["Vehicle", driver.vehicle], ["Contact", driver.contact]].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: rowBg, borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: textSub }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: label === "Driver ID" ? "#1D6AE5" : textMain, fontFamily: label === "Driver ID" ? "monospace" : "inherit" }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `2px dashed ${dark ? "#374151" : "#E5E7EB"}`, paddingTop: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#10B981", background: "#ECFDF5", padding: "8px 12px", borderRadius: 8 }}>
            ✓ Driver ID auto-generated.
          </div>
        </div>

        <button onClick={onClose} style={{ width: "100%", padding: "11px", background: "#10B981", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Done</button>
      </div>
    </Modal>
  );
}

function AvatarCropModal({ src, onApply, onClose }: { src: string; onApply: (croppedImage: string) => void; onClose: () => void }) {
  const { dark } = useTheme();
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [zoom, setZoom] = useState(1.15);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [preview, setPreview] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(true);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  function getRenderedImageSize(image: HTMLImageElement) {
    const frameSize = frameRef.current?.clientWidth ?? 360;
    const fitScale = Math.min(frameSize / image.naturalWidth, frameSize / image.naturalHeight);
    return {
      width: image.naturalWidth * fitScale * zoom,
      height: image.naturalHeight * fitScale * zoom,
    };
  }

  function getCropRect(image: HTMLImageElement) {
    const frameSize = frameRef.current?.clientWidth ?? 360;
    const rendered = getRenderedImageSize(image);
    const scaledWidth = rendered.width * zoom;
    const scaledHeight = rendered.height * zoom;
    const left = frameSize / 2 - scaledWidth / 2 + imageOffset.x;
    const top = frameSize / 2 - scaledHeight / 2 + imageOffset.y;
    const visibleLeft = Math.max(0, -left);
    const visibleTop = Math.max(0, -top);
    const visibleRight = Math.min(scaledWidth, frameSize - left);
    const visibleBottom = Math.min(scaledHeight, frameSize - top);

    if (visibleRight <= visibleLeft || visibleBottom <= visibleTop) {
      return { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
    }

    return {
      x: (visibleLeft / scaledWidth) * image.naturalWidth,
      y: (visibleTop / scaledHeight) * image.naturalHeight,
      width: ((visibleRight - visibleLeft) / scaledWidth) * image.naturalWidth,
      height: ((visibleBottom - visibleTop) / scaledHeight) * image.naturalHeight,
    };
  }

  function buildCroppedDataUrl(image: HTMLImageElement) {
    const rect = getCropRect(image);
    const canvas = document.createElement("canvas");
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");
    if (!context) return src;

    context.clearRect(0, 0, outputSize, outputSize);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputSize, outputSize);
    context.drawImage(
      image,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      outputSize,
      outputSize,
    );
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  useEffect(() => {
    if (!src) return;
    setIsProcessing(true);
    const image = new Image();
    image.onload = () => {
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
      setPreview(buildCroppedDataUrl(image));
      setIsProcessing(false);
    };
    image.onerror = () => {
      setPreview("");
      setIsProcessing(false);
    };
    image.src = src;
  }, [src, zoom, imageOffset]);

  useEffect(() => {
    setImageOffset({ x: 0, y: 0 });
    setZoom(1.15);
  }, [src]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: imageOffset.x,
      offsetY: imageOffset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || !frameRef.current) return;
    const frame = frameRef.current;
    const rect = frame.getBoundingClientRect();
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    const maxMove = 110 * (zoom - 0.85);

    setImageOffset({
      x: clamp(dragStart.current.offsetX + dx * 1.2, -maxMove, maxMove),
      y: clamp(dragStart.current.offsetY + dy * 1.2, -maxMove, maxMove),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const applyCrop = () => {
    if (!src || isProcessing) return;
    const image = new Image();
    image.onload = () => {
      onApply(buildCroppedDataUrl(image));
      onClose();
    };
    image.onerror = () => {
      onApply(src);
      onClose();
    };
    image.src = src;
  };

  const frameSize = frameRef.current?.clientWidth ?? 360;
  const displaySize = imageSize.width && imageSize.height
    ? getRenderedImageSize({ naturalWidth: imageSize.width, naturalHeight: imageSize.height } as HTMLImageElement)
    : { width: frameSize, height: frameSize };

  return (
    <Modal title="Crop Avatar" onClose={onClose} width={520}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 13, color: dark ? "#9CA3AF" : "#6B7280" }}>
          Drag the image to position the face inside the square.
        </div>

        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => { dragStart.current = null; }}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            maxHeight: 360,
            borderRadius: 16,
            overflow: "hidden",
            background: dark ? "#111827" : "#F3F4F6",
            border: `1px solid ${dark ? "#374151" : "#E5E7EB"}`,
            cursor: "grab",
            userSelect: "none",
            touchAction: "none",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.7)",
          }}
        >
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 16 }}>
            <img
              src={src}
              alt="Avatar preview"
              onPointerDown={handlePointerDown}
              style={{
                display: "block",
                width: `${displaySize.width}px`,
                height: `${displaySize.height}px`,
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(${imageOffset.x}px, ${imageOffset.y}px)`,
                marginLeft: `${-displaySize.width / 2}px`,
                marginTop: `${-displaySize.height / 2}px`,
                objectFit: "contain",
                cursor: "grab",
                transition: "transform 0.08s ease-out",
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "2px solid #ffffff",
              borderRadius: 16,
              boxShadow: "0 0 0 9999px rgba(17,24,39,0.5)",
              pointerEvents: "none",
            }}
          />
        </div>

        {preview && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 2 }}>
            <div style={{ fontSize: 12, color: dark ? "#D1D5DB" : "#374151", fontWeight: 600 }}>Live preview</div>
            <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: `2px solid ${dark ? "#374151" : "#E5E7EB"}`, background: "#fff" }}>
              <img src={preview} alt="Crop preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: dark ? "#D1D5DB" : "#374151", fontWeight: 600 }}>Zoom</span>
              <span style={{ fontSize: 12, color: dark ? "#D1D5DB" : "#374151", fontWeight: 600 }}>{zoom.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.1}
              value={zoom}
              onChange={(event) => {
                const nextZoom = Number(event.target.value);
                setZoom(nextZoom);
                setImageOffset((current) => ({
                  x: clamp(current.x, -90, 90),
                  y: clamp(current.y, -90, 90),
                }));
              }}
              style={{ width: "100%", accentColor: "#1D6AE5" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`, background: "transparent", color: dark ? "#9CA3AF" : "#6B7280", cursor: "pointer" }}>Cancel</button>
            <button type="button" onClick={applyCrop} disabled={isProcessing} style={{ padding: "10px 16px", borderRadius: 8, background: isProcessing ? (dark ? "#4B5563" : "#D1D5DB") : "#1D6AE5", border: "none", color: "#fff", cursor: isProcessing ? "not-allowed" : "pointer", fontWeight: 600, opacity: isProcessing ? 0.8 : 1 }}>
              {isProcessing ? "Processing..." : "Use Crop"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const emptyForm = { firstName: "", lastName: "", vehicle: "", contact: "", avatar: "" };

function getSaveError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "Failed to save. Please try again.";
}

const countries = `Philippines|+63
Afghanistan|+93
Albania|+355
Algeria|+213
Andorra|+376
Angola|+244
Antigua and Barbuda|+1268
Argentina|+54
Armenia|+374
Australia|+61
Austria|+43
Azerbaijan|+994
Bahamas|+1242
Bahrain|+973
Bangladesh|+880
Barbados|+1246
Belarus|+375
Belgium|+32
Belize|+501
Benin|+229
Bhutan|+975
Bolivia|+591
Bosnia and Herzegovina|+387
Botswana|+267
Brazil|+55
Brunei|+673
Bulgaria|+359
Burkina Faso|+226
Burundi|+257
Cambodia|+855
Cameroon|+237
Canada|+1
Cape Verde|+238
Central African Republic|+236
Chad|+235
Chile|+56
China|+86
Colombia|+57
Comoros|+269
Congo|+242
Costa Rica|+506
Croatia|+385
Cuba|+53
Cyprus|+357
Czech Republic|+420
Denmark|+45
Djibouti|+253
Dominica|+1767
Dominican Republic|+1809
Ecuador|+593
Egypt|+20
El Salvador|+503
Equatorial Guinea|+240
Eritrea|+291
Estonia|+372
Eswatini|+268
Ethiopia|+251
Fiji|+679
Finland|+358
France|+33
Gabon|+241
Gambia|+220
Georgia|+995
Germany|+49
Ghana|+233
Greece|+30
Grenada|+1473
Guatemala|+502
Guinea|+224
Guyana|+592
Haiti|+509
Honduras|+504
Hungary|+36
Iceland|+354
India|+91
Indonesia|+62
Iran|+98
Iraq|+964
Ireland|+353
Israel|+972
Italy|+39
Jamaica|+1876
Japan|+81
Jordan|+962
Kazakhstan|+7
Kenya|+254
Kiribati|+686
Kuwait|+965
Kyrgyzstan|+996
Laos|+856
Latvia|+371
Lebanon|+961
Lesotho|+266
Liberia|+231
Libya|+218
Liechtenstein|+423
Lithuania|+370
Luxembourg|+352
Madagascar|+261
Malawi|+265
Malaysia|+60
Maldives|+960
Mali|+223
Malta|+356
Marshall Islands|+692
Mauritania|+222
Mauritius|+230
Mexico|+52
Micronesia|+691
Moldova|+373
Monaco|+377
Mongolia|+976
Montenegro|+382
Morocco|+212
Mozambique|+258
Myanmar|+95
Namibia|+264
Nauru|+674
Nepal|+977
Netherlands|+31
New Zealand|+64
Nicaragua|+505
Niger|+227
Nigeria|+234
North Korea|+850
North Macedonia|+389
Norway|+47
Oman|+968
Pakistan|+92
Palau|+680
Palestine|+970
Panama|+507
Papua New Guinea|+675
Paraguay|+595
Peru|+51
Poland|+48
Portugal|+351
Qatar|+974
Romania|+40
Russia|+7
Rwanda|+250
Saint Kitts and Nevis|+1869
Saint Lucia|+1758
Saint Vincent and the Grenadines|+1784
Samoa|+685
San Marino|+378
Sao Tome and Principe|+239
Saudi Arabia|+966
Senegal|+221
Serbia|+381
Seychelles|+248
Sierra Leone|+232
Singapore|+65
Slovakia|+421
Slovenia|+386
Solomon Islands|+677
Somalia|+252
South Africa|+27
South Korea|+82
South Sudan|+211
Spain|+34
Sri Lanka|+94
Sudan|+249
Suriname|+597
Sweden|+46
Switzerland|+41
Syria|+963
Taiwan|+886
Tajikistan|+992
Tanzania|+255
Thailand|+66
Timor-Leste|+670
Togo|+228
Tonga|+676
Trinidad and Tobago|+1868
Tunisia|+216
Turkey|+90
Turkmenistan|+993
Tuvalu|+688
Uganda|+256
Ukraine|+380
United Arab Emirates|+971
United Kingdom|+44
United States|+1
Uruguay|+598
Uzbekistan|+998
Vanuatu|+678
Vatican City|+379
Venezuela|+58
Vietnam|+84
Yemen|+967
Zambia|+260
Zimbabwe|+263`.split("\n").map((entry) => {
  const [name, code] = entry.split("|");
  return { name, code };
});


// End of region comment



// ============================================================
// Page logic and UI
// ============================================================
// ============================================================
// Driver list, add/edit forms, deletion, and detail navigation.
// ============================================================
export function DriversPage({ onViewDetail }: DriversPageProps) {
  const { dark } = useTheme();
  const isMobile = useIsMobile();
  const { drivers, vehicles, addDriver, updateDriver, removeDriver } = useApp();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [countryCode, setCountryCode] = useState("+63");
  const [formError, setFormError] = useState("");
  const [cropSource, setCropSource] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [receipt, setReceipt] = useState<Driver | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const bg = dark ? "#111827" : "#F4F5F7";
  const cardBg = dark ? "#1F2937" : "#fff";
  const textMain = dark ? "#F9FAFB" : "#111827";
  const textSub = dark ? "#9CA3AF" : "#6B7280";
  const borderColor = dark ? "#374151" : "#F3F4F6";
  const shadow = dark ? "0 1px 4px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.07)";
  const rowHover = dark ? "#374151" : "#FAFAFA";
  const inputBg = dark ? "#374151" : "#F8F9FA";
  const thColor = dark ? "#6B7280" : "#9CA3AF";
  const checkBorder = dark ? "#4B5563" : "#D1D5DB";

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(""), 1800);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const filtered = drivers.filter((e) =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase()) ||
    e.vehicle.toLowerCase().includes(search.toLowerCase())
  );

  const allChecked = filtered.length > 0 && filtered.every((e) => selected.has(e.id));
  const someChecked = filtered.some((e) => selected.has(e.id));
  const hasAvailableVehicleSlot = vehicles.some((vehicle) => vehicle.driverIds.length < 2);

  function vehicleSlotAvailable(plate: string) {
    const normalized = formatPlate(plate || "");
    if (!normalized) return false;
    const vehicle = vehicles.find((item) => item.plateNumber === normalized);
    return Boolean(vehicle && vehicle.driverIds.length < 2);
  }

  function toggleAll() { if (allChecked) setSelected(new Set()); else setSelected(new Set(filtered.map((e) => e.id))); }
  function toggleOne(id: string) { setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      setFormError("Please upload a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const bitmap = await (createImageBitmap as typeof createImageBitmap)(blob, { imageOrientation: "from-image" } as any);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Image processing unavailable.");
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0);
      const mime = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
      const dataUrl = canvas.toDataURL(mime, 0.92);
      setCropSource(dataUrl);
      setFormError("");
    } catch (error) {
      console.error("Avatar crop source load failed", error);
      setFormError("This image could not be processed. Please try a different file.");
    }

    e.target.value = "";
  }

  function openAdd() { setForm(emptyForm); setCountryCode("+63"); setFormError(""); setModal("add"); }
  function openEdit(e: Driver) {
    setEditTarget(e);
    const digits = e.contact.replace(/\D/g, "");
    const localDigits = digits.startsWith("63") && digits.length > 10 ? digits.slice(2) : digits.replace(/^0/, "");
    setCountryCode(e.contact.trim().startsWith("+63") ? "+63" : "+63");
    setForm({ firstName: e.firstName, lastName: e.lastName, vehicle: e.vehicle, contact: localDigits, avatar: e.avatar ?? "" });
    setFormError(""); setModal("edit");
  }

  async function handleSave() {
    const fullContact = `${countryCode}${form.contact.replace(/\D/g, "")}`;
    const validationError = validateName(form.firstName, "First name") || validateName(form.lastName, "Last name") || (form.vehicle && form.vehicle !== "Unassigned" ? validatePlate(form.vehicle) : null) || validatePhone(fullContact);
    if (validationError) { setFormError(validationError); return; }
    const normalized = {
      firstName: formatName(form.firstName),
      lastName: formatName(form.lastName),
      vehicle: form.vehicle && form.vehicle !== "Unassigned" ? formatPlate(form.vehicle) : "",
      contact: formatPhone(fullContact),
      avatar: form.avatar || null,
    };

    if (modal === "add") {
      const newDriver: Driver = { id: genDriverId(drivers), ...normalized };
      try {
        await addDriver(newDriver);
        setModal(null);
        setReceipt(newDriver);
        setSuccessMessage("New Driver Added!");
      } catch (e) {
        setFormError(getSaveError(e));
      }
    } else if (modal === "edit" && editTarget) {
      try {
        const driverPatch = normalized.vehicle ? { ...normalized } : { firstName: normalized.firstName, lastName: normalized.lastName, contact: normalized.contact, avatar: normalized.avatar };
        await updateDriver(editTarget.id, driverPatch);
        setModal(null);
        setSuccessMessage("Changes Saved");
      } catch (e) {
        setFormError(getSaveError(e));
      }
    }
  }

  async function deleteOne(id: string) {
    try { await removeDriver(id); } catch (e) { console.error(e); }
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    setConfirmDelete(null);
  }
  async function massDelete() {
    await Promise.all([...selected].map((id) => removeDriver(id).catch(console.error)));
    setSelected(new Set());
    setConfirmBulkDelete(false);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 24, background: bg, fontFamily: "Inter, sans-serif", transition: "background 0.2s" }}>
      {/* ============================================================ */}
      {/* Driver page header and account actions */}
      {/* ============================================================ */}
      {successMessage && (
        <div role="status" style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1100, padding: "11px 18px", background: dark ? "#064E3B" : "#ECFDF5", border: `1px solid ${dark ? "#10B981" : "#A7F3D0"}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", color: dark ? "#D1FAE5" : "#047857", fontSize: 14, fontWeight: 600, animation: "driver-toast-in 180ms ease-out" }}>
          {successMessage}
          <style>{`@keyframes driver-toast-in { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
        </div>
      )}
      <PageHeader icon={Contact} iconColor="#10B981" title="Driver Information" subtitle="Driver profiles and vehicle assignments">
      </PageHeader>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {/* ============================================================ */}
        {/* Driver search and create actions */}
        {/* ============================================================ */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: inputBg, border: `1.5px solid ${dark ? "#6B7280" : "#D1D5DB"}`, borderRadius: 8, padding: "8px 12px", width: isMobile ? "100%" : 320, boxSizing: "border-box", boxShadow: dark ? "0 0 0 1px rgba(156,163,175,.12)" : "0 1px 3px rgba(15,23,42,.06)" }}>
          <Search size={15} color={dark ? "#D1D5DB" : "#6B7280"} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drivers..." style={{ background: "transparent", border: "none", outline: "none", fontSize: 14, color: textMain, width: "100%", fontFamily: "Inter, sans-serif" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: isMobile ? 0 : "auto", width: isMobile ? "100%" : "auto" }}>
          {selected.size > 0 && (
            <button onClick={() => setConfirmBulkDelete(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 14px", background: "#FEF2F2", color: "#EF4444", borderRadius: 8, border: "1px solid #FECACA", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", flex: isMobile ? 1 : undefined }}>
              <Trash2 size={14} /> Delete {selected.size} Selected
            </button>
          )}
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 14px", background: "#10B981", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", flex: isMobile ? 1 : undefined }}>
            <Plus size={14} /> Add Driver
          </button>
        </div>
      </div>

      <div style={{ background: cardBg, borderRadius: 12, boxShadow: shadow, overflow: "hidden" }}>
        {/* ============================================================ */}
        {/* Driver directory table */}
        {/* ============================================================ */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                <th style={{ padding: "10px 16px", width: 40 }}>
                  <div onClick={toggleAll} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${allChecked ? "#1D6AE5" : checkBorder}`, background: allChecked ? "#1D6AE5" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {allChecked && <Check size={10} color="#fff" />}
                    {!allChecked && someChecked && <div style={{ width: 8, height: 2, background: "#1D6AE5", borderRadius: 1 }} />}
                  </div>
                </th>
                {["Driver Name", "Driver ID", "Vehicle", "Contact", "Actions"].map((h, i) => (
                  <th key={i} style={{ fontSize: 12, fontWeight: 600, color: thColor, textAlign: "left", padding: "10px 14px", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
              <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 36,
                      textAlign: "center",
                      color: textSub,
                      fontSize: 14,
                    }}>
                  No drivers match your search.</td>
                </tr>
              ) : (
                <>
                  {filtered.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${borderColor}` : "none", transition: "background 0.1s", background: selected.has(e.id) ? (dark ? "#1e3a5f" : "#EBF2FF") : "transparent" }}
                      onMouseEnter={(el) => { if (!selected.has(e.id)) (el.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                      onMouseLeave={(el) => { if (!selected.has(e.id)) (el.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                      <td style={{ padding: "11px 16px" }}>
                        <div onClick={() => toggleOne(e.id)} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${selected.has(e.id) ? "#1D6AE5" : checkBorder}`, background: selected.has(e.id) ? "#1D6AE5" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {selected.has(e.id) && <Check size={10} color="#fff" />}
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: e.avatar ? "transparent" : "#1D6AE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0, overflow: "hidden", border: e.avatar ? "1px solid rgba(29,106,229,0.15)" : "none" }}>
                            {e.avatar ? <img src={e.avatar} alt={`${e.firstName} ${e.lastName}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <>{(e.firstName[0] ?? "") + (e.lastName[0] ?? "")}</>}
                          </div>
                          <span style={{ fontSize: 14, color: textMain, fontWeight: 500 }}>{e.firstName} {e.lastName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#1D6AE5", fontFamily: "monospace", fontWeight: 600 }}>{e.id}</td>
                      <td style={{ padding: "11px 14px", fontSize: 14, color: textMain, fontWeight: 500 }}>{e.vehicle}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: textSub }}>{e.contact}</td>
                      <td style={{ width: 235, padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 207, whiteSpace: "nowrap" }}>
                          <button onClick={(event) => { event.stopPropagation(); openEdit(e); }} aria-label={`Edit ${e.firstName} ${e.lastName}`}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#EBF2FF", color: "#1D6AE5", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                            <Edit3 size={12} /> Edit
                          </button>
                          {onViewDetail && (
                            <button onClick={(event) => { event.stopPropagation(); onViewDetail(e.id); }}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                              <BarChart2 size={12} /> View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={6} style={{ padding: "10px 18px 15px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                        <span style={{ flex: 1, height: 1, background: dark ? "#374151" : "#E5E7EB" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: dark ? "#9CA3AF" : "#94A3B8", whiteSpace: "nowrap" }}>
                          End of table
                        </span>
                        <span style={{ flex: 1, height: 1, background: dark ? "#374151" : "#E5E7EB" }} />
                      </div>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Add Driver" : "Edit Driver"} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {modal === "add" && (
              <div style={{ padding: "8px 12px", background: dark ? "#374151" : "#F0F9FF", borderRadius: 8, fontSize: 13, color: dark ? "#93C5FD" : "#0369A1" }}>
                Driver ID is auto-generated.
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: form.avatar ? "transparent" : "#1D6AE5", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${dark ? "#374151" : "#E5E7EB"}` }}>
                  {form.avatar ? <img src={form.avatar} alt="Driver avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>{((form.firstName[0] ?? "") + (form.lastName[0] ?? "") || "D")}</span>}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ position: "absolute", right: -2, bottom: -2, width: 22, height: 22, borderRadius: "50%", background: "#1D6AE5", border: "2px solid #fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Camera size={11} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: "8px 12px", background: dark ? "#374151" : "#F3F4F6", color: dark ? "#F9FAFB" : "#111827", border: "1px solid transparent", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Upload Photo</button>
                {form.avatar && <button type="button" onClick={() => setForm((prev) => ({ ...prev, avatar: "" }))} style={{ padding: "8px 12px", background: "transparent", border: `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 8, fontSize: 13, color: dark ? "#D1D5DB" : "#374151", cursor: "pointer" }}>Remove Photo</button>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <FloatField label="Driver First Name" value={form.firstName} onChange={(v) => setForm((p) => ({ ...p, firstName: v }))} />
              <FloatField label="Driver Last Name" value={form.lastName} onChange={(v) => setForm((p) => ({ ...p, lastName: v }))} />
            </div>
            <div style={{ position: "relative" }}>
              <select
                value={form.vehicle === "Unassigned" ? "" : form.vehicle}
                disabled={!hasAvailableVehicleSlot && !form.vehicle}
                onChange={(e) => setForm((p) => ({ ...p, vehicle: e.target.value }))}
                aria-label="Vehicle"
                style={{ width: "100%", padding: "15px 44px 15px 14px", fontSize: 15, color: !hasAvailableVehicleSlot && !form.vehicle ? (dark ? "#6B7280" : "#9CA3AF") : form.vehicle ? (dark ? "#F9FAFB" : "#111827") : (dark ? "#9CA3AF" : "#9CA3AF"), background: !hasAvailableVehicleSlot && !form.vehicle ? (dark ? "#374151" : "#F3F4F6") : (dark ? "#374151" : "#fff"), border: `1.5px solid ${!hasAvailableVehicleSlot && !form.vehicle ? (dark ? "#4B5563" : "#D1D5DB") : (dark ? "#4B5563" : "#E5E7EB")}`, borderRadius: 10, outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif", appearance: "none", cursor: !hasAvailableVehicleSlot && !form.vehicle ? "not-allowed" : "pointer" }}
              >
                <option value="">{modal === "add" && !hasAvailableVehicleSlot ? "No Vehicles Available" : "Unassigned"}</option>
                {vehicles.filter((vehicle) => vehicle.driverIds.length < 2 || (modal === "edit" && vehicle.plateNumber === form.vehicle)).map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.plateNumber}>{vehicle.plateNumber}{vehicle.model ? ` - ${vehicle.model}` : ""}</option>
                ))}
              </select>
              <ChevronDown size={18} color={!hasAvailableVehicleSlot && !form.vehicle ? (dark ? "#6B7280" : "#9CA3AF") : (dark ? "#D1D5DB" : "#4B5563")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(145px, 0.9fr) 1.4fr", gap: 8 }}>
              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} aria-label="Country code"
                style={{ width: "100%", padding: "0 10px", fontSize: 14, color: dark ? "#F9FAFB" : "#111827", background: dark ? "#374151" : "#fff", border: `1.5px solid ${dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 10, outline: "none" }}>
                {countries.map((country) => <option key={`${country.name}-${country.code}`} value={country.code}>{country.name} ({country.code})</option>)}
              </select>
              <FloatField label="Contact Number" value={formatLocalPhoneDisplay(form.contact)} maxLength={12} onChange={(v) => setForm((p) => ({ ...p, contact: v.replace(/\D/g, "").slice(0, 10) }))} />
            </div>
            {formError && <div style={{ fontSize: 14, color: "#EF4444", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>{formError}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 8, fontSize: 14, color: dark ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 1, padding: "11px", background: "#1D6AE5", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{modal === "add" ? "Add Driver" : "Save Changes"}</button>
            </div>
            {modal === "edit" && editTarget && <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, marginBottom: 14, color: dark ? "#9CA3AF" : "#6B7280", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                <div style={{ flex: 1, borderTop: `1px dashed ${dark ? "#4B5563" : "#D1D5DB"}` }} />
                <span>or</span>
                <div style={{ flex: 1, borderTop: `1px dashed ${dark ? "#4B5563" : "#D1D5DB"}` }} />
              </div>
              <div>
                <button onClick={() => { setModal(null); setConfirmDelete(editTarget.id); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 14, color: "#EF4444", cursor: "pointer", fontFamily: "Inter, sans-serif" }}><Trash2 size={14} />  Delete Driver Details</button>
              </div>
            </>}
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete Driver" onClose={() => setConfirmDelete(null)}>
          <p style={{ fontSize: 15, color: dark ? "#D1D5DB" : "#374151", lineHeight: 1.6, marginBottom: 20 }}>
            Are you sure you want to delete <strong style={{ color: "#EF4444" }}>{drivers.find((e) => e.id === confirmDelete)?.firstName} {drivers.find((e) => e.id === confirmDelete)?.lastName}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 8, fontSize: 14, color: dark ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
            <button onClick={() => deleteOne(confirmDelete)} style={{ flex: 1, padding: "11px", background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Delete</button>
          </div>
        </Modal>
      )}

      {confirmBulkDelete && (
        <Modal title="Delete Drivers" onClose={() => setConfirmBulkDelete(false)}>
          <p style={{ fontSize: 15, color: dark ? "#D1D5DB" : "#374151", lineHeight: 1.6, marginBottom: 12 }}>
            Are you sure you want to delete the following drivers? This action cannot be undone.
          </p>
          <div style={{ maxHeight: 140, overflowY: "auto", display: "grid", gap: 6, marginBottom: 20, padding: 10, background: dark ? "#451A1A" : "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
            {[...selected].map((id) => {
              const driver = drivers.find((item) => item.id === id);
              return <strong key={id} style={{ color: dark ? "#FCA5A5" : "#B91C1C", fontSize: 14 }}>{driver ? `${driver.firstName} ${driver.lastName} (${driver.id})` : id}</strong>;
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirmBulkDelete(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`, borderRadius: 8, fontSize: 14, color: dark ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
            <button onClick={() => void massDelete()} style={{ flex: 1, padding: "11px", background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Delete</button>
          </div>
        </Modal>
      )}

      {cropSource && (
        <AvatarCropModal
          src={cropSource}
          onClose={() => setCropSource(null)}
          onApply={(croppedImage) => {
            setForm((prev) => ({ ...prev, avatar: croppedImage }));
            setCropSource(null);
          }}
        />
      )}

      {receipt && <ReceiptModal driver={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

// End of region comment


/* DELIVERY PRO — CONTROL AUTO
   Datos separados por vehículo dentro de APP_DATA.autos.
   El guardado y la sincronización reutilizan el flujo seguro existente. */
var AUTO_CATALOGO = {
  "Motor":["Aceite del motor","Filtro de aceite","Filtro de aire","Filtro de combustible","Bujías","Bobinas","Correa de distribución","Cadena de distribución","Tensor de distribución","Bomba de agua","Bomba de aceite","Retenes","Juntas y empaquetaduras","Tapa de cilindros","Limpieza de inyectores","Inyectores","Sensor de oxígeno","Sensor de temperatura","Termostato","Radiador","Mangueras","Refrigerante","Electroventilador","Soportes de motor","Reparación de motor","Otros"],
  "Caja y transmisión":["Aceite de caja","Filtro de caja automática","Embrague","Disco de embrague","Placa de embrague","Crapodina","Cilindro maestro","Cilindro auxiliar","Semiejes","Juntas homocinéticas","Retenes de caja","Diferencial","Soportes de caja","Otros"],
  "Frenos":["Pastillas delanteras","Pastillas traseras","Discos de freno","Tambores","Zapatas","Cilindros de rueda","Bomba de freno","Líquido de frenos","Mangueras de freno","Cálipers","Servo de freno","ABS y sensores","Otros"],
  "Suspensión y dirección":["Amortiguadores delanteros","Amortiguadores traseros","Espirales","Cazoletas","Bujes","Parrillas","Rótulas","Extremos de dirección","Axiales","Cremallera","Bomba hidráulica","Líquido de dirección","Rodamientos","Mazas de rueda","Barra estabilizadora","Otros"],
  "Sistema eléctrico":["Batería","Alternador","Motor de arranque","Correas auxiliares","Fusibles","Relés","Cableado","Luces delanteras","Luces traseras","Faros","Sensores","Módulos electrónicos","Otros"],
  "Aire acondicionado":["Carga de gas refrigerante","Compresor","Embrague del compresor","Condensador","Evaporador","Filtro de cabina","Válvula de expansión","Presostato","Electroventilador","Mangueras","Reparación de fugas","Otros"],
  "Neumáticos y ruedas":["Neumático delantero izquierdo","Neumático delantero derecho","Neumático trasero izquierdo","Neumático trasero derecho","Rotación","Alineación","Balanceo","Reparación de cubierta","Válvulas","Llantas","Rodamientos","Otros"],
  "Carrocería y exterior":["Paragolpes","Guardabarros","Capó","Puertas","Espejos","Parabrisas","Vidrios","Limpiaparabrisas","Chapa y pintura","Cerraduras","Otros"],
  "Interior":["Asientos","Tapizados","Cinturones de seguridad","Tablero","Aireadores","Levantavidrios","Cerraduras internas","Alfombras","Otros"],
  "Escape y combustible":["Escape","Silenciador","Catalizador","Sonda lambda","Bomba de combustible","Filtro de combustible","Tanque","Mangueras de combustible","Otros"],
  "Mantenimiento general":["Lavado de motor","Limpieza de inyectores","Limpieza de radiador","Cambio de refrigerante","Cambio de líquido hidráulico","Cambio de líquido de frenos","Revisión general","Inspección preventiva","Engrase","Otros"],
  "Documentación y controles":["ITV / inspección técnica","Seguro","Habilitación","Registro de vencimiento","Otros"]
};
var AUTO_UI = {view:"inicio", form:"", editingId:null, filters:{q:"",category:"",from:"",to:""}};

function autoId() {
  try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch(e) {}
  return "auto-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,10);
}
function autoLocalDate() {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}
function autoEsc(v) {
  return String(v === undefined || v === null ? "" : v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function autoNum(v) {
  var raw = String(v === undefined || v === null ? "" : v).trim();
  var normalized = raw.replace(/\./g,"").replace(/,/g,"").replace(/[^\d-]/g,"");
  var n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}
function autoFormatNumber(v) {
  var digits = String(v === undefined || v === null ? "" : v).replace(/\D/g,"");
  if (!digits) return "";
  return String(Number(digits)).replace(/\B(?=(\d{3})+(?!\d))/g,".");
}
function autoFormatLive(input) {
  if (!input) return;
  var before = input.value, formatted = autoFormatNumber(before);
  if (formatted !== before) {
    input.value = formatted;
    try { input.setSelectionRange(formatted.length,formatted.length); } catch(e) {}
  }
}
function autoAttachThousands(ids) {
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el || el.dataset.autoThousands === "1") return;
    el.dataset.autoThousands = "1";
    el.setAttribute("inputmode","numeric");
    el.addEventListener("input",function(){autoFormatLive(el);});
    autoFormatLive(el);
  });
}
function autoMoney(v) {
  return typeof fmt === "function" ? fmt(v) : "Gs. " + Math.round(v || 0).toLocaleString("es-PY");
}
function autoData() {
  if (!APP_DATA.autos || typeof APP_DATA.autos !== "object") APP_DATA.autos = {};
  if (!Array.isArray(APP_DATA.autos.vehicles)) APP_DATA.autos.vehicles = [];
  if (!Array.isArray(APP_DATA.autos.records)) APP_DATA.autos.records = [];
  if (!APP_DATA.autos.activeVehicleId || !APP_DATA.autos.vehicles.some(function(v){return v.id === APP_DATA.autos.activeVehicleId;})) {
    var first = APP_DATA.autos.vehicles.find(function(v){return !v.archived;}) || APP_DATA.autos.vehicles[0];
    APP_DATA.autos.activeVehicleId = first ? first.id : null;
  }
  return APP_DATA.autos;
}
function autoVehiculo() {
  var d = autoData();
  return d.vehicles.find(function(v){return v.id === d.activeVehicleId;}) || null;
}
function autoRecords(vehicleId) {
  return autoData().records.filter(function(r){return r.vehicleId === vehicleId && !r.deletedAt;})
    .sort(function(a,b){return String(b.date || "").localeCompare(String(a.date || "")) || (Number(b.km)||0)-(Number(a.km)||0);});
}
function autoTotal(vehicleId) {
  return autoRecords(vehicleId).reduce(function(sum,r){return sum + (Number(r.total)||0);},0);
}
function autoCategoryOptions(selected) {
  return Object.keys(AUTO_CATALOGO).map(function(k){
    return '<option value="' + autoEsc(k) + '"' + (k === selected ? " selected" : "") + '>' + autoEsc(k) + '</option>';
  }).join("");
}
function autoVehicleLabel(v) {
  return [v.brand,v.model,v.year].filter(Boolean).join(" ") || "Vehículo sin nombre";
}
function autoRender() {
  autoData();
  var host = document.getElementById("auto-content");
  if (!host) return;
  if (AUTO_UI.form === "vehicle") { autoRenderVehicleForm(); return; }
  if (AUTO_UI.form === "record") { autoRenderRecordForm(); return; }
  if (AUTO_UI.form === "km") { autoRenderKmForm(); return; }
  var v = autoVehiculo();
  if (!v) {
    host.innerHTML = '<div class="auto-head"><div><div class="auto-title">Control del auto</div><div class="auto-subtitle">Registro técnico de tus vehículos</div></div></div>' +
      '<div class="auto-empty">Todavía no registraste ningún vehículo.<br>Primero cargá los datos del auto para comenzar su historial.</div>' +
      '<button class="auto-action primary" style="width:100%;margin-top:12px" onclick="autoNuevoVehiculo()">＋ Registrar mi primer vehículo</button>';
    return;
  }
  if (AUTO_UI.view === "historial") { autoRenderHistory(v); return; }
  autoRenderHome(v);
}
function autoRenderHome(v) {
  var host = document.getElementById("auto-content");
  var records = autoRecords(v.id);
  var total = autoTotal(v.id);
  var pending = autoMaintenanceAlerts(v);
  var options = autoData().vehicles.map(function(item){
    return '<option value="' + autoEsc(item.id) + '"' + (item.id === v.id ? " selected" : "") + '>' +
      autoEsc(autoVehicleLabel(item) + (item.plate ? " · " + item.plate : "") + (item.archived ? " · Archivado" : "")) + '</option>';
  }).join("");
  var alerts = pending.length ? pending.slice(0,8).map(function(a){
    return '<div class="auto-alert ' + a.level + '"><div class="auto-alert-title">' + autoEsc(a.title) +
      ' <span class="auto-status ' + a.level + '">' + autoEsc(a.status) + '</span></div><div class="auto-alert-detail">' +
      autoEsc(a.detail) + '</div></div>';
  }).join("") : '<div class="auto-alert ok"><div class="auto-alert-title">Sin mantenimientos programados pendientes</div><div class="auto-alert-detail">Los avisos aparecerán cuando registres un próximo cambio por kilometraje o fecha.</div></div>';
  var recent = records.slice(0,5).map(autoRecordCard).join("") || '<div class="auto-empty">Todavía no hay trabajos registrados para este vehículo.</div>';
  host.innerHTML =
    '<div class="auto-head"><div><div class="auto-title">Control del auto</div><div class="auto-subtitle">Historial técnico, mantenimiento y costos</div></div>' +
    '<button class="auto-mini-btn" onclick="autoNuevoVehiculo()">＋ Vehículo</button></div>' +
    '<div class="auto-card"><div class="auto-muted" style="margin-bottom:7px">VEHÍCULO SELECCIONADO</div>' +
    '<select class="auto-select" aria-label="Seleccionar vehículo" onchange="autoSeleccionarVehiculo(this.value)">' + options + '</select>' +
    '<div class="auto-vehicle-line" style="margin-top:12px"><div><div class="auto-vehicle-name">' + autoEsc(autoVehicleLabel(v)) + '</div>' +
    '<div class="auto-muted">' + autoEsc([v.color,v.fuel].filter(Boolean).join(" · ") || "Datos generales") + '</div></div>' +
    '<div class="auto-plate">' + autoEsc(v.plate || "SIN MATRÍCULA") + '</div></div>' +
    '<div class="auto-record-actions"><button class="auto-mini-btn" onclick="autoEditarVehiculo()">Editar datos</button>' +
    '<button class="auto-mini-btn" onclick="autoCambiarVista(\'historial\')">Historial completo</button>' +
    (v.archived ? '<button class="auto-mini-btn" onclick="autoReactivarVehiculo()">Reactivar</button>' : '<button class="auto-mini-btn danger" onclick="autoArchivarVehiculo()">Archivar</button>') +
    '</div></div>' +
    '<div class="auto-kpis">' +
    '<div class="auto-kpi"><div class="auto-kpi-label">Kilometraje actual</div><div class="auto-kpi-value">' + autoEsc(Math.round(Number(v.currentKm)||0).toLocaleString("es-PY")) + ' km</div><div class="auto-kpi-note"><button class="auto-mini-btn" style="margin-top:6px" onclick="autoAbrirKm()">Actualizar km</button></div></div>' +
    '<div class="auto-kpi"><div class="auto-kpi-label">Total histórico</div><div class="auto-kpi-value" style="color:var(--green)">' + autoEsc(autoMoney(total)) + '</div><div class="auto-kpi-note">Solo este vehículo</div></div>' +
    '<div class="auto-kpi"><div class="auto-kpi-label">Trabajos registrados</div><div class="auto-kpi-value">' + records.length + '</div><div class="auto-kpi-note">Historial individual</div></div>' +
    '<div class="auto-kpi"><div class="auto-kpi-label">Alertas pendientes</div><div class="auto-kpi-value" style="color:' + (pending.some(function(a){return a.level === "danger";}) ? "var(--red)" : "var(--gold)") + '">' + pending.length + '</div><div class="auto-kpi-note">Por km o por fecha</div></div>' +
    '</div>' +
    '<div class="auto-actions">' +
    '<button class="auto-action primary" onclick="autoNuevoRegistro()" ' + (v.archived ? "disabled" : "") + '>＋ Registrar mantenimiento</button>' +
    '<button class="auto-action" onclick="autoPDF()">▤ Descargar informe PDF</button>' +
    '</div>' +
    '<div class="auto-section-head"><div class="auto-section-title">Próximos mantenimientos</div></div>' + alerts +
    '<div class="auto-section-head"><div class="auto-section-title">Últimos trabajos</div><button class="auto-mini-btn" onclick="autoCambiarVista(\'historial\')">Ver todos</button></div>' +
    recent +
    (v.notes ? '<div class="auto-card"><div class="auto-section-title">Observaciones del vehículo</div><div class="auto-muted" style="margin-top:6px">' + autoEsc(v.notes) + '</div></div>' : '');
}
function autoLatestMaintenanceRecords(vehicleId) {
  var latest=new Map();
  autoData().records.filter(function(r){return r.vehicleId===vehicleId&&!r.deletedAt;}).forEach(function(r){
    var key=String(r.category||"")+"|"+String(r.item||"").trim().toLowerCase();
    var stamp=Date.parse(r.updatedAt||r.createdAt||r.date||"")||0;
    var old=latest.get(key),oldStamp=old?(Date.parse(old.updatedAt||old.createdAt||old.date||"")||0):-1;
    if(!old||stamp>oldStamp||(stamp===oldStamp&&Number(r.km||0)>Number(old.km||0)))latest.set(key,r);
  });
  return Array.from(latest.values());
}
function autoMaintenanceAlerts(v) {
  var today=autoLocalDate();
  return autoLatestMaintenanceRecords(v.id).filter(function(r){return Number(r.nextKm)>0||!!r.nextDate;}).map(function(r){
    var kmLeft=Number(r.nextKm)>0?Number(r.nextKm)-(Number(v.currentKm)||0):null;
    var dayLeft=r.nextDate?Math.ceil((new Date(r.nextDate+"T00:00:00").getTime()-new Date(today+"T00:00:00").getTime())/86400000):null;
    var overdue=(kmLeft!==null&&kmLeft<=0)||(dayLeft!==null&&dayLeft<=0);
    var soon=!overdue&&((kmLeft!==null&&kmLeft<=500)||(dayLeft!==null&&dayLeft<=30));
    if(!overdue&&!soon)return null;
    var detail=[];
    if(kmLeft!==null)detail.push(kmLeft<=0?"Superado por "+Math.abs(Math.round(kmLeft)).toLocaleString("es-PY")+" km":"Restan "+Math.round(kmLeft).toLocaleString("es-PY")+" km");
    if(dayLeft!==null)detail.push(dayLeft<=0?"Fecha vencida hace "+Math.abs(dayLeft)+" días":"Faltan "+dayLeft+" días");
    return {level:overdue?"danger":"warn",status:overdue?"CONTROLAR AHORA":"PRÓXIMO",title:r.item,
      detail:detail.join(" · ")+" · Objetivo: "+(r.nextKm?Math.round(r.nextKm).toLocaleString("es-PY")+" km":r.nextDate),
      vehicleId:v.id,recordId:r.id,kind:"auto"};
  }).filter(Boolean);
}
function autoRecordCard(r) {
  return '<div class="auto-record"><div class="auto-record-top"><div style="min-width:0;flex:1"><div class="auto-record-title">' +
    autoEsc(r.item) + '</div><div class="auto-record-meta">' + autoEsc(r.date || "Sin fecha") + ' · ' +
    autoEsc(Math.round(Number(r.km)||0).toLocaleString("es-PY")) + ' km · ' + autoEsc(r.category || "Sin categoría") +
    (r.workshop ? '<br>Taller: ' + autoEsc(r.workshop) : '') + (r.visit ? '<br>Visita / orden: ' + autoEsc(r.visit) : '') + (r.warranty ? '<br>Garantía: ' + autoEsc(r.warranty) : '') + '</div></div><div class="auto-record-cost">' +
    autoEsc(autoMoney(r.total)) + '</div></div>' +
    (r.description ? '<div class="auto-muted" style="margin-top:7px">' + autoEsc(r.description) + '</div>' : '') +
    (r.nextKm || r.nextDate ? '<div><span class="auto-tag">Próximo: ' + autoEsc(r.nextKm ? Math.round(r.nextKm).toLocaleString("es-PY") + " km" + (r.nextIntervalKm ? " (cada " + Math.round(r.nextIntervalKm).toLocaleString("es-PY") + " km)" : "") : "") +
      (r.nextKm && r.nextDate ? " · " : "") + autoEsc(r.nextDate || "") + '</span></div>' : '') +
    '<div class="auto-record-actions"><button class="auto-mini-btn" onclick="autoEditarRegistro(\'' + autoEsc(r.id) + '\')">Editar</button>' +
    '<button class="auto-mini-btn danger" onclick="autoEliminarRegistro(\'' + autoEsc(r.id) + '\')">Eliminar</button></div></div>';
}
function autoCambiarVista(view) {
  AUTO_UI.view = view;
  AUTO_UI.form = "";
  autoRender();
}
function autoSeleccionarVehiculo(id) {
  var v = autoData().vehicles.find(function(x){return x.id === id;});
  if (!v) return;
  APP_DATA.autos.activeVehicleId = id;
  AUTO_UI.view = "inicio";
  AUTO_UI.form = "";
  save();
  autoRender();
}
function autoNuevoVehiculo() { AUTO_UI.form = "vehicle"; AUTO_UI.editingId = null; autoRender(); }
function autoEditarVehiculo() { var v = autoVehiculo(); if (!v) return; AUTO_UI.form = "vehicle"; AUTO_UI.editingId = v.id; autoRender(); }
function autoRenderVehicleForm() {
  var host = document.getElementById("auto-content");
  var v = AUTO_UI.editingId ? autoData().vehicles.find(function(x){return x.id === AUTO_UI.editingId;}) : null;
  v = v || {};
  host.innerHTML = '<div class="auto-head"><div><div class="auto-title">' + (v.id ? "Editar vehículo" : "Registrar vehículo") +
    '</div><div class="auto-subtitle">Cada vehículo tendrá su propio historial y sus propios gastos.</div></div></div>' +
    '<div class="auto-form"><div class="auto-form-grid">' +
    autoField("Marca","auto-v-brand",v.brand,"Ej.: Toyota") +
    autoField("Modelo","auto-v-model",v.model,"Ej.: Corolla") +
    autoField("Año","auto-v-year",v.year,"Ej.: 2012","number") +
    autoField("Matrícula","auto-v-plate",v.plate,"Ej.: ABC 123") +
    autoField("Color","auto-v-color",v.color,"Color") +
    '<div class="auto-field"><label>Combustible</label><select id="auto-v-fuel"><option value="">Seleccionar</option>' +
    ["Nafta","Diésel","Híbrido","Eléctrico","GLP","Otro"].map(function(x){return '<option value="' + x + '"' + (v.fuel === x ? " selected" : "") + '>' + x + '</option>';}).join("") +
    '</select></div>' +
    autoField("Kilometraje actual","auto-v-km",v.currentKm,"Ej.: 98500","number") +
    autoField("Fecha de adquisición","auto-v-date",v.acquisitionDate,"","date") +
    '<div class="auto-field full"><label>Número de chasis (opcional)</label><input id="auto-v-vin" value="' + autoEsc(v.vin) + '" maxlength="40" placeholder="Número de chasis"></div>' +
    '<div class="auto-field full"><label>Observaciones</label><textarea id="auto-v-notes" maxlength="1000" placeholder="Datos adicionales del vehículo">' + autoEsc(v.notes) + '</textarea></div>' +
    '</div><div class="auto-form-buttons"><button class="auto-action" onclick="autoCancelarForm()">Cancelar</button>' +
    '<button class="auto-action primary" onclick="autoGuardarVehiculo()">' + (v.id ? "Guardar cambios" : "Guardar vehículo") + '</button></div></div>';
  autoAttachThousands(["auto-v-km"]);
}
function autoField(label,id,value,placeholder,type) {
  var t = type || "text";
  var thousands = t === "number" && (/km/i.test(id) || /part|labor|other/i.test(id));
  var inputType = thousands ? "text" : t;
  var displayValue = thousands ? autoFormatNumber(value) : value;
  return '<div class="auto-field"><label for="' + id + '">' + autoEsc(label) + '</label><input id="' + id + '" type="' + inputType + '"' +
    (thousands ? ' inputmode="numeric" class="auto-thousands"' : '') +
    ' value="' + autoEsc(displayValue) + '" placeholder="' + autoEsc(placeholder || "") + '"' + (t === "number" ? ' min="0"' : "") + '></div>';
}
function autoGuardarVehiculo() {
  var d = autoData();
  var id = AUTO_UI.editingId;
  var existing = id ? d.vehicles.find(function(x){return x.id === id;}) : null;
  var brand = document.getElementById("auto-v-brand").value.trim();
  var model = document.getElementById("auto-v-model").value.trim();
  var year = autoNum(document.getElementById("auto-v-year").value);
  var km = autoNum(document.getElementById("auto-v-km").value);
  if (!brand || !model) { alert("Ingresá la marca y el modelo del vehículo."); return; }
  if (km < 0 || year < 0 || year > new Date().getFullYear()+1) { alert("Revisá el año y el kilometraje."); return; }
  var now = new Date().toISOString();
  var v = Object.assign({}, existing || {}, {
    id: existing ? existing.id : autoId(), brand:brand, model:model, year:year || "",
    plate:document.getElementById("auto-v-plate").value.trim().toUpperCase(),
    color:document.getElementById("auto-v-color").value.trim(),
    fuel:document.getElementById("auto-v-fuel").value,
    currentKm:km,
    acquisitionDate:document.getElementById("auto-v-date").value,
    vin:document.getElementById("auto-v-vin").value.trim(),
    notes:document.getElementById("auto-v-notes").value.trim(),
    archived:existing ? !!existing.archived : false, updatedAt:now, createdAt:existing ? existing.createdAt : now
  });
  if (existing) d.vehicles[d.vehicles.findIndex(function(x){return x.id === id;})] = v;
  else d.vehicles.push(v);
  d.activeVehicleId = v.id;
  AUTO_UI.form = ""; AUTO_UI.view = "inicio"; AUTO_UI.editingId = null;
  save().then(function(){ showToast(hasPending() ? "Vehículo guardado en este teléfono; sincronización pendiente." : "Vehículo guardado."); autoRender(); });
}
function autoAbrirKm() { AUTO_UI.form = "km"; autoRender(); }
function autoRenderKmForm() {
  var v = autoVehiculo();
  document.getElementById("auto-content").innerHTML =
    '<div class="auto-head"><div><div class="auto-title">Actualizar kilometraje</div><div class="auto-subtitle">' + autoEsc(autoVehicleLabel(v)) + '</div></div></div>' +
    '<div class="auto-form"><div class="auto-field"><label>Kilometraje actual</label><input id="auto-km-new" type="text" inputmode="numeric" class="auto-thousands" value="' + autoEsc(autoFormatNumber(v.currentKm || 0)) + '"></div>' +
    '<div class="auto-form-buttons"><button class="auto-action" onclick="autoCancelarForm()">Cancelar</button><button class="auto-action primary" onclick="autoGuardarKm()">Guardar km</button></div></div>';
  autoAttachThousands(["auto-km-new"]);
}
function autoGuardarKm() {
  var v = autoVehiculo();
  var km = autoNum(document.getElementById("auto-km-new").value);
  if (!v || km < 0) { alert("Ingresá un kilometraje válido."); return; }
  if (km < (Number(v.currentKm)||0) && !window.confirm("El nuevo kilometraje es menor que el anterior. ¿Confirmás que es una corrección de lectura?")) return;
  v.currentKm = km; v.updatedAt = new Date().toISOString();
  AUTO_UI.form = "";
  save().then(function(){ showToast("Kilometraje actualizado."); autoRender(); if(typeof renderDashboard==="function")renderDashboard(); });
}
function autoNuevoRegistro() {
  var v = autoVehiculo();
  if (!v || v.archived) { showToast("Seleccioná un vehículo activo."); return; }
  AUTO_UI.form = "record"; AUTO_UI.editingId = null; autoRender();
}
function autoEditarRegistro(id) {
  var r = autoData().records.find(function(x){return x.id === id && !x.deletedAt;});
  if (!r) return;
  if (r.vehicleId !== (autoVehiculo() || {}).id) { alert("El registro pertenece a otro vehículo."); return; }
  AUTO_UI.form = "record"; AUTO_UI.editingId = id; autoRender();
}
function autoRenderRecordForm() {
  var host=document.getElementById("auto-content"),v=autoVehiculo();
  var r=AUTO_UI.editingId?autoData().records.find(function(x){return x.id===AUTO_UI.editingId;}):null;
  r=r||{};
  var category=r.category||"Motor";
  var oldInterval=r.nextIntervalKm!==undefined&&r.nextIntervalKm!==null?Number(r.nextIntervalKm):(Number(r.nextKm)>0&&Number(r.km)>=0?Number(r.nextKm)-Number(r.km):0);
  host.innerHTML='<div class="auto-head"><div><div class="auto-title">'+(r.id?"Editar mantenimiento":"Registrar mantenimiento")+'</div><div class="auto-subtitle">'+autoEsc(autoVehicleLabel(v))+' · Registro independiente por vehículo.</div></div></div>'+
  '<div class="auto-form"><div class="auto-cascade-step"><div class="auto-cascade-label">1. Elegí la categoría</div><input id="auto-r-category" type="hidden" value="'+autoEsc(category)+'"><div id="auto-category-carousel" class="auto-category-carousel"></div>'+
  '<div class="auto-cascade-label" style="margin-top:12px">2. Elegí la pieza o trabajo</div><div id="auto-piece-options" class="auto-piece-options"></div>'+
  '<div class="auto-field" style="margin-top:9px"><label>Pieza o mantenimiento *</label><input id="auto-r-item" maxlength="100" value="'+autoEsc(r.item)+'" placeholder="Seleccioná arriba o escribí una pieza"></div></div>'+
  '<details class="auto-accordion" open><summary>3. Datos del trabajo</summary><div class="auto-accordion-body"><div class="auto-form-grid">'+
  '<div class="auto-field"><label>Fecha del trabajo *</label><input id="auto-r-date" type="date" value="'+autoEsc(r.date||autoLocalDate())+'"></div>'+
  autoField("Kilometraje al realizar el trabajo *","auto-r-km",r.km!==undefined?r.km:v.currentKm||0,"Ej.: 98.500","number")+
  '<div class="auto-field full"><label>Descripción del trabajo</label><textarea id="auto-r-description" maxlength="1000" placeholder="Qué se hizo, diagnóstico o detalle">'+autoEsc(r.description)+'</textarea></div></div></div></details>'+
  '<details class="auto-accordion"><summary>4. Repuestos y costos</summary><div class="auto-accordion-body"><div class="auto-form-grid">'+
  autoField("Marca del repuesto","auto-r-brand",r.partBrand,"Ej.: Bosch / Denso")+
  autoField("Modelo o referencia","auto-r-ref",r.partReference,"Código o referencia")+
  autoField("Cantidad","auto-r-qty",r.quantity||1,"1","number")+
  autoField("Precio unitario del repuesto (Gs.)","auto-r-part",r.partCost||0,"Ej.: 18.000","number")+
  autoField("Mano de obra (Gs.)","auto-r-labor",r.labor||0,"0","number")+
  autoField("Otros gastos (Gs.)","auto-r-other",r.otherCost||0,"0","number")+
  '<div class="auto-total-box"><span>Costo total calculado</span><strong id="auto-r-total">'+autoEsc(autoMoney(r.total||0))+'</strong></div></div></div></details>'+
  '<details class="auto-accordion" open><summary>5. Próximo mantenimiento</summary><div class="auto-accordion-body"><div class="auto-form-grid">'+
  autoField("Intervalo para el próximo cambio (km)","auto-r-next-interval",oldInterval||"","Ej.: 5.000","number")+
  '<div class="auto-field"><label>Próxima revisión por fecha</label><input id="auto-r-next-date" type="date" value="'+autoEsc(r.nextDate)+'"></div>'+
  '<div class="auto-total-box auto-next-target"><span>Próximo kilometraje calculado</span><strong id="auto-r-next-display">—</strong></div></div>'+
  '<div class="auto-form-help" style="margin-top:8px">El sistema suma el intervalo al kilometraje del trabajo. Usá el intervalo recomendado por el fabricante o tu mecánico.</div></div></details>'+
  '<details class="auto-accordion"><summary>6. Taller, garantía y observaciones</summary><div class="auto-accordion-body"><div class="auto-form-grid">'+
  autoField("Taller o mecánico","auto-r-workshop",r.workshop,"Nombre del taller")+
  autoField("Garantía","auto-r-warranty",r.warranty,"Ej.: 3 meses / 5.000 km")+
  autoField("Factura / comprobante","auto-r-receipt",r.receipt,"N.º de factura o referencia")+
  '<div class="auto-field full"><label>Visita / orden de trabajo (opcional)</label><input id="auto-r-visit" maxlength="80" value="'+autoEsc(r.visit)+'" placeholder="Ej.: Orden 145"></div>'+
  '<div class="auto-field full"><label>Observaciones</label><textarea id="auto-r-notes" maxlength="1500" placeholder="Notas adicionales">'+autoEsc(r.notes)+'</textarea></div></div></div></details>'+
  '<div class="auto-form-buttons"><button class="auto-action" onclick="autoCancelarForm()">Cancelar</button><button class="auto-action primary" onclick="autoGuardarRegistro()">Guardar trabajo</button></div></div>';
  autoRenderCategoryCascade(category,r.item||"");
  autoAttachThousands(["auto-r-km","auto-r-part","auto-r-labor","auto-r-other","auto-r-next-interval"]);
  ["auto-r-qty","auto-r-part","auto-r-labor","auto-r-other"].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener("input",autoCalcularTotal);});
  ["auto-r-km","auto-r-next-interval"].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener("input",autoCalcularProximo);});
  autoCalcularTotal();autoCalcularProximo();
}
function autoRenderCategoryCascade(selectedCategory,selectedItem) {
  var catHost=document.getElementById("auto-category-carousel"),pieceHost=document.getElementById("auto-piece-options");
  if(!catHost||!pieceHost)return;
  catHost.innerHTML=Object.keys(AUTO_CATALOGO).map(function(cat){return '<button type="button" class="auto-category-pill'+(cat===selectedCategory?' active':'')+'" onclick="autoSeleccionarCategoria(&quot;'+autoEsc(cat)+'&quot;)">'+autoEsc(cat)+'</button>';}).join("");
  pieceHost.innerHTML=(AUTO_CATALOGO[selectedCategory]||[]).map(function(item){return '<button type="button" class="auto-piece-pill'+(item===selectedItem?' active':'')+'" onclick="autoSeleccionarPieza(&quot;'+autoEsc(item)+'&quot;)">'+autoEsc(item)+'</button>';}).join("");
}
function autoSeleccionarCategoria(category) {
  var cat=document.getElementById("auto-r-category"),item=document.getElementById("auto-r-item");
  if(!AUTO_CATALOGO[category])return;cat.value=category;item.value="";autoRenderCategoryCascade(category,"");
}
function autoSeleccionarPieza(item) {
  var field=document.getElementById("auto-r-item");if(!field)return;field.value=item;
  autoRenderCategoryCascade(document.getElementById("auto-r-category").value,item);
}
function autoActualizarCatalogo() {
  var cat = document.getElementById("auto-r-category").value;
  var list = document.getElementById("auto-items");
  if (list) list.innerHTML = (AUTO_CATALOGO[cat] || []).map(function(x){return '<option value="' + autoEsc(x) + '"></option>';}).join("");
}
function autoCalcularTotal() {
  var qty = Math.max(1,autoNum(document.getElementById("auto-r-qty") && document.getElementById("auto-r-qty").value || 1));
  var parts = autoNum(document.getElementById("auto-r-part") && document.getElementById("auto-r-part").value);
  var labor = autoNum(document.getElementById("auto-r-labor") && document.getElementById("auto-r-labor").value);
  var other = autoNum(document.getElementById("auto-r-other") && document.getElementById("auto-r-other").value);
  var el = document.getElementById("auto-r-total");
  if (el) el.textContent = autoMoney((qty * parts) + labor + other);
}
function autoCalcularProximo() {
  var kmEl=document.getElementById("auto-r-km"),intervalEl=document.getElementById("auto-r-next-interval"),result=document.getElementById("auto-r-next-display");
  if(!result||!kmEl||!intervalEl)return;
  var km=autoNum(kmEl.value),interval=autoNum(intervalEl.value);
  result.textContent=interval>0?(km+interval).toLocaleString("es-PY")+" km":"Sin intervalo definido";
}
function autoGuardarRegistro() {
  var d = autoData();
  var v = autoVehiculo();
  if (!v || v.archived) { alert("El vehículo no está activo."); return; }
  var date = document.getElementById("auto-r-date").value;
  var km = autoNum(document.getElementById("auto-r-km").value);
  var category = document.getElementById("auto-r-category").value;
  var item = document.getElementById("auto-r-item").value.trim();
  var quantity = Math.max(1,autoNum(document.getElementById("auto-r-qty").value));
  var partCost = autoNum(document.getElementById("auto-r-part").value);
  var labor = autoNum(document.getElementById("auto-r-labor").value);
  var otherCost = autoNum(document.getElementById("auto-r-other").value);
  var nextIntervalKm = autoNum(document.getElementById("auto-r-next-interval").value);
  var nextKm = nextIntervalKm > 0 ? km + nextIntervalKm : null;
  var nextDate = document.getElementById("auto-r-next-date").value;
  if (!date || !category || !item || date > autoLocalDate() || km < 0 || partCost < 0 || labor < 0 || otherCost < 0) {
    alert("Completá la fecha (no futura), el kilometraje, la categoría, la pieza y verificá que los importes no sean negativos."); return;
  }
  if (nextIntervalKm < 0) { alert("El intervalo debe ser un número positivo."); return; }
  if (nextDate && nextDate < date) { alert("La fecha del próximo mantenimiento no puede ser anterior al trabajo."); return; }
  var now = new Date().toISOString();
  var id = AUTO_UI.editingId;
  var old = id ? d.records.find(function(x){return x.id === id;}) : null;
  var record = Object.assign({},old || {},{
    id:old ? old.id : autoId(), vehicleId:v.id, date:date, km:km, category:category, item:item,
    description:document.getElementById("auto-r-description").value.trim(),
    partBrand:document.getElementById("auto-r-brand").value.trim(),
    partReference:document.getElementById("auto-r-ref").value.trim(),
    quantity:quantity, partCost:partCost, labor:labor, otherCost:otherCost,
    total:(quantity * partCost) + labor + otherCost,
    workshop:document.getElementById("auto-r-workshop").value.trim(),
    nextIntervalKm:nextIntervalKm || null, nextKm:nextKm, nextDate:nextDate || "",
    warranty:document.getElementById("auto-r-warranty").value.trim(),
    receipt:document.getElementById("auto-r-receipt").value.trim(),
    visit:document.getElementById("auto-r-visit").value.trim(),
    notes:document.getElementById("auto-r-notes").value.trim(),
    createdAt:old ? old.createdAt : now, updatedAt:now
  });
  if (old) d.records[d.records.findIndex(function(x){return x.id === id;})] = record;
  else d.records.push(record);
  if (km > (Number(v.currentKm)||0)) { v.currentKm = km; v.updatedAt = now; }
  AUTO_UI.form = ""; AUTO_UI.editingId = null; AUTO_UI.view = "inicio";
  save().then(function(){
    showToast(hasPending() ? "Trabajo guardado en el teléfono; falta sincronizar." : "Trabajo guardado.");
    autoRender();
    if(typeof renderDashboard==="function")renderDashboard();
  });
}
function autoCancelarForm() { AUTO_UI.form = ""; AUTO_UI.editingId = null; autoRender(); }
function autoEliminarRegistro(id) {
  var d = autoData();
  var r = d.records.find(function(x){return x.id === id;});
  if (!r) return;
  if (!window.confirm("¿Eliminar el registro de " + r.item + "? Esta acción no se puede deshacer.")) return;
  r.deletedAt = new Date().toISOString();
  r.updatedAt = r.deletedAt;
  save().then(function(){showToast("Registro eliminado del historial.");autoRender();});
}
function autoArchivarVehiculo() {
  var v = autoVehiculo(); if (!v) return;
  if (!window.confirm("¿Archivar " + autoVehicleLabel(v) + "? El historial y los registros no se borrarán.")) return;
  v.archived = true; v.updatedAt = new Date().toISOString();
  var next = autoData().vehicles.find(function(x){return !x.archived && x.id !== v.id;});
  APP_DATA.autos.activeVehicleId = next ? next.id : v.id;
  save().then(function(){showToast("Vehículo archivado. Su historial se conserva.");autoRender();});
}
function autoReactivarVehiculo() {
  var v = autoVehiculo(); if (!v) return;
  v.archived = false; v.updatedAt = new Date().toISOString();
  save().then(function(){showToast("Vehículo reactivado.");autoRender();});
}
function autoRenderHistory(v) {
  var host = document.getElementById("auto-content");
  var f = AUTO_UI.filters;
  var all = autoRecords(v.id);
  var cats = '<option value="">Todas las categorías</option>' + Object.keys(AUTO_CATALOGO).map(function(c){return '<option value="' + autoEsc(c) + '"' + (f.category === c ? " selected" : "") + '>' + autoEsc(c) + '</option>';}).join("");
  var filtered = all.filter(function(r){
    var hay = [r.item,r.category,r.description,r.workshop,r.partBrand,r.partReference,r.receipt,r.notes].join(" ").toLowerCase();
    return (!f.q || hay.indexOf(f.q.toLowerCase()) >= 0) &&
      (!f.category || r.category === f.category) &&
      (!f.from || String(r.date || "") >= f.from) &&
      (!f.to || String(r.date || "") <= f.to);
  });
  var recordsHtml = filtered.map(autoRecordCard).join("") || '<div class="auto-empty">No hay registros que coincidan con los filtros.</div>';
  host.innerHTML = '<div class="auto-head"><div><div class="auto-title">Historial del vehículo</div><div class="auto-subtitle">' +
    autoEsc(autoVehicleLabel(v)) + ' · ' + filtered.length + ' de ' + all.length + ' registros</div></div>' +
    '<button class="auto-mini-btn" onclick="autoCambiarVista(\'inicio\')">‹ Volver</button></div>' +
    '<div class="auto-card"><div class="auto-filter-grid">' +
    '<div class="auto-field full"><label>Buscar pieza, descripción o taller</label><input id="auto-filter-q" value="' + autoEsc(f.q) + '" placeholder="Ej.: aceite, frenos, taller"></div>' +
    '<div class="auto-field full"><label>Categoría</label><select id="auto-filter-category">' + cats + '</select></div>' +
    '<div class="auto-field"><label>Desde</label><input id="auto-filter-from" type="date" value="' + autoEsc(f.from) + '"></div>' +
    '<div class="auto-field"><label>Hasta</label><input id="auto-filter-to" type="date" value="' + autoEsc(f.to) + '"></div>' +
    '</div><div class="auto-form-buttons"><button class="auto-action" onclick="autoLimpiarFiltros()">Limpiar</button>' +
    '<button class="auto-action primary" onclick="autoAplicarFiltros()">Aplicar filtros</button></div>' +
    '<button class="auto-action" style="width:100%;margin-top:9px" onclick="autoPDF()">▤ Descargar informe PDF</button></div>' +
    '<div class="auto-section-head"><div class="auto-section-title">Trabajos registrados</div><button class="auto-mini-btn" onclick="autoNuevoRegistro()">＋ Nuevo</button></div>' + recordsHtml;
}
function autoAplicarFiltros() {
  AUTO_UI.filters = {
    q:document.getElementById("auto-filter-q").value.trim(),
    category:document.getElementById("auto-filter-category").value,
    from:document.getElementById("auto-filter-from").value,
    to:document.getElementById("auto-filter-to").value
  };
  if (AUTO_UI.filters.from && AUTO_UI.filters.to && AUTO_UI.filters.from > AUTO_UI.filters.to) {
    alert("La fecha inicial no puede ser posterior a la fecha final."); return;
  }
  autoRender();
}
function autoLimpiarFiltros() { AUTO_UI.filters = {q:"",category:"",from:"",to:""}; autoRender(); }
function autoPDF() {
  var v = autoVehiculo();
  if (!v) { alert("No hay un vehículo seleccionado."); return; }
  var f = AUTO_UI.view === "historial" ? AUTO_UI.filters : {q:"",category:"",from:"",to:""};
  var records = autoRecords(v.id).filter(function(r){
    var hay = [r.item,r.category,r.description,r.workshop,r.partBrand,r.partReference,r.receipt,r.notes].join(" ").toLowerCase();
    return (!f.from || String(r.date || "") >= f.from) && (!f.to || String(r.date || "") <= f.to) &&
      (!f.category || r.category === f.category) && (!f.q || hay.indexOf(f.q.toLowerCase()) >= 0);
  });
  var total = records.reduce(function(s,r){return s + (Number(r.total)||0);},0);
  var rows = records.map(function(r){
    return '<tr><td>' + autoEsc(r.date) + '</td><td>' + autoEsc(Math.round(Number(r.km)||0).toLocaleString("es-PY")) + ' km</td>' +
      '<td><b>' + autoEsc(r.item) + '</b><br><small>' + autoEsc(r.category) + '</small>' +
      (r.description ? '<br><small>' + autoEsc(r.description) + '</small>' : '') +
      (r.visit ? '<br><small>Visita / orden: ' + autoEsc(r.visit) + '</small>' : '') +
      (r.partBrand || r.partReference ? '<br><small>Repuesto: ' + autoEsc([r.partBrand,r.partReference].filter(Boolean).join(" / ")) + '</small>' : '') +
      (r.notes ? '<br><small>Observaciones: ' + autoEsc(r.notes) + '</small>' : '') +
      (r.receipt ? '<br><small>Comprobante: ' + autoEsc(r.receipt) + '</small>' : '') + '</td>' +
      '<td>' + autoEsc(r.workshop || "—") + '</td><td class="money">' + autoEsc(autoMoney(r.total)) + '</td></tr>';
  }).join("");
  var w = window.open("","_blank");
  if (!w) { alert("El navegador bloqueó el informe. Permití ventanas emergentes para Delivery Pro y volvé a tocar Descargar PDF."); return; }
  var title = autoVehicleLabel(v);
  var dateRange = (f.from || f.to) ? ((f.from || "Inicio") + " a " + (f.to || "Hoy")) : "Historial completo";
  if (f.category) dateRange += " · " + f.category;
  if (f.q) dateRange += " · Búsqueda: " + f.q;
  var html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Delivery Pro - Informe Auto - ' + autoEsc(title) + '</title><style>' +
    'body{font-family:Arial,sans-serif;color:#20242c;margin:28px;font-size:11px}h1{font-size:21px;margin:0 0 4px}h2{font-size:13px;margin:0 0 10px;color:#555} .brand{font-size:10px;letter-spacing:2px;color:#a36a12;font-weight:bold;margin-bottom:12px} .meta{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:18px 0;padding:12px;border:1px solid #ddd;border-radius:8px} .meta b{display:block;color:#777;font-size:9px;text-transform:uppercase;margin-bottom:3px} .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0} .tile{border:1px solid #ddd;border-radius:8px;padding:9px} .tile span{display:block;color:#666;font-size:9px;text-transform:uppercase} .tile strong{font-size:15px} table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#252b36;color:white;text-align:left;padding:8px 6px;font-size:9px}td{border-bottom:1px solid #ddd;padding:8px 6px;vertical-align:top}small{color:#666;font-size:9px}.money{text-align:right;font-weight:bold;white-space:nowrap}.total{margin:14px 0;text-align:right;font-size:16px;font-weight:bold}.footer{margin-top:24px;padding-top:8px;border-top:1px solid #ddd;color:#777;font-size:9px} .empty{padding:18px;text-align:center;color:#666;border:1px dashed #ccc} @page{size:A4;margin:12mm} @media print{body{margin:0}.no-print{display:none!important}}' +
    '</style></head><body><div class="brand">DELIVERY PRO · CONTROL VEHICULAR</div><h1>' + autoEsc(title) + '</h1><h2>Informe de mantenimiento · ' + autoEsc(dateRange) + '</h2>' +
    '<div class="meta"><div><b>Marca y modelo</b>' + autoEsc(v.brand + " " + v.model) + '</div><div><b>Año</b>' + autoEsc(v.year || "—") + '</div>' +
    '<div><b>Matrícula</b>' + autoEsc(v.plate || "—") + '</div><div><b>Color / combustible</b>' + autoEsc([v.color,v.fuel].filter(Boolean).join(" · ") || "—") + '</div>' +
    '<div><b>Kilometraje actual</b>' + autoEsc(Math.round(Number(v.currentKm)||0).toLocaleString("es-PY")) + ' km</div><div><b>Generado</b>' + autoEsc(new Date().toLocaleString("es-PY")) + '</div>' +
    '<div><b>Chasis</b>' + autoEsc(v.vin || "—") + '</div><div><b>Fecha de adquisición</b>' + autoEsc(v.acquisitionDate || "—") + '</div></div>' +
    '<div class="summary"><div class="tile"><span>Trabajos incluidos</span><strong>' + records.length + '</strong></div><div class="tile"><span>Total del informe</span><strong>' + autoEsc(autoMoney(total)) + '</strong></div><div class="tile"><span>Histórico total</span><strong>' + autoEsc(autoMoney(autoTotal(v.id))) + '</strong></div></div>' +
    '<table><thead><tr><th>Fecha</th><th>Kilometraje</th><th>Trabajo y detalle</th><th>Taller</th><th style="text-align:right">Costo total</th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5" class="empty">No hay trabajos registrados en este período.</td></tr>') +
    '</tbody></table><div class="total">Total de los registros: ' + autoEsc(autoMoney(total)) + '</div>' +
    '<h2>Desglose y seguimiento</h2><table><thead><tr><th>Trabajo</th><th>Repuesto</th><th>Mano de obra</th><th>Otros</th><th>Próximo control</th></tr></thead><tbody>' +
    records.map(function(r){return '<tr><td>' + autoEsc(r.item) + '</td><td>' + autoEsc(autoMoney((Number(r.quantity)||1)*(Number(r.partCost)||0))) + '</td><td>' + autoEsc(autoMoney(r.labor)) + '</td><td>' + autoEsc(autoMoney(r.otherCost)) + '</td><td>' + autoEsc((r.nextKm ? Math.round(r.nextKm).toLocaleString("es-PY") + " km" : "") + (r.nextKm && r.nextDate ? " / " : "") + (r.nextDate || "—")) + '</td></tr>';}).join("") +
    '</tbody></table>' + (v.notes ? '<p><b>Observaciones del vehículo:</b> ' + autoEsc(v.notes) + '</p>' : '') +
    '<div class="footer">Documento generado por Delivery Pro. Los intervalos y próximos controles se basan en los datos ingresados por el usuario. Verificar siempre las especificaciones del fabricante.</div>' +
    '<div class="no-print" style="margin-top:20px"><button onclick="window.print()" style="padding:12px 18px;background:#e3a02f;border:0;border-radius:8px;font-weight:bold">Imprimir / Guardar como PDF</button></div>' +
    '<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},350)};<\/script></body></html>';
  w.document.open(); w.document.write(html); w.document.close();
}

var AUTO_HOME = {selectedId:"moto",alertsExpanded:false};
function autoGetAllControlAlerts() {
  var all=[];
  autoData().vehicles.filter(function(v){return !v.archived;}).forEach(function(v){
    autoMaintenanceAlerts(v).forEach(function(a){a.vehicleLabel=autoVehicleLabel(v);all.push(a);});
  });
  [["aceite","Aceite"],["transmision","Transmisión"]].forEach(function(pair){
    var t=MOTO&&MOTO[pair[0]];
    if(!t||!(Number(t.kmCambio)>0)||!(Number(t.intervalo)>0))return;
    var target=Number(t.kmCambio)+Number(t.intervalo),left=target-(Number(MOTO.km)||0);
    if(left>500)return;
    all.push({kind:"moto",vehicleId:"moto",title:pair[1],status:left<=0?"CONTROLAR AHORA":"PRÓXIMO",
      level:left<=0?"danger":"warn",detail:(left<=0?"Superado por "+Math.abs(Math.round(left)).toLocaleString("es-PY")+" km":"Restan "+Math.round(left).toLocaleString("es-PY")+" km")+" · Objetivo: "+Math.round(target).toLocaleString("es-PY")+" km",vehicleLabel:"Moto"});
  });
  return all.sort(function(a,b){return (a.level==="danger"?0:1)-(b.level==="danger"?0:1);});
}
function autoRenderHomeCompact() {
  var host=document.getElementById("dash-vehicle-control");
  if(!host||typeof MOTO==="undefined")return;
  var d=autoData(),vehicles=d.vehicles.filter(function(v){return !v.archived;});
  var items=[{id:"moto",label:"Moto",name:"Moto",km:Number(MOTO.km)||0}].concat(vehicles.map(function(v){
    return {id:v.id,label:([v.brand,v.model].filter(Boolean).join(" ")||"Auto"),name:autoVehicleLabel(v),km:Number(v.currentKm)||0};
  }));
  if(!items.some(function(x){return x.id===AUTO_HOME.selectedId;}))AUTO_HOME.selectedId="moto";
  var selected=items.find(function(x){return x.id===AUTO_HOME.selectedId;})||items[0];
  var alerts=autoGetAllControlAlerts(),urgent=alerts.filter(function(a){return a.level==="danger";}).length,near=alerts.length-urgent;
  var chips=items.map(function(x){
    return '<button type="button" class="auto-home-chip'+(x.id===selected.id?' active':'')+'" onclick="autoSelectHomeVehicle(&quot;'+autoEsc(x.id)+'&quot;)"><span>'+(x.id==="moto"?"🏍️":"🚗")+' '+autoEsc(x.label)+'</span><b>'+autoEsc(Math.round(x.km).toLocaleString("es-PY"))+' km</b></button>';
  }).join("");
  if(!vehicles.length)chips+='<button type="button" class="auto-home-chip add" onclick="showPage(&quot;auto&quot;)">＋ Agregar auto</button>';
  var alertText=alerts.length?(urgent?urgent+" control"+(urgent===1?"":"es")+" ahora":"")+(urgent&&near?" · ":"")+(near?near+" próximo"+(near===1?"":"s"):""):"Sin controles pendientes";
  var details=alerts.length?alerts.slice(0,10).map(function(a){
    return '<button type="button" class="auto-home-alert '+a.level+'" onclick="autoGoToControl(&quot;'+autoEsc(a.kind)+'&quot;,&quot;'+autoEsc(a.vehicleId)+'&quot;)"><span class="auto-home-alert-main"><b>'+autoEsc(a.vehicleLabel+" · "+a.title)+'</b><small>'+autoEsc(a.detail)+'</small></span><span class="auto-status '+a.level+'">'+(a.level==="danger"?"AHORA":"PRÓXIMO")+'</span></button>';
  }).join(""):'<div class="auto-home-empty">Todo en orden. No hay mantenimientos próximos.</div>';
  host.innerHTML='<div class="auto-home-card"><div class="auto-home-head"><div><b>🏍️ Kilometraje y controles</b><small>Actualización rápida de Moto y Auto</small></div><button type="button" class="auto-home-manage" onclick="showPage(&quot;auto&quot;)">Gestionar</button></div>'+
    '<div class="auto-home-carousel">'+chips+'</div><div class="auto-home-update"><div class="auto-home-update-label"><span>Actualizar · <b>'+autoEsc(selected.name)+'</b></span><small>Actual: '+autoEsc(Math.round(selected.km).toLocaleString("es-PY"))+' km</small></div>'+
    '<div class="auto-home-update-row"><input id="auto-home-km-input" type="text" inputmode="numeric" value="'+autoEsc(autoFormatNumber(selected.km))+'" placeholder="Nuevo km" oninput="autoFormatLive(this)"><button type="button" onclick="autoGuardarKmHome()">Guardar</button></div></div>'+
    '<div class="auto-home-alert-summary"><span class="'+(urgent?"has-danger":alerts.length?"has-warn":"has-ok")+'">'+(alerts.length?"⚠️ "+autoEsc(alertText):"✓ "+autoEsc(alertText))+'</span><button type="button" onclick="autoToggleHomeAlerts()">'+(AUTO_HOME.alertsExpanded?"Ocultar":"Ver detalles")+" ⌄</button></div>'+
    '<div class="auto-home-alert-list" '+(AUTO_HOME.alertsExpanded?"":"hidden")+'>'+details+'</div></div>';
}
function autoSelectHomeVehicle(id){AUTO_HOME.selectedId=id;autoRenderHomeCompact();}
function autoToggleHomeAlerts(){AUTO_HOME.alertsExpanded=!AUTO_HOME.alertsExpanded;autoRenderHomeCompact();}
async function autoGuardarKmHome() {
  var input=document.getElementById("auto-home-km-input"),km=autoNum(input&&input.value);
  if(!input||!String(input.value).trim()){alert("Ingresá un kilometraje válido.");return;}
  var id=AUTO_HOME.selectedId;
  if(id==="moto"){
    if(km<(Number(MOTO.km)||0)&&!window.confirm("El kilometraje es menor al anterior. ¿Querés corregir la lectura?"))return;
    MOTO.km=km;APP_DATA.moto=MOTO;if(typeof renderMoto==="function")renderMoto();
  }else{
    var v=autoData().vehicles.find(function(x){return x.id===id&&!x.archived;});
    if(!v){alert("No se encontró el vehículo seleccionado.");return;}
    if(km<(Number(v.currentKm)||0)&&!window.confirm("El kilometraje es menor al anterior. ¿Querés corregir la lectura?"))return;
    v.currentKm=km;v.updatedAt=new Date().toISOString();
  }
  await save();
  if(typeof renderDashboard==="function"&&currentPage==="dashboard")renderDashboard();else autoRenderHomeCompact();
  showToast(hasPending()?"Kilometraje guardado en el teléfono; sincronización pendiente.":"Kilometraje actualizado.");
}
function autoGoToControl(kind,vehicleId) {
  if(kind==="moto"){showPage("moto");return;}
  var v=autoData().vehicles.find(function(x){return x.id===vehicleId&&!x.archived;});
  if(v){autoData().activeVehicleId=v.id;AUTO_UI.view="historial";AUTO_UI.form="";AUTO_UI.filters={q:"",category:"",from:"",to:""};showPage("auto");}
}

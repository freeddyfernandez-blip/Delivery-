
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
  var n = Number(String(v === undefined || v === null ? "" : v).replace(/[^\d.-]/g,""));
  return Number.isFinite(n) ? n : 0;
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
  return autoData().records.filter(function(r){return r.vehicleId === vehicleId;})
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
function autoMaintenanceAlerts(v) {
  var today = autoLocalDate();
  var list = autoRecords(v.id).filter(function(r){return Number(r.nextKm)>0 || !!r.nextDate;}).map(function(r){
    var kmLeft = Number(r.nextKm)>0 ? Number(r.nextKm) - (Number(v.currentKm)||0) : null;
    var dayLeft = r.nextDate ? Math.ceil((new Date(r.nextDate + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000) : null;
    var overdue = (kmLeft !== null && kmLeft <= 0) || (dayLeft !== null && dayLeft <= 0);
    var soon = !overdue && ((kmLeft !== null && kmLeft <= 500) || (dayLeft !== null && dayLeft <= 30));
    if (!overdue && !soon) return null;
    var detail = [];
    if (kmLeft !== null) detail.push(kmLeft <= 0 ? "Kilometraje objetivo superado" : "Restan " + Math.round(kmLeft).toLocaleString("es-PY") + " km");
    if (dayLeft !== null) detail.push(dayLeft <= 0 ? "Fecha prevista vencida" : "Faltan " + dayLeft + " días");
    return {level:overdue ? "danger" : "warn",status:overdue ? "VENCIDO" : "PRÓXIMO",title:r.item,detail:detail.join(" · ") + " · Último registro: " + (r.date || "sin fecha")};
  }).filter(Boolean);
  return list;
}
function autoRecordCard(r) {
  return '<div class="auto-record"><div class="auto-record-top"><div style="min-width:0;flex:1"><div class="auto-record-title">' +
    autoEsc(r.item) + '</div><div class="auto-record-meta">' + autoEsc(r.date || "Sin fecha") + ' · ' +
    autoEsc(Math.round(Number(r.km)||0).toLocaleString("es-PY")) + ' km · ' + autoEsc(r.category || "Sin categoría") +
    (r.workshop ? '<br>Taller: ' + autoEsc(r.workshop) : '') + '</div></div><div class="auto-record-cost">' +
    autoEsc(autoMoney(r.total)) + '</div></div>' +
    (r.description ? '<div class="auto-muted" style="margin-top:7px">' + autoEsc(r.description) + '</div>' : '') +
    (r.nextKm || r.nextDate ? '<div><span class="auto-tag">Próximo: ' + autoEsc(r.nextKm ? Math.round(r.nextKm).toLocaleString("es-PY") + " km" : "") +
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
}
function autoField(label,id,value,placeholder,type) {
  var t = type || "text";
  return '<div class="auto-field"><label for="' + id + '">' + autoEsc(label) + '</label><input id="' + id + '" type="' + t +
    '" value="' + autoEsc(value) + '" placeholder="' + autoEsc(placeholder || "") + '"' + (t === "number" ? ' min="0"' : "") + '></div>';
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
    '<div class="auto-form"><div class="auto-field"><label>Kilometraje actual</label><input id="auto-km-new" type="number" min="0" step="1" value="' + autoEsc(v.currentKm || 0) + '"></div>' +
    '<div class="auto-form-buttons"><button class="auto-action" onclick="autoCancelarForm()">Cancelar</button><button class="auto-action primary" onclick="autoGuardarKm()">Guardar km</button></div></div>';
}
function autoGuardarKm() {
  var v = autoVehiculo();
  var km = autoNum(document.getElementById("auto-km-new").value);
  if (!v || km < 0) { alert("Ingresá un kilometraje válido."); return; }
  if (km < (Number(v.currentKm)||0) && !window.confirm("El nuevo kilometraje es menor que el anterior. ¿Confirmás que es una corrección de lectura?")) return;
  v.currentKm = km; v.updatedAt = new Date().toISOString();
  AUTO_UI.form = "";
  save().then(function(){ showToast("Kilometraje actualizado."); autoRender(); });
}
function autoNuevoRegistro() {
  var v = autoVehiculo();
  if (!v || v.archived) { showToast("Seleccioná un vehículo activo."); return; }
  AUTO_UI.form = "record"; AUTO_UI.editingId = null; autoRender();
}
function autoEditarRegistro(id) {
  var r = autoData().records.find(function(x){return x.id === id;});
  if (!r) return;
  if (r.vehicleId !== (autoVehiculo() || {}).id) { alert("El registro pertenece a otro vehículo."); return; }
  AUTO_UI.form = "record"; AUTO_UI.editingId = id; autoRender();
}
function autoRenderRecordForm() {
  var host = document.getElementById("auto-content");
  var v = autoVehiculo();
  var r = AUTO_UI.editingId ? autoData().records.find(function(x){return x.id === AUTO_UI.editingId;}) : null;
  r = r || {};
  var category = r.category || "Motor";
  host.innerHTML = '<div class="auto-head"><div><div class="auto-title">' + (r.id ? "Editar mantenimiento" : "Registrar mantenimiento") +
    '</div><div class="auto-subtitle">' + autoEsc(autoVehicleLabel(v)) + ' · Los costos de Auto no se mezclan con los gastos de Moto o Delivery.</div></div></div>' +
    '<div class="auto-form"><div class="auto-form-grid">' +
    '<div class="auto-field"><label>Fecha del trabajo *</label><input id="auto-r-date" type="date" value="' + autoEsc(r.date || autoLocalDate()) + '"></div>' +
    '<div class="auto-field"><label>Kilometraje del trabajo *</label><input id="auto-r-km" type="number" min="0" step="1" value="' + autoEsc(r.km !== undefined ? r.km : v.currentKm || 0) + '"></div>' +
    '<div class="auto-field"><label>Categoría *</label><select id="auto-r-category" onchange="autoActualizarCatalogo()">' + autoCategoryOptions(category) + '</select></div>' +
    '<div class="auto-field"><label>Pieza o mantenimiento *</label><input id="auto-r-item" list="auto-items" maxlength="100" value="' + autoEsc(r.item) + '" placeholder="Elegí o escribí una pieza"><datalist id="auto-items">' +
    (AUTO_CATALOGO[category] || []).map(function(x){return '<option value="' + autoEsc(x) + '"></option>';}).join("") + '</datalist></div>' +
    '<div class="auto-field full"><label>Descripción del trabajo</label><textarea id="auto-r-description" maxlength="1000" placeholder="Qué se hizo, diagnóstico o detalle">' + autoEsc(r.description) + '</textarea></div>' +
    autoField("Marca del repuesto","auto-r-brand",r.partBrand,"Ej.: Bosch / Denso") +
    autoField("Modelo o referencia","auto-r-ref",r.partReference,"Código o referencia") +
    autoField("Cantidad","auto-r-qty",r.quantity || 1,"1","number") +
    autoField("Precio unitario del repuesto (Gs.)","auto-r-part",r.partCost || 0,"0","number") +
    autoField("Mano de obra (Gs.)","auto-r-labor",r.labor || 0,"0","number") +
    autoField("Otros gastos (Gs.)","auto-r-other",r.otherCost || 0,"0","number") +
    '<div class="auto-total-box"><span>Costo total calculado</span><strong id="auto-r-total">' + autoEsc(autoMoney(r.total || 0)) + '</strong></div>' +
    autoField("Taller o mecánico","auto-r-workshop",r.workshop,"Nombre del taller") +
    autoField("Próximo cambio por kilometraje","auto-r-next-km",r.nextKm || "","Km objetivo","number") +
    '<div class="auto-field"><label>Próxima revisión por fecha</label><input id="auto-r-next-date" type="date" value="' + autoEsc(r.nextDate) + '"></div>' +
    autoField("Garantía","auto-r-warranty",r.warranty,"Ej.: 3 meses / 5.000 km") +
    autoField("Factura / comprobante","auto-r-receipt",r.receipt,"N.º de factura o referencia") +
    '<div class="auto-field full"><label>Visita / orden de trabajo (opcional)</label><input id="auto-r-visit" maxlength="80" value="' + autoEsc(r.visit) + '" placeholder="Ej.: Orden 145 o visita del 18/11"></div>' +
    '<div class="auto-field full"><label>Observaciones</label><textarea id="auto-r-notes" maxlength="1500" placeholder="Notas adicionales">' + autoEsc(r.notes) + '</textarea></div>' +
    '</div><div class="auto-form-buttons"><button class="auto-action" onclick="autoCancelarForm()">Cancelar</button>' +
    '<button class="auto-action primary" onclick="autoGuardarRegistro()">Guardar trabajo</button></div>' +
    '<div class="auto-form-help" style="margin-top:10px">El intervalo del próximo cambio lo definís vos según el manual del vehículo o la indicación del mecánico. No se inventan intervalos.</div></div>';
  ["auto-r-qty","auto-r-part","auto-r-labor","auto-r-other"].forEach(function(id){
    var el = document.getElementById(id); if (el) el.addEventListener("input", autoCalcularTotal);
  });
  autoCalcularTotal();
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
  var nextKm = autoNum(document.getElementById("auto-r-next-km").value);
  var nextDate = document.getElementById("auto-r-next-date").value;
  if (!date || !category || !item || date > autoLocalDate() || km < 0 || partCost < 0 || labor < 0 || otherCost < 0) {
    alert("Completá la fecha (no futura), el kilometraje, la categoría, la pieza y verificá que los importes no sean negativos."); return;
  }
  if (nextKm && nextKm <= km) { alert("El próximo kilometraje debe ser mayor que el kilometraje de este trabajo."); return; }
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
    nextKm:nextKm || null, nextDate:nextDate || "",
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
  });
}
function autoCancelarForm() { AUTO_UI.form = ""; AUTO_UI.editingId = null; autoRender(); }
function autoEliminarRegistro(id) {
  var d = autoData();
  var r = d.records.find(function(x){return x.id === id;});
  if (!r) return;
  if (!window.confirm("¿Eliminar el registro de " + r.item + "? Esta acción no se puede deshacer.")) return;
  d.records = d.records.filter(function(x){return x.id !== id;});
  save().then(function(){showToast("Registro eliminado.");autoRender();});
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
  var f = AUTO_UI.filters;
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

// --- CONFIGURAÇÕES SUPABASE ---
const SUPABASE_URL = "https://ahknfgfinwbwczkgjfjf.supabase.co"; // <<< CORREÇÃO: URL base, sem /rest/v1/
const SUPABASE_KEY = "sb_publishable_uR9PBom78o08tJwco0Hksg_ul9qqUuR"; // <<< ATENÇÃO: Substitua pela sua chave real

const supabaseHeaders = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

async function apiUpsertUsers(users) {
  if (!users || users.length === 0) return;
  return fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: { ...supabaseHeaders, "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify(users)
  }).catch(err => console.error("Supabase Error:", err));
}

async function apiUpsertPunches(punches) {
  if (!punches || punches.length === 0) return;
  return fetch(`${SUPABASE_URL}/rest/v1/punches`, {
    method: 'POST',
    headers: { ...supabaseHeaders, "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify(punches)
  }).catch(err => console.error("Supabase Error:", err));
}

async function apiDeletePunch(punchId) {
  return fetch(`${SUPABASE_URL}/rest/v1/punches?id=eq.${punchId}`, {
    method: 'DELETE',
    headers: supabaseHeaders
  }).catch(err => console.error("Supabase Error:", err));
}
// ------------------------------

const STORAGE_KEY = "inova-ponto-browser-db-v2";
const SESSION_KEY = "inova-ponto-browser-session-v2";

const PUNCH_TYPES = [
  { value: "clock_in", label: "Entrada" },
  { value: "lunch_out", label: "Saída almoço" },
  { value: "lunch_in", label: "Retorno almoço" },
  { value: "clock_out", label: "Saída" },
];

const PUNCH_LABELS = Object.fromEntries(PUNCH_TYPES.map((item) => [item.value, item.label]));

const JOURNEY_TYPES = {
  integral: { label: "Integral" }, 
  "meio-periodo": { label: "Meio Período" }, 
};

function getExpectedPunches(journeyType) {
  if (journeyType === "meio-periodo") {
    return [
      { value: "clock_in", label: "Entrada" },
      { value: "clock_out", label: "Saída" },
    ];
  }
  return PUNCH_TYPES;
}

const WEEKDAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const MOTIVATIONAL_MESSAGES = [
  { text: "Excelência operacional começa quando disciplina e clareza caminham juntas.", author: "Visão institucional" },
  { text: "Processos elegantes reduzem ruído e ampliam confiança.", author: "Diretriz executiva" },
  { text: "Consistência diária é a forma mais silenciosa de liderança.", author: "Cultura de gestão" },
  { text: "Ambientes bem organizados favorecem decisões mais seguras.", author: "Mensagem do dia" },
  { text: "Sofisticação também está na simplicidade de uma rotina bem conduzida.", author: "Presença corporativa" },
  { text: "Resultados sustentáveis nascem de operações estáveis.", author: "Ritmo executivo" },
  { text: "Clareza no acompanhamento fortalece a confiança em toda a operação.", author: "Leitura estratégica" },
  { text: "Quando o padrão visual transmite ordem, a rotina acompanha.", author: "Painel institucional" },
];

const state = {
  db: createEmptyDatabase(),
  me: null,
  activeSection: "dashboardSection",
  selectedPunchDay: todayKey(),
  adjustmentFilters: null,
  reportFilters: null,
  report: null,
};

const dom = {
  portalEntry: document.getElementById("portalEntry"),
  loginScreen: document.getElementById("loginScreen"),
  appScreen: document.getElementById("appScreen"),
  loginForm: document.getElementById("loginForm"),
  logoutButton: document.getElementById("logoutButton"),
  sessionRole: document.getElementById("sessionRole"),
  sessionName: document.getElementById("sessionName"),
  clockBadge: document.getElementById("clockBadge"),
  storageBadge: document.getElementById("storageBadge"),
  navButtons: Array.from(document.querySelectorAll("[data-section]")),
  sections: Array.from(document.querySelectorAll(".section-block")),
  dashboardMetrics: document.getElementById("dashboardMetrics"),
  todayHighlight: document.getElementById("todayHighlight"),
  holidayGrid: document.getElementById("holidayGrid"),
  activityList: document.getElementById("activityList"),
  backupExportButton: document.getElementById("backupExportButton"),
  backupImportInput: document.getElementById("backupImportInput"),
  motivationMessage: document.getElementById("motivationMessage"),
  motivationAuthor: document.getElementById("motivationAuthor"),
  employeeForm: document.getElementById("employeeForm"),
  employeeList: document.getElementById("employeeList"),
  cancelEditButton: document.getElementById("cancelEditButton"),
  manualPunchForm: document.getElementById("manualPunchForm"),
  manualEmployee: document.getElementById("manualEmployee"),
  manualPunchType: document.getElementById("manualPunchType"),
  adjustmentFilterForm: document.getElementById("adjustmentFilterForm"),
  adjustmentEmployee: document.getElementById("adjustmentEmployee"),
  adjustmentSummary: document.getElementById("adjustmentSummary"),
  adjustmentList: document.getElementById("adjustmentList"),
  punchDayForm: document.getElementById("punchDayForm"),
  punchDayInput: document.getElementById("punchDayInput"),
  punchSummary: document.getElementById("punchSummary"),
  punchObservationInput: document.getElementById("punchObservationInput"),
  punchButtons: Array.from(document.querySelectorAll(".punch-btn")),
  todayPunchTable: document.getElementById("todayPunchTable"),
  profileForm: document.getElementById("profileForm"),
  reportForm: document.getElementById("reportForm"),
  reportEmployee: document.getElementById("reportEmployee"),
  reportSummary: document.getElementById("reportSummary"),
  reportTable: document.getElementById("reportTable"),
  toast: document.getElementById("toast"),
};

let isAppReady = false;

bootstrap();

async function bootstrap() {
  bindEvents(); // Garante que o evento de form (submit) seja capturado imediatamente
  try {
    state.db = await loadDatabase();
    await seedInitialData();
    renderBrandMessage();
    renderPunchTypeOptions();
    setInitialDates();
    restoreSession();
    injectStyles();
    updateClock();
    renderStorageBadge();
    setInterval(updateClock, 1000);
    refreshUi();
    isAppReady = true; // Libera o sistema após carregar os dados
  } catch (error) {
    console.error("Erro na inicialização:", error);
  }
}

function bindEvents() {
  dom.loginForm.addEventListener("submit", onLogin);
  dom.logoutButton.addEventListener("click", logout);
  dom.employeeForm.addEventListener("submit", onSaveEmployee);
  dom.cancelEditButton.addEventListener("click", resetEmployeeForm);
  dom.manualPunchForm.addEventListener("submit", onManualPunch);
  dom.adjustmentFilterForm.addEventListener("submit", onLoadAdjustments);
  dom.employeeList.addEventListener("click", onEmployeeListClick);
  dom.adjustmentList.addEventListener("click", onAdjustmentClick);
  dom.punchDayForm.addEventListener("submit", onPunchDaySubmit);
  dom.punchButtons.forEach((button) => button.addEventListener("click", () => onSelfPunch(button.dataset.type)));
  dom.profileForm.addEventListener("submit", onUpdateCredentials);
  dom.reportForm.addEventListener("submit", onGenerateReport);
  dom.navButtons.forEach((button) => button.addEventListener("click", () => showSection(button.dataset.section)));
  if (dom.backupExportButton) dom.backupExportButton.addEventListener("click", exportBackup);
  dom.backupImportInput.addEventListener("change", importBackup);
}

function refreshUi() {
  syncSessionUser();
  renderAuthState();
  renderStorageBadge();
  if (!state.me) return;
  populateEmployeeSelectors();
  renderDashboard();
  renderEmployeeList();
  renderPunchSection();
  renderProfileForm();
  renderAdjustmentsFromState();
  renderReportFromState();
}

function renderAuthState() {
  const authenticated = Boolean(state.me);
  dom.portalEntry.classList.toggle("hidden", authenticated);
  dom.loginScreen.classList.toggle("hidden", authenticated);
  dom.appScreen.classList.toggle("hidden", !authenticated);
  if (!authenticated) return;

  const isAdmin = state.me.role === "admin";
  dom.sessionRole.textContent = isAdmin ? "Gestão administrativa do ponto" : "Ambiente do colaborador";
  dom.sessionName.textContent = state.me.name;
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.classList.toggle("hidden", !isAdmin);
  });
  showSection(state.activeSection);
}

function renderBrandMessage() {
  if (!dom.motivationMessage || !dom.motivationAuthor) {
    return;
  }

  const index = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
  const message = MOTIVATIONAL_MESSAGES[index];
  dom.motivationMessage.textContent = message.text;
  dom.motivationAuthor.textContent = message.author;
}

function showSection(sectionId) {
  const allowedSection = canAccessSection(sectionId) ? sectionId : "dashboardSection";
  state.activeSection = allowedSection;
  dom.sections.forEach((section) => {
    section.classList.toggle("hidden", section.id !== allowedSection);
  });
  dom.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === allowedSection);
  });
}

function canAccessSection(sectionId) {
  if (!state.me) return false; // Não autenticado
  if (["employeesSection", "reportsSection"].includes(sectionId)) {
    return state.me.role === "admin";
  }
  return true;
}

function setInitialDates() {
  const today = todayKey();
  const monthRange = currentMonthRange();
  dom.punchDayInput.value = today;
  dom.manualPunchForm.elements.date.value = today;
  dom.adjustmentFilterForm.elements.date.value = today;
  dom.reportForm.elements.startDate.value = monthRange.start;
  dom.reportForm.elements.endDate.value = monthRange.end;
}

function renderPunchTypeOptions() {
  dom.manualPunchType.innerHTML = PUNCH_TYPES.map(
    (item) => `<option value="${item.value}">${item.label}</option>`,
  ).join("");
}

function renderDashboard() {
  renderDashboardMetrics();
  renderTodayHighlight();
  renderHolidayGrid();
  renderActivityList();
}

function renderDashboardMetrics() {
  const metrics = state.me.role === "admin" ? buildAdminMetrics() : buildEmployeeMetrics();
  dom.dashboardMetrics.innerHTML = metrics.map((metric) => `
    <article class="metric">
      <span class="metric-label">${metric.label}</span>
      <strong>${metric.value}</strong>
      <p>${metric.detail}</p>
    </article>
  `).join("");
}

function buildAdminMetrics() {
  const employees = getEmployees();
  const weekRange = currentWeekRange();
  const monthRange = currentMonthRange();
  let weekWorked = 0;
  let monthWorked = 0;
  let monthExtra = 0;
  let monthMissing = 0;

  employees.forEach((employee) => {
    const weekReport = buildReport(employee, weekRange.start, weekRange.end);
    const monthReport = buildReport(employee, monthRange.start, monthRange.end);
    weekWorked += weekReport.totalWorkedMinutes;
    monthWorked += monthReport.totalWorkedMinutes;
    monthExtra += monthReport.totalOvertimeMinutes;
    monthMissing += monthReport.totalMissingMinutes;
  });

  return [
    { label: "Colaboradores", value: String(employees.length), detail: employees.length ? "Equipe cadastrada neste navegador" : "Nenhum colaborador cadastrado" },
    { label: "Horas na semana", value: formatMinutesClock(weekWorked), detail: `${formatDate(weekRange.start)} a ${formatDate(weekRange.end)}` },
    { label: "Horas no mês", value: formatMinutesClock(monthWorked), detail: monthLabel(monthRange.start) },
    { label: "Saldo do mês", value: formatMinutesClock(monthExtra), detail: `Déficit ${formatMinutesClock(monthMissing)}` },
  ];
}

function buildEmployeeMetrics() {
  const weekRange = currentWeekRange();
  const monthRange = currentMonthRange();
  const todaySummary = summarizeDay(state.me, todayKey(), getPunchesForDay(state.me.id, todayKey()));
  const todayPunches = getPunchesForDay(state.me.id, todayKey());
  const expectedPunchesList = getExpectedPunches(state.me.journeyType);
  const nextPunchObj = expectedPunchesList[todayPunches.length];
  const nextType = nextPunchObj ? nextPunchObj.label : "Jornada concluída";
  const weekReport = buildReport(state.me, weekRange.start, weekRange.end);
  const monthReport = buildReport(state.me, monthRange.start, monthRange.end);

  return [
    { label: "Semana atual", value: formatMinutesClock(weekReport.totalWorkedMinutes), detail: `Extras ${formatMinutesClock(weekReport.totalOvertimeMinutes)}` },
    { label: "Mês atual", value: formatMinutesClock(monthReport.totalWorkedMinutes), detail: `Saldo ${formatMinutesClock(monthReport.totalOvertimeMinutes - monthReport.totalMissingMinutes)}` },
    { label: "Previsto hoje", value: formatMinutesClock(todaySummary.expectedMinutes), detail: todaySummary.holidayName || todaySummary.journeyDescription },
    { label: "Próxima ação", value: nextType, detail: `${todayPunches.length} batida(s) registrada(s) hoje` },
  ];
}

function renderTodayHighlight() {
  if (state.me.role === "admin") {
    const today = todayKey();
    const employees = getEmployees();
    const started = employees.filter((employee) => getPunchesForDay(employee.id, today).length > 0).length;
    const completed = employees.filter((employee) => getPunchesForDay(employee.id, today).some((punch) => punch.punchType === "clock_out")).length;
    const pending = Math.max(0, employees.length - completed);
    const latestPunch = [...state.db.punches]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .find((punch) => toDateKeyLocal(new Date(punch.timestamp)) === today);

    dom.todayHighlight.innerHTML = `
      <div class="metric-grid compact-metric-grid">
        <article class="metric mini-metric"><span class="metric-label">Iniciaram</span><strong>${started}</strong><p>Com pelo menos uma batida hoje</p></article>
        <article class="metric mini-metric"><span class="metric-label">Concluíram</span><strong>${completed}</strong><p>Com saída final registrada</p></article>
        <article class="metric mini-metric"><span class="metric-label">Pendentes</span><strong>${pending}</strong><p>Aguardando fechamento do dia</p></article>
      </div>
      <div class="hint-box top-gap">
        <strong>Última movimentação</strong>
        <p>${latestPunch ? describePunchActivity(latestPunch, true) : "Nenhum apontamento feito hoje."}</p>
      </div>
    `;
    return;
  }

  const today = todayKey();
  const punches = getPunchesForDay(state.me.id, today);
  const summary = summarizeDay(state.me, today, punches);
  const expectedPunchesList = getExpectedPunches(state.me.journeyType);
  const nextPunchObj = expectedPunchesList[punches.length];
  const nextType = nextPunchObj ? nextPunchObj.label : "Jornada concluída";

  dom.todayHighlight.innerHTML = `
    <div class="highlight-panel">
      <strong>${formatDate(today)}</strong>
      <p>${summary.holidayName || summary.journeyDescription}</p>
      <div class="metric-grid compact-metric-grid top-gap">
        <article class="metric mini-metric"><span class="metric-label">Trabalhado</span><strong>${formatMinutesClock(summary.workedMinutes)}</strong><p>Total calculado até agora</p></article>
        <article class="metric mini-metric"><span class="metric-label">Extras</span><strong>${formatMinutesClock(summary.overtimeMinutes)}</strong><p>Somente após cumprir o previsto</p></article>
        <article class="metric mini-metric"><span class="metric-label">Próxima ação</span><strong>${nextType}</strong><p>${punches.length < expectedPunchesList.length ? "Batida disponível para hoje" : "Jornada finalizada"}</p></article>
      </div>
    </div>
  `;
}

function renderHolidayGrid() {
  const holidays = upcomingHolidays(6);
  dom.holidayGrid.innerHTML = holidays.map((holiday) => `
    <article class="stack-card">
      <span class="metric-label">${formatDate(holiday.date)}</span>
      <strong>${holiday.name}</strong>
    </article>
  `).join("");
}

function renderActivityList() {
  const punches = state.me.role === "admin"
    ? [...state.db.punches]
    : state.db.punches.filter((item) => item.employeeId === state.me.id);
  const recent = punches.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);
  if (!recent.length) {
    dom.activityList.innerHTML = "<p>Nenhum apontamento registrado ainda.</p>";
    return;
  }
  dom.activityList.innerHTML = recent.map((punch) => `
    <article class="activity-item">
      <div>
        <strong>${describePunchActivity(punch, state.me.role === "admin")}</strong>
        <p>${formatDateTime(punch.timestamp)}</p>
      </div>
      <span class="tag">${formatPunchSource(punch.source)}</span>
    </article>
  `).join("");
}

function renderEmployeeList() {
  if (!state.me || state.me.role !== "admin") return;
  const employees = getEmployees();

  if (!employees.length) {
    dom.employeeList.innerHTML = "<p>Nenhum colaborador cadastrado.</p>";
    return;
  }

  dom.employeeList.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Login</th>
            <th>Jornada</th>
            <th>Setor</th>
            <th>Carga Horária</th>
            <th>Hoje</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${employees.map((employee) => `
            <tr>
              <td><strong>${employee.name}</strong></td>
              <td>${employee.username}</td>
              <td>${JOURNEY_TYPES[employee.journeyType] ? JOURNEY_TYPES[employee.journeyType].label : "N/A"}</td>
              <td>${employee.department || "Não informado"}</td>
              <td>${employee.workSchedule || "-"}</td>
              <td>${getPunchesForDay(employee.id, todayKey()).length} batida(s)</td>
              <td class="row-actions">
                <button class="small-btn" type="button" data-edit-id="${employee.id}">Editar</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function populateEmployeeSelectors() {
  const employees = getEmployees();
  const options = employees.length
    ? employees.map((employee) => `<option value="${employee.id}">${employee.name}</option>`).join("")
    : '<option value="">Nenhum colaborador cadastrado</option>';

  [dom.manualEmployee, dom.adjustmentEmployee, dom.reportEmployee].forEach((select) => {
    select.innerHTML = options;
    select.disabled = employees.length === 0;
  });

  const disableForms = employees.length === 0;
  dom.manualPunchForm.querySelector('button[type="submit"]').disabled = disableForms;
  dom.adjustmentFilterForm.querySelector('button[type="submit"]').disabled = disableForms;
  dom.reportForm.querySelector('button[type="submit"]').disabled = disableForms;

  if (!disableForms) {
    const firstEmployeeId = employees[0].id;
    dom.manualEmployee.value = dom.manualEmployee.value || firstEmployeeId;
    dom.adjustmentEmployee.value = state.adjustmentFilters?.employeeId || dom.adjustmentEmployee.value || firstEmployeeId;
    dom.reportEmployee.value = state.reportFilters?.employeeId || dom.reportEmployee.value || firstEmployeeId;
  }
}

function renderPunchSection() {
  if (!state.me) return;

  const dateKey = state.selectedPunchDay || todayKey();
  const punches = getPunchesForDay(state.me.id, dateKey);
  const summary = summarizeDay(state.me, dateKey, punches);
  const isToday = dateKey === todayKey();
  const expectedPunchesList = getExpectedPunches(state.me.journeyType);
  const nextPunch = expectedPunchesList[punches.length];

  dom.punchDayInput.value = dateKey;
  dom.punchSummary.innerHTML = `
    <div class="metric-grid compact-metric-grid">
      <article class="metric mini-metric"><span class="metric-label">Data</span><strong>${formatDate(dateKey)}</strong><p>${summary.holidayName || summary.journeyDescription}</p></article>
      <article class="metric mini-metric"><span class="metric-label">Previsto</span><strong>${formatMinutesClock(summary.expectedMinutes)}</strong><p>${summary.isWorkDay ? "Dia de trabalho" : "Dia de folga"}</p></article>
      <article class="metric mini-metric"><span class="metric-label">Trabalhado</span><strong>${formatMinutesClock(summary.workedMinutes)}</strong><p>Saldo ${formatMinutesClock(summary.overtimeMinutes - summary.missingMinutes)}</p></article>
      <article class="metric mini-metric"><span class="metric-label">Próxima ação</span><strong>${nextPunch ? nextPunch.label : "Jornada concluída"}</strong><p>${isToday ? "Batidas disponíveis apenas no dia atual" : "Visualização histórica"}</p></article>
    </div>
  `;

  const allowedValues = expectedPunchesList.map(p => p.value);
  dom.punchButtons.forEach((button) => {
    button.style.display = allowedValues.includes(button.dataset.type) ? "" : "none";
    button.disabled = !isToday || !nextPunch || button.dataset.type !== nextPunch.value;
  });
  dom.punchObservationInput.disabled = !isToday || !nextPunch;

  renderPunchTable(dom.todayPunchTable, punches, false);
}

function renderAdjustmentsFromState() {
  if (!state.me || state.me.role !== "admin") {
    dom.adjustmentSummary.innerHTML = "";
    dom.adjustmentList.innerHTML = "";
    return;
  }
  if (!state.adjustmentFilters) {
    dom.adjustmentSummary.innerHTML = "";
    dom.adjustmentList.innerHTML = "";
    return;
  }

  const employee = findUserById(state.adjustmentFilters.employeeId);
  if (!employee) {
    dom.adjustmentSummary.innerHTML = "<p>Colaborador não encontrado.</p>";
    dom.adjustmentList.innerHTML = "";
    return;
  }

  dom.adjustmentEmployee.value = state.adjustmentFilters.employeeId;
  dom.adjustmentFilterForm.elements.date.value = state.adjustmentFilters.date;
  const punches = getPunchesForDay(employee.id, state.adjustmentFilters.date);
  dom.adjustmentSummary.innerHTML = `
    <article class="metric">
      <span class="metric-label">${employee.name}</span>
      <strong>${formatDate(state.adjustmentFilters.date)}</strong>
      <p>${punches.length} apontamento(s) encontrado(s)</p>
    </article>
  `;
  renderPunchTable(dom.adjustmentList, punches, true);
}

function renderReportFromState() {
  if (!state.me || state.me.role !== "admin" || !state.reportFilters) {
    dom.reportSummary.innerHTML = "";
    dom.reportTable.innerHTML = "";
    state.report = null;
    return;
  }

  const employee = findUserById(state.reportFilters.employeeId);
  if (!employee) {
    dom.reportSummary.innerHTML = "<p>Colaborador não encontrado.</p>";
    dom.reportTable.innerHTML = "";
    state.report = null;
    return;
  }

  dom.reportEmployee.value = state.reportFilters.employeeId;
  dom.reportForm.elements.startDate.value = state.reportFilters.startDate;
  dom.reportForm.elements.endDate.value = state.reportFilters.endDate;
  state.report = buildReport(employee, state.reportFilters.startDate, state.reportFilters.endDate);
  dom.reportSummary.innerHTML = `
    <div class="metric-grid">
      <article class="metric"><span class="metric-label">Previsto</span><strong>${formatMinutesClock(state.report.expectedMinutes)}</strong></article>
      <article class="metric"><span class="metric-label">Trabalhado</span><strong>${formatMinutesClock(state.report.totalWorkedMinutes)}</strong></article>
      <article class="metric"><span class="metric-label">Extras</span><strong>${formatMinutesClock(state.report.totalOvertimeMinutes)}</strong></article>
      <article class="metric"><span class="metric-label">Déficit</span><strong>${formatMinutesClock(state.report.totalMissingMinutes)}</strong></article>
    </div>
    <div class="toolbar start top-gap">
      <button id="downloadReportButton" class="primary-btn" type="button">Baixar CSV</button>
    </div>
  `;

  document.getElementById("downloadReportButton").addEventListener("click", downloadReportCsv);

  dom.reportTable.innerHTML = `
    <div class="table-wrap top-gap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Dia</th>
            <th>Tipo</th>
            <th>Entrada</th>
            <th>Saída almoço</th>
            <th>Retorno almoço</th>
            <th>Saída</th>
            <th>Previsto</th>
            <th>Trabalhado</th>
            <th>Extras</th>
            <th>Déficit</th>
          </tr>
        </thead>
        <tbody>
          ${state.report.days.map((day) => `
            <tr class="day-status-${day.status}">
              <td>${formatDate(day.date)}</td>
              <td>${day.weekDay}</td>
              <td><span class="tag">${day.holidayName || (day.isWorkDay ? "Dia de trabalho" : "Folga")}</span></td>
              <td>${day.times.clock_in || "-"}</td>
              <td>${day.times.lunch_out || "-"}</td>
              <td>${day.times.lunch_in || "-"}</td>
              <td>${day.times.clock_out || "-"}</td>
              <td>${formatMinutesClock(day.expectedMinutes)}</td>
              <td>${formatMinutesClock(day.workedMinutes)}</td>
              <td>${formatMinutesClock(day.overtimeMinutes)}</td>
              <td>${formatMinutesClock(day.missingMinutes)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderProfileForm() {
  dom.profileForm.elements.username.value = state.me.username;
}

function renderPunchTable(container, punches, allowDelete) {
  if (!punches.length) {
    container.innerHTML = "<p>Nenhum apontamento encontrado.</p>";
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Horário e observação</th>
            <th>Origem</th>
            ${allowDelete ? "<th>Ações</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${punches.map((punch) => `
            <tr>
              <td>${PUNCH_LABELS[punch.punchType] || punch.punchType}</td>
              <td>
                <div class="time-note">
                  <strong>${formatDateTime(punch.timestamp)}</strong>
                  ${punch.notes ? `<span>${punch.notes}</span>` : '<span class="muted-inline">Sem observação.</span>'}
                </div>
              </td>
              <td>${formatPunchSource(punch.source)}</td>
              ${allowDelete ? `<td><button class="small-btn small-danger" type="button" data-delete-punch="${punch.id}">Reverter</button></td>` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function onLogin(event) {
  event.preventDefault();

  if (!isAppReady) {
    toast("Conectando ao banco de dados, aguarde um instante...");
    return;
  }

  const formData = new FormData(dom.loginForm);
  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") || "");
  const user = state.db.users.find((item) => item.username === username && item.isActive);

  if (!user || user.password !== password) {
    toast("Login ou senha inválidos.");
    return;
  }

  state.me = user;
  localStorage.setItem(SESSION_KEY, user.id);
  dom.loginForm.reset();
  state.activeSection = "dashboardSection";
  state.selectedPunchDay = todayKey();
  refreshUi();
  toast("Acesso realizado com sucesso.");
}

function logout() {
  state.me = null;
  state.report = null;
  state.reportFilters = null;
  state.adjustmentFilters = null;
  state.activeSection = "dashboardSection";
  localStorage.removeItem(SESSION_KEY);
  refreshUi();
}

function onSaveEmployee(event) {
  event.preventDefault();

  try {
    const formData = new FormData(dom.employeeForm);
    const employeeId = String(formData.get("employeeId") || "");
    const name = String(formData.get("name") || "").trim();
    const username = normalizeUsername(formData.get("username"));
    const password = String(formData.get("password") || "");
    const journeyType = String(formData.get("journeyType") || "");
    const department = String(formData.get("department") || "").trim();
    const workSchedule = String(formData.get("workSchedule") || "").trim();
    const expectedHoursWeekly = Array.from({ length: 7 }, (_, i) => Number(formData.get(`expectedHours${i}`)) || 0);

    if (!name) throw new Error("Informe o nome do colaborador.");
    if (!username) throw new Error("Informe o login do colaborador.");
    if (!JOURNEY_TYPES[journeyType]) throw new Error("Selecione um tipo de jornada válido.");

    ensureUniqueUsername(username, employeeId || null);

    let userToSave = null;
    if (employeeId) {
      const employee = findUserById(employeeId);
      if (!employee || employee.role !== "employee") throw new Error("Colaborador não encontrado.");

      employee.name = name;
      employee.username = username;
      employee.journeyType = journeyType;
      employee.department = department;
      employee.workSchedule = workSchedule;
      employee.expectedHoursWeekly = expectedHoursWeekly;
      employee.updatedAt = nowIso();

      if (password) {
        if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
        employee.password = password;
      }
      userToSave = employee;

      toast("Colaborador atualizado.");
    } else {
      if (password.length < 6) throw new Error("Informe uma senha inicial com pelo menos 6 caracteres.");
      const newUser = {
        id: makeId(),
        name,
        username,
        password,
        role: "employee",
        journeyType,
        department,
        workSchedule,
        expectedHoursWeekly,
        isActive: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.db.users.push(newUser);
      userToSave = newUser;
      toast("Colaborador cadastrado.");
    }

    await apiUpsertUsers([userToSave]);
    persistDatabase();
    resetEmployeeForm();
    refreshUi();
    showSection("employeesSection");
  } catch (error) {
    toast(error.message);
  }
}

function onEmployeeListClick(event) {
  const button = event.target.closest("[data-edit-id]");
  if (!button) return;

  const employee = findUserById(button.dataset.editId);
  if (!employee) {
    toast("Colaborador não encontrado.");
    return;
  }

  dom.employeeForm.elements.employeeId.value = employee.id;
  dom.employeeForm.elements.name.value = employee.name;
  dom.employeeForm.elements.username.value = employee.username;
  dom.employeeForm.elements.password.value = "";
  dom.employeeForm.elements.journeyType.value = employee.journeyType;
  dom.employeeForm.elements.department.value = employee.department;
  if (dom.employeeForm.elements.workSchedule) dom.employeeForm.elements.workSchedule.value = employee.workSchedule;
  
  const fallbackHours = employee.expectedHours || (employee.journeyType === "meio-periodo" ? 4 : 8);
  for (let i = 0; i < 7; i++) {
    if (dom.employeeForm.elements[`expectedHours${i}`]) {
      dom.employeeForm.elements[`expectedHours${i}`].value = employee.expectedHoursWeekly 
        ? employee.expectedHoursWeekly[i] 
        : (i === 0 || i === 6 ? 0 : fallbackHours);
    }
  }
  showSection("employeesSection");
}

function resetEmployeeForm() {
  dom.employeeForm.reset();
  dom.employeeForm.elements.employeeId.value = "";
  dom.employeeForm.elements.journeyType.value = "integral";
  if (dom.employeeForm.elements.workSchedule) dom.employeeForm.elements.workSchedule.value = "";
  for (let i = 0; i < 7; i++) {
    if (dom.employeeForm.elements[`expectedHours${i}`]) {
      dom.employeeForm.elements[`expectedHours${i}`].value = (i === 0 || i === 6) ? 0 : 8;
    }
  }
}

async function onManualPunch(event) {
  event.preventDefault();

  try {
    const formData = new FormData(dom.manualPunchForm);
    const employeeId = String(formData.get("employeeId") || "");
    const date = String(formData.get("date") || "");
    const time = String(formData.get("time") || "");
    const punchType = String(formData.get("punchType") || "");
    const employee = findUserById(employeeId);

    if (!employee || employee.role !== "employee") throw new Error("Colaborador não encontrado.");
    if (!date || !time) throw new Error("Informe data e hora do apontamento.");

    await addPunch(
      {
        employeeId,
        punchType,
        timestamp: localDateTimeToIso(date, time),
        source: "admin",
      },
      { enforceSequence: false },
    );

    dom.manualPunchForm.elements.time.value = "";
    refreshUi();
    toast("Apontamento manual inserido.");
  } catch (error) {
    toast(error.message);
  }
}

function onLoadAdjustments(event) {
  event.preventDefault();
  const formData = new FormData(dom.adjustmentFilterForm);
  state.adjustmentFilters = {
    employeeId: String(formData.get("employeeId") || ""),
    date: String(formData.get("date") || ""),
  };
  renderAdjustmentsFromState();
}

async function onAdjustmentClick(event) {
  const button = event.target.closest("[data-delete-punch]");
  if (!button) return;
  if (!window.confirm("Deseja realmente reverter este apontamento?")) return;

  const before = state.db.punches.length;
  state.db.punches = state.db.punches.filter((item) => item.id !== button.dataset.deletePunch);

  if (before === state.db.punches.length) {
    toast("Apontamento não encontrado.");
    return;
  }

  await apiDeletePunch(button.dataset.deletePunch);
  persistDatabase();
  refreshUi();
  toast("Apontamento revertido.");
}

function onPunchDaySubmit(event) {
  event.preventDefault();
  const date = String(new FormData(dom.punchDayForm).get("date") || "");
  if (!date) {
    toast("Informe a data para consulta.");
    return;
  }
  state.selectedPunchDay = date;
  renderPunchSection();
}

async function onSelfPunch(type) {
  if (!state.me) return;
  if (state.selectedPunchDay !== todayKey()) {
    toast("As batidas automáticas só podem ser feitas na data de hoje.");
    return;
  }

  try {
    const notes = String(dom.punchObservationInput.value || "").trim();
    await addPunch(
      {
        employeeId: state.me.id,
        punchType: type,
        timestamp: nowIso(),
        source: "self",
        notes,
      },
      { enforceSequence: true },
    );

    dom.punchObservationInput.value = "";
    refreshUi();
    showSection("punchSection");
    toast("Ponto registrado.");
  } catch (error) {
    toast(error.message);
  }
}

async function onUpdateCredentials(event) {
  event.preventDefault();

  try {
    const formData = new FormData(dom.profileForm);
    const username = normalizeUsername(formData.get("username"));
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");

    if (!username) throw new Error("Informe o novo login.");
    if (state.me.password !== currentPassword) throw new Error("Senha atual inválida.");
    if (newPassword.length < 6) throw new Error("A nova senha deve ter pelo menos 6 caracteres.");

    ensureUniqueUsername(username, state.me.id);
    state.me.username = username;
    state.me.password = newPassword;
    state.me.updatedAt = nowIso();
    await apiUpsertUsers([state.me]);
    persistDatabase();
    refreshUi();
    dom.profileForm.elements.currentPassword.value = "";
    dom.profileForm.elements.newPassword.value = "";
    toast("Credenciais atualizadas.");
  } catch (error) {
    toast(error.message);
  }
}

function onGenerateReport(event) {
  event.preventDefault();

  try {
    const formData = new FormData(dom.reportForm);
    const employeeId = String(formData.get("employeeId") || "");
    const startDate = String(formData.get("startDate") || "");
    const endDate = String(formData.get("endDate") || "");

    if (!employeeId) throw new Error("Selecione um colaborador.");
    if (!startDate || !endDate) throw new Error("Informe o período do relatório.");
    if (startDate > endDate) throw new Error("A data inicial não pode ser maior que a final.");

    state.reportFilters = { employeeId, startDate, endDate };
    renderReportFromState();
  } catch (error) {
    toast(error.message);
  }
}

function exportBackup() {
  const backup = { ...state.db, exportedAt: nowIso() };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `backup-cartao-ponto-${todayKey()}.json`);
  toast("Backup exportado.");
}

function importBackup(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  if (!window.confirm("Importar um backup substituirá os dados atuais deste navegador. Deseja continuar?")) {
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => { // CORREÇÃO: Adicionado async para permitir await
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      state.db = normalizeDatabase(parsed);
      await seedInitialData();
      await apiUpsertUsers(state.db.users);
      await apiUpsertPunches(state.db.punches);
      persistDatabase();
      restoreSession();
      refreshUi();
      toast("Backup importado com sucesso.");
    } catch {
      toast("Não foi possível importar o backup.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

function downloadReportCsv() {
  if (!state.report) {
    toast("Gere um relatório antes de exportar.");
    return;
  }

  const rows = [
    ["Relatório de Cartão Ponto"],
    [],
    ["Colaborador", state.report.employee.name],
    ["Período", `${formatDate(state.report.startDate)} a ${formatDate(state.report.endDate)}`],
  ["Jornada", JOURNEY_TYPES[state.report.employee.journeyType] ? JOURNEY_TYPES[state.report.employee.journeyType].label : "N/A"],
    ["Total Previsto", formatMinutesClock(state.report.expectedMinutes)],
    ["Trabalhado", formatMinutesClock(state.report.totalWorkedMinutes)],
    ["Horas extras", formatMinutesClock(state.report.totalOvertimeMinutes)],
    ["Déficit", formatMinutesClock(state.report.totalMissingMinutes)],
    [],
    ["Data", "Dia", "Tipo", "Entrada", "Saída almoço", "Retorno almoço", "Saída", "Previsto", "Trabalhado", "Extras", "Déficit"],
    ...state.report.days.map((day) => [
      formatDate(day.date),
      day.weekDay,
      day.holidayName || (day.isWorkDay ? "Dia de trabalho" : "Folga"),
      day.times.clock_in || "-",
      day.times.lunch_out || "-",
      day.times.lunch_in || "-",
      day.times.clock_out || "-",
      formatMinutesClock(day.expectedMinutes),
      formatMinutesClock(day.workedMinutes),
      formatMinutesClock(day.overtimeMinutes),
      formatMinutesClock(day.missingMinutes),
    ]),
  ];

  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(";")).join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const fileName = `relatorio-${slugify(state.report.employee.name)}-${state.report.startDate}-${state.report.endDate}.csv`;
  downloadBlob(blob, fileName);
  toast("Relatório exportado em CSV.");
}

function buildReport(employee, startDate, endDate) {
  const punches = getPunchesForRange(employee.id, startDate, endDate);
  const grouped = groupPunchesByDay(punches);
  const days = enumerateDates(startDate, endDate).map((dateKey) => summarizeDay(employee, dateKey, grouped.get(dateKey) || []));

  return {
    employee,
    startDate,
    endDate,
    expectedMinutes: days.reduce((total, day) => total + day.expectedMinutes, 0),
    totalWorkedMinutes: days.reduce((total, day) => total + day.workedMinutes, 0),
    totalOvertimeMinutes: days.reduce((total, day) => total + day.overtimeMinutes, 0),
    totalMissingMinutes: days.reduce((total, day) => total + day.missingMinutes, 0),
    days,
  };
}

function summarizeDay(employee, dateKey, punches) {
  const holiday = holidayName(dateKey);
  const date = parseDateKey(dateKey);
  const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
  const expectedHoursForDay = employee.expectedHoursWeekly ? employee.expectedHoursWeekly[dayOfWeek] : (dayOfWeek === 0 || dayOfWeek === 6 ? 0 : (employee.expectedHours || (employee.journeyType === "meio-periodo" ? 4 : 8)));
  const baseExpectedMinutes = expectedHoursForDay * 60;
  const isWorkDay = !holiday && baseExpectedMinutes > 0;
  const journey = JOURNEY_TYPES[employee.journeyType];
  const expectedMinutes = holiday ? 0 : baseExpectedMinutes;

  const sortedPunches = [...punches].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const byType = {};
  sortedPunches.forEach((punch) => {
    byType[punch.punchType] = punch;
  });

  let workedMinutes = 0;
  if (byType.clock_in && byType.clock_out) {
    workedMinutes = diffMinutes(new Date(byType.clock_in.timestamp), new Date(byType.clock_out.timestamp));
    if (byType.lunch_out && byType.lunch_in) {
      workedMinutes -= diffMinutes(new Date(byType.lunch_out.timestamp), new Date(byType.lunch_in.timestamp));
    }
    workedMinutes = Math.max(0, workedMinutes);
  }

  const overtimeMinutes = holiday || !isWorkDay ? workedMinutes : Math.max(0, workedMinutes - expectedMinutes);
  const balance = workedMinutes - expectedMinutes;
  const missingMinutes = isWorkDay ? Math.max(0, expectedMinutes - workedMinutes) : 0;
  const times = {};
  sortedPunches.forEach((punch) => {
    times[punch.punchType] = formatTime(new Date(punch.timestamp));
  });

  let status = "default";
  if (isWorkDay) {
    if (balance >= 0) status = "complete";
    else if (workedMinutes > 0) status = "incomplete";
    else if (dateKey < todayKey()) status = "missing";
  }

  return {
    date: dateKey,
    weekDay: WEEKDAY_NAMES[date.getDay()],
    holidayName: holiday,
    isWorkDay,
    journeyDescription: journey ? (employee.workSchedule ? `${journey.label} (${employee.workSchedule})` : journey.label) : "Jornada não definida",
    expectedMinutes,
    workedMinutes,
    status,
    overtimeMinutes,
    missingMinutes,
    times,
  };
}

async function addPunch(payload, options = { enforceSequence: false }) {
  const employee = findUserById(payload.employeeId);
  if (!employee) throw new Error("Usuário não encontrado.");
  if (!PUNCH_LABELS[payload.punchType]) throw new Error("Tipo de batida inválido.");

  const dateKey = toDateKeyLocal(new Date(payload.timestamp));
  const punches = getPunchesForDay(payload.employeeId, dateKey);
  const expectedPunchesList = getExpectedPunches(employee.journeyType);

  if (punches.length >= expectedPunchesList.length) {
    throw new Error(`Este dia já possui o limite de batidas registradas (${expectedPunchesList.length}).`);
  }
  if (punches.some((item) => item.punchType === payload.punchType)) {
    throw new Error(`Já existe uma batida do tipo ${PUNCH_LABELS[payload.punchType]} nesta data.`);
  }

  if (options.enforceSequence) {
    const expected = expectedPunchesList[punches.length]?.value;
    if (payload.punchType !== expected) {
      const nextLabel = expectedPunchesList[punches.length]?.label || "nenhuma";
      throw new Error(`Sequência inválida. Próxima batida esperada: ${nextLabel}.`);
    }
  }

  const newPunch = {
    id: makeId(),
    employeeId: payload.employeeId,
    punchType: payload.punchType,
    timestamp: payload.timestamp,
    source: payload.source || "self",
    notes: payload.notes || "",
    createdAt: nowIso(),
  };
  state.db.punches.push(newPunch);

  await apiUpsertPunches([newPunch]);
  persistDatabase();
}

function getEmployees() {
  return state.db.users
    .filter((user) => user.role === "employee" && user.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function getPunchesForDay(employeeId, dateKey) {
  return state.db.punches
    .filter((punch) => punch.employeeId === employeeId && toDateKeyLocal(new Date(punch.timestamp)) === dateKey)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function getPunchesForRange(employeeId, startDate, endDate) {
  return state.db.punches
    .filter((punch) => {
      const dateKey = toDateKeyLocal(new Date(punch.timestamp));
      return punch.employeeId === employeeId && dateKey >= startDate && dateKey <= endDate;
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function groupPunchesByDay(punches) {
  const grouped = new Map();
  punches.forEach((punch) => {
    const dateKey = toDateKeyLocal(new Date(punch.timestamp));
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey).push(punch);
  });
  return grouped;
}

function ensureUniqueUsername(username, currentUserId = null) {
  const exists = state.db.users.some((user) => user.username === username && user.id !== currentUserId);
  if (exists) throw new Error("Este login já está em uso.");
}

/**
 * Popula o banco de dados com dados iniciais se estiver vazio.
 * Cria um administrador, 4 colaboradores de exemplo e registros de ponto simulados.
 */
async function seedInitialData() {
  if (state.db.users.length > 0 || state.db.punches.length > 0) {
    return; // O banco de dados já tem dados, não faz nada.
  }

  const now = new Date();
  const adminId = makeId();
  const adminUser = {
      id: adminId,
      name: "Administrador",
      username: "admin",
      password: "123456",
      role: "admin",
      journeyType: "integral",
      department: "Gestão",
      expectedHoursWeekly: [0, 8, 8, 8, 8, 8, 0],
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
  };
  state.db.users = [adminUser];

  state.db.punches = [];

  await apiUpsertUsers([adminUser]);
  persistDatabase();
}

function restoreSession() {
  const userId = localStorage.getItem(SESSION_KEY);
  state.me = userId ? findUserById(userId) : null;
  if (!state.me) localStorage.removeItem(SESSION_KEY);
}

function syncSessionUser() {
  if (!state.me) return;
  const freshUser = findUserById(state.me.id);
  if (!freshUser) {
    logout();
    return;
  }
  state.me = freshUser;
}

function renderStorageBadge() {
  dom.storageBadge.textContent = `${state.db.users.length} usuário(s) • ${state.db.punches.length} registro(s)`;
}

function updateClock() {
  dom.clockBadge.textContent = new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

async function loadDatabase() {
  try {
    const [usersRes, punchesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, { headers: supabaseHeaders }),
      fetch(`${SUPABASE_URL}/rest/v1/punches?select=*`, { headers: supabaseHeaders })
    ]);
    if (!usersRes.ok || !punchesRes.ok) {
      throw new Error(`Falha na conexão: ${usersRes.status} ${usersRes.statusText}`);
    }
    
    const users = await usersRes.json();
    const punches = await punchesRes.json();
    return normalizeDatabase({ users, punches });
  } catch (error) {
    console.error("Falha na nuvem, lendo cache local:", error);
    toast(`Falha na conexão: ${error.message}`);
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeDatabase(JSON.parse(raw)) : createEmptyDatabase();
  }
}

function normalizeDatabase(data) {
  const database = createEmptyDatabase();
  if (!data || typeof data !== "object") return database;

  database.users = Array.isArray(data.users) ? data.users.map(normalizeUser).filter(Boolean) : [];
  database.punches = Array.isArray(data.punches) ? data.punches.map(normalizePunch).filter(Boolean) : [];
  database.updatedAt = typeof data.updatedAt === "string" ? data.updatedAt : nowIso();
  return database;
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return null;
  const username = normalizeUsername(user.username || user.login || "");
  if (!username) return null;

  return {
    id: String(user.id || makeId()),
    name: String(user.name || "Usuário"),
    username,
    password: String(user.password || ""),
    role: ["admin", "employee"].includes(user.role) ? user.role : "employee",
    journeyType: ["integral", "meio-periodo"].includes(user.journeyType) ? user.journeyType : "integral",
    department: String(user.department || ""),
    workSchedule: String(user.workSchedule || ""),
    expectedHoursWeekly: Array.isArray(user.expectedHoursWeekly) ? user.expectedHoursWeekly.map(Number) : 
      (user.expectedHours !== undefined 
        ? [0, Number(user.expectedHours), Number(user.expectedHours), Number(user.expectedHours), Number(user.expectedHours), Number(user.expectedHours), 0] 
        : (user.journeyType === "meio-periodo" ? [0, 4, 4, 4, 4, 4, 0] : [0, 8, 8, 8, 8, 8, 0])
      ),
    isActive: typeof user.isActive === "boolean" ? user.isActive : true,
    createdAt: String(user.createdAt || user.created_at || nowIso()),
    updatedAt: String(user.updatedAt || user.updated_at || nowIso()),
  };
}

function normalizePunch(punch) {
  if (!punch || typeof punch !== "object") return null;
  if (!punch.employeeId && !punch.employee_id) return null;

  return {
    id: String(punch.id || makeId()),
    employeeId: String(punch.employeeId || punch.employee_id),
    punchType: String(punch.punchType || punch.punch_type || ""),
    timestamp: String(punch.timestamp || nowIso()),
    source: String(punch.source || "self"),
    notes: String(punch.notes || ""),
    createdAt: String(punch.createdAt || punch.created_at || nowIso()),
  };
}

function createEmptyDatabase() {
  return { version: 2, users: [], punches: [], updatedAt: nowIso() };
}

function persistDatabase() {
  state.db.updatedAt = nowIso();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.db));
  renderStorageBadge();
}

function findUserById(userId) {
  return state.db.users.find((user) => user.id === userId) || null;
}

function upcomingHolidays(limit = 6) {
  const today = todayKey();
  const currentYear = parseDateKey(today).getFullYear();
  const items = [...brazilianHolidays(currentYear), ...brazilianHolidays(currentYear + 1)];
  return items.filter((holiday) => holiday.date >= today).slice(0, limit);
}

function brazilianHolidays(year) {
  const easter = calculateEaster(year);
  return [
    { date: toDateKeyLocal(new Date(year, 0, 1, 12)), name: "Confraternização Universal" },
    { date: toDateKeyLocal(addDays(easter, -47)), name: "Carnaval" },
    { date: toDateKeyLocal(addDays(easter, -2)), name: "Sexta-feira Santa" },
    { date: toDateKeyLocal(new Date(year, 3, 21, 12)), name: "Tiradentes" },
    { date: toDateKeyLocal(new Date(year, 4, 1, 12)), name: "Dia do Trabalho" },
    { date: toDateKeyLocal(addDays(easter, 60)), name: "Corpus Christi" },
    { date: toDateKeyLocal(new Date(year, 8, 7, 12)), name: "Independência do Brasil" },
    { date: toDateKeyLocal(new Date(year, 9, 12, 12)), name: "Nossa Senhora Aparecida" },
    { date: toDateKeyLocal(new Date(year, 10, 2, 12)), name: "Finados" },
    { date: toDateKeyLocal(new Date(year, 10, 15, 12)), name: "Proclamação da República" },
    { date: toDateKeyLocal(new Date(year, 10, 20, 12)), name: "Dia da Consciência Negra" },
    { date: toDateKeyLocal(new Date(year, 11, 25, 12)), name: "Natal" },
  ].sort((a, b) => a.date.localeCompare(b.date));
}

function holidayName(dateKey) {
  const year = parseDateKey(dateKey).getFullYear();
  const holiday = brazilianHolidays(year).find((holiday) => holiday.date === dateKey);
  return holiday ? holiday.name : "";
}

function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day, 12);
}

function enumerateDates(startDate, endDate) {
  const dates = [];
  let current = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  while (current <= end) {
    dates.push(toDateKeyLocal(current));
    current = addDays(current, 1);
  }

  return dates;
}

function currentWeekRange() {
  const today = parseDateKey(todayKey());
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = addDays(today, diff);
  const end = addDays(start, 6);
  return { start: toDateKeyLocal(start), end: toDateKeyLocal(end) };
}

function diffMinutes(start, end) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function localDateTimeToIso(dateKey, timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = parseDateKey(dateKey);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value).split(":").map(Number);
  return hours * 60 + minutes;
}

function currentMonthRange() {
  const today = parseDateKey(todayKey());
  const start = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12);
  return { start: toDateKeyLocal(start), end: toDateKeyLocal(end) };
}

function monthLabel(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("pt-BR");
}

function formatTime(date) {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMinutesClock(totalMinutes) {
  const safe = Math.max(0, Math.round(totalMinutes || 0));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatPunchSource(source) {
  return source === "admin" ? "Ajuste manual" : "Registro próprio";
}

function describePunchActivity(punch, includeEmployee) {
  const employee = findUserById(punch.employeeId);
  const prefix = includeEmployee && employee ? `${employee.name} • ` : "";
  return `${prefix}${PUNCH_LABELS[punch.punchType] || punch.punchType}`;
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeCsvCell(value) {
  const text = String(value !== null && value !== undefined ? value : "");
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function todayKey() {
  return toDateKeyLocal(new Date());
}

function nowIso() {
  return new Date().toISOString();
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function toDateKeyLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  next.setHours(12, 0, 0, 0);
  return next;
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toast(message) {
  if (!dom.toast) {
    console.log("TOAST:", message);
    return;
  }
  dom.toast.textContent = message;
  dom.toast.classList.remove("hidden");
  clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => dom.toast.classList.add("hidden"), 3200);
}

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .day-status-complete td { background-color: #e9f7ec; }
    .day-status-incomplete td { background-color: #fff9e6; }
    .day-status-missing td { background-color: #fdecea; }
    .highlight-panel .metric strong { color: #212529; }
  `;
  document.head.appendChild(style);
}

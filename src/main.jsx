import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';

const money = (n) => (n / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const blank = { name: '', email: '', plan_id: '' };
const currentMonth = new Date().toLocaleDateString('sv-SE').slice(0, 7);
const validMonth = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

async function api(path, method = 'GET', body) {
  const response = await fetch('/api/' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    let result;
    try {
      result = await response.json();
    } catch {}
    throw Error(result?.error || 'Falha na API');
  }
  return method === 'GET' ? response.json() : null;
}

function monthCalendar(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = new Date(0);
  firstDay.setUTCHours(0, 0, 0, 0);
  firstDay.setUTCFullYear(year, monthNumber - 1, 1);
  const lastDay = new Date(0);
  lastDay.setUTCHours(0, 0, 0, 0);
  lastDay.setUTCFullYear(year, monthNumber, 0);
  const offset = (firstDay.getUTCDay() + 6) % 7;
  const days = lastDay.getUTCDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
  const label = firstDay.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return { cells, label };
}

function App() {
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [month, setMonth] = useState(currentMonth);
  const [monthDraft, setMonthDraft] = useState(currentMonth);
  const [monthError, setMonthError] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [plan, setPlan] = useState({ name: '', price: '' });

  async function load() {
    try {
      const [studentList, planList, paymentList] = await Promise.all([
        api('students'),
        api('plans'),
        api('payments?month=' + month),
      ]);
      setStudents(studentList);
      setPlans(planList);
      setPayments(paymentList);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    load();
  }, [month]);

  async function act(action) {
    try {
      setError('');
      await action();
      await load();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  function updateMonthDraft(value) {
    setMonthDraft(value);
    if (validMonth(value)) {
      setMonth(value);
      setMonthError('');
    } else if (/^\d{4}-\d{2}$/.test(value)) {
      setMonthError('Mês inválido');
    } else {
      setMonthError('');
    }
  }

  function changeMonthBy(offset) {
    const [year, monthNumber] = month.split('-').map(Number);
    const monthIndex = year * 12 + monthNumber - 1 + offset;
    const nextYear = Math.floor(monthIndex / 12);
    if (nextYear < 0 || nextYear > 9999) return;
    const nextMonth = String((monthIndex % 12) + 1).padStart(2, '0');
    const next = `${String(nextYear).padStart(4, '0')}-${nextMonth}`;
    setMonth(next);
    setMonthDraft(next);
    setMonthError('');
  }

  const paid = new Set(payments.map((payment) => payment.student_id));
  const calendar = monthCalendar(month);
  const monthInputInvalid = monthDraft !== month;

  return (
    <>
      <header>
        <div className="container py-4">
          <small>GESTÃO DE ACADEMIA</small>
          <h1>GymControl<span>.</span></h1>
          <p>Alunos, planos e mensalidades em um só lugar.</p>
        </div>
      </header>
      <main className="container py-4">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
          <button
            type="button"
            className="overview-toggle"
            aria-expanded={calendarOpen}
            onClick={() => setCalendarOpen(!calendarOpen)}
          >
            <span className="h5 mb-0">Visão geral</span>
            <span className="overview-toggle-label">{calendarOpen ? 'Fechar calendário' : 'Abrir calendário'}</span>
          </button>
          <div>
            <label className="visually-hidden" htmlFor="month-reference">Mês de referência (AAAA-MM)</label>
            <input
              id="month-reference"
              aria-label="Mês de referência"
              aria-invalid={Boolean(monthError)}
              aria-describedby={monthError ? 'month-error' : undefined}
              className={`form-control w-auto ${monthError ? 'is-invalid' : ''}`}
              type="text"
              inputMode="numeric"
              placeholder="AAAA-MM"
              value={monthDraft}
              onChange={(event) => updateMonthDraft(event.target.value)}
              onBlur={() => {
                if (!validMonth(monthDraft)) setMonthError('Mês inválido. Use o formato AAAA-MM, com mês entre 01 e 12.');
              }}
            />
            {monthError && <div id="month-error" className="invalid-feedback d-block">{monthError}</div>}
          </div>
        </div>

        {calendarOpen && (
          <section className="panel month-calendar mb-4" aria-label={`Calendário de ${calendar.label}`}>
            <div className="calendar-heading">
              <button type="button" className="btn btn-outline-secondary" onClick={() => changeMonthBy(-1)} aria-label="Mês anterior">‹</button>
              <h2 className="h5 mb-0 text-capitalize">{calendar.label}</h2>
              <button type="button" className="btn btn-outline-secondary" onClick={() => changeMonthBy(1)} aria-label="Próximo mês">›</button>
            </div>
            <div className="calendar-grid" role="grid" aria-label={`Dias de ${calendar.label}`}>
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                <div className="calendar-weekday" role="columnheader" key={day}>{day}</div>
              ))}
              {calendar.cells.map((day, index) => (
                <div className={`calendar-day${day ? '' : ' calendar-day-empty'}`} role="gridcell" key={`${day ?? 'empty'}-${index}`}>
                  {day}
                </div>
              ))}
            </div>
            <div className="calendar-summary">
              <div><small>Mensalidades pagas</small><strong>{paid.size}</strong></div>
              <div><small>Pendentes</small><strong>{students.length - paid.size}</strong></div>
              <div><small>Recebido</small><strong>{money(payments.reduce((total, payment) => total + payment.amount, 0))}</strong></div>
            </div>
            <p className="calendar-note mb-0">O programa acompanha os pagamentos por mês; não há registro de um dia específico para cada pagamento.</p>
          </section>
        )}

        <div className="row g-3 mb-4">
          {[
            ['Alunos cadastrados', students.length],
            ['Mensalidades pagas', paid.size],
            ['Pendentes', students.length - paid.size],
            ['Recebido', money(payments.reduce((total, payment) => total + payment.amount, 0))],
          ].map(([label, value]) => (
            <div className="col-6 col-lg-3" key={label}>
              <div className="panel"><small>{label}</small><div className="metric">{value}</div></div>
            </div>
          ))}
        </div>

        <div className="row g-3 mb-4">
          <div className="col-lg-8">
            <form className="panel" onSubmit={(event) => {
              event.preventDefault();
              act(async () => {
                await api('students' + (form.id ? '/' + form.id : ''), form.id ? 'PUT' : 'POST', {
                  ...form,
                  plan_id: Number(form.plan_id),
                });
                setForm(blank);
              });
            }}>
              <h2 className="h5">{form.id ? 'Editar aluno' : 'Cadastrar aluno'}</h2>
              <div className="row g-2">
                <div className="col-md"><label>Nome</label><input required className="form-control" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
                <div className="col-md"><label>E-mail</label><input required type="email" className="form-control" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
                <div className="col-md">
                  <label>Plano</label>
                  <select required className="form-select" value={form.plan_id} onChange={(event) => setForm({ ...form, plan_id: event.target.value })}>
                    <option value="">Selecione</option>
                    {plans.map((item) => <option key={item.id} value={item.id}>{item.name} — {money(item.price)}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary mt-3">Salvar aluno</button>
              {form.id && <button type="button" className="btn btn-light mt-3 ms-2" onClick={() => setForm(blank)}>Cancelar</button>}
            </form>
          </div>
          <div className="col-lg-4">
            <form className="panel" onSubmit={(event) => {
              event.preventDefault();
              act(async () => {
                await api('plans', 'POST', { name: plan.name, price: Math.round(Number(plan.price) * 100) });
                setPlan({ name: '', price: '' });
              });
            }}>
              <h2 className="h5">Novo plano</h2>
              <div className="d-flex gap-2">
                <div><label>Nome</label><input required className="form-control" value={plan.name} onChange={(event) => setPlan({ ...plan, name: event.target.value })} /></div>
                <div><label>Valor (R$)</label><input required type="number" min="0.01" step="0.01" className="form-control" value={plan.price} onChange={(event) => setPlan({ ...plan, price: event.target.value })} /></div>
              </div>
              <button className="btn btn-outline-primary mt-3">Adicionar</button>
            </form>
          </div>
        </div>

        <section className="panel">
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
            <h2 className="h5">Alunos e mensalidades</h2>
            <input aria-label="Pesquisar aluno" placeholder="Pesquisar aluno..." className="form-control w-auto" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr>{['Aluno', 'Plano', 'Valor', 'Situação', 'Ações'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
              <tbody>
                {students.filter((student) => (student.name + ' ' + student.email).toLowerCase().includes(search.toLowerCase())).map((student) => (
                  <tr key={student.id}>
                    <td><strong>{student.name}</strong><br /><small>{student.email}</small></td>
                    <td>{student.plan}</td>
                    <td>{money(student.price)}</td>
                    <td><span className={`badge ${paid.has(student.id) ? 'text-bg-success' : 'text-bg-warning'}`}>{paid.has(student.id) ? 'Pago' : 'Pendente'}</span></td>
                    <td>
                      <div className="d-flex gap-1">
                        <button disabled={paid.has(student.id) || monthInputInvalid} className="btn btn-sm btn-success" onClick={() => act(() => api('payments', 'POST', { student_id: student.id, month }))}>Pagar</button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setForm(student)}>Editar</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => {
                          if (confirm('Excluir aluno e seu histórico de pagamentos?')) act(() => api('students/' + student.id, 'DELETE'));
                        }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!students.length && <p className="text-secondary">Nenhum aluno cadastrado. Comece pelo formulário acima.</p>}
          </div>
        </section>
        <footer className="py-4 text-secondary">Matheus Camacho · Erick Peter | UniSenac 2026</footer>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);

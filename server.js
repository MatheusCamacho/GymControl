import express from 'express'; import {database,registerPayment} from './db.js';
const app=express(),db=database(); app.use(express.json());
app.get('/api/plans',(q,r)=>r.json(db.prepare('SELECT * FROM plans ORDER BY name').all()));
app.post('/api/plans',(q,r)=>{const {name,price}=q.body;if(!name?.trim()||!Number.isSafeInteger(price)||price<=0)throw Error('Plano inválido');db.prepare('INSERT INTO plans(name,price) VALUES (?,?)').run(name.trim(),price);r.sendStatus(201)});
app.get('/api/students',(q,r)=>r.json(db.prepare('SELECT students.*,plans.name AS plan,plans.price FROM students JOIN plans ON plans.id=students.plan_id ORDER BY students.name').all()));
function student(q,r){const {name,email,plan_id}=q.body;if(!name?.trim()||!/^\S+@\S+\.\S+$/.test(email)||!Number.isInteger(plan_id))throw Error('Dados inválidos');if(q.params.id){const x=db.prepare('UPDATE students SET name=?,email=?,plan_id=? WHERE id=?').run(name.trim(),email,plan_id,q.params.id);if(!x.changes)return r.sendStatus(404);}else db.prepare('INSERT INTO students(name,email,plan_id) VALUES (?,?,?)').run(name.trim(),email,plan_id);r.sendStatus(204)}
app.post('/api/students',student);app.put('/api/students/:id',student);app.delete('/api/students/:id',(q,r)=>{db.prepare('DELETE FROM students WHERE id=?').run(q.params.id);r.sendStatus(204)});
app.get('/api/payments',(q,r)=>r.json(db.prepare('SELECT * FROM payments WHERE month=?').all(q.query.month||'')));
app.post('/api/payments',(q,r)=>{registerPayment(db,q.body.student_id,q.body.month);r.sendStatus(201)});
app.use((e,q,r,n)=>r.status(400).json({error:e.message.includes('UNIQUE')?'Registro duplicado':e.message}));app.listen(3001,'127.0.0.1',()=>console.log('API na porta 3001'));

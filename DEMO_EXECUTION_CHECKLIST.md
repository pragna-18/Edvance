# 🎯 Real-Time Collaboration Demo - Execution Checklist

## Pre-Demo Checklist (30 minutes before)

### Network Setup
- [ ] Both laptops on same WiFi network
- [ ] Note down Laptop 1 IP address: `______________`
- [ ] Note down Laptop 2 IP address: `______________`
- [ ] Test ping between laptops:
  ```powershell
  ping 192.168.1.X  # Replace with other laptop's IP
  ```

### Database Setup (Laptop 1)
- [ ] PostgreSQL service running
  ```powershell
  Get-Service PostgreSQL*
  ```
- [ ] Test local connection:
  ```powershell
  psql -U postgres
  ```
- [ ] Database `edvance_demo` exists
  ```sql
  \l
  \q
  ```
- [ ] PostgreSQL listening on all interfaces:
  - [ ] `postgresql.conf`: `listen_addresses = '*'`
  - [ ] `pg_hba.conf`: Has `host all all 0.0.0.0/0 md5` entry

### Code Setup (Both Laptops)
- [ ] `.env` files created in `server/` directories with correct IPs
- [ ] `.env` files created in `client/` directories pointing to Laptop 1
- [ ] Database migrations run:
  ```powershell
  npx prisma migrate deploy
  ```

### Services Started (Before Demo)

**Laptop 1 - Terminal 1:**
- [ ] Server running on port 5000
  ```powershell
  cd server
  npm run dev
  # Look for: "✅ Server running on port 5000"
  # Look for: "✅ Socket.io initialized"
  ```

**Laptop 1 - Terminal 2:**
- [ ] Frontend running on port 3000
  ```powershell
  cd client
  npm run dev
  # Look for: "Local: http://localhost:3000"
  ```

**Laptop 2 - Terminal 1:**
- [ ] Frontend running on port 3000
  ```powershell
  cd client
  npm run dev
  ```

### Browser Setup
- [ ] Laptop 1: Browser open to `http://localhost:3000`
- [ ] Laptop 2: Browser open to `http://localhost:3000`
- [ ] Both browsers logged in (can be different accounts)
- [ ] Both positions side-by-side for visibility

---

## Demo Execution (5 minutes)

### Phase 1: Preparation (1:00)

**Laptop 1 Screen:**
```
[0:00] "Let me show you real-time collaborative lesson planning"
[0:15] "This is EdVance running on Laptop 1 - we have the server and database"
```

### Phase 2: Create Lesson (1:00)

**Laptop 1:**
- [ ] Click "Create New Lesson Plan"
- [ ] Fill form:
  - Title: "Photosynthesis: Real-Time Demo"
  - Subject: "Biology"
  - Grade: "9"
  - Duration: "45"
  - Objectives: 
    - [ ] "Understand photosynthesis process"
    - [ ] "Identify inputs and outputs"
  - Materials:
    - [ ] "Textbook"
    - [ ] "Microscope"
  - Activities:
    - [ ] "Lab experiment"
  - Assessments:
    - [ ] "Quiz"
- [ ] Click "Save & Collaborate"
- [ ] **Copy the Plan ID** shown on screen

### Phase 3: Join Collaboration (1:30)

**Laptop 2 Screen:**
```
[1:15] "Now this is Teacher 2 on a different laptop"
[1:30] "We're sharing a database - same lesson plan, different machines"
```

**Laptop 2:**
- [ ] Search for lesson: "Photosynthesis: Real-Time Demo"
- [ ] Click to open the lesson
- [ ] Verify all data from Laptop 1 is visible
  ```
  ✅ Title: "Photosynthesis: Real-Time Demo"
  ✅ Grade: 9
  ✅ All objectives visible
  ✅ All materials visible
  ```

### Phase 4: Live Editing - Laptop 1 → Laptop 2 (1:30)

**Laptop 1:**
- [ ] Edit title: Change to "Photosynthesis: LIVE UPDATE TEST"
- [ ] Point to Laptop 2 and say: "Watch the title change in real-time!"

**Laptop 2:**
- [ ] Verify title changed **instantly** without refresh
  ```
  ✅ Title shows: "Photosynthesis: LIVE UPDATE TEST"
  ✅ No page refresh needed!
  ```

**Laptop 1:**
- [ ] Change duration: 45 → 50 minutes

**Laptop 2:**
- [ ] Verify duration changed instantly
  ```
  ✅ Duration shows: 50
  ```

### Phase 5: Live Editing - Laptop 2 → Laptop 1 (1:00)

**Laptop 2:**
- [ ] Add new material: "Lab Safety Equipment"
- [ ] Say: "Now I'm editing from Laptop 2..."

**Laptop 1:**
- [ ] Verify new material appears instantly
  ```
  ✅ Materials list now includes: "Lab Safety Equipment"
  ✅ Changes from Laptop 2 visible instantly!
  ```

**Laptop 2:**
- [ ] Add new objective: "Practice lab safety"

**Laptop 1:**
- [ ] Verify new objective appears
  ```
  ✅ Objectives now include: "Practice lab safety"
  ```

### Phase 6: Health Score Update (0:30)

**Both Laptops:**
- [ ] Health score automatically recalculates
- [ ] Verify score visible on both screens
- [ ] Say: "The ML model automatically scores the lesson quality"

### Phase 7: Database Verification (0:30)

**Laptop 1 - Open Terminal:**
```powershell
psql -U postgres -d edvance_demo

SELECT id, title, duration, content FROM "LessonPlan" 
WHERE title LIKE 'Photosynthesis%' 
LIMIT 1;

\q
```

- [ ] Show database contains all edits from both laptops
- [ ] Say: "All changes are persisted to the shared database"

---

## Demo Success Criteria

✅ **All must pass for successful demo:**

- [ ] Changes from Laptop 1 appear on Laptop 2 instantly
- [ ] Changes from Laptop 2 appear on Laptop 1 instantly
- [ ] No page refreshes needed
- [ ] Health score updates automatically
- [ ] Database shows all changes
- [ ] No error messages in browser console
- [ ] No errors in server terminal
- [ ] Both browsers stay synchronized

---

## Troubleshooting During Demo

### Changes not appearing?
```
1. Check browser console (F12) - look for errors
2. Try hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. Check server terminal on Laptop 1 for errors
4. Verify both browsers connected to same server
```

### Connection refused errors?
```
1. Verify Laptop 1 IP in .env files is correct
2. Verify Laptop 1 server still running
3. Verify both on same WiFi network
4. Try: ping 192.168.1.X (Laptop 1's IP) from Laptop 2
```

### Slow updates?
```
1. Check network latency (ping)
2. Close other applications to reduce network traffic
3. Check if WiFi is 2.4GHz or 5GHz (5GHz is faster)
```

---

## Demo Talking Points

1. **Real-Time Sync**
   - "Changes appear instantly across devices"
   - "No refresh needed - WebSocket-based communication"

2. **Shared Database**
   - "Both laptops read/write to same PostgreSQL database"
   - "Single source of truth for all lesson data"

3. **Scalability**
   - "This works with unlimited collaborators"
   - "Same architecture used on internet (just replace local IPs with cloud URLs)"

4. **Security**
   - "JWT tokens verify user identity"
   - "Each user can only access their own lessons"

5. **Intelligence**
   - "ML model automatically scores lesson quality"
   - "Real-time feedback helps teachers improve"

6. **Use Cases**
   - "Multiple teachers collaborating on curriculum"
   - "Department heads reviewing lesson plans"
   - "Real-time feedback during lesson design workshops"

---

## Post-Demo

- [ ] Close all terminal windows
- [ ] Keep servers running for questions
- [ ] Note any issues for improvement
- [ ] Get feedback from viewers

---

## Time Breakdown

```
Setup & Testing:        30 minutes
  - Network config:     10 min
  - Database setup:     10 min
  - Service startup:    10 min

Live Demo:              5 minutes
  - Prep:               1 min
  - Create lesson:      1 min
  - Join collab:        1 min
  - Live editing demo:  1 min
  - DB verification:    0.5 min
  - Q&A:                0.5 min

Total:                  35 minutes
```

---

**You're ready to demo real-time collaboration! 🚀**
